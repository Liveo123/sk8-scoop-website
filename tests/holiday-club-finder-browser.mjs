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
let seasonExpired = false; // Test both season and expiry deterministically.
const freeze = async iso => rpc('Page.addScriptToEvaluateOnNewDocument',{source:'Date.now = () => '+Date.parse(iso)+';'});
const screenshot = async name => {
  const value = await rpc('Page.captureScreenshot', {format:'png',captureBeyondViewport:false,fromSurface:true});
  await writeFile('visual-qa/holiday-club-finder/' + name, Buffer.from(value.data, 'base64'));
};
const goto = async () => {
  await rpc('Page.navigate', {url:BASE + '/kids-family/holiday-club-finder/'});
  check(await ready(seasonExpired?
    "document.getElementById('expired')?.hidden===false":
    "document.querySelectorAll('#club-list .club-card').length===9"),
    seasonExpired?'Expired Christmas finder notice loads':'9 programme cards loaded');
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
  const clock=await freeze('2026-11-26T12:00:00Z');
  await rpc('Emulation.setDeviceMetricsOverride',{width:1280,height:900,screenWidth:1280,screenHeight:900,deviceScaleFactor:1,mobile:false});
  await goto();
  check(await evalJS("document.title.includes('Holiday Clubs')"),'Correct page title');
  check(await evalJS("document.querySelector('meta[name=robots]')?.content==='noindex,follow'"),'Seasonal finder stays non-indexed');
  if (!seasonExpired) {
  check(await evalJS("document.querySelectorAll('#club-list .club-card a[href^=\"https://\"]').length===9"),'9 provider detail links, HTTPS');
  check(await evalJS("Boolean(document.getElementById('finder-join-free')) && document.getElementById('finder-join-free').getAttribute('href')==='/join/'"),'Optional newsletter continuation');
  check(await evalJS("document.querySelector('.finder-help')?.textContent.includes('HAF')"),'Official HAF guidance visible');
  check(await evalJS("document.documentElement.scrollWidth<=innerWidth+1"),'No desktop horizontal overflow');
  await screenshot('desktop-all.png');
  check(await setFilter('area','Cheadle Hulme'),'Area filter accepts input');
  check((await count())===1,'Cheadle Hulme programme location filtered');
  await setFilter('area','');
  await setFilter('type','Football');
  check((await count())===4,'Four football programmes filtered');
  await setFilter('type','');
  await setFilter('day','30');
  check((await count())===5,'30 December programmes filtered');
  await setFilter('day','');
  await setFilter('area','Cheadle Hulme');
  await setFilter('age','3');
  check((await count())===0,'Impossible selection shows no results');
  check(await evalJS("document.getElementById('empty')?.hidden===false"),'Empty-result help visible');
  await setFilter('age','');
  await setFilter('area','');
  check((await count())===9,'Clearing filters restores all listings');
  check(await evalJS("Array.from(document.querySelectorAll('.finder-filters label')).every(e=>document.getElementById(e.htmlFor))"),'Every filter has associated label');
  check(await evalJS("document.querySelectorAll('main a[href^=\"https://\"]').length>=10"),'Provider and council links available without signup');
  check(await evalJS("document.querySelectorAll('#club-list .club-card').length===9"),'All nine programmes available without email gate');
  await evalJS("window.__finderSignals=[];window.sk8Track=(n,p)=>window.__finderSignals.push({n,p});true");
  await setFilter('area','Cheadle Hulme');
  check(await evalJS("window.__finderSignals.some(x=>x.n==='holiday_club_filter_used'&&x.p.filter_type==='area'&&!Object.hasOwn(x.p,'age'))"),'Filter tracking does not expose child age');
  await evalJS("document.querySelector('#club-list .club-card a').addEventListener('click',e=>e.preventDefault(),true);document.querySelector('#club-list .club-card a').click();true");
  check(await evalJS("window.__finderSignals.some(x=>x.n==='holiday_club_booking_click'&&x.p.area==='Cheadle Hulme')"),'Booking click tracked without assuming booking');
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
  }

  // Exercise the exact guide on the same preview origin before the expiry clock changes.
  await rpc('Emulation.setDeviceMetricsOverride',{width:1280,height:900,screenWidth:1280,screenHeight:900,deviceScaleFactor:1,mobile:false});
  await rpc('Page.navigate',{url:BASE+'/indoor-play/'});
  check(await ready("document.querySelectorAll('.ip-card').length===15 && document.getElementById('ip-live')?.hidden===false"),'15 indoor-play cards and live finder loaded');
  check(await evalJS("document.querySelectorAll('.ip-compare-row').length===15"),'All price scenarios present');
  check(await evalJS("document.querySelectorAll('.ip-map-venue').length===15"),'All 15 mapped venues have links');
  check(await evalJS("document.querySelectorAll('.ip-location-photo').length===2 && Array.from(document.querySelectorAll('.ip-location-photo')).every(x=>!x.getAttribute('src')&&x.dataset.src.startsWith('https://'))"),'Two attributed opt-in location photos; no initial external image request');
  check(await evalJS("(()=>{const f=document.getElementById('ip-filters');const r=f.querySelector('input[name=ip-zone][value=SK8]');r.click();return document.querySelectorAll('.ip-card:not([hidden])').length===2})()"),'SK8 radio instantly filters to two sites');
  check(await evalJS("(()=>{document.getElementById('ip-reset-top').click();return document.querySelectorAll('.ip-card:not([hidden])').length===15})()"),'Guide reset restores all sites');
  check(await evalJS("(()=>{document.getElementById('ip-age').value='7';document.getElementById('ip-age').dispatchEvent(new Event('change',{bubbles:true}));return document.querySelector('#awesome-walls [data-price-value]').textContent==='£30.00'})()"),'Eligible older-child climbing package calculates £30');
  check(await evalJS("(()=>{document.getElementById('ip-reset-top').click();document.getElementById('ip-load-map').click();return !document.getElementById('ip-map-canvas').hidden&&document.querySelectorAll('.ip-map-pin').length>0&&document.querySelector('.ip-map-credit').textContent.includes('OpenStreetMap')})()"),'Click-to-load map pins and attribution');
  check(await evalJS("(()=>{document.getElementById('ip-load-map').click();return document.getElementById('ip-map-canvas').hidden})()"),'Map closes without removing list');
  await screenshot('indoor-play-desktop.png');
  for(const width of [390,360]){await rpc('Emulation.setDeviceMetricsOverride',{width,height:844,screenWidth:width,screenHeight:844,deviceScaleFactor:1,mobile:true});check(await evalJS("document.documentElement.scrollWidth<=document.documentElement.clientWidth+1"),'Indoor-play layout fits at '+width+'px');await screenshot('indoor-play-'+width+'.png');}
  await rpc('Page.navigate',{url:BASE+'/kids-family/what-indoor-play-really-costs/'});
  check(await ready("document.body?.innerText.includes('play trip really cost') && !!document.querySelector('a[href=\\\"/indoor-play/#finder\\\"]')"),'Supporting article and live finder link load');
  await rpc('Page.removeScriptToEvaluateOnNewDocument',{identifier:clock.identifier});
  await freeze('2027-01-01T12:00:00Z'); seasonExpired=true;
  await goto();
  {
    check(await evalJS("document.getElementById('expired')?.hidden===false && document.getElementById('expired')?.textContent.includes('These Christmas listings have expired')"),
      'Expired Christmas guide clearly labelled');
    check(await count()===0,'No expired holiday club booking cards shown');
    check(await evalJS("document.querySelector('.finder-filters')?.hidden===true"),
      'Out-of-date date and age filters hidden');
    check(await evalJS("document.getElementById('count')?.textContent.includes('expired')"),
      'Results status explains expiry');
    check(await evalJS("document.querySelector('#expired a[href=\"/kids-family/\"]')?.textContent.includes('current')"),
      'Useful live family-content continuation without a signup barrier');
    check(await evalJS("document.querySelectorAll('#club-list a').length===0"),
      'No outdated Christmas booking links offered');
    check(await evalJS("document.getElementById('finder-join-free')?.getAttribute('href')==='/join/'"),
      'Newsletter invitation remains optional');
    check(await evalJS("document.documentElement.scrollWidth<=innerWidth+1"),
      'Expired-state desktop layout fits');
    await screenshot('desktop-expired.png');
    for (const width of [390,360]) {
      await rpc('Emulation.setDeviceMetricsOverride',{width,height:844,screenWidth:width,screenHeight:844,deviceScaleFactor:1,mobile:true});
      await goto();
      check(await count()===0,'Expired cards stay hidden at '+width+'px');
      check(await evalJS("document.documentElement.scrollWidth<=document.documentElement.clientWidth+1"),
        'Expired-state mobile layout fits at '+width+'px');
      check(await evalJS("(() => {const a=document.querySelector('#expired a[href=\"/kids-family/\"]');if(!a)return false;const b=a.getBoundingClientRect();return b.width>0&&b.height>0&&getComputedStyle(a).visibility==='visible';})()"),
        'Current family link remains visible and operable at '+width+'px');
      await screenshot('mobile-expired-'+width+'.png');
    }
    console.log('Seasonal finder correctly retires all Christmas club cards and offers current family ideas.');
  }
  check(errors.length===0,'No uncaught browser errors: '+errors.length);
  console.log('Holiday Club Finder release-browser QA complete.');
} finally {
  try {ws?.close();} catch {}
  chrome.kill('SIGTERM');
}
