import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';

const base = (process.env.PREVIEW_URL || '').replace(/\/$/, '');
if (!base) throw Error('PREVIEW_URL missing');
const port = 19413;
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
const chrome = spawn(process.env.CHROME || 'google-chrome', [
  '--headless=new','--disable-gpu','--no-sandbox','--disable-dev-shm-usage',
  '--remote-debugging-port=' + port,'--user-data-dir=/tmp/sk8-calendar-browser-' + process.pid,
  '--window-size=1366,900','about:blank'
],{stdio:'ignore'});
let ws, serial = 0;
const promises = new Map(), errors = [];
const check = (condition, message) => {if(!condition) throw Error('FAIL: ' + message); console.log('PASS: ' + message);};
const rpc = (method, params = {}) => new Promise((resolve,reject) => {
  const id=++serial; promises.set(id,{resolve,reject}); ws.send(JSON.stringify({id,method,params}));
});
const evaluate = async expression => {
  const data=await rpc('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});
  if(data.exceptionDetails) throw Error(data.exceptionDetails.exception?.description||data.exceptionDetails.text);
  return data.result?.value;
};
const waitFor = async expression => {
  for(let i=0;i<120;i++){try{if(await evaluate(expression))return;}catch{} await pause(150);}
  throw Error('Timed out: '+expression);
};
const click = selector => evaluate("(() => { const e=document.querySelector("+JSON.stringify(selector)+"); if(!e) return false; e.click(); return true; })()");
const shot = async name => {
  const x=await rpc('Page.captureScreenshot',{format:'png',captureBeyondViewport:false,fromSurface:true});
  await writeFile('visual-qa/calendar/'+name,Buffer.from(x.data,'base64'));
};
try {
  await mkdir('visual-qa/calendar',{recursive:true});
  let ready=false;
  for(let i=0;i<130;i++){
    try{const r=await fetch('http://127.0.0.1:'+port+'/json/version');if(r.ok){ready=true;break;}}catch{}
    await pause(150);
  }
  check(ready,'Chrome starts');
  const tab=await(await fetch('http://127.0.0.1:'+port+'/json/new?about:blank',{method:'PUT'})).json();
  ws=new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise((resolve,reject)=>{ws.addEventListener('open',resolve,{once:true});ws.addEventListener('error',reject,{once:true});});
  ws.addEventListener('message', e=>{
    const payload=JSON.parse(String(e.data));
    if(payload.method==='Runtime.exceptionThrown')errors.push(payload.params.exceptionDetails?.exception?.description||payload.params.exceptionDetails?.text);
    if(!payload.id)return;
    const p=promises.get(payload.id);if(!p)return;promises.delete(payload.id);
    if(payload.error)p.reject(Error(payload.error.message));else p.resolve(payload.result);
  });
  await rpc('Page.enable');await rpc('Runtime.enable');
  await rpc('Page.navigate',{url:base+'/whats-on/'});
  await waitFor("document.querySelector('[data-events-status]')?.textContent.includes('shown')");
  if (await evaluate("Boolean(document.querySelector('[data-consent-none]')) && !document.querySelector('.privacy-choices')?.hidden")) {
    await click('[data-consent-none]');
    await pause(150);
  }
  check(await evaluate("document.body.dataset.calendarView==='agenda'"),'agenda opens by default');
  check(await evaluate("document.querySelectorAll('.event-listing-card').length>=20"),'real event records render');
  check(await evaluate("document.querySelectorAll('.whats-on-agenda-date').length>=3"),'agenda grouped by date');
  check(await evaluate("document.querySelectorAll('.event-listing-card .my-sk8-save').length>=20"),'My SK8 buttons render');
  check(await evaluate("document.querySelector('[data-event-id=\"reddish-vale-halloween-pumpkin-festival-2026-10-10\"] a[download]')===null"),'unknown session dates do not export misleading ICS');
  check(await evaluate("!document.querySelector('[data-events-list]').textContent.includes('Sisters Youth Qiyam')"),'excluded listing absent');
  check(await click('[data-event-filter="free"]'),'free filter usable');
  check(await evaluate("!document.querySelector('[data-events-list]').textContent.includes('Quarry Bank Scarecrow Festival')"),'paid admission excluded from Free');
  check(await evaluate("document.querySelector('[data-events-list]').textContent.includes('Foodie Friday')"),'free entry event retained');
  check(await evaluate("document.querySelectorAll('.my-sk8-save').length>0"),'My SK8 rebinds after Free');
  await click('[data-event-filter="all"]');
  check(await click('[data-calendar-view="month"]'),'month toggle works');
  check(await evaluate("document.body.dataset.calendarView==='month'"),'month mode active');
  check(await evaluate("document.querySelectorAll('[data-calendar-day]').length>=28"),'date grid rendered');
  check(await evaluate("document.querySelector('[data-calendar-day=\"2026-10-10\"]')?.classList.contains('has-events')"),'confirmed date marked');
  check(await evaluate("(() => { const b=document.querySelector('[data-calendar-day=\"2026-10-10\"]');b.focus();b.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));return document.activeElement?.dataset.calendarDay==='2026-10-11';})()"),'calendar arrow-key navigation accessible');
  check(await evaluate("document.querySelector('[data-calendar-day=\"2026-10-20\"] small')?.textContent.trim()==='1 event'"),'only confirmed daily activity shown, not uncertain theatre sessions');
  for(let i=0;i<12;i++)await click('[data-calendar-next]');
  check(await evaluate("document.querySelector('[data-calendar-next]').disabled"),'12-month browsing limit');
  check(await evaluate("document.querySelector('[data-calendar-day=\"2027-10-08\"]')?.disabled"),'future date outside horizon disabled');
  check(await click('[data-calendar-view="agenda"]'),'back to agenda');
  check(await evaluate("(() => {const e=document.querySelector('[data-calendar-choose-date]');e.value='2026-10-20';e.dispatchEvent(new Event('change',{bubbles:true}));return true;})()"),'select unconfirmed date');
  check(await evaluate("document.querySelectorAll('.event-listing-card').length===1 && !document.querySelector('[data-events-list]').textContent.includes('The Girl on the Train')"),'date-range performances are not fabricated; verified festival remains');
  check(await click('[data-calendar-clear-date]'),'clear date');
  check(await evaluate("document.querySelectorAll('.event-listing-card .my-sk8-save').length>=20"),'My SK8 rebinds on date clearing');
  check(await evaluate("(() => {const e=document.querySelector('[data-calendar-choose-date]');e.value='2026-10-10';e.dispatchEvent(new Event('change',{bubbles:true}));return true;})()"),'select confirmed date');
  const selector='[data-event-id="quarry-bank-scarecrow-festival-2026-10-03--2026-10-10"] .my-sk8-save';
  check(await evaluate("document.querySelector('[data-event-id=\"quarry-bank-scarecrow-festival-2026-10-03--2026-10-10\"] a[download]')!==null"),'confirmed daily occurrence offers calendar export');
  check(await click(selector),'save specific occurrence');
  check(await evaluate("JSON.parse(localStorage.getItem('sk8_saved_items_v1')||'[]').some(e=>e.id.endsWith('--2026-10-10')&&e.date==='2026-10-10')"),'saved date agrees with clicked date');
  await evaluate("document.querySelector('[data-calendar-controls]').scrollIntoView({block:'start',behavior:'instant'});true");
  await shot('desktop-agenda.png');
  await click('[data-calendar-view="month"]');
  for(let i=0;i<12;i++)await click('[data-calendar-prev]');
  check(await evaluate("document.querySelector('[data-calendar-month-heading]').textContent==='October 2026'"),'review screenshots show current confirmed month');
  await evaluate("(() => {const el=document.querySelector('[data-calendar-controls]');window.scrollTo(0,el.getBoundingClientRect().top+window.scrollY-108);return true;})()");
  await shot('desktop-month.png');
  await rpc('Emulation.setDeviceMetricsOverride',{width:390,height:844,screenWidth:390,screenHeight:844,deviceScaleFactor:1,mobile:true});
  check(await evaluate("document.documentElement.scrollWidth<=window.innerWidth+1"),'mobile month view no horizontal overflow');
  await evaluate("document.querySelector('[data-calendar-month-panel]').scrollIntoView({block:'start',behavior:'instant'});window.scrollBy(0,-104);true");
  await pause(350);
  await shot('mobile-month.png');
  check(!errors.length,'no uncaught JS errors: '+errors.join('; '));
  console.log('Calendar integration browser checks passed.');
} finally {
  try{ws?.close();}catch{}
  chrome.kill('SIGTERM');
}
