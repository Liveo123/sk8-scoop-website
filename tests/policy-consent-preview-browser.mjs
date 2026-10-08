import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';

const BASE=(process.env.PREVIEW_URL||'https://policy-audit-2026-10-08-draft.previews.sk8scoop.com').replace(/\/$/,'');
if (!/\.previews\.sk8scoop\.com$/.test(new URL(BASE).hostname)) throw Error('Preview URL only');
const chrome=spawn(process.env.CHROME||'google-chrome',[
  '--headless=new','--no-sandbox','--disable-gpu','--disable-background-networking',
  '--remote-debugging-port=9237','--user-data-dir=/tmp/sk8-policy-consent-preview',
  '--window-size=390,844','about:blank'
],{stdio:'ignore'});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let ws;
try {
  let endpoint;
  for(let i=0;i<120;i++) {
    try{const r=await fetch('http://127.0.0.1:9237/json/version');if(r.ok){endpoint=await r.json();break;}}
    catch{}
    await sleep(200);
  }
  assert.ok(endpoint,'Chrome debug endpoint');
  const target=await (await fetch('http://127.0.0.1:9237/json/new?about:blank',{method:'PUT'})).json();
  ws=new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((yes,no)=>{ws.addEventListener('open',yes,{once:true});ws.addEventListener('error',no,{once:true});});
  let seq=0;
  const pending=new Map(),trackers=[];
  ws.addEventListener('message',e=>{
    const d=JSON.parse(String(e.data));
    if(d.method==='Network.requestWillBeSent') {
      const url=d.params?.request?.url||'';
      if(/googletagmanager\.com|google-analytics\.com|connect\.facebook\.net|facebook\.com\/tr[/?]/i.test(url))trackers.push(url);
    }
    if(!d.id)return;
    const v=pending.get(d.id);if(!v)return;pending.delete(d.id);
    if(d.error)v.reject(Error(d.error.message));else v.resolve(d.result);
  });
  const cmd=(method,params={})=>new Promise((resolve,reject)=>{
    const id=++seq;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));
  });
  const evalPage=async expression=>{
    const r=await cmd('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});
    if(r.exceptionDetails)throw Error(r.exceptionDetails.text||'Page evaluation failed');
    return r.result.value;
  };
  const wait=async(expr,timeout=12000)=>{
    const at=Date.now();while(Date.now()-at<timeout){try{if(await evalPage(expr))return;}catch{}await sleep(150);}
    throw Error('Timed out: '+expr);
  };
  const navigate=async path=>{
    await cmd('Page.navigate',{url:BASE+path});
    await wait("document.readyState==='complete'");
    await sleep(400);
  };
  await cmd('Page.enable');await cmd('Runtime.enable');await cmd('Network.enable');
  // A test consent click must not cause a real analytics/ads event.
  await cmd('Network.setBlockedURLs',{urls:[
    '*://*.googletagmanager.com/*','*://*.google-analytics.com/*',
    '*://connect.facebook.net/*','*://*.facebook.com/tr*'
  ]});
  await cmd('Emulation.setDeviceMetricsOverride',{
    width:390,height:844,screenWidth:390,screenHeight:844,deviceScaleFactor:1,mobile:true
  });
  await navigate('/privacy.html');
  assert.equal(trackers.length,0,'No optional tracker requests before consent');
  assert.ok(await evalPage("document.body.innerText.includes('Paul Livesey')"),'Operator identity visible');
  assert.ok(await evalPage("document.body.innerText.includes('JiveLoop')"),'Umbrella trading name visible');
  assert.ok(await evalPage("document.body.innerText.includes('136 Stockport Road')"),'Correspondence address visible');
  assert.ok(await evalPage("document.querySelector('.privacy-choices') && !document.querySelector('.privacy-choices').hidden"),'Fresh visitor sees privacy choice');
  await evalPage("document.querySelector('[data-consent-none]').click();true");
  await wait("JSON.parse(localStorage.getItem('sk8_privacy_choices_v1')||'null')?.analytics===false");
  await navigate('/terms.html');
  assert.ok(await evalPage("document.body.innerText.includes('Paul Livesey')"),'Proprietor in terms');
  assert.equal(trackers.length,0,'No trackers after rejecting optional');
  await navigate('/editorial-policy.html');
  assert.ok(await evalPage("document.body.innerText.includes('Paid')"),'Editorial paid-content disclosure present');
  await navigate('/advertising-terms.html');
  assert.ok(await evalPage("document.body.innerText.includes('Paul Livesey')"),'Advertiser contract identifies the proprietor');
  assert.ok(await evalPage("document.body.innerText.includes('automatic')"),'Advertiser renewals described');
  assert.ok(await evalPage("document.documentElement.scrollWidth<=document.documentElement.clientWidth+2"),'No horizontal overflow on advert terms at 390px');
  await evalPage("document.cookie='_ga=test-marker; Path=/; SameSite=Lax'; document.querySelector('.privacy-choices-launcher').click();true");
  await evalPage("document.querySelector('[data-consent-choose]').click();document.querySelector('[data-consent-analytics]').checked=true;document.querySelector('[data-consent-marketing]').checked=false;document.querySelector('[data-consent-save]').click();true");
  await wait("JSON.parse(localStorage.getItem('sk8_privacy_choices_v1')||'null')?.analytics===true");
  assert.ok(await evalPage("JSON.parse(localStorage.getItem('sk8_privacy_choices_v1')).marketing===false"),'Analytics and marketing controls distinct');
  await evalPage("document.querySelector('.privacy-choices-launcher').click();document.querySelector('[data-consent-none]').click();true");
  await wait("JSON.parse(localStorage.getItem('sk8_privacy_choices_v1')||'null')?.analytics===false");
  assert.ok(await evalPage("!document.cookie.includes('_ga=test-marker')"),'Tracking cookie cleared on withdrawal');
  await navigate('/privacy.html');
  assert.equal(trackers.length>0,true,'Opt-in attempted an analytics request without sending it to provider');
  console.log('PASS policy identity, links, mobile layout, consent, opt-out and tracker network checks');
} finally {
  try{ws?.close();}catch{}
  try{chrome.kill('SIGTERM');}catch{}
}
