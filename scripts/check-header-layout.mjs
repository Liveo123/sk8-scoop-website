import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';

const BASE_URL = (process.env.HEADER_QA_BASE_URL || 'https://www.sk8scoop.com').replace(/\/$/, '');
const CHROME = process.env.CHROME || 'google-chrome';
const widths = [1199, 1200, 1280, 1366, 1440];
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

await mkdir('visual-qa/header-layout', { recursive: true });

const chrome = spawn(CHROME, [
  '--headless=new',
  '--disable-gpu',
  '--no-sandbox',
  '--hide-scrollbars',
  '--remote-debugging-port=9224',
  '--user-data-dir=/tmp/sk8-header-layout-profile',
  '--window-size=1440,900',
  'about:blank'
], { stdio: ['ignore', 'pipe', 'pipe'] });

chrome.stdout.on('data', chunk => process.stdout.write(chunk));
chrome.stderr.on('data', chunk => process.stderr.write(chunk));

let version;
for (let i = 0; i < 120; i++) {
  try {
    const response = await fetch('http://127.0.0.1:9224/json/version');
    if (response.ok) {
      version = await response.json();
      break;
    }
  } catch {}
  await sleep(200);
}
if (!version) throw new Error('Chrome DevTools endpoint did not start');

const targetResponse = await fetch('http://127.0.0.1:9224/json/new?about:blank', { method: 'PUT' });
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
  await writeFile('visual-qa/header-layout/' + name, Buffer.from(image.data, 'base64'));
};

const fail = message => {
  console.error('FAIL ' + message);
  throw new Error(message);
};

try {
  await setViewport(1440);
  await navigate('/');
  await evaluate(`localStorage.setItem('sk8_subscriber_recognition_v1', JSON.stringify({
    version: 1,
    recognised: true,
    savedAt: new Date().toISOString(),
    expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000
  })); true`);

  for (const width of widths) {
    await setViewport(width);
    await navigate('/advertise.html?header-qa=' + width);

    if (!await waitFor("document.querySelector('.reader-nav-join') && document.querySelector('.reader-nav-latest')")) {
      fail(width + 'px: subscriber header actions did not render');
    }

    if (width < 1200) {
      await evaluate("document.querySelector('.menu-btn')?.click(); true");
      if (!await waitFor("document.querySelector('.nav')?.classList.contains('open')")) {
        fail(width + 'px: compact menu did not open');
      }
    }

    const state = await evaluate(`(() => {
      const nav = document.querySelector('.site-header .nav');
      const menu = document.querySelector('.site-header .menu-btn');
      const join = document.querySelector('.reader-nav-join');
      const latest = document.querySelector('.reader-nav-latest');
      const plainJoin = [...document.querySelectorAll('.nav a:not(.button)')]
        .filter(a => new URL(a.href, location.href).pathname.replace(/\\/+$/, '') === '/join');
      const rect = el => el ? el.getBoundingClientRect().toJSON() : null;
      return {
        width: innerWidth,
        documentWidth: document.documentElement.scrollWidth,
        navDisplay: getComputedStyle(nav).display,
        navDirection: getComputedStyle(nav).flexDirection,
        menuDisplay: getComputedStyle(menu).display,
        joinRect: rect(join),
        latestRect: rect(latest),
        navRect: rect(nav),
        plainJoinCount: plainJoin.length,
        joinCount: document.querySelectorAll('.reader-nav-join').length,
        latestCount: document.querySelectorAll('.reader-nav-latest').length
      };
    })()`);

    console.log('HEADER_STATE ' + JSON.stringify(state));

    if (state.plainJoinCount !== 0) fail(width + 'px: duplicate plain Join link is visible in nav source');
    if (state.joinCount !== 1) fail(width + 'px: expected exactly one Join free CTA');
    if (state.latestCount !== 1) fail(width + 'px: expected exactly one See what’s new CTA');
    if (state.documentWidth > width + 1) fail(width + 'px: page has horizontal overflow (' + state.documentWidth + ' > ' + width + ')');

    for (const [label, box] of [['Join free', state.joinRect], ['See what’s new', state.latestRect]]) {
      if (!box) fail(width + 'px: missing ' + label + ' bounds');
      if (box.left < -1 || box.right > width + 1) {
        fail(width + 'px: ' + label + ' is clipped outside viewport (' + box.left + '..' + box.right + ')');
      }
    }

    if (width >= 1200) {
      if (state.navDisplay === 'none') fail(width + 'px: desktop navigation is hidden');
      if (state.navDirection === 'column') fail(width + 'px: desktop navigation collapsed vertically');
      if (state.menuDisplay !== 'none') fail(width + 'px: desktop menu button should be hidden');
    } else {
      if (state.navDirection !== 'column') fail(width + 'px: compact navigation should be vertical when opened');
    }

    await screenshot('advertise-' + width + '.png');
    console.log('PASS header layout at ' + width + 'px');
  }

  console.log('Header responsive browser QA passed at ' + widths.join(', ') + 'px.');
} finally {
  try { ws.close(); } catch {}
  try { chrome.kill('SIGTERM'); } catch {}
}
