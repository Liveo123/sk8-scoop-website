import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
const base=(process.env.PREVIEW_URL||'').replace(/\/$/,'');
if(!base)throw Error('PREVIEW_URL required');
const port=19471;
const sleep=ms=>new Promise(done=>setTimeout(done,ms));
const chrome=spawn(process.env.CHROME||'google-chrome',[
 '--headless=new','--disable-gpu','--no-sandbox','--disable-dev-shm-usage',
 '--remote-debugging-port='+port,'--user-data-dir=/tmp/sk8-ux-20-'+process.pid,
 '--window-size=1366,900','about:blank'
],{stdio:'ignore'});
let ws,serial=0;const pending=new Map();
const check=(ok,note)=>{if(!ok)throw Error('FAIL: '+note);console.log('PASS: '+note);};
const rpc=(method,params={})=>new Promise((resolve,reject)=>{
 const id=++serial;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));
});
const evaluate=async expr=>{
 const response=await rpc('Runtime.evaluate',{expression:expr,returnByValue:true,awaitPromise:true});
 if(response.exceptionDetails)throw Error(response.exceptionDetails.exception?.description||response.exceptionDetails.text);
 return response.result?.value;
};
const waitFor=async expr=>{
 for(let attempt=0;attempt<110;attempt++){try{if(await evaluate(expr))return;}catch{}await sleep(150);}
 throw Error('Timed out: '+expr);
};
const click=selector=>evaluate("(() => {const e=document.querySelector("+JSON.stringify(selector)+");if(!e)return false;e.click();return true;})()");
const navigate=async path=>{await rpc('Page.navigate',{url:base+path});await waitFor('document.readyState==="complete"');};
const viewport=(width,height)=>rpc('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<800});
const shot=async name=>{
 const r=await rpc('Page.captureScreenshot',{format:'png',captureBeyondViewport:false,fromSurface:true});
 await writeFile('visual-qa/usability/'+name,Buffer.from(r.data,'base64'));
};
try{
 await mkdir('visual-qa/usability',{recursive:true});
 let ready=false;
 for(let i=0;i<120;i++){
  try{if((await fetch('http://127.0.0.1:'+port+'/json/version')).ok){ready=true;break;}}catch{}
  await sleep(150);
 }
 check(ready,'Chromium starts');
 const tab=await(await fetch('http://127.0.0.1:'+port+'/json/new?about:blank',{method:'PUT'})).json();
 ws=new WebSocket(tab.webSocketDebuggerUrl);
 await new Promise((resolve,reject)=>{ws.addEventListener('open',resolve,{once:true});ws.addEventListener('error',reject,{once:true});});
 ws.addEventListener('message',event=>{
  const message=JSON.parse(String(event.data));if(!message.id)return;
  const p=pending.get(message.id);if(!p)return;pending.delete(message.id);
  if(message.error)p.reject(Error(message.error.message));else p.resolve(message.result);
 });
 await rpc('Page.enable');await rpc('Runtime.enable');
 await viewport(1366,900);
 await navigate('/');
 await waitFor('Boolean(document.querySelector(".site-header .nav-more"))');
 check(await evaluate("['/start/','/submit/','/contact/','/advertise.html'].every(p=>[...document.querySelectorAll('.nav-more-menu a')].some(a=>new URL(a.href).pathname===p))"),'All secondary destinations kept');
 check(await evaluate("document.querySelectorAll('.site-header .nav>a:not(.button)').length===5"),'Five primary reader routes');
 check(await evaluate("document.querySelectorAll('.reader-first-chips > a').length===4"),'Four immediate task shortcuts');
 check(await evaluate("Boolean(document.querySelector('input[aria-describedby=\"reader-first-search-help\"]'))"),'Search scope accessible');
 await shot('homepage-desktop.png');
 await navigate('/whats-on/?filter=weekend&type=free-family&area=Cheadle');
 await waitFor('window.SK8_EVENT_DATA && document.querySelector("[data-events-status]").textContent.includes("shown")');
 if(await evaluate("Boolean(document.querySelector('[data-consent-none]'))&&!document.querySelector('.privacy-choices')?.hidden")){
  await click('[data-consent-none]');await sleep(180);
 }
 check(await evaluate('window.SK8_EVENT_DATA.length>0'),'Checked event feed loads');
 check(await evaluate("(() => {const core=window.SK8CalendarCore;const now=core.localToday();const day=new Date(now+'T00:00:00Z').getUTCDay();const add=(s,n)=>{const d=new Date(s+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);};const sat=day===0?now:add(now,(6-day+7)%7);const sun=day===0?now:add(sat,1);const wanted=window.SK8_EVENT_DATA.filter(e=>e.area==='Cheadle'&&core.isFree(e)&&core.isFamily(e)&&core.withinRange(e,sat,sun)).length;return wanted===document.querySelectorAll('.event-listing-card').length;})()"),'Weekend, Free, Family and Cheadle filters combine correctly');
 check(await evaluate("['weekend','free','family'].every(k=>document.querySelector('[data-event-filter=\"'+k+'\"]')?.getAttribute('aria-pressed')==='true')"),'Combined selections visible to screen readers');
 check(await evaluate("document.querySelector('[data-whats-on-selection]')?.textContent.includes('free & family-friendly')"),'Plain-language combined result label');
 check(await evaluate("new URL(location.href).searchParams.get('type')==='free-family'"),'Selection survives in sharable URL');
 await shot('whatson-desktop.png');
 check(await click('[data-calendar-view="month"]'),'Month calendar available with active conditions');
 check(await evaluate("document.querySelector('[data-event-filter=\"weekend\"]')?.getAttribute('aria-pressed')==='true'"),'Month view preserves weekend filter');
 check(await evaluate("[...document.querySelectorAll('.sk8-calendar-day.has-events')].every(el=>[0,6].includes(new Date(el.dataset.calendarDay+'T00:00:00Z').getUTCDay()))"),'Month view does not highlight non-weekend dates for weekend-only results');
 check(await click('[data-calendar-view="agenda"]'),'Return to agenda');
 check(await click('[data-event-filter="all"]'),'All dates available');
 check(await evaluate("['free','family'].every(k=>document.querySelector('[data-event-filter=\"'+k+'\"]')?.getAttribute('aria-pressed')==='false')"),'All dates also provides familiar reset');
 await navigate('/whats-on/?filter=free');
 await waitFor('window.SK8_EVENT_DATA && document.querySelector("[data-events-status]").textContent.includes("shown")');
 check(await evaluate("document.querySelector('[data-event-filter=\"free\"]')?.getAttribute('aria-pressed')==='true'"),'Old free preset works');
 check(await evaluate("document.querySelectorAll('.event-listing-card').length===window.SK8_EVENT_DATA.filter(window.SK8CalendarCore.isFree).length"),'Old free preset results correct');
 await viewport(390,844);
 await navigate('/');
 await waitFor('Boolean(document.querySelector(".site-header .nav-more"))');
 check(await evaluate('document.documentElement.scrollWidth<=window.innerWidth+3'),'Homepage has no mobile horizontal overflow');
 check(await click('.site-header .menu-btn'),'Mobile menu opens');
 check(await evaluate("document.querySelector('.site-header .nav').classList.contains('open')"),'Mobile menu visible');
 check(await click('.site-header .nav-more summary'),'Mobile More disclosure opens');
 check(await evaluate("document.querySelector('.site-header .nav-more').open"),'More links accessible');
 await evaluate("document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));true");
 check(await evaluate("!document.querySelector('.site-header .nav-more').open"),'Escape closes secondary menu');
 await evaluate("document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));true");
 check(await evaluate("!document.querySelector('.site-header .nav').classList.contains('open')"),'Escape closes mobile navigation');
 await shot('homepage-mobile.png');
 await navigate('/whats-on/?filter=weekend&type=free-family');
 await waitFor('window.SK8_EVENT_DATA && document.querySelector("[data-events-status]").textContent.includes("shown")');
 check(await evaluate('document.documentElement.scrollWidth<=window.innerWidth+3'),"What's On has no mobile horizontal overflow");
 check(await evaluate("[...document.querySelectorAll('.whats-on-filter-buttons button')].every(el=>el.getBoundingClientRect().height>=43)"),'All mobile filters meet practical touch-target size');
 await shot('whatson-mobile.png');
 console.log('PASS 20-pass usability browser QA completed');
}catch(error){console.error(error);process.exitCode=1;}
finally{try{ws?.close();}catch{}chrome.kill('SIGTERM');}
