import { spawn } from 'node:child_process';

const BASE_URL = (process.env.GUIDE_QA_BASE_URL || '').replace(/\/$/, '');
const CHROME = process.env.CHROME || 'google-chrome';
if (!BASE_URL) throw new Error('GUIDE_QA_BASE_URL is required');

const filters = ['local','free','under10','under5','primary','teen','rainy','send'];
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const results = [];
const record = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  console.log((ok ? 'PASS ' : 'FAIL ') + name + (detail ? ': ' + detail : ''));
  if (!ok) throw new Error(name + (detail ? ': ' + detail : ''));
};

const chrome = spawn(CHROME, [
  '--headless=new',
  '--disable-gpu',
  '--no-sandbox',
  '--hide-scrollbars',
  '--remote-debugging-port=9225',
  '--user-data-dir=/tmp/sk8-halloween-guide-profile',
  '--window-size=390,844',
  'about:blank'
], { stdio: ['ignore', 'pipe', 'pipe'] });

chrome.stdout.on('data', chunk => process.stdout.write(chunk));
chrome.stderr.on('data', chunk => process.stderr.write(chunk));

let version;
for (let i = 0; i < 120; i++) {
  try {
    const response = await fetch('http://127.0.0.1:9225/json/version');
    if (response.ok) {
      version = await response.json();
      break;
    }
  } catch {}
  await sleep(200);
}
if (!version) throw new Error('Chrome DevTools endpoint did not start');

const targetResponse = await fetch('http://127.0.0.1:9225/json/new?about:blank', { method: 'PUT' });
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
await command('Emulation.setDeviceMetricsOverride', {
  width: 390, height: 844, deviceScaleFactor: 1, mobile: true,
  screenWidth: 390, screenHeight: 844
});

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

const navigate = async path => {
  await command('Page.navigate', { url: BASE_URL + path });
  const ok = await waitFor("document.readyState === 'complete'", 15000);
  if (!ok) throw new Error('Page did not finish loading: ' + path);
  await sleep(650);
};

try {
  await navigate('/halloween-half-term-guide/guide/');
  record('Direct guide does not redirect to landing', await evaluate("location.pathname.replace(/\\/$/,'') === '/halloween-half-term-guide/guide'"), await evaluate('location.href'));
  record('Guide filter anchor exists', Boolean(await evaluate("document.getElementById('filters')")));
  record('Guide has filter controls', (await evaluate("document.querySelectorAll('#filters [data-filter]').length")) >= 9);
  record('Guide has event cards', (await evaluate("document.querySelectorAll('.card').length")) >= 40);

  for (const filter of filters) {
    await navigate('/halloween-half-term-guide/guide/?filter=' + encodeURIComponent(filter) + '#filters');
    const pathname = await evaluate("location.pathname.replace(/\\/$/,'')");
    record(filter + ' stays on direct guide', pathname === '/halloween-half-term-guide/guide', await evaluate('location.href'));
    record(filter + ' query state retained', (await evaluate("new URLSearchParams(location.search).get('filter')")) === filter);
    record(filter + ' control becomes active', Boolean(await evaluate(`document.querySelector('[data-filter="${filter}"]')?.classList.contains('active') && document.querySelector('[data-filter="${filter}"]')?.getAttribute('aria-pressed') === 'true'`)));
    const visible = await evaluate("Array.from(document.querySelectorAll('.card')).filter(card => !card.hidden).length");
    record(filter + ' returns visible results', visible > 0, String(visible));
    const top = await evaluate("Math.round(document.getElementById('filters')?.getBoundingClientRect().top ?? 9999)");
    record(filter + ' anchor lands near filters on mobile', top < 250 && top > -80, String(top));
  }

  console.log(JSON.stringify({ ok: true, checks: results.length, base: BASE_URL, filters }, null, 2));
} finally {
  try { ws.close(); } catch {}
  try { chrome.kill('SIGTERM'); } catch {}
}
