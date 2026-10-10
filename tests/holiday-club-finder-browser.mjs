import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';

const BASE = (process.env.PREVIEW_URL || '').replace(/\/$/, '');
if (!BASE) throw Error('PREVIEW_URL is required');
const port = 19377;
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const chrome = spawn(process.env.CHROME || 'google-chrome', [
  '--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage',
  '--remote-debugging-port=' + port,
  '--user-data-dir=/tmp/sk8-finder-' + process.pid, '--window-size=1280,900', 'about:blank'
], { stdio: 'ignore' });
let ws, serial = 0;
const tasks = new Map();
const errors = [];
const check = (ok, title) => { if (!ok) throw Error('FAIL: ' + title); console.log('PASS: ' + title); };
const rpc = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++serial;
  tasks.set(id, {resolve, reject});
  ws.send(JSON.stringify({id, method, params}));
});
const evalJS = async expression => {
  const data = await rpc('Runtime.evaluate', {expression, returnByValue:true, awaitPromise:true});
  if (data.exceptionDetails) throw Error(data.exceptionDetails.exception?.description || data.exceptionDetails.text);
  return data.result?.value;
};
const ready = async (expression) => {
  for (let i=0; i<110; i++) {
    try { if (await evalJS(expression)) return true; } catch {}
    await sleep(140);
  }
  return false;
};
const setFilter = async (name, value) => evalJS(
  '(() => {const e=document.getElementById(' + JSON.stringify(name) + ');e.value=' +
  JSON.stringify(value) + ';e.dispatchEvent(new Event("change",{bubbles:true}));return true;})()'
);
const count = async () => evalJS("document.querySelectorAll('#club-list .club-card').length");
const screenshot = async name => {
  const value = await rpc('Page.captureScreenshot', {format:'png',captureBeyondViewport:false,fromSurface:true});
  await writeFile('visual-qa/holiday-club-finder/' + name, Buffer.from(value.data, 'base64'));
};
const goto = async () => {
  await rpc('Page.navigate', {url:BASE + '/kids-family/holiday-club-finder/'});
  check(await ready("document.querySelectorAll('#club-list .club-card').length===18"), '18 club cards loaded');
};
try {
  await mkdir('visual-qa/holiday-club-finder', {recursive:true});
  let browserReady = false;
  for (let i=0; i<140; i++) {
    try {
      const response = await fetch('http://127.0.0.1:' + port + '/json/version');
      if (response.ok) {browserReady=true;break;}
    } catch {}
    await sleep(140);
  }
  check(browserReady,'Chromium available');
  const tab = await (await fetch('http://127.0.0.1:' + port + '/json/new?about:blank', {method:'PUT'})).json();
  ws = new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise((resolve,reject) => {
    ws.addEventListener('open',resolve,{once:true});
    ws.addEventListener('error',reject,{once:true});
  });
  ws.addEventListener('message', event => {
    const payload = JSON.parse(String(event.data));
    if (payload.method==='Runtime.exceptionThrown') errors.push(payload.params?.exceptionDetails?.exception?.description || 'Page error');
    if (!payload.id) return;
    const task=tasks.get(payload.id);
    if (!task) return;
    tasks.delete(payload.id);
    if (payload.error) task.reject(Error(payload.error.message)); else task.resolve(payload.result);
  });
  await rpc('Page.enable');
  await rpc('Runtime.enable');
  await rpc('Emulation.setDeviceMetricsOverride',{width:1280,height:900,screenWidth:1280,screenHeight:900,deviceScaleFactor:1,mobile:false});
  await goto();
  check(await evalJS("document.title.includes('Holiday Clubs')"),'Correct page title');
  check(await evalJS("document.querySelector('meta[name=robots]')?.content==='noindex,follow'"),'Draft not indexable until owner approval');
  check(await evalJS("document.querySelectorAll('#club-list .club-card a[href^=\"https://\"]').length===18"),'18 provider detail links, HTTPS');
  check(await evalJS("Boolean(document.getElementById('finder-join-free')) && document.getElementById('finder-join-free').getAttribute('href')==='/join/'"),'Optional newsletter continuation');
  check(await evalJS("document.querySelector('.finder-help')?.textContent.includes('HAF')"),'Official HAF guidance visible');
  check(await evalJS("document.documentElement.scrollWidth<=innerWidth+1"),'No desktop horizontal overflow');
  await screenshot('desktop-all.png');
  check(await setFilter('area','Gatley'),'Area filter accepts input');
  check((await count())===2,'Gatley has two programme locations');
  await setFilter('area','');
  await setFilter('type','Gymnastics');
  check((await count())===2,'Gymnastics options filtered');
  await setFilter('type','');
  await setFilter('day','30');
  check((await count())===13,'Friday programme options filtered');
  await setFilter('day','');
  await setFilter('area','Gatley');
  await setFilter('age','3');
  check((await count())===0,'Impossible selection shows no results');
  check(await evalJS("document.getElementById('empty')?.hidden===false"),'Empty-result help visible');
  await setFilter('age','');
  await setFilter('area','');
  check((await count())===18,'Clearing filters restores all listings');
  check(await evalJS("Array.from(document.querySelectorAll('.finder-filters label')).every(e=>document.getElementById(e.htmlFor))"),'Every filter has associated label');
  check(await evalJS("document.querySelectorAll('main a[href^=\"https://\"]').length>=19"),'Provider and council links available without signup');
  check(await evalJS("document.querySelectorAll('#club-list .club-card').length===18"),'All clubs available without email gate');
  await evalJS("window.__finderSignals=[];window.sk8Track=(n,p)=>window.__finderSignals.push({n,p});true");
  await setFilter('area','Gatley');
  check(await evalJS("window.__finderSignals.some(x=>x.n==='holiday_club_filter_used'&&x.p.filter_type==='area'&&!Object.hasOwn(x.p,'age'))"),'Filter tracking does not expose child age');
  await evalJS("document.querySelector('#club-list .club-card a').addEventListener('click',e=>e.preventDefault(),true);document.querySelector('#club-list .club-card a').click();true");
  check(await evalJS("window.__finderSignals.some(x=>x.n==='holiday_club_booking_click'&&x.p.area==='Gatley')"),'Booking click tracked without assuming booking');
  await evalJS("document.getElementById('finder-join-free').addEventListener('click',e=>e.preventDefault(),true);document.getElementById('finder-join-free').click();true");
  check(await evalJS("window.__finderSignals.some(x=>x.n==='holiday_finder_join_click')"),'Join CTA event recorded');
  for(const width of [390,360]) {
    await rpc('Emulation.setDeviceMetricsOverride',{width,height:844,screenWidth:width,screenHeight:844,deviceScaleFactor:1,mobile:true});
    await goto();
    check(await evalJS("document.documentElement.scrollWidth<=document.documentElement.clientWidth+1"),'No horizontal overflow at '+width+'px');
    check(await evalJS("document.querySelector('#club-list .club-card').getBoundingClientRect().width<=innerWidth+1"),'Card fits phone at '+width+'px');
    check(await evalJS("document.getElementById('finder-join-free').getBoundingClientRect().height>=40"),'Join link tappable at '+width+'px');
    await screenshot('mobile-'+width+'.png');
  }
  check(errors.length===0,'No uncaught browser errors: '+errors.length);
  console.log('Holiday Club Finder release-browser QA complete.');
} finally {
  try {ws?.close();} catch {}
  chrome.kill('SIGTERM');
}
