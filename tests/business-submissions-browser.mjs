import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';

const BASE=(process.env.BUSINESS_QA_BASE_URL||'http://127.0.0.1:8771').replace(/\/$/,'');
const CHROME=process.env.CHROME||'google-chrome';
const PORT=9249;
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const chrome=spawn(CHROME,[
  '--headless=new','--no-sandbox','--disable-gpu',
  '--remote-debugging-port='+PORT,
  '--user-data-dir=/tmp/sk8-business-submission-qa-'+process.pid,
  '--window-size=1280,950','about:blank'
],{stdio:'ignore'});
let socket;
try {
  let ready=false;
  for (let i=0;i<90;i++) {
    try { ready=(await fetch('http://127.0.0.1:'+PORT+'/json/version')).ok; } catch {}
    if (ready) break;
    await sleep(150);
  }
  assert.ok(ready,'Chrome did not start');
  const tab=await (await fetch('http://127.0.0.1:'+PORT+'/json/new?about:blank',{method:'PUT'})).json();
  socket=new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise((resolve,reject)=>{
    socket.addEventListener('open',resolve,{once:true});
    socket.addEventListener('error',reject,{once:true});
  });
  let seq=0;const pending=new Map();
  socket.addEventListener('message',event=>{
    const msg=JSON.parse(String(event.data));
    const promise=pending.get(msg.id);
    if (!promise) return;
    pending.delete(msg.id);
    if (msg.error) promise.reject(new Error(msg.error.message));
    else promise.resolve(msg.result);
  });
  const cmd=(method,params={})=>new Promise((resolve,reject)=>{
    const id=++seq;pending.set(id,{resolve,reject});
    socket.send(JSON.stringify({id,method,params}));
  });
  const evaluate=async expression=>{
    const result=await cmd('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
    if (result.exceptionDetails) throw Error(JSON.stringify(result.exceptionDetails));
    return result.result?.value;
  };
  const wait=async expression=>{
    for(let i=0;i<70;i++){
      try {if(await evaluate(expression))return true;}catch{}
      await sleep(100);
    }
    return false;
  };

  await cmd('Page.enable');
  await cmd('Runtime.enable');
  await cmd('Page.addScriptToEvaluateOnNewDocument',{source:[
    'window.__sk8BusinessPosts=[];',
    'window.__sk8BusinessFail=false;',
    'const originalFetch=window.fetch.bind(window);',
    'window.fetch=async function(input,options={}){',
    'const url=typeof input==="string"?input:(input?.url||String(input));',
    'const method=String(options.method||input?.method||"GET").toUpperCase();',
    'if(url.includes("/api/business-submission")&&method==="POST"){',
    'window.__sk8BusinessPosts.push(JSON.parse(options.body));',
    'return window.__sk8BusinessFail?',
    'new Response(JSON.stringify({error:"Your submission could not be saved."}),{status:503,headers:{"content-type":"application/json"}}):',
    'new Response(JSON.stringify({message:"Thank you. Your submission has been saved.",submissionId:42}),{status:200,headers:{"content-type":"application/json"}});',
    '}return originalFetch(input,options);',
    '};'
  ].join('\n')});
  await cmd('Page.navigate',{url:BASE+'/business-submissions/'});
  assert(await wait('document.readyState==="complete" && !!document.querySelector(".business-fast-form")'),
    'form page failed to load');
  const layout=await evaluate("(()=>{"+
    "const form=document.querySelector('.business-fast-form');"+
    "const r=form.getBoundingClientRect();"+
    "return {top:r.top,required:form.querySelectorAll('[required]').length,"+
    "width:document.documentElement.scrollWidth,viewport:innerWidth,"+
    "hasLogo:!!document.querySelector('header img'),"+
    "formText:form.querySelector('button[type=submit]').textContent};})()");
  assert.equal(layout.required,4);
  assert(layout.top<650,'form should begin near the top of the page');
  assert.equal(layout.hasLogo,true);
  assert(layout.width<=layout.viewport+3,'desktop layout must not scroll horizontally');
  await evaluate("(()=>{"+
    "const form=document.querySelector('.business-fast-form');"+
    "form.querySelector('[name=submission_type]').value='community_information';"+
    "form.querySelector('[name=details]').value='The community centre has a free book club next Thursday.';"+
    "form.querySelector('[name=email]').value='visitor@example.co.uk';"+
    "form.querySelector('[name=official_url]').value='example.co.uk/events';"+
    "form.querySelector('[name=privacy_confirmed]').checked=true;"+
    "form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));return true;})()");
  assert(await wait('document.querySelector("[data-form-status]").classList.contains("success")'),
    'mocked success state missing');
  const submitted=await evaluate("({"+
    "requests:window.__sk8BusinessPosts.slice(),"+
    "status:document.querySelector('[data-form-status]').textContent,"+
    "emailAfterReset:document.querySelector('[name=email]').value})");
  assert.equal(submitted.requests.length,1,'must issue only one POST, never legacy second POST');
  assert.equal(submitted.requests[0].official_url,'https://example.co.uk/events',
    'URL should be normalized without making https compulsory');
  assert.match(submitted.status,/saved/i);
  assert.equal(submitted.emailAfterReset,'');
  await evaluate("(()=>{"+
    "window.__sk8BusinessFail=true;"+
    "const form=document.querySelector('.business-fast-form');"+
    "form.querySelector('[name=submission_type]').value='opening';"+
    "form.querySelector('[name=details]').value='A new independent bookshop is coming to Cheadle.';"+
    "form.querySelector('[name=email]').value='again@example.co.uk';"+
    "form.querySelector('[name=privacy_confirmed]').checked=true;"+
    "form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));return true;})()");
  assert(await wait('document.querySelector("[data-form-status]").classList.contains("error")'),
    'mocked error state missing');
  assert.equal(await evaluate("document.querySelector('[name=email]').value"),'again@example.co.uk',
    'failed submit should retain values');

  await cmd('Emulation.setDeviceMetricsOverride',{
    width:390,height:844,deviceScaleFactor:1,mobile:true
  });
  await sleep(450);
  const mobile=await evaluate("(()=>{"+
    "const form=document.querySelector('.business-fast-form');"+
    "const r=form.getBoundingClientRect();"+
    "return {top:r.top,width:document.documentElement.scrollWidth,viewport:innerWidth,"+
    "buttonHeight:form.querySelector('button[type=submit]').getBoundingClientRect().height};})()");
  assert(mobile.top<650,'mobile form should begin in first screen');
  assert(mobile.width<=mobile.viewport+3,'mobile page must not scroll sideways');
  assert(mobile.buttonHeight>=44,'submit button must meet touch target guidance');
  await evaluate("(()=>{const f=document.querySelector('.business-fast-form');f.reset();const s=f.querySelector('[data-form-status]');s.className='status-box';s.textContent='';return true;})()");
  await sleep(100);
  mkdirSync('visual-qa/business-submissions',{recursive:true});
  const screenshot=await cmd('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});
  writeFileSync('visual-qa/business-submissions/mobile.png',Buffer.from(screenshot.data,'base64'));
  console.log('PASS browser: short visible form, four required controls, single POST, URL, success/failure states and mobile layout.');
  console.log(JSON.stringify({desktop:layout,mobile,safeMockedPosts:submitted.requests.length}));
} finally {
  try{socket?.close();}catch{}
  try{chrome.kill('SIGTERM');}catch{}
}
