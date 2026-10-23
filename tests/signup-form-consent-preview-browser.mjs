import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';

const BASE=(process.env.PREVIEW_URL||'').replace(/\/$/,'');
assert.ok(BASE,'Cloudflare preview URL required');
assert.ok(new URL(BASE).hostname.endsWith('.previews.sk8scoop.com'),'Preview-only QA; production is forbidden');
const CHROME=process.env.CHROME||'google-chrome';
const PORT=9239;
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const chrome=spawn(CHROME,[
  '--headless=new','--no-sandbox','--disable-gpu','--disable-background-networking',
  '--remote-debugging-port='+PORT,'--user-data-dir=/tmp/sk8-signup-consent-'+process.pid,
  '--window-size=1280,900','about:blank'
],{stdio:['ignore','ignore','pipe']});
chrome.stderr.on('data',buf=>{
  if(/FATAL/i.test(String(buf)))process.stderr.write(buf);
});
let socket;
try{
  let endpoint=false;
  for(let i=0;i<90;i++){
    try{endpoint=(await fetch('http://127.0.0.1:'+PORT+'/json/version')).ok}catch{}
    if(endpoint)break;
    await sleep(200);
  }
  assert.ok(endpoint,'Headless Chrome debug endpoint');
  const page=await (await fetch('http://127.0.0.1:'+PORT+'/json/new?about:blank',{method:'PUT'})).json();
  socket=new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve,reject)=>{
    socket.addEventListener('open',resolve,{once:true});
    socket.addEventListener('error',reject,{once:true});
  });
  let sequence=0;
  const pending=new Map();
  socket.addEventListener('message',event=>{
    const payload=JSON.parse(String(event.data));
    if(!payload.id)return;
    const callback=pending.get(payload.id);
    if(!callback)return;
    pending.delete(payload.id);
    payload.error?callback.reject(Error(payload.error.message)):callback.resolve(payload.result);
  });
  const cdp=(method,params={})=>new Promise((resolve,reject)=>{
    const id=++sequence;
    pending.set(id,{resolve,reject});
    socket.send(JSON.stringify({id,method,params}));
  });
  const evaluate=async expression=>{
    const result=await cdp('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});
    if(result.exceptionDetails)throw Error(result.exceptionDetails.text||'Page evaluation failed');
    return result.result?.value;
  };
  const waitFor=async(expression,label)=>{
    for(let i=0;i<80;i++){
      try{if(await evaluate(expression))return}catch{}
      await sleep(150);
    }
    throw Error('Timed out: '+label);
  };

  await cdp('Page.enable');
  await cdp('Runtime.enable');
  await cdp('Network.enable');
  // Attempts to load optional analytics/Meta scripts are blocked, and no form is submitted.
  await cdp('Network.setBlockedURLs',{urls:[
    '*://*.googletagmanager.com/*','*://*.google-analytics.com/*',
    '*://connect.facebook.net/*','*://*.facebook.com/tr*','*://assets.mailerlite.com/*'
  ]});
  await cdp('Page.navigate',{url:BASE+'/52-adventures/'});
  await waitFor("document.readyState==='complete' && Boolean(document.querySelector('[data-signup-form]'))",'52 Adventures landing page loaded');
  await waitFor("Boolean(document.querySelector('[data-consent-choose]'))",'Consent controls loaded');

  const formPosition=await evaluate("document.querySelector('[data-signup-form]').dataset.formPosition||'unknown'");
  const viewCountExpression=(()=>{
    const pos=JSON.stringify(formPosition);
    return "(()=> (window.dataLayer||[]).filter(e=>e && e[0]==='event' && e[1]==='signup_form_view' && e[2]?.form_position==="+pos+").length)()";
  })();
  assert.equal(await evaluate("Boolean(window.gtag)"),false,'GA4 is not initialised before consent');
  await evaluate("document.querySelector('[data-signup-form]').scrollIntoView({block:'center',behavior:'instant'});true");
  await sleep(450);
  const visible=await evaluate("(()=>{const e=document.querySelector('[data-signup-form]'),r=e.getBoundingClientRect();return r.height>0&&r.width>0&&r.top<innerHeight&&r.bottom>0;})()");
  assert.ok(visible,'Signup form becomes visible during pre-consent test');
  assert.equal(await evaluate(viewCountExpression),0,'No form view recorded before analytics consent');

  await evaluate("document.querySelector('[data-consent-choose]').click();document.querySelector('[data-consent-analytics]').checked=true;document.querySelector('[data-consent-marketing]').checked=false;document.querySelector('[data-consent-save]').click();true");
  await waitFor("Boolean(JSON.parse(localStorage.getItem('sk8_privacy_choices_v1')||'null')?.analytics)",'Analytics consent persisted');
  await waitFor(viewCountExpression+'===1','Already-visible signup form tracked after consent');
  assert.equal(await evaluate(viewCountExpression),1,'Visible form tracked exactly once after consent');
  assert.equal(await evaluate("Boolean(JSON.parse(localStorage.getItem('sk8_privacy_choices_v1')||'null')?.marketing)"),false,'Meta marketing consent remains off');

  await evaluate("window.scrollTo({top:0,behavior:'instant'});true");
  await sleep(200);
  await evaluate("document.querySelector('[data-signup-form]').scrollIntoView({block:'center',behavior:'instant'});true");
  await sleep(400);
  assert.equal(await evaluate(viewCountExpression),1,'Scrolling does not duplicate a single form view');

  await evaluate("document.querySelector('.privacy-choices-launcher').click();document.querySelector('[data-consent-none]').click();true");
  await waitFor("JSON.parse(localStorage.getItem('sk8_privacy_choices_v1')||'null')?.analytics===false",'Analytics consent withdrawn');
  console.log('PASS: preview browser consent, 45% form impression, once-after-consent, no duplicate impression, Meta opt-out and withdrawal; no real signup');
}finally{
  try{socket?.close()}catch{}
  try{chrome.kill('SIGTERM')}catch{}
}
