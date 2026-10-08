import { spawn } from 'node:child_process';
import { writeFile, mkdir } from 'node:fs/promises';

const PREVIEW_URL = (process.env.PREVIEW_URL || '').replace(/\/$/, '');
const CHROME = process.env.CHROME || 'google-chrome';
if (!PREVIEW_URL) throw new Error('PREVIEW_URL is required');

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const results = [];
const record = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  console.log((ok ? 'PASS ' : 'FAIL ') + name + (detail ? ': ' + detail : ''));
  if (!ok) throw new Error(name + (detail ? ': ' + detail : ''));
};

await mkdir('visual-qa/my-sk8', { recursive: true });

const chrome = spawn(CHROME, [
  '--headless=new',
  '--disable-gpu',
  '--no-sandbox',
  '--hide-scrollbars',
  '--remote-debugging-port=9222',
  '--user-data-dir=/tmp/sk8-my-sk8-profile',
  '--window-size=1440,1200',
  'about:blank'
], { stdio: ['ignore', 'pipe', 'pipe'] });

chrome.stdout.on('data', chunk => process.stdout.write(chunk));
chrome.stderr.on('data', chunk => process.stderr.write(chunk));

let version;
for (let i = 0; i < 120; i++) {
  try {
    const response = await fetch('http://127.0.0.1:9222/json/version');
    if (response.ok) {
      version = await response.json();
      break;
    }
  } catch {}
  await sleep(200);
}
if (!version) throw new Error('Chrome DevTools endpoint did not start');

const targetResponse = await fetch('http://127.0.0.1:9222/json/new?about:blank', { method: 'PUT' });
const target = await targetResponse.json();
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  ws.addEventListener('open', resolve, { once: true });
  ws.addEventListener('error', reject, { once: true });
});

let seq = 0;
const pending = new Map();
ws.addEventListener('message', event => {
  const payload = JSON.parse(String(event.data));
  if (!payload.id) return;
  const item = pending.get(payload.id);
  if (!item) return;
  pending.delete(payload.id);
  if (payload.error) item.reject(new Error(payload.error.message || JSON.stringify(payload.error)));
  else item.resolve(payload.result);
});

const command = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++seq;
  pending.set(id, { resolve, reject });
  ws.send(JSON.stringify({ id, method, params }));
});

await command('Page.enable');
await command('Runtime.enable');

const evaluate = async expression => {
  const result = await command('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || 'Runtime evaluation failed');
  return result.result && result.result.value;
};

const waitFor = async (expression, timeout = 12000) => {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    try {
      if (await evaluate(expression)) return true;
    } catch {}
    await sleep(150);
  }
  return false;
};

const navigate = async path => {
  await command('Page.navigate', { url: PREVIEW_URL + path });
  const ok = await waitFor("document.readyState === 'complete'", 15000);
  if (!ok) throw new Error('Page did not finish loading: ' + path);
  await sleep(700);
};

const setViewport = async (width, height, mobile = false) => {
  await command('Emulation.setDeviceMetricsOverride', {
    width, height, deviceScaleFactor: 1, mobile,
    screenWidth: width, screenHeight: height
  });
};

const screenshot = async name => {
  const image = await command('Page.captureScreenshot', { format: 'png', fromSurface: true, captureBeyondViewport: false });
  await writeFile('visual-qa/my-sk8/' + name, Buffer.from(image.data, 'base64'));
};

const fullScreenshot = async name => {
  const metrics = await command('Page.getLayoutMetrics');
  const size = metrics.cssContentSize || metrics.contentSize;
  const image = await command('Page.captureScreenshot', {
    format: 'png',
    fromSurface: true,
    captureBeyondViewport: true,
    clip: { x: 0, y: 0, width: size.width, height: Math.min(size.height, 12000), scale: 1 }
  });
  await writeFile('visual-qa/my-sk8/' + name, Buffer.from(image.data, 'base64'));
};

const click = async selector => evaluate("(() => { const el = document.querySelector(" + JSON.stringify(selector) + "); if (!el) return false; el.click(); return true; })()");
const text = async selector => evaluate("document.querySelector(" + JSON.stringify(selector) + ")?.textContent?.trim() || ''");
const attr = async (selector, name) => evaluate("document.querySelector(" + JSON.stringify(selector) + ")?.getAttribute(" + JSON.stringify(name) + ") || ''");

try {
  await setViewport(1440, 1200, false);

  await navigate('/whats-on/');
  if (await evaluate("Boolean(document.querySelector('[data-consent-none]')) && !document.querySelector('.privacy-choices')?.hidden")) {
    await click('[data-consent-none]');
    await sleep(250);
  }
  await evaluate("localStorage.removeItem('sk8_saved_items_v1'); localStorage.removeItem('sk8_reminders_v1'); true");
  record('What’s On renders My SK8 CTA', await waitFor("document.querySelector('[data-my-sk8-count]') !== null"));
  record('My SK8 script loaded', await waitFor("typeof window.SK8MySaved === 'object'"));
  // Choose current listings at runtime. Fixed October 2026 IDs would make this QA expire
  // even when the reader features continue working correctly.
  const visibleIds = await evaluate("[...document.querySelectorAll('[data-sk8-event-actions]')].map(el=>el.dataset.sk8EventActions)");
  const currentEvents = (await evaluate("fetch('/data/events.json',{cache:'no-store'}).then(r=>r.json())"))
    .filter(e => visibleIds.includes(e.id) && e.status === 'verified');
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit'
  }).format(new Date());
  const todayDate = new Date(today+'T00:00:00Z');
  const day = todayDate.getUTCDay();
  const saturday = new Date(todayDate);
  saturday.setUTCDate(saturday.getUTCDate() + (day === 0 ? -1 : day === 6 ? 0 : 6-day));
  const sunday = new Date(saturday);
  sunday.setUTCDate(saturday.getUTCDate()+1);
  const saturdayIso = saturday.toISOString().slice(0,10);
  const sundayIso = sunday.toISOString().slice(0,10);
  const tomorrowDate = new Date(todayDate);
  tomorrowDate.setUTCDate(todayDate.getUTCDate()+1);
  const tomorrowIso = tomorrowDate.toISOString().slice(0,10);
  const coreAreas = ['Cheadle','Cheadle Hulme','Gatley','Heald Green'];
  const weekendEvents = currentEvents.filter(e =>
    e.date<=sundayIso && (e.end_date||e.date)>=saturdayIso && e.venue);
  const nearbyCandidates = e => currentEvents.filter(candidate =>
    candidate.id!==e.id && candidate.area===e.area && candidate.date>=today &&
    (candidate.end_date||candidate.date)>=today);
  const primary = weekendEvents.find(e => coreAreas.includes(e.area) && nearbyCandidates(e).length>=2)
    || weekendEvents.find(e => coreAreas.includes(e.area))
    || weekendEvents[0];
  const secondary = currentEvents.find(e =>
    e.id!==primary?.id && e.date<=tomorrowIso && (e.end_date||e.date)>=today && e.venue)
    || currentEvents.find(e => e.id!==primary?.id && e.venue);
  const tertiary = currentEvents.find(e =>
    e.id!==primary?.id && e.id!==secondary?.id) || secondary;
  record('Current event fixtures available for browser QA', Boolean(primary && secondary && tertiary));
  const primarySelector = '[data-sk8-event-actions="' + primary.id + '"]';
  const secondarySelector = '[data-sk8-event-actions="' + secondary.id + '"]';
  const nearby = nearbyCandidates(primary).find(e=>e.id!==secondary.id);
  console.log('LIVE_QA_EVENTS '+JSON.stringify({
    today, primary:primary.id, secondary:secondary.id, tertiary:tertiary.id,
    nearby:nearby?.id||null, saturdayIso, sundayIso
  }));
  record('Event actions render', await waitFor("document.querySelector(" + JSON.stringify(primarySelector + " .my-sk8-save") + ") !== null"));
  record('Event actions use colourful icon markers', Boolean(await evaluate("document.querySelectorAll(" + JSON.stringify(primarySelector + " .my-sk8-action-icon") + ").length >= 5")));
  record('My SK8 is visible in main navigation', Boolean(await evaluate("document.querySelector('.nav .nav-my-sk8')")));
  record('My SK8 is prominent after What’s On in main nav', Boolean(await evaluate(`(() => { const hrefs=[...document.querySelectorAll('#main-nav>a')].map(a=>a.getAttribute('href')); const whats=hrefs.indexOf('/whats-on/'); const mine=hrefs.indexOf('/my-sk8/'); const guides=hrefs.indexOf('/guides/'); return whats >= 0 && mine === whats + 1 && guides === mine + 1; })()`)));
  record('Event action row has five icon call-outs', (await evaluate("document.querySelectorAll(" + JSON.stringify(primarySelector + " .my-sk8-action-icon") + ").length")) === 5);
  record('Event action icons have five visual tones', (await evaluate("new Set([...document.querySelectorAll(" + JSON.stringify(primarySelector + " .my-sk8-action-icon") + ")].map(el => [...el.classList].find(name=>name.startsWith('tone-')))).size")) === 5);

  const calendarHref = await attr(primarySelector + ' a[download]', 'href');
  record('Calendar action generated', calendarHref.startsWith('data:text/calendar'), calendarHref.slice(0, 40));

  const directionsHref = await evaluate("document.querySelector(" + JSON.stringify(primarySelector + ' a[target="_blank"]') + ")?.href || ''");
  record('Directions action generated', directionsHref.includes('google.com/maps/search'), directionsHref);

  record('Save button clickable', await click(primarySelector + ' .my-sk8-save'));
  await sleep(250);
  record('Saved weekend event persisted', Boolean(await evaluate("JSON.parse(localStorage.getItem('sk8_saved_items_v1') || '[]').some(x=>x.id===" + JSON.stringify(primary.id) + ")")));
  record('My SK8 nav count updates after save', (await text('[data-nav-my-sk8-count]')) === '1', await text('[data-nav-my-sk8-count]'));
  record('Main-nav My SK8 count updates after save', (await text('[data-nav-my-sk8-count]')) === '1' && !(await evaluate("document.querySelector('[data-nav-my-sk8-count]')?.hidden")));

  record('Set reminder intent without saving first', await click(secondarySelector + ' button:not(.my-sk8-save)'));
  await sleep(250);
  record('Reminder persisted', Boolean(await evaluate("JSON.parse(localStorage.getItem('sk8_reminders_v1') || '[]').includes(" + JSON.stringify(secondary.id) + ")")));
  record('Reminder also saves the event', Boolean(await evaluate("JSON.parse(localStorage.getItem('sk8_saved_items_v1') || '[]').some(x=>x.id===" + JSON.stringify(secondary.id) + ")")));

  await navigate('/my-sk8/');
  record('My SK8 page title visible', (await text('h1')) === 'My SK8', await text('h1'));
  record('Subscriber shelf is shown on My SK8', Boolean(await evaluate("document.querySelector('[data-subscriber-shelf]')")));
  record('Subscriber shelf starts locked without access cookie', !(await evaluate("document.querySelector('[data-subscriber-shelf-locked]')?.hidden")));
  record('Subscriber shelf unlock form is available', Boolean(await evaluate("document.querySelector('[data-subscriber-shelf-locked] [data-signup-form]')")));
  record('Unlocked subscriber shelf is genuinely hidden before access', Boolean(await evaluate("getComputedStyle(document.querySelector('[data-subscriber-shelf-unlocked]')).display === 'none'")));
  record('Subscriber shelf uses compact professional copy', Boolean(await evaluate("document.querySelector('[data-subscriber-shelf-locked]')?.textContent.includes('Unlock the full SK8 Scoop experience') && document.querySelector('[data-subscriber-shelf-locked]')?.textContent.includes('website extras') && !document.querySelector('[data-subscriber-shelf-locked]')?.textContent.includes('Personal maps later')")));

  record('Two current saves shown', (await text('[data-my-sk8-total]')) === '2', await text('[data-my-sk8-total]'));
  record('Saved weekend event appears', Boolean(await evaluate("document.body.textContent.includes(" + JSON.stringify(primary.title) + ")")));
  record('Weekend plan includes Saturday event', Boolean(await evaluate("document.querySelector('[data-weekend-plan]')?.textContent.includes(" + JSON.stringify(primary.title) + ")")));
  record('Reminder panel flags due item', Boolean(await evaluate("document.querySelector('[data-my-sk8-reminders]')?.textContent.includes(" + JSON.stringify(secondary.date<=tomorrowIso ? secondary.title : 'reminder') + ")")));
  if (nearby) record('Nearby suggestion appears', Boolean(await evaluate("document.querySelector('[data-my-sk8-active]')?.textContent.includes(" + JSON.stringify(nearby.title) + ")")));

  const mapHref = await attr('[data-map-saved]', 'href');
  record('Map saved places enabled', mapHref.includes('google.com/maps/'), mapHref);
  record('Share shortlist enabled', !(await evaluate("document.querySelector('[data-share-saved]')?.disabled")));

  await evaluate("Object.defineProperty(navigator, 'share', { configurable: true, value: async data => { window.__sk8ShareData = data; } })");
  record('Share button clickable', await click('[data-share-saved]'));
  await sleep(150);
  const shareUrl = await evaluate("window.__sk8ShareData?.url || ''");
  record('Share URL contains saved IDs', shareUrl.includes('list=') && shareUrl.includes(primary.id), shareUrl);

  await evaluate("localStorage.setItem('sk8_saved_items_v1', JSON.stringify([...JSON.parse(localStorage.getItem('sk8_saved_items_v1') || '[]'), {id:'expired-test',title:'Expired test event',date:'2026-01-01',end_date:'2026-01-01',area:'Cheadle',venue:'Test venue',cost:'Free',category:'Test',description:'QA only'}]))");
  await navigate('/my-sk8/');
  record('Expired item excluded from active list', !(await evaluate("document.querySelector('[data-my-sk8-active]')?.textContent.includes('Expired test event')")));
  record('Expired item moved to Past saves', Boolean(await evaluate("document.querySelector('[data-my-sk8-past]')?.textContent.includes('Expired test event')")));
  record('Expired item does not offer a reminder', !(await evaluate("document.querySelector('[data-saved-id=\\\"expired-test\\\"] [data-my-sk8-reminder]')")));

  await screenshot('my-sk8-desktop.png');
  await fullScreenshot('my-sk8-desktop-full.png');

  await setViewport(1280, 900, false);
  await navigate('/whats-on/');
  record('Desktop header has no horizontal overflow at 1280px', Boolean(await evaluate('document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1')), String(await evaluate("document.documentElement.scrollWidth + '/' + document.documentElement.clientWidth")));
  record('Desktop nav does not overlap logo at 1280px', Boolean(await evaluate(`(() => { const brand=document.querySelector('.brand')?.getBoundingClientRect(); const nav=document.querySelector('#main-nav')?.getBoundingClientRect(); if(!brand||!nav) return false; return brand.right <= nav.left + 0.5 && nav.right <= innerWidth + 1; })()`)));

  await setViewport(1120, 900, false);
  await navigate('/whats-on/');
  record('Narrow desktop header switches to menu before overlap', Boolean(await evaluate(`(() => { const menu=document.querySelector('.menu-btn'); const nav=document.querySelector('#main-nav'); if(!menu||!nav) return false; return getComputedStyle(menu).display !== 'none' && getComputedStyle(nav).display === 'none'; })()`)));
  record('Narrow desktop menu opens with My SK8 near the top', await click('.menu-btn'));
  await sleep(120);
  record('My SK8 remains discoverable in narrow desktop menu', Boolean(await evaluate(`(() => { const nav=document.querySelector('#main-nav'); const hrefs=[...nav.querySelectorAll(':scope>a')].map(a=>a.getAttribute('href')); return getComputedStyle(nav).display !== 'none' && hrefs.indexOf('/my-sk8/') === hrefs.indexOf('/whats-on/') + 1; })()`)));

  await setViewport(390, 844, true);
  await navigate('/my-sk8/');
  record('Mobile My SK8 page has no horizontal overflow', Boolean(await evaluate('document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1')), String(await evaluate("document.documentElement.scrollWidth + '/' + document.documentElement.clientWidth")));
  record('Mobile saved cards visible', Boolean(await evaluate("document.querySelectorAll('.my-sk8-saved-card').length >= 2")));
  await screenshot('my-sk8-mobile.png');
  await fullScreenshot('my-sk8-mobile-full.png');

  await setViewport(390, 844, true);
  await navigate('/whats-on/');
  record('Mobile What’s On has no horizontal overflow', Boolean(await evaluate('document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1')), String(await evaluate("document.documentElement.scrollWidth + '/' + document.documentElement.clientWidth")));
  record('Mobile event save action visible', Boolean(await evaluate("document.querySelector('[data-sk8-event-actions] .my-sk8-save')")));
  await screenshot('whats-on-my-sk8-mobile.png');
  await fullScreenshot('whats-on-my-sk8-mobile-full.png');

  await navigate('/my-sk8/');
  await evaluate("window.SK8MySaved.unsaveEvent(" + JSON.stringify(secondary.id) + ")");
  await sleep(150);
  record('Removing a save also clears its reminder', !(await evaluate("JSON.parse(localStorage.getItem('sk8_reminders_v1') || '[]').includes(" + JSON.stringify(secondary.id) + ")")));

  await evaluate("localStorage.removeItem('sk8_saved_items_v1'); localStorage.removeItem('sk8_reminders_v1'); true");
  await navigate('/my-sk8/');
  record('Empty My SK8 hides the planning toolbox', Boolean(await evaluate("document.querySelector('[data-my-sk8-toolbox]')?.hidden && getComputedStyle(document.querySelector('[data-my-sk8-toolbox]')).display === 'none'")));
  record('Empty My SK8 does not show the route button', Boolean(await evaluate("document.querySelector('[data-map-saved]')?.hidden && getComputedStyle(document.querySelector('[data-map-saved]')).display === 'none'")));
  await navigate('/outdoors/chadkirk-country-estate/');
  record('Useful article types load My SK8 save controls automatically', await waitFor("document.querySelector('[data-my-sk8-page-save-bar]') !== null"));
  record('Generic article save button has an icon', Boolean(await evaluate("document.querySelector('[data-my-sk8-page-save-bar] .my-sk8-action-icon')")));
  record('Generic article save works', await click('[data-my-sk8-page-save-bar] button'));
  await sleep(150);
  record('Generic article persisted', Boolean(await evaluate("JSON.parse(localStorage.getItem('sk8_saved_items_v1') || '[]').some(x => x.id === 'page:outdoors/chadkirk-country-estate' && x.kind === 'page')")));
  await navigate('/my-sk8/?list=page%3Aoutdoors%2Fchadkirk-country-estate');
  record('Generic saved article can be shared', !(await evaluate("document.querySelector('[data-shared-shortlist]')?.hidden")));
  record('Generic shared article has a readable fallback title', Boolean(await evaluate("document.querySelector('[data-shared-items]')?.textContent.includes('Chadkirk Country Estate')")));
  await evaluate("localStorage.removeItem('sk8_saved_items_v1'); true");

  await navigate('/free-cheap-guide/');
  record('Free & Cheap landing has concise subscriber copy', Boolean(await evaluate("document.body.textContent.includes('Get the full guide free') && !document.body.textContent.includes('Unlock all subscriber guides')")));
  record('Free & Cheap landing has protected signup form', Boolean(await evaluate("document.querySelector('[data-signup-form][data-guide-key=\"free-cheap\"]')")));
  record('Locked recognised state is not accidentally visible', Boolean(await evaluate("getComputedStyle(document.querySelector('[data-subscriber-unlocked]')).display === 'none'")));
  await navigate('/52-adventures/');
  record('52 Adventures landing has protected signup form', Boolean(await evaluate("document.querySelector('[data-signup-form][data-guide-key=\"52-adventures\"]')")));
  record('52 Adventures signup copy is concise', Boolean(await evaluate("document.body.textContent.includes('Already subscribed? Use the same address.')")));
  record('52 Adventures uses the approved automation hero', Boolean(await evaluate("document.querySelector('.hero-visual img')?.src.includes('52-adventures-email-hero-v5-no-people')")));
  record('52 Adventures landing no longer promotes the aqueduct image', !(await evaluate("[...document.images].some(img => img.src.includes('52-adventures-marple-aqueduct'))")));
  await navigate('/halloween-half-term-guide/');
  record('Halloween landing uses unified protected signup form', Boolean(await evaluate("document.querySelector('[data-signup-form][data-guide-key=\"halloween\"]')")));
  record('Halloween signup copy is concise', Boolean(await evaluate("document.body.textContent.includes('Already subscribed? Use the same address.')")));
  record('Halloween benefit cards use visual thumbnails', (await evaluate("document.querySelectorAll('.benefit-mark img').length")) === 3);
  record('Halloween hero has useful content filling the lower-right space', Boolean(await evaluate("document.querySelector('.hero-quick-links')?.textContent.includes('Find the right plan quickly')")));
  await navigate('/free-cheap-guide/guide/');
  record('Free & Cheap direct guide link works without repeat signup', Boolean(await evaluate("location.pathname === '/free-cheap-guide/guide/'")));
  await navigate('/52-adventures/guide/');
  record('52 Adventures direct guide link works without repeat signup', Boolean(await evaluate("location.pathname === '/52-adventures/guide/'")));
  await navigate('/halloween-half-term-guide/guide/');
  record('Halloween direct guide link works without repeat signup', Boolean(await evaluate("location.pathname === '/halloween-half-term-guide/guide/'")));

  await navigate('/my-sk8/');
  await evaluate("document.querySelector('#my-sk8-subscriber-email').value='preview-test@example.com'; document.querySelector('#my-sk8-subscriber-email').dispatchEvent(new Event('input',{bubbles:true})); true");
  record('Preview subscriber unlock form submits', await click('[data-subscriber-shelf-locked] button[type="submit"]'));
  record('Preview subscriber shelf unlocks without production secrets', await waitFor("document.querySelector('[data-subscriber-shelf-unlocked]') && !document.querySelector('[data-subscriber-shelf-unlocked]').hidden", 8000));
  record('Preview explains that MailerLite was not changed', Boolean(await evaluate("document.body.textContent.includes('Preview unlocked. No email was added to MailerLite.')")));
  record('Subscriber guide button becomes a working link', (await attr('[data-subscriber-shelf-unlocked] a[href="/free-cheap-guide/guide/"]','href')) === '/free-cheap-guide/guide/');
  await navigate('/free-cheap-guide/guide/');
  record('Preview subscriber can still open Free & Cheap directly', Boolean(await evaluate("location.pathname === '/free-cheap-guide/guide/'")));

  await navigate('/my-sk8/');
  record('Preview access status remains active after navigation', Boolean(await evaluate("fetch('/api/subscriber-access-status', {credentials:'same-origin',cache:'no-store'}).then(r => r.json()).then(x => x.active === true)")));
  record('Preview subscriber shelf remains unlocked on revisit', await waitFor("document.querySelector('[data-subscriber-shelf-unlocked]') && !document.querySelector('[data-subscriber-shelf-unlocked]').hidden", 8000));

  await evaluate("localStorage.setItem('sk8_subscriber_recognition_v1', JSON.stringify({version:1,recognised:true,savedAt:new Date().toISOString(),expiresAt:Date.now()+30*86400000})); true");
  await navigate('/my-sk8/');
  record('Recognised reader has See what’s new shortcut', Boolean(await evaluate("document.querySelector('.reader-nav-latest')")));
  await command('Network.enable');
  await command('Network.clearBrowserCookies');
  await navigate('/my-sk8/');
  record('Cleared cookie deactivates authenticated subscriber shelf', Boolean(await evaluate("fetch('/api/subscriber-access-status', {credentials:'same-origin',cache:'no-store'}).then(r => r.json()).then(x => x.active === false)")));
  record('Cleared cookie shows the email recovery form', await waitFor("document.querySelector('[data-subscriber-shelf-locked]') && !document.querySelector('[data-subscriber-shelf-locked]').hidden", 8000));
  record('Browser recognition is kept separately from cookie', Boolean(await evaluate("document.querySelector('.reader-nav-latest')")));
  await navigate('/halloween-half-term-guide/guide/');
  record('Direct Halloween guide survives deleted subscriber cookie', Boolean(await evaluate("location.pathname === '/halloween-half-term-guide/guide/'")));

  await navigate('/local-history/gatley-shouter/');
  record('Article page shows My SK8 save bar', await waitFor("document.querySelector('[data-my-sk8-page-save-bar]') !== null"));
  record('Article save explains My SK8', Boolean(await evaluate("document.querySelector('[data-my-sk8-page-save-bar]')?.textContent.includes('saved events and useful local stuff')")));
  record('Article save button has colourful icon marker', Boolean(await evaluate("document.querySelector('[data-my-sk8-page-save-bar] .my-sk8-action-icon.tone-save')")));
  record('Article save button works', await click('[data-my-sk8-page-save-bar] button'));
  await sleep(180);
  record('Article persisted as a page item', Boolean(await evaluate("JSON.parse(localStorage.getItem('sk8_saved_items_v1') || '[]').some(x => x.id === 'page:local-history/gatley-shouter' && x.kind === 'page')")));
  record('Article page has no horizontal overflow on mobile', Boolean(await evaluate('document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1')), String(await evaluate("document.documentElement.scrollWidth + '/' + document.documentElement.clientWidth")));
  await fullScreenshot('gatley-shouter-save-mobile-full.png');

  await navigate('/my-sk8/');
  record('Article-only My SK8 count is one', (await text('[data-my-sk8-total]')) === '1', await text('[data-my-sk8-total]'));
  record('Saved articles section becomes visible', !(await evaluate("document.querySelector('[data-my-sk8-pages-section]')?.hidden")));
  record('Saved Gatley Shouter appears in My SK8', Boolean(await evaluate("document.querySelector('[data-my-sk8-pages]')?.textContent.includes('The Gatley Shouter')")));
  record('Article-only shortlist can still be shared', !(await evaluate("document.querySelector('[data-share-saved]')?.disabled")));
  record('Article-only state keeps route map hidden', Boolean(await evaluate("document.querySelector('[data-map-saved]')?.hidden")));
  record('Article-only state hides empty Coming up section', Boolean(await evaluate("document.querySelector('[data-my-sk8-active-section]')?.hidden")));
  record('Article-only state hides reminders', Boolean(await evaluate("document.querySelector('[data-my-sk8-reminders-section]')?.hidden")));
  record('Article-only state hides weekend plan', Boolean(await evaluate("document.querySelector('[data-weekend-plan-section]')?.hidden")));

  await navigate('/outdoors/gatley-carrs/');
  record('Selective save expansion reaches Gatley Carrs', await waitFor("document.querySelector('[data-my-sk8-page-save-bar]') !== null"));
  record('My SK8 nav count persists on a normal content page', (await text('[data-nav-my-sk8-count]')) === '1' && !(await evaluate("document.querySelector('[data-nav-my-sk8-count]')?.hidden")));

  await evaluate("localStorage.removeItem('sk8_saved_items_v1'); localStorage.removeItem('sk8_reminders_v1'); true");
  await navigate('/whats-on/?save=' + encodeURIComponent(secondary.id) + '&utm_source=newsletter&utm_medium=email');
  record('Newsletter-style save URL persists item', Boolean(await evaluate("JSON.parse(localStorage.getItem('sk8_saved_items_v1') || '[]').some(x=>x.id===" + JSON.stringify(secondary.id) + ")")));
  record('Save parameter removed after processing', !(await evaluate("location.search.includes('save=')")), await evaluate('location.search'));

  await evaluate("localStorage.removeItem('sk8_saved_items_v1'); localStorage.removeItem('sk8_reminders_v1'); true");
  await navigate('/whats-on/?event=' + encodeURIComponent(tertiary.id) + '&my_action=save&utm_source=newsletter&utm_medium=email');
  record('Direct newsletter save action persists item', Boolean(await evaluate("JSON.parse(localStorage.getItem('sk8_saved_items_v1') || '[]').some(x=>x.id===" + JSON.stringify(tertiary.id) + ")")));
  record('Direct save action parameter is cleaned', !(await evaluate("location.search.includes('my_action=')")), await evaluate('location.search'));

  await evaluate("localStorage.removeItem('sk8_saved_items_v1'); localStorage.removeItem('sk8_reminders_v1'); true");
  await navigate('/whats-on/?event=' + encodeURIComponent(tertiary.id) + '&my_action=remind&utm_source=newsletter&utm_medium=email');
  record('Direct newsletter reminder persists reminder', Boolean(await evaluate("JSON.parse(localStorage.getItem('sk8_reminders_v1') || '[]').includes(" + JSON.stringify(tertiary.id) + ")")));
  record('Direct newsletter reminder also saves event', Boolean(await evaluate("JSON.parse(localStorage.getItem('sk8_saved_items_v1') || '[]').some(x=>x.id===" + JSON.stringify(tertiary.id) + ")")));
  record('Direct reminder action parameter is cleaned', !(await evaluate("location.search.includes('my_action=')")), await evaluate('location.search'));

  await navigate('/halloween/boo/');
  record('BOO page reveal starts automatically', await waitFor("document.body.classList.contains('revealed')", 3000));
  record('BOO page no longer requires a second switch click', !(await evaluate("document.querySelector('#light-switch')")));

  await navigate('/my-sk8/?list=' + [primary.id,secondary.id,'page:local-history/gatley-shouter'].map(encodeURIComponent).join(','));
  record('Shared shortlist renders', !(await evaluate("document.querySelector('[data-shared-shortlist]')?.hidden")));
  record('Shared shortlist has three items', (await text('[data-shared-count]')) === '3', await text('[data-shared-count]'));
  record('Shared shortlist can contain a saved article', Boolean(await evaluate("document.querySelector('[data-shared-items]')?.textContent.includes('The Gatley Shouter')")));

  const noindex = await attr('meta[name="robots"]', 'content');
  record('My SK8 experiment is noindex', /noindex/i.test(noindex), noindex);

  await writeFile('visual-qa/my-sk8/results.json', JSON.stringify({ preview: PREVIEW_URL, results }, null, 2));
  console.log('Completed ' + results.length + ' My SK8 preview checks.');
} finally {
  try { ws.close(); } catch {}
  chrome.kill('SIGTERM');
}
