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
for (let i = 0; i < 50; i++) {
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

const click = async selector => evaluate("(() => { const el = document.querySelector(" + JSON.stringify(selector) + "); if (!el) return false; el.click(); return true; })()");
const text = async selector => evaluate("document.querySelector(" + JSON.stringify(selector) + ")?.textContent?.trim() || ''");
const attr = async (selector, name) => evaluate("document.querySelector(" + JSON.stringify(selector) + ")?.getAttribute(" + JSON.stringify(name) + ") || ''");

try {
  await setViewport(1440, 1200, false);

  await navigate('/whats-on/');
  record('What’s On renders My SK8 CTA', await waitFor("document.querySelector('[data-my-sk8-count]') !== null"));
  record('My SK8 script loaded', await waitFor("typeof window.SK8MySaved === 'object'"));
  record('Event actions render', await waitFor("document.querySelector('[data-sk8-event-actions=\"heald-green-library-storytime-2026-10-10\"] .my-sk8-save') !== null"));

  const calendarHref = await attr('[data-sk8-event-actions="heald-green-library-storytime-2026-10-10"] a[download]', 'href');
  record('Calendar action generated', calendarHref.startsWith('data:text/calendar'), calendarHref.slice(0, 40));

  const directionsHref = await evaluate("document.querySelector('[data-sk8-event-actions=\"heald-green-library-storytime-2026-10-10\"] a[target=\"_blank\"]')?.href || ''");
  record('Directions action generated', directionsHref.includes('google.com/maps/search'), directionsHref);

  record('Save button clickable', await click('[data-sk8-event-actions="heald-green-library-storytime-2026-10-10"] .my-sk8-save'));
  await sleep(250);
  record('Saved weekend event persisted', Boolean(await evaluate("JSON.parse(localStorage.getItem('sk8_saved_items_v1') || '[]').some(x => x.id === 'heald-green-library-storytime-2026-10-10')")));

  record('Save second event', await click('[data-sk8-event-actions="cheadle-brew-and-biscuit-2026-10-06"] .my-sk8-save'));
  await sleep(150);
  record('Set reminder intent', await click('[data-sk8-event-actions="cheadle-brew-and-biscuit-2026-10-06"] button:not(.my-sk8-save)'));
  await sleep(200);
  record('Reminder persisted', Boolean(await evaluate("JSON.parse(localStorage.getItem('sk8_reminders_v1') || '[]').includes('cheadle-brew-and-biscuit-2026-10-06')")));

  await navigate('/my-sk8/');
  record('My SK8 page title visible', (await text('h1')) === 'My SK8', await text('h1'));
  record('Two current saves shown', (await text('[data-my-sk8-total]')) === '2', await text('[data-my-sk8-total]'));
  record('Saved weekend event appears', Boolean(await evaluate('document.body.textContent.includes("Storytime at Heald Green Library")')));
  record('Weekend plan includes Saturday event', Boolean(await evaluate('document.querySelector("[data-weekend-plan]")?.textContent.includes("Storytime at Heald Green Library")')));
  record('Reminder panel flags due item', Boolean(await evaluate('document.querySelector("[data-my-sk8-reminders]")?.textContent.includes("Cheadle: Brew and a Biscuit")')));
  record('Nearby suggestion appears', Boolean(await evaluate('document.querySelector("[data-my-sk8-active]")?.textContent.includes("Halloween Crafty Kids Pop Up")')));

  const mapHref = await attr('[data-map-saved]', 'href');
  record('Map saved places enabled', mapHref.includes('google.com/maps/'), mapHref);
  record('Share shortlist enabled', !(await evaluate("document.querySelector('[data-share-saved]')?.disabled")));

  await evaluate("Object.defineProperty(navigator, 'share', { configurable: true, value: async data => { window.__sk8ShareData = data; } })");
  record('Share button clickable', await click('[data-share-saved]'));
  await sleep(150);
  const shareUrl = await evaluate("window.__sk8ShareData?.url || ''");
  record('Share URL contains saved IDs', shareUrl.includes('list=') && shareUrl.includes('heald-green-library-storytime-2026-10-10'), shareUrl);

  await evaluate("localStorage.setItem('sk8_saved_items_v1', JSON.stringify([...JSON.parse(localStorage.getItem('sk8_saved_items_v1') || '[]'), {id:'expired-test',title:'Expired test event',date:'2026-01-01',end_date:'2026-01-01',area:'Cheadle',venue:'Test venue',cost:'Free',category:'Test',description:'QA only'}]))");
  await navigate('/my-sk8/');
  record('Expired item excluded from active list', !(await evaluate("document.querySelector('[data-my-sk8-active]')?.textContent.includes('Expired test event')")));
  record('Expired item moved to Past saves', Boolean(await evaluate("document.querySelector('[data-my-sk8-past]')?.textContent.includes('Expired test event')")));

  await screenshot('my-sk8-desktop.png');

  await setViewport(390, 844, true);
  await navigate('/my-sk8/');
  record('Mobile My SK8 page has no horizontal overflow', Boolean(await evaluate('document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1')), String(await evaluate("document.documentElement.scrollWidth + '/' + document.documentElement.clientWidth")));
  record('Mobile saved cards visible', Boolean(await evaluate("document.querySelectorAll('.my-sk8-saved-card').length >= 2")));
  await screenshot('my-sk8-mobile.png');

  await setViewport(390, 844, true);
  await navigate('/whats-on/');
  record('Mobile What’s On has no horizontal overflow', Boolean(await evaluate('document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1')), String(await evaluate("document.documentElement.scrollWidth + '/' + document.documentElement.clientWidth")));
  record('Mobile event save action visible', Boolean(await evaluate("document.querySelector('[data-sk8-event-actions] .my-sk8-save')")));
  await screenshot('whats-on-my-sk8-mobile.png');

  await evaluate("localStorage.removeItem('sk8_saved_items_v1'); localStorage.removeItem('sk8_reminders_v1'); true");
  await navigate('/whats-on/?save=john-lewis-cheadle-baby-beyond-2026-10-08&utm_source=newsletter&utm_medium=email');
  record('Newsletter-style save URL persists item', Boolean(await evaluate("JSON.parse(localStorage.getItem('sk8_saved_items_v1') || '[]').some(x => x.id === 'john-lewis-cheadle-baby-beyond-2026-10-08')")));
  record('Save parameter removed after processing', !(await evaluate("location.search.includes('save=')")), await evaluate('location.search'));

  await navigate('/my-sk8/?list=heald-green-library-storytime-2026-10-10,john-lewis-cheadle-baby-beyond-2026-10-08');
  record('Shared shortlist renders', !(await evaluate("document.querySelector('[data-shared-shortlist]')?.hidden")));
  record('Shared shortlist has two items', (await text('[data-shared-count]')) === '2', await text('[data-shared-count]'));

  const noindex = await attr('meta[name="robots"]', 'content');
  record('My SK8 experiment is noindex', /noindex/i.test(noindex), noindex);

  await writeFile('visual-qa/my-sk8/results.json', JSON.stringify({ preview: PREVIEW_URL, results }, null, 2));
  console.log('Completed ' + results.length + ' My SK8 preview checks.');
} finally {
  try { ws.close(); } catch {}
  chrome.kill('SIGTERM');
}
