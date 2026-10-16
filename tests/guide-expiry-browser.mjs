// SK8 Scoop: actual guide browser QA. Runs on preview source, never publishes.
import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
const BASE=(process.env.PREVIEW_URL||'').replace(/\/$/,'');
const CHROME=process.env.CHROME||'google-chrome';
if(!BASE)throw Error('PREVIEW_URL required');
const sleep=n=>new Promise(resolve=>setTimeout(resolve,n));
const check=(label,ok,detail='')=>{console.log((ok?'PASS ':'FAIL ')+label+(detail?': '+detail:''));if(!ok)throw Error(label+(detail?': '+detail:''));};
const chrome=spawn(CHROME,['--headless=new','--disable-gpu','--no-sandbox','--hide-scrollbars','--remote-debugging-port=9244','--user-data-dir=/tmp/sk8-guide-expiry-'+process.pid,'--window-size=390,844','about:blank'],{stdio:['ignore','ignore','pipe']});
chrome.stderr.on('data',bytes=>{const t=String(bytes);if(/FATAL/i.test(t))process.stderr.write(t.slice(0,400));});
let ws;
try {
 let version;
 for(let n=0;n<100;n++){try{const res=await fetch('http://127.0.0.1:9244/json/version');if(res.ok){version=await res.json();break;}}catch{}await sleep(150);}
 check('Chrome ready',!!version);
 const target=await (await fetch('http://127.0.0.1:9244/json/new?about:blank',{method:'PUT'})).json();
 ws=new WebSocket(target.webSocketDebuggerUrl);
 await new Promise((resolve,reject)=>{ws.addEventListener('open',resolve,{once:true});ws.addEventListener('error',reject,{once:true});});
 let seq=0;const pending=new Map();
 ws.addEventListener('message',e=>{const msg=JSON.parse(String(e.data));if(!msg.id)return;const p=pending.get(msg.id);if(!p)return;pending.delete(msg.id);if(msg.error)p.reject(Error(msg.error.message));else p.resolve(msg.result);});
 const cmd=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});
 const evalJs=async expression=>{const result=await cmd('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(result.exceptionDetails)throw Error(result.exceptionDetails.exception?.description||result.exceptionDetails.text||'Page JavaScript error');return result.result.value;};
 const waitFor=async(expression,limit=22000)=>{const start=Date.now();while(Date.now()-start<limit){try{if(await evalJs(expression))return true;}catch{}await sleep(130);}return false;};
 await cmd('Page.enable');await cmd('Runtime.enable');
 await cmd('Emulation.setDeviceMetricsOverride',{width:390,height:844,screenWidth:390,screenHeight:844,deviceScaleFactor:1,mobile:true});
 await cmd('Page.navigate',{url:BASE+'/halloween-half-term-guide/guide/'});
 check('Guide renders',await waitFor("document.readyState==='complete' && !!window.sk8GuideExpiry"));
 const details=await evalJs("({count:E.length,visible:[...document.querySelectorAll('.card')].filter(x=>!x.hidden).length,engine:typeof SK8GuideExpiry.mount,asset:[...document.scripts].some(x=>x.src.endsWith('/assets/guide-expiry.js'))})");
 check('46 selected records',details.count===46);
 check('Shared expiry asset loaded',details.engine==='function'&&details.asset);
 async function dateCase(date) {
   return await evalJs("(()=>{const date="+JSON.stringify(date)+";const NativeDate=window.__originalDate||(window.__originalDate=window.Date);window.Date=class extends NativeDate{constructor(...args){super(...(args.length?args:[date+'T12:00:00Z']));}static now(){return NativeDate.parse(date+'T12:00:00Z');}};return window.sk8GuideExpiry.refresh();})()");
 }
 const initially=await dateCase('2026-10-16');
 check('16 October current count',initially.remaining===45,JSON.stringify(initially));
 const state=await evalJs("({expired:document.querySelector('.card[data-event-index=\"44\"]').hidden,upcoming:!document.querySelector('.card[data-event-index=\"43\"]').hidden,hasOldLink:!!document.querySelector('.calendar-grid a[href=\"#event-44\"]'),overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth+1})");
 check('10 October workshop hidden',state.expired);
 check('17 October session still visible',state.upcoming);
 check('Expired date omitted from calendar',!state.hasOldLink);
 check('No horizontal mobile overflow',!state.overflow);
 const filters=await evalJs("(() => {document.querySelector('.filter[data-filter=\"free\"]').click();const cards=[...document.querySelectorAll('.card')].filter(c=>!c.hidden);return {active:document.querySelector('.filter.active')?.dataset.filter, shown:cards.length, counter:document.getElementById('result-count')?.textContent};})()");
 check('Filter respects expiry and shows matching total',filters.active==='free' && filters.counter===filters.shown+' shown');
 await evalJs("document.querySelector('.filter[data-filter=\"all\"]').click();true");
 await cmd('Emulation.setDeviceMetricsOverride',{width:320,height:670,screenWidth:320,screenHeight:670,deviceScaleFactor:1,mobile:true});
 check('No horizontal overflow on small phone',await evalJs("document.documentElement.scrollWidth<=document.documentElement.clientWidth+1"));
 await cmd('Emulation.setDeviceMetricsOverride',{width:390,height:844,screenWidth:390,screenHeight:844,deviceScaleFactor:1,mobile:true});
 const after17=await dateCase('2026-10-18');
 check('One-day 17 October event hides on 18 October',after17.remaining===44);
 const linkState=await evalJs("({oneDay:document.querySelector('.card[data-event-index=\"43\"]').hidden,moonlight:!document.querySelector('.card[data-event-index=\"3\"]').hidden,dates:[...document.querySelectorAll('.card[data-event-index=\"3\"] .nue-date-choices a')].map(a=>a.textContent.trim())})");
 check('Past single event is removed',linkState.oneDay);
 check('Mixed session event remains',linkState.moonlight);
 check('Only future Moonlight session choices remain',linkState.dates.length===2 && linkState.dates.every(x=>!x.startsWith('17')));
 const on26=await dateCase('2026-10-26');
 check('Half-term status on 26 October',on26.remaining===35);
 const onMonday=await evalJs("document.querySelector('.card[data-event-index=\"45\"] .nue-calendar')?.href||''");
 check('Tatton closed-Monday calendar respects 27 October',onMonday.includes('20261027'));
 const finished=await dateCase('2026-11-02');
 check('All 43 dated items automatically expired',finished.remaining===3 && finished.dated===0,JSON.stringify(finished));
 const end=await evalJs("({calendar:document.querySelector('.calendar-grid')?.textContent||'',review:[13,18,39].map(n=>!document.querySelector('.card[data-event-index=\"'+n+'\"]').hidden)})");
 check('End-of-season message appears',end.calendar.includes('No dated activities remain'));
 check('Unknown end dates and evergreen item retained',end.review.every(Boolean));
 await mkdir('visual-qa/guide-expiry',{recursive:true});
 const screenshot=await cmd('Page.captureScreenshot',{format:'png',fromSurface:true,captureBeyondViewport:false});
 await writeFile('visual-qa/guide-expiry/finished-mobile.png',Buffer.from(screenshot.data,'base64'));
 console.log('GUIDE_EXPIRY_QA_PASS');
} finally {if(ws)ws.close();chrome.kill('SIGTERM');}
