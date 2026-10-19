import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import core from '../assets/sk8-calendar-core.js';

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
  const today = await evaluate("window.SK8CalendarCore.localToday()");
  const data = await evaluate("window.SK8_EVENT_DATA");
  const shift = (date, days) => {
    const d=new Date(date+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+days);
    return d.toISOString().slice(0,10);
  };
  const activeIds = new Set(data.map(e=>e.id));
  check(data.length>0,'at least one current, verified event loads');
  check(!data.some(e=>['cancelled','sold_out','example'].includes(String(e.status||'').toLowerCase())),
    'unavailable events are excluded from browser state');
  check(await evaluate("document.body.dataset.calendarView==='agenda'"),'agenda opens by default');
  check(await evaluate("document.querySelector('.whats-on-seasonal-watch')?.textContent.includes('planning themes, not scheduled events')"),
    'seasonal themes distinguished from dated events');
  check(await evaluate("document.querySelectorAll('.event-listing-card').length")===data.length,
    'every current event record renders, no fixed event quota');
  check(data.some(e=>['Cheadle','Cheadle Hulme','Gatley','Heald Green'].includes(e.area)),
    'current core-SK8 records exist');

  const gatley=data.filter(e=>e.area==='Gatley');
  check(await click('[data-event-area="Gatley"]'),'Gatley filter selectable');
  check(await evaluate("document.querySelectorAll('.event-listing-card').length")===gatley.length,
    'Gatley filter matches real current records');
  if(gatley.length) check(await evaluate("document.querySelector('[data-events-list]').textContent.includes("+JSON.stringify(gatley[0].title)+")"),
    'current Gatley event visible');

  await click('[data-event-area="all"]');
  const nowDate=new Date(today+'T00:00:00Z');
  const dayOfWeek=nowDate.getUTCDay();
  const sat=shift(today,dayOfWeek===0?0:(6-dayOfWeek+7)%7);
  const sun=shift(sat,dayOfWeek===0?0:1);
  const weekendExpected=data.filter(e=>core.withinRange(e,sat,sun));
  check(await click('[data-event-filter="weekend"]'),'weekend filter selectable');
  check(await evaluate("document.querySelectorAll('.event-listing-card').length")===weekendExpected.length,
    'weekend results correspond to actual confirmed sessions');
  check(await click('[data-event-filter="all"]'),'reset weekend filter');
  check(await evaluate("document.querySelectorAll('.event-listing-card').length")===data.length,
    'all current records return after reset');

  check(await click('[data-event-filter="free"]'),'free filter selectable');
  check(await evaluate("document.querySelectorAll('.event-listing-card').length")===data.filter(core.isFree).length,
    'free filter respects actual cost classifications');
  check(await click('[data-event-filter="all"]'),'reset free filter');
  check(await evaluate("!document.querySelector('[data-events-list]').textContent.includes('Sisters Youth Qiyam')"),
    'excluded organiser listings remain absent');
  if (activeIds.has('reddish-vale-halloween-pumpkin-festival-2026-10-10')) {
    check(await evaluate("document.querySelector('[data-event-id=\"reddish-vale-halloween-pumpkin-festival-2026-10-10\"] a[download]')===null"),
      'unconfirmed range does not offer a fabricated calendar occurrence');
  }

  const candidates=data.map(e=>{
    let chosen=null;
    if(core.mode(e)==='specific_dates') chosen=core.confirmedDates(e).find(d=>d>=today);
    else if(core.mode(e)==='daily') chosen=e.date>today?e.date:today;
    else if(e.date>=today) chosen=e.date;
    return {event:e,date:chosen};
  }).filter(x=>x.date&&core.withinHorizon(x.date,today)).sort((a,b)=>{
    const score=x=>(x.event.end_time?4:0)+(core.mode(x.event)==='daily'?2:0)+
      (core.mode(x.event)==='specific_dates'?1:0);
    return score(b)-score(a) || a.date.localeCompare(b.date);
  });
  check(candidates.length>0,'at least one future dated record is testable');
  const selected=candidates[0], chosen=selected.date, originalEvent=selected.event;
  const chosenId=['daily','specific_dates'].includes(core.mode(originalEvent)) ?
    originalEvent.id+'--'+chosen : originalEvent.id;

  check(await click('[data-calendar-view="month"]'),'month view available');
  check(await evaluate("document.body.dataset.calendarView==='month'"),'month view active');
  check(await evaluate("document.querySelectorAll('[data-calendar-day]').length>=28"),'month grid has dates');
  let located=false;
  for(let i=0;i<12;i++){
    located=await evaluate("Boolean(document.querySelector('[data-calendar-day="+JSON.stringify(chosen)+"]'))");
    if(located)break;
    check(await click('[data-calendar-next]'),'move to future month');
  }
  check(located,'the next confirmed event is in 12-month calendar');
  check(await evaluate("document.querySelector('[data-calendar-day="+JSON.stringify(chosen)+"]')?.classList.contains('has-events')"),
    'verified future event date marked');
  if (core.mode(originalEvent)==='specific_dates') {
    const missing=shift(chosen,1);
    if (!core.onDate(originalEvent,missing) && core.withinHorizon(missing,today)) {
      check(await evaluate("window.SK8CalendarCore.onDate(window.SK8_EVENT_DATA.find(e=>e.id==="+JSON.stringify(originalEvent.id)+"),"+JSON.stringify(missing)+")===false"),
        'unconfirmed recurring session not invented');
    }
  }
  check(await evaluate("document.querySelector('[data-calendar-day="+JSON.stringify(chosen)+"]')!==null"),
    'selected date exists in calendar DOM');
  check(await evaluate("(() => {const x=document.querySelector('[data-calendar-day="+JSON.stringify(chosen)+"]');if(!x)return false;x.focus();return document.activeElement===x;})()"),
    'calendar days are keyboard focusable');

  check(await click('[data-calendar-view="agenda"]'),'return to agenda');
  check(await evaluate("(() => {const x=document.querySelector('[data-calendar-choose-date]');x.value="+JSON.stringify(chosen)+";x.dispatchEvent(new Event('change',{bubbles:true}));return true;})()"),
    'choose next actual confirmed date');
  await waitFor("!!document.querySelector('[data-event-id="+JSON.stringify(chosenId)+"]')");
  check(await evaluate("document.querySelector('[data-event-id="+JSON.stringify(chosenId)+"]')!==null"),
    'chosen event is present on its verified date');
  const range=data.find(e=>core.mode(e)==='range_unspecified' && e.end_date>e.date &&
    shift(e.date,1)>=today && core.withinHorizon(shift(e.date,1),today));
  if(range){
    const uncertain=shift(range.date,1);
    const oldChosen=chosen;
    await evaluate("(() => {const x=document.querySelector('[data-calendar-choose-date]');x.value="+JSON.stringify(uncertain)+";x.dispatchEvent(new Event('change',{bubbles:true}));return true;})()");
    check(await evaluate("!document.querySelector('[data-event-id="+JSON.stringify(range.id)+"]')"),
      'unconfirmed mid-run theatre date is not fabricated');
    await evaluate("(() => {const x=document.querySelector('[data-calendar-choose-date]');x.value="+JSON.stringify(oldChosen)+";x.dispatchEvent(new Event('change',{bubbles:true}));return true;})()");
  }

  await waitFor("!!document.querySelector('[data-event-id="+JSON.stringify(chosenId)+"] .my-sk8-save')");
  check(await click('[data-event-id="'+chosenId+'"] .my-sk8-save'),'save one verified dated event');
  check(await evaluate("JSON.parse(localStorage.getItem('sk8_saved_items_v1')||'[]').some(e=>e.id==="+JSON.stringify(chosenId)+" && e.date==="+JSON.stringify(chosen)+")"),
    'saved event date matches confirmed calendar date');
  if (originalEvent.end_time && originalEvent.time) {
    const desired='DTEND;TZID=Europe/London:'+chosen.replaceAll('-','')+'T'+originalEvent.end_time.replace(':','')+'00';
    check(await evaluate("(() => {const x=document.querySelector('[data-event-id="+JSON.stringify(chosenId)+"] a[download]');return !!x&&decodeURIComponent(x.href).includes("+JSON.stringify(desired)+");})()"),
      'confirmed finish time appears in calendar export');
  }

  await waitFor("!document.querySelector('[data-my-sk8-toast]')?.classList.contains('show')");
  await evaluate("document.querySelector('[data-calendar-controls]').scrollIntoView({block:'start',behavior:'instant'});true");
  await shot('desktop-agenda.png');
  check(await click('[data-calendar-view="month"]'),'return to month for screenshot');
  await evaluate("(() => {const x=document.querySelector('[data-calendar-month-panel]');x.scrollIntoView({block:'start',behavior:'instant'});return true;})()");
  await shot('desktop-month.png');
  await rpc('Emulation.setDeviceMetricsOverride',{
    width:390,height:844,screenWidth:390,screenHeight:844,deviceScaleFactor:1,mobile:true});
  check(await evaluate("document.documentElement.scrollWidth<=window.innerWidth+1"),
    'mobile month view has no horizontal overflow');
  check(await evaluate("getComputedStyle(document.querySelector('.sk8-calendar-count-word')).display==='none'"),
    'mobile day counts remain compact');
  await shot('mobile-month.png');

  await rpc('Page.navigate',{url:base+'/my-sk8/'});
  await waitFor("document.querySelector('[data-saved-id="+JSON.stringify(chosenId)+"]')!==null");
  check(await evaluate("document.querySelector('[data-saved-id="+JSON.stringify(chosenId)+"]')!==null"),
    'saved verified event appears in My SK8');
  check(!errors.length,'no uncaught calendar JavaScript errors: '+errors.join('; '));
  console.log('Date-independent calendar integration browser checks passed.');
} finally {
  try{ws?.close();}catch{}
  chrome.kill('SIGTERM');
}
