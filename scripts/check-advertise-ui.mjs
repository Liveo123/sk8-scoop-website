import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';

const BASE_URL = (process.env.ADVERT_QA_BASE_URL || 'https://preview-advertise-simple-pricing-oct2026.previews.sk8scoop.com').replace(/\/$/, '');
const CHROME = process.env.CHROME || 'google-chrome';
const widths = [360, 390, 768, 1024, 1440];
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

await mkdir('visual-qa/advertise', { recursive: true });

const chrome = spawn(CHROME, [
  '--headless=new',
  '--disable-gpu',
  '--no-sandbox',
  '--hide-scrollbars',
  '--remote-debugging-port=9238',
  '--user-data-dir=/tmp/sk8-advertise-ui-profile',
  '--window-size=1440,900',
  'about:blank'
], { stdio: ['ignore', 'pipe', 'pipe'] });

chrome.stdout.on('data', chunk => process.stdout.write(chunk));
chrome.stderr.on('data', chunk => process.stderr.write(chunk));

let version;
for (let i = 0; i < 120; i++) {
  try {
    const response = await fetch('http://127.0.0.1:9238/json/version');
    if (response.ok) {
      version = await response.json();
      break;
    }
  } catch {}
  await sleep(200);
}
if (!version) throw new Error('Chrome DevTools endpoint did not start');

const targetResponse = await fetch('http://127.0.0.1:9238/json/new?about:blank', { method: 'PUT' });
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

const waitFor = async (expression, timeout = 15000) => {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    try {
      if (await evaluate(expression)) return true;
    } catch {}
    await sleep(150);
  }
  return false;
};

const setViewport = async width => {
  await command('Emulation.setDeviceMetricsOverride', {
    width,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
    screenWidth: width,
    screenHeight: 900
  });
};

const navigate = async path => {
  await command('Page.navigate', { url: BASE_URL + path });
  if (!await waitFor("document.readyState === 'complete'")) {
    throw new Error('Page did not finish loading: ' + path);
  }
  await sleep(1000);
};

const screenshot = async name => {
  const image = await command('Page.captureScreenshot', {
    format: 'png',
    fromSurface: true,
    captureBeyondViewport: false
  });
  await writeFile('visual-qa/advertise/' + name, Buffer.from(image.data, 'base64'));
};

const fail = message => {
  console.error('FAIL ' + message);
  throw new Error(message);
};

try {
  for (const width of widths) {
    await setViewport(width);
    let loaded = false;
    for (let attempt = 0; attempt < 8; attempt++) {
      await navigate('/advertise.html?advertiser-ui-qa=' + width);
      if (await waitFor("document.querySelectorAll('#products .ad-simple-card').length === 3 && document.querySelector('[data-stat=subscriberCount]')", 5000)) {
        loaded = true;
        break;
      }
      await sleep(3000);
    }
    if (!loaded) fail(width + 'px: preview did not load the three-package page');
    await screenshot('hero-' + width + '.png');
    const before = await evaluate(`(() => {
      const rect = e => e.getBoundingClientRect().toJSON();
      const cards = [...document.querySelectorAll('#products .ad-simple-card')];
      const buttons = cards.map(e => e.querySelector('button'));
      const form = document.querySelector('#campaign-enquiry form');
      return {
        viewport: innerWidth,
        documentWidth: document.documentElement.scrollWidth,
        cards: cards.map(e => ({ width: rect(e).width, left: rect(e).left, right: rect(e).right })),
        touchTargets: buttons.map(e => Math.round(rect(e).height)),
        bodyFontSize: parseFloat(getComputedStyle(cards[0].querySelector('p:not(.ad-simple-price-value)')).fontSize),
        formLabelsPresent: ['business_name','contact_name','email','website','preferred_date','advert_copy']
          .every(n => form.querySelector('[name="'+n+'"]')?.labels?.length > 0),
        formRequired: ['business_name','contact_name','email','website','preferred_date','advert_copy']
          .every(n => !!form.querySelector('[name="'+n+'"]')?.required),
        pricesVisible: cards.map(e => e.querySelector('.ad-simple-price-value')?.textContent?.trim()),
        orderIsClear: [...['products','campaign-enquiry','what-you-buy'].map(id=>document.getElementById(id))]
          .every((el,i,a) => !i || a[i-1].getBoundingClientRect().top + scrollY < el.getBoundingClientRect().top + scrollY),
        heroCtaTargetsPrice: document.querySelector('[data-ad-hero-action="compare_packages"]')?.getAttribute('href') === '#products'
      };
    })()`);
    console.log('ADVERT_LAYOUT ' + JSON.stringify(before));
    if (before.documentWidth > width + 1) fail(width + 'px: horizontal page overflow');
    if (!before.cards.every(c => c.left > -1 && c.right <= width + 1)) fail(width + 'px: pricing cards clipped horizontally');
    if (!before.touchTargets.every(h => h >= 44)) fail(width + 'px: purchase button target under 44px');
    if (before.bodyFontSize < 15) fail(width + 'px: offer copy below 15px');
    if (!before.formLabelsPresent || !before.formRequired) fail(width + 'px: essential form labels or required fields missing');
    if (before.pricesVisible.join(',') !== '£35,£28,£60') fail(width + 'px: displayed prices do not match approval');
    if (!before.orderIsClear || !before.heroCtaTargetsPrice) fail(width + 'px: decision and form sequence is unclear');
    await evaluate("document.getElementById('products').scrollIntoView({block:'start',behavior:'instant'}); true");
    await sleep(250);
    await screenshot('prices-' + width + '.png');
    await evaluate("document.querySelector('#products button[data-ad-package=halloween_guide]').click();true");
    await sleep(550);
    const selectedGuide = await evaluate("({checked:document.querySelector('input[name=package]:checked')?.value,summary:document.querySelector('[data-ad-selection-summary]')?.textContent,goal:document.querySelector('textarea[name=advert_copy]')?.value,formValid:document.querySelector('#campaign-enquiry form')?.checkValidity()})");
    if(selectedGuide.checked !== 'halloween_guide' || !selectedGuide.summary.includes('£28')) fail(width+'px: Guide selection did not carry to form');
    if(selectedGuide.goal !== '' || selectedGuide.formValid) fail(width+'px: empty offer can pass enquiry validation');
    await screenshot('guide-selected-' + width + '.png');
    await evaluate("document.querySelector('#products button[data-ad-package=halloween_combo]').click();true");
    const selectedCombo = await evaluate("({checked:document.querySelector('input[name=package]:checked')?.value,summary:document.querySelector('[data-ad-selection-summary]')?.textContent})");
    if(selectedCombo.checked !== 'halloween_combo' || !selectedCombo.summary.includes('£60')) fail(width+'px: Combo selection did not carry to form');
    await evaluate("document.querySelector('#products details.ad-simple-extras').open=true;document.querySelector('button[data-ad-package=halloween_section]').click();true");
    const selectedSponsor = await evaluate("({checked:document.querySelector('input[name=package]:checked')?.value,shown:document.querySelector('[data-sponsor-option=halloween_section]')?.hidden===false,summary:document.querySelector('[data-ad-selection-summary]')?.textContent})");
    if(selectedSponsor.checked !== 'halloween_section' || !selectedSponsor.shown || !selectedSponsor.summary.includes('£110')) fail(width+'px: Optional sponsorship choice is invisible or unselected');
    console.log('ADVERT_SELECTION ' + JSON.stringify({width,guide:selectedGuide,combo:selectedCombo,sponsor:selectedSponsor}));
    console.log('PASS advertiser UX at '+width+'px');
  }
  console.log('PASS five viewport widths, all package handoffs, real goal validation, no horizontal overflow.');
} finally {
  try { ws.close(); } catch {}
  try { chrome.kill('SIGTERM'); } catch {}
}
