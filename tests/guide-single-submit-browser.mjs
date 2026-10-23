import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';

const BASE=(process.env.GUIDE_QA_BASE_URL||'http://127.0.0.1:8769').replace(/\/$/,'');
const CHROME=process.env.CHROME||'google-chrome';
const PORT=9248;
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const chrome=spawn(CHROME,['--headless=new','--no-sandbox','--disable-gpu',
  '--remote-debugging-port='+PORT,'--user-data-dir=/tmp/sk8-guide-signup-'+process.pid,
  '--window-size=1280,900','about:blank'],{stdio:'ignore'});
let socket;
try {
  let ready=false;
  for(let i=0;i<100;i++){try{ready=(await fetch('http://127.0.0.1:'+PORT+'/json/version')).ok}catch{}if(ready)break;await sleep(150);}
  assert(ready,'Headless browser failed to start');
  const target=await (await fetch('http://127.0.0.1:'+PORT+'/json/new?about:blank',{method:'PUT'})).json();
  socket=new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve,reject)=>{socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',reject,{once:true})});
  let seq=0;const pending=new Map();
  socket.addEventListener('message',event=>{
    const x=JSON.parse(String(event.data)),p=pending.get(x.id);
    if(!p)return;pending.delete(x.id);x.error?p.reject(Error(x.error.message)):p.resolve(x.result);
  });
  const cmd=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}))});
  const evaluate=async code=>{
    const x=await cmd('Runtime.evaluate',{expression:code,returnByValue:true,awaitPromise:true});
    if(x.exceptionDetails)throw Error(x.exceptionDetails.text||'Runtime.evaluate failed');
    return x.result?.value;
  };
  const wait=async code=>{
    for(let i=0;i<100;i++){try{if(await evaluate(code))return true}catch{}await sleep(90)}return false;
  };
  await cmd('Page.enable');await cmd('Runtime.enable');
  // Intercept every signup POST. No real subscribers or MailerLite emails are created.
  // Mocked failure responses prevent redirects hiding a duplicate submission.
  const source=[
    "window.__guideQaPosts=[];",
    "const originalFetch=window.fetch.bind(window);",
    "window.fetch=async function(resource,opts={}){",
    "const url=typeof resource==='string'?resource:resource?.url||String(resource);",
    "const method=String(opts.method||resource?.method||'GET').toUpperCase();",
    "if(url.includes('/api/signup-config'))return new Response(JSON.stringify({siteKey:'qa-fake-turnstile'}),{status:200,headers:{'content-type':'application/json'}});",
    "if(method==='POST'){window.__guideQaPosts.push({url,method});",
    "const success=window.__guideQaSuccessMode===true;",
    "return new Response(JSON.stringify({success,error:success?undefined:'QA intercepted. No subscriber was created.'}),{status:success?200:422,headers:{'content-type':'application/json'}});}",
    "return originalFetch(resource,opts);};",
    "window.turnstile={render:function(host,options){options?.callback?.('qa-fake-token');return 1;},reset:function(){},remove:function(){}};"
  ].join('\n');
  await cmd('Page.addScriptToEvaluateOnNewDocument',{source});
  for(const [name,slug,key] of [
    ['Halloween','halloween-half-term-guide','halloween'],
    ['Free & Cheap','free-cheap-guide','free-cheap'],
    ['52 Adventures','52-adventures','52-adventures']
  ]) {
    await cmd('Page.navigate',{url:BASE+'/'+slug+'/'});
    assert(await wait("document.readyState==='complete' && Boolean(document.querySelector('[data-signup-form][data-signup-kind=\"guide\"]'))"),name+' landing missing signup form');
    assert(await wait("Boolean(document.querySelector('[data-signup-form] input[name=\"sk8_started_at\"]'))"),name+' missing protected signup initialisation');
    const state=await evaluate("(()=>{"+
      "const form=document.querySelector('[data-signup-form][data-signup-kind=\"guide\"]');"+
      "const email=form.querySelector('input[type=\"email\"]');email.value='guide-qa-virtual@example.com';"+
      "form.querySelectorAll('input[name=\"cf-turnstile-response\"]').forEach(x=>x.value='qa-fake-token');"+
      "const key=form.dataset.guideKey;"+
      "const cancelled=!form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));"+
      "return {key,cancelled,hasProtection:Boolean(form.querySelector('input[name=\"sk8_started_at\"]'))};})()");
    assert.equal(state.key,key,name+' guide identity changed');
    await sleep(750);
    const posts=await evaluate("window.__guideQaPosts.slice()");
    const protectedPosts=posts.filter(x=>x.url==='/api/newsletter-signup');
    const otherPosts=posts.filter(x=>x.url!=='/api/newsletter-signup');
    const summary={name,guideKey:state.key,protectedRequests:protectedPosts.length,unexpectedRequests:otherPosts.length,posts};
    console.log('Simulated guide signup: '+JSON.stringify(summary));
    assert.equal(protectedPosts.length,1,name+' must POST to protected signup exactly once');
    assert.equal(otherPosts.length,0,name+' must not also POST to MailerLite or the page URL');
    // Replay a simulated successful worker response to check the acquisition label.
    // Suppress only the 350ms navigation timeout; never navigate or send a real email.
    await evaluate("(()=>{"+
      "window.__guideQaPosts=[];window.__guideQaSuccessMode=true;window.__guideQaTracks=[];"+
      "window.sk8Track=(event,data)=>{window.__guideQaTracks.push({event,data})};"+
      "const realSetTimeout=window.setTimeout.bind(window);"+
      "window.setTimeout=(fn,ms,...args)=>ms===350?0:realSetTimeout(fn,ms,...args);"+
      "const form=document.querySelector('[data-signup-form][data-signup-kind=\"guide\"]');"+
      "form.querySelector('input[name=\"cf-turnstile-response\"]').value='qa-fake-token';"+
      "form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));return true;})()");
    await sleep(190);
    const happy=await evaluate("({posts:window.__guideQaPosts.slice(),signups:window.__guideQaTracks.filter(x=>x.event==='sign_up')})");
    const expectedSource={halloween:'halloween_guide','free-cheap':'free_cheap_guide','52-adventures':'52_adventures_guide'}[key];
    console.log(name+' mocked success attribution: '+JSON.stringify(happy));
    assert.equal(happy.posts.length,1,name+' success must also issue exactly one POST');
    assert.equal(happy.posts[0].url,'/api/newsletter-signup');
    assert.equal(happy.signups.length,1,name+' success must record one signup conversion');
    assert.equal(happy.signups[0].data.signup_source,expectedSource,name+' signup attribution must match guide identity');
  }
  console.log('PASS: Three guide signup forms use one protected POST each. No emails were sent.');
}finally{
  try{socket?.close()}catch{}
  try{chrome.kill('SIGTERM')}catch{}
}
