import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';

const BASE = (process.env.SUBSCRIBER_QA_URL || 'https://www.sk8scoop.com').replace(/\/$/, '');
const CHROME = process.env.CHROME || 'google-chrome';
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const checks = [];
const check = (label, ok, detail = '') => {
  checks.push({ label, ok: Boolean(ok), detail });
  console.log((ok ? 'PASS ' : 'FAIL ') + label + (detail ? ' - ' + detail : ''));
  if (!ok) throw new Error(label + (detail ? ': ' + detail : ''));
};

await mkdir('visual-qa/subscriber-journey', { recursive: true });
const chrome = spawn(CHROME, [
  '--headless=new', '--no-sandbox', '--disable-gpu', '--hide-scrollbars',
  '--remote-debugging-port=9228',
  '--user-data-dir=/tmp/sk8-subscriber-journey-' + process.pid,
  '--window-size=1366,900', 'about:blank'
], { stdio: ['ignore', 'pipe', 'pipe'] });
chrome.stderr.on('data', chunk => {
  const str = String(chunk);
  if (/FATAL|DevTools listening/.test(str)) process.stderr.write(str);
});
let ws;
try {
  let ready = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    try {
      const response = await fetch('http://127.0.0.1:9228/json/version');
      if (response.ok) { ready = true; break; }
    } catch {}
    await sleep(200);
  }
  if (!ready) throw new Error('Headless Chrome did not start');
  const response = await fetch('http://127.0.0.1:9228/json/new?about:blank', { method: 'PUT' });
  const target = await response.json();
  ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve, { once: true });
    ws.addEventListener('error', reject, { once: true });
  });
  let id = 0;
  const pending = new Map();
  ws.addEventListener('message', event => {
    const message = JSON.parse(String(event.data));
    const entry = pending.get(message.id);
    if (!entry) return;
    pending.delete(message.id);
    if (message.error) entry.reject(new Error(message.error.message));
    else entry.resolve(message.result);
  });
  const cdp = (method, params = {}) => new Promise((resolve, reject) => {
    const callId = ++id;
    pending.set(callId, { resolve, reject });
    ws.send(JSON.stringify({ id: callId, method, params }));
  });
  const evalJS = async expression => {
    const result = await cdp('Runtime.evaluate', {
      expression, awaitPromise: true, returnByValue: true
    });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || expression);
    return result.result?.value;
  };
  const waitFor = async expression => {
    for (let i = 0; i < 80; i++) {
      try { if (await evalJS(expression)) return true; } catch {}
      await sleep(150);
    }
    return false;
  };
  const navigate = async path => {
    await cdp('Page.navigate', { url: BASE + path });
    if (!await waitFor("document.readyState === 'complete'")) {
      throw new Error('Page did not load: ' + path);
    }
    await sleep(850);
  };
  const accessStatus = () => evalJS(
    "fetch('/api/subscriber-access-status',{credentials:'same-origin',cache:'no-store'})" +
    ".then(async r=>({status:r.status, body:await r.json()}))"
  );
  const shot = async name => {
    const image = await cdp('Page.captureScreenshot', {
      format: 'png', fromSurface: true, captureBeyondViewport: false
    });
    await writeFile('visual-qa/subscriber-journey/' + name, Buffer.from(image.data, 'base64'));
  };
  await cdp('Page.enable');
  await cdp('Runtime.enable');
  await cdp('Emulation.setDeviceMetricsOverride', {
    width: 1366, height: 900, deviceScaleFactor: 1,
    mobile: false, screenWidth: 1366, screenHeight: 900
  });

  // Anonymous visitor. Nothing is submitted to MailerLite.
  await navigate('/my-sk8/');
  check('My SK8 loads', await evalJS("document.body.dataset.page === 'my-sk8'"));
  check('Anonymous has Join free CTA', await evalJS(
    "document.querySelector('.reader-nav-join')?.textContent.trim()==='Join free'"
  ));
  check('Anonymous subscriber shelf is locked', await waitFor(
    "document.querySelector('[data-subscriber-shelf]')?.dataset.subscriberState === 'locked'"
  ));
  const anonymous = await accessStatus();
  check('Anonymous access status reports inactive', anonymous.status === 200 && anonymous.body?.active === false);
  check('No duplicate plain Join links', await evalJS(
    "[...document.querySelectorAll('nav a:not(.button)')]" +
    ".filter(a=>new URL(a.href).pathname.replace(/\\/$/,'')==='/join').length===0"
  ));

  // Current editorial policy: full URLs remain usable without a browser token.
  for (const route of [
    '/free-cheap-guide/guide/',
    '/52-adventures/guide/',
    '/halloween-half-term-guide/guide/'
  ]) {
    await navigate(route);
    const actual = await evalJS('location.pathname');
    check('Direct guide survives cookie-free visit: ' + route, actual === route, actual);
  }

  // A real email-link visit can set local recognition without authenticating a cookie.
  await navigate('/my-sk8/');
  await evalJS(
    "localStorage.setItem('sk8_subscriber_recognition_v1',JSON.stringify({" +
    "version:1,recognised:true,savedAt:new Date().toISOString()," +
    "expiresAt:Date.now()+30*86400000})); true"
  );
  await navigate('/my-sk8/?subscriber-test=recognised');
  check('Recognised reader gets See what’s new', await evalJS(
    "document.querySelector('.reader-nav-latest')?.textContent.trim()==='See what’s new'"
  ));
  check('Join free is retained beside latest link', await evalJS(
    "document.querySelector('.reader-nav-join')?.textContent.trim()==='Join free'"
  ));
  const recognised = await accessStatus();
  check('Local recognition alone does not become server authentication',
    recognised.status === 200 && recognised.body?.active === false);
  const shelf = await evalJS(
    "document.querySelector('[data-subscriber-shelf]')?.dataset.subscriberState"
  );
  console.log('OBSERVED_RECOGNITION_SPLIT ' +
    JSON.stringify({ recognisedBrowser: true, serverAccess: false, shelfState: shelf }));
  await shot('recognised-without-cookie-desktop.png');

  // Clear both browser recognition and cookies: links must not start looping.
  await cdp('Network.enable');
  await cdp('Network.clearBrowserCookies');
  await evalJS(
    "localStorage.removeItem('sk8_subscriber_recognition_v1'); true"
  );
  await navigate('/halloween-half-term-guide/guide/');
  check('Cookie-cleared reader still opens the full Halloween guide',
    (await evalJS('location.pathname')) === '/halloween-half-term-guide/guide/');
  await navigate('/my-sk8/');
  check('Cleared browser returns to newcomer state', await waitFor(
    "document.querySelector('[data-subscriber-shelf]')?.dataset.subscriberState === 'locked'"
  ));

  // Layout on a real phone-sized viewport.
  await cdp('Emulation.setDeviceMetricsOverride', {
    width: 390, height: 844, deviceScaleFactor: 1,
    mobile: true, screenWidth: 390, screenHeight: 844
  });
  await navigate('/my-sk8/');
  check('My SK8 mobile has no horizontal overflow', await evalJS(
    'document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1'
  ));
  await shot('anonymous-mobile.png');

  console.log('Subscriber journey read-only QA passed: ' + checks.length + ' checks.');
  await writeFile('visual-qa/subscriber-journey/results.json',
    JSON.stringify({ base: BASE, mode: 'read-only', checks }, null, 2));
} finally {
  try { ws?.close(); } catch {}
  chrome.kill('SIGTERM');
}
