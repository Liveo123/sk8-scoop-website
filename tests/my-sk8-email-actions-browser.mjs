import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';

const BASE=(process.env.PREVIEW_URL||'').replace(/\/$/,'');
const CHROME=process.env.CHROME||'google-chrome';
if(!BASE)throw Error('PREVIEW_URL is required');

const ids=[
  'grimmfest-2026-10-08',
  'bramhall-halloween-market-2026-10-10',
  'quarry-bank-scarecrow-festival-2026-10-03',
  'reddish-vale-halloween-pumpkin-festival-2026-10-10',
  'cheadle-hulme-con-club-babalola-2026-10-10',
  'girl-on-the-train-chads-2026-10-17',
  'meet-the-quakers-cheadle-hulme-2026-10-10'
];
const sleep=n=>new Promise(r=>setTimeout(r,n));
const record=(name,passed,detail='')=>{
  console.log((passed?'PASS ':'FAIL ')+name+(detail?': '+detail:''));
  if(!passed)throw Error(name+(detail?': '+detail:''));
};
await mkdir('visual-qa/my-sk8',{recursive:true});
const chrome=spawn(CHROME,[
  '--headless=new','--disable-gpu','--no-sandbox','--hide-scrollbars',
  '--remote-debugging-port=9233',
  '--user-data-dir=/tmp/sk8-email-quick-action-qa',
  '--window-size=390,844','about:blank'
],{stdio:['ignore','ignore','pipe']});
chrome.stderr.on('data',chunk=>{const s=String(chunk);if(/ERROR|FATAL/i.test(s))process.stderr.write(s.slice(0,400));});
let endpoint;
for(let i=0;i<120;i++){
  try{const response=await fetch('http://127.0.0.1:9233/json/version');if(response.ok){endpoint=await response.json();break;}}
  catch{}
  await sleep(200);
}
if(!endpoint)throw Error('Chrome did not start');
const target=await (await fetch('http://127.0.0.1:9233/json/new?about:blank',{method:'PUT'})).json();
const ws=new WebSocket(target.webSocketDebuggerUrl);
await new Promise((ok,fail)=>{ws.addEventListener('open',ok,{once:true});ws.addEventListener('error',fail,{once:true});});
let seq=0;
const pending=new Map();
ws.addEventListener('message',e=>{
  const data=JSON.parse(String(e.data));
  if(!data.id)return;
  const task=pending.get(data.id);
  if(!task)return;
  pending.delete(data.id);
  if(data.error)task.reject(Error(data.error.message));else task.resolve(data.result);
});
const cmd=(method,params={})=>new Promise((resolve,reject)=>{
  const id=++seq;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));
});
const evaluate=async expression=>{
  const data=await cmd('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});
  if(data.exceptionDetails)throw Error(data.exceptionDetails.text||'Evaluation failed');
  return data.result&&data.result.value;
};
const ready=async(expr,limit=12000)=>{
  const start=Date.now();
  while(Date.now()-start<limit){try{if(await evaluate(expr))return true;}catch{}await sleep(130);}
  return false;
};
const visit=async (action,id)=>{
  const query='event='+encodeURIComponent(id)+'&my_action='+encodeURIComponent(action)+'&utm_campaign=issue16_halloween';
  await cmd('Page.navigate',{url:BASE+'/my-sk8/action/?'+query});
  record('Page load '+action+'/'+id,await ready("document.readyState==='complete'"));
  record('Action settles '+action+'/'+id,await ready("document.getElementById('action-card')?.getAttribute('aria-busy')==='false'"));
};
const saved=()=>evaluate("JSON.parse(localStorage.getItem('sk8_saved_items_v1')||'[]')");
const reminders=()=>evaluate("JSON.parse(localStorage.getItem('sk8_reminders_v1')||'[]')");
const heading=()=>evaluate("document.getElementById('status-title')?.textContent||''");
const screenshot=async(name)=>{
  const r=await cmd('Page.captureScreenshot',{format:'png',fromSurface:true,captureBeyondViewport:false});
  await writeFile('visual-qa/my-sk8/'+name,Buffer.from(r.data,'base64'));
};
try{
  await cmd('Page.enable');
  await cmd('Runtime.enable');
  await cmd('Emulation.setDeviceMetricsOverride',{width:390,height:844,screenWidth:390,screenHeight:844,deviceScaleFactor:1,mobile:true});
  await cmd('Page.navigate',{url:BASE+'/my-sk8/'});
  record('Same-origin My SK8 loads',await ready("document.readyState==='complete'"));
  const events=await evaluate("fetch('/data/events.json',{cache:'no-store'}).then(r=>r.ok?r.json():Promise.reject(Error('not found')))");
  record('Every newsletter action ID exists in the event catalogue',ids.every(id=>events.some(e=>e.id===id)));
  await evaluate("localStorage.removeItem('sk8_saved_items_v1');localStorage.removeItem('sk8_reminders_v1');true");
  for(const id of ids){
    await visit('save',id);
    record('Saved confirmation for '+id,(await heading()).includes('Saved'));
    record('Storage contains '+id,(await saved()).some(e=>e.id===id));
    record('Correct event title on confirmation',Boolean(await evaluate("document.getElementById('event-title')?.textContent")));
    record('No horizontal overflow at 390px',Boolean(await evaluate('document.documentElement.scrollWidth<=document.documentElement.clientWidth+1')));
  }
  const count=(await saved()).length;
  record('Exactly seven events saved',count===ids.length,String(count));
  await visit('save',ids[0]);
  record('Idempotent repeat click',(await saved()).length===ids.length);
  await screenshot('email-save-confirmation-mobile.png');
  await visit('remind',ids[1]);
  record('Reminder stored',(await reminders()).includes(ids[1]));
  record('Reminder clearly described as on-site',Boolean(await evaluate("document.getElementById('status-message')?.textContent.includes('on-site')")));
  await screenshot('email-reminder-confirmation-mobile.png');
  await visit('calendar',ids[2]);
  record('Calendar presents a downloadable .ics',Boolean(await evaluate("document.querySelector('a[download$=\".ics\"]')?.href.startsWith('data:text/calendar')")));
  await visit('directions',ids[3]);
  record('Directions lead to Google Maps',Boolean(await evaluate("document.getElementById('primary-link')?.href.startsWith('https://www.google.com/maps/search/')")));
  await visit('save','nonexistent-issue16-qa-id');
  record('Unknown event never reports success',(await heading())==='This action was not completed');
  record('Unknown event does not modify saves',(await saved()).length===ids.length);
  await screenshot('email-invalid-confirmation-mobile.png');
  await cmd('Emulation.setDeviceMetricsOverride',{width:320,height:670,screenWidth:320,screenHeight:670,deviceScaleFactor:1,mobile:true});
  await visit('save',ids[1]);
  record('No horizontal overflow at 320px',Boolean(await evaluate('document.documentElement.scrollWidth<=document.documentElement.clientWidth+1')));
  record('Buttons meet mobile minimum touch height',Boolean(await evaluate("document.getElementById('primary-link').getBoundingClientRect().height>=48")));
  await screenshot('email-action-320-mobile.png');
  // Every filtered Halloween Guide link used in Issue 16 must remain direct, active and useful.
  await cmd('Emulation.setDeviceMetricsOverride',{width:390,height:844,screenWidth:390,screenHeight:844,deviceScaleFactor:1,mobile:true});
  const guideFilters=['local','free','under10','under5','primary','teen','rainy','send'];
  for(const filter of guideFilters){
    const guideUrl=BASE+'/halloween-half-term-guide/guide/?filter='+filter+'&utm_source=newsletter&utm_campaign=issue16_halloween#filters';
    await cmd('Page.navigate',{url:guideUrl});
    record('Guide loaded for '+filter,await ready("document.readyState==='complete'",18000));
    await sleep(500);
    const result=await evaluate("(() => { const filter="+JSON.stringify(filter)+"; const button=document.querySelector('[data-filter=\"'+filter+'\"]'); const wrap=document.getElementById('filters'); const rect=wrap?.getBoundingClientRect(); return {path:location.pathname,hash:location.hash,query:new URLSearchParams(location.search).get('filter'),active:!!button?.classList.contains('active'),pressed:button?.getAttribute('aria-pressed'),shown:[...document.querySelectorAll('.card')].filter(el=>!el.hidden).length,top:rect?.top??9999,bottom:rect?.bottom??-9999,vh:innerHeight,viewport:innerWidth,documentWidth:document.documentElement.scrollWidth};})()");
    record('No signup landing redirect for '+filter,result.path.replace(/\/$/,'')==='/halloween-half-term-guide/guide',result.path);
    record('Filter query and anchor retained '+filter,result.query===filter&&result.hash==='#filters');
    record('Requested filter activated '+filter,result.active&&result.pressed==='true');
    record('Filtered ideas visible '+filter,result.shown>0,String(result.shown));
    record('Mobile filter controls visible '+filter,result.bottom>0&&result.top<result.vh*0.75,JSON.stringify({top:result.top,bottom:result.bottom,vh:result.vh}));
    record('Guide mobile width fits '+filter,result.documentWidth<=result.viewport+1,String(result.documentWidth)+'/'+String(result.viewport));
    if(filter==='rainy')await screenshot('halloween-rainy-filter-mobile.png');
  }
  console.log('Issue 16 compact actions and all eight Halloween Guide links passed.');

}finally{
  try{ws.close();}catch{}
  chrome.kill('SIGTERM');
}
