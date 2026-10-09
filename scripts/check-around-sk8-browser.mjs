/* Around SK8 browser QA: uses Chrome DevTools Protocol without third-party packages.
 * Runs only against a local copy of the PR. MailerLite is intercepted, never contacted.
 */
import {spawn} from 'node:child_process';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {randomInt} from 'node:crypto';

const BASE=(process.env.PREVIEW_URL||'http://127.0.0.1:8767').replace(/\/$/,'');
const CHROME=process.env.CHROME||'google-chrome';
const PORT=9400+randomInt(100,500);
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const fail=m=>{throw new Error('Around SK8 browser QA: '+m)};
const expect=(ok,m)=>{if(!ok)fail(m)};
const formEndpoint='https://assets.mailerlite.com/jsonp/2462354/forms/193724501149615325/subscribe';

const pageMarkup=await readFile('around-sk8/index.html','utf8');
const pageCss=await readFile('assets/around-sk8-preview.css','utf8');
expect((pageMarkup.match(/<h1\b/g)||[]).length===1,'Page must have one H1');
expect((pageMarkup.match(/data-signup-form/g)||[]).length===1,'Page must have one signup form');
expect(pageMarkup.indexOf('qa-fixes-v1.css')<pageMarkup.indexOf('around-sk8-preview.css'),'Page CSS must load after global QA overrides');
expect(pageMarkup.includes('data-page="around-sk8"'),'Wrong page identity');
expect(!pageMarkup.includes('around-map'),'Old nonfunctional map must be absent');
expect(!pageMarkup.includes('around-more-grid'),'Old incorrect EAT/FAMILY/SAVE labels must be absent');
expect(pageCss.includes('@media(max-width:430px)')&&pageCss.includes(':focus-visible'),'Mobile and focus styles missing');
expect((pageCss.match(/\{/g)||[]).length===(pageCss.match(/\}/g)||[]).length,'CSS braces unbalanced');
console.log('PASS: static page identity, form, CSS cascade and content controls');

const chrome=spawn(CHROME,[
  '--headless=new','--disable-gpu','--no-sandbox','--disable-dev-shm-usage',
  '--hide-scrollbars','--no-first-run',`--remote-debugging-port=${PORT}`,
  `--user-data-dir=/tmp/sk8-around-browser-${process.pid}`,
  '--window-size=1440,900','about:blank'
],{stdio:['ignore','pipe','pipe']});
let browserLog='';
chrome.stderr?.on('data',data=>{browserLog+=String(data).slice(0,2500);});
let socket;
try{
  let ready=false;
  for(let i=0;i<90;i++){
    try{ready=(await fetch(`http://127.0.0.1:${PORT}/json/version`)).ok;}catch{}
    if(ready)break;
    await sleep(160);
  }
  expect(ready,'Chrome remote debugging did not start: '+browserLog.slice(-500));
  const t=await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`,{method:'PUT'})).json();
  socket=new WebSocket(t.webSocketDebuggerUrl);
  await new Promise((ok,bad)=>{socket.addEventListener('open',ok,{once:true});socket.addEventListener('error',bad,{once:true})});
  let seq=0;
  const pending=new Map();
  let interceptMode=null;
  let interceptHits=0;
  let cmd;
  socket.addEventListener('message',event=>{
    const message=JSON.parse(String(event.data));
    if(message.id){
      const request=pending.get(message.id);
      if(request){pending.delete(message.id);message.error?request.reject(Error(message.error.message)):request.resolve(message.result);}
    }
    if(message.method==='Fetch.requestPaused'){
      const requestId=message.params.requestId;
      const url=message.params.request?.url||'';
      if(url.startsWith(formEndpoint)){
        interceptHits++;
        const payload=interceptMode==='error'?{success:false,errors:{fields:{email:['This test email was not accepted.']}}}:{success:true};
        const body=Buffer.from(JSON.stringify(payload)).toString('base64');
        void cmd('Fetch.fulfillRequest',{requestId,responseCode:200,responseHeaders:[
          {name:'content-type',value:'application/json'},
          {name:'access-control-allow-origin',value:'*'},
          {name:'access-control-allow-methods',value:'POST, OPTIONS'}
        ],body}).catch(error=>{console.error('Mocked MailerLite response failed',error);});
      } else {
        void cmd('Fetch.continueRequest',{requestId}).catch(()=>{});
      }
    }
  });
  cmd=(method,params={})=>new Promise((resolve,reject)=>{
    const id=++seq;
    pending.set(id,{resolve,reject});
    socket.send(JSON.stringify({id,method,params}));
  });
  const evaluate=async expression=>{
    const r=await cmd('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
    if(r.exceptionDetails)fail('Page JS evaluate exception: '+r.exceptionDetails.text);
    return r.result.value;
  };
  const wait=async (expression,label,tries=120)=>{
    for(let i=0;i<tries;i++){
      try{if(await evaluate(expression))return;}catch{}
      await sleep(140);
    }
    fail('Timed out waiting for '+label);
  };
  await cmd('Page.enable');
  await cmd('Runtime.enable');
  await cmd('Network.enable');
  await mkdir('visual-qa/around-sk8',{recursive:true});
  for(const width of [320,390,768,1440]){
    await cmd('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false,screenWidth:width,screenHeight:900});
    await cmd('Page.navigate',{url:BASE+'/around-sk8/'});
    await wait("document.readyState==='complete'&&!!document.querySelector('.around-quick-board')",'Around SK8 at '+width);
    await sleep(350);
    // Browser lazy-loading deliberately defers images below the fold.
    // Scroll each story visual into view, then assert it actually loads.
    const imageCount=await evaluate("document.querySelectorAll('.around-story-visual img').length");
    expect(imageCount===3, `${width}px expected exactly three editorial images`);
    for(let imageIndex=0;imageIndex<imageCount;imageIndex++){
      await evaluate(`(()=>{const img=document.querySelectorAll('.around-story-visual img')[${imageIndex}];img.scrollIntoView({block:'center',behavior:'instant'});return true;})()`);
      await wait(`(()=>{const img=document.querySelectorAll('.around-story-visual img')[${imageIndex}];return img.complete&&img.naturalWidth>0})()`,`image ${imageIndex+1} at ${width}px`,140);
    }
    await evaluate("(()=>{window.scrollTo({top:0,left:0,behavior:'instant'});return true;})()");
    await sleep(200);
    const metrics=await evaluate(`(()=>{
      const rect=el=>{const b=el.getBoundingClientRect();return {left:b.left,right:b.right,top:b.top,bottom:b.bottom,width:b.width,height:b.height};};
      const quick=[...document.querySelectorAll('.around-quick-link')];
      const areas=[...document.querySelectorAll('.around-area-links a')];
      const guides=[...document.querySelectorAll('.around-next-card')];
      const imgs=[...document.querySelectorAll('.around-story-visual img')];
      const f=document.querySelector('form[data-form-position="around-sk8-inline"]');
      const primary=document.querySelector('.around-hero-copy>.button');
      return {width:innerWidth,scrollWidth:document.documentElement.scrollWidth,
        h1:[...document.querySelectorAll('h1')].map(x=>x.textContent.trim()),title:document.title,
        quick:quick.map(a=>({text:a.textContent.trim(),href:a.getAttribute('href'),rect:rect(a)})),
        area:areas.map(a=>a.textContent.trim()),guides:guides.length,images:imgs.map(i=>({src:i.getAttribute('src'),loaded:i.complete&&i.naturalWidth>0,rect:rect(i)})),
        form:!!f,formRect:f?rect(f):null,inputRect:f?rect(f.querySelector('input')):null,
        heroAction:primary?rect(primary):null,
        cards:[...document.querySelectorAll('.around-story-lead,.around-story-compact')].map(rect),
        footer:!!document.querySelector('footer'),privacy:!!document.querySelector('.privacy-choices'),
        docHeight:document.documentElement.scrollHeight
      };
    })()`);
    expect(metrics.width===width,`${width}px incorrect viewport width ${metrics.width}`);
    expect(metrics.scrollWidth<=width+2,`${width}px horizontal overflow; document width ${metrics.scrollWidth}`);
    expect(metrics.h1.length===1&&metrics.h1[0].includes('useful bits'),`${width}px missing correct heading`);
    expect(metrics.quick.length===4&&metrics.quick.every(x=>x.href&&x.rect.width>100),`${width}px four usable topic shortcuts required`);
    expect(metrics.area.length===4&&metrics.guides===3,`${width}px missing neighbourhood or guide routes`);
    expect(metrics.images.length===3&&metrics.images.every(x=>x.loaded),`${width}px broken editorial image: ${JSON.stringify(metrics.images)}`);
    expect(metrics.form&&metrics.formRect.width>200&&metrics.inputRect.width>140,`${width}px unusable newsletter form`);
    expect(metrics.heroAction.width>80&&metrics.heroAction.height>=36,`${width}px hero action too small`);
    expect(metrics.footer&&metrics.privacy,`${width}px global script or footer missing`);
    expect(!await evaluate("!!document.querySelector('.nue-next-section[data-nue-generated]') || getComputedStyle(document.querySelector('.nue-next-section[data-nue-generated]')).display==='none'"),`${width}px duplicate generic next-step panel is visible`);
    for(const box of [...metrics.cards,...metrics.quick.map(x=>x.rect),metrics.formRect,metrics.inputRect]){
      expect(box.left>=-2&&box.right<=width+2,`${width}px clipped item ${JSON.stringify(box)}`);
    }
    const imageHeight=Math.min(Math.ceil(metrics.docHeight)+20,9000);
    await cmd('Emulation.setDeviceMetricsOverride',{width,height:imageHeight,deviceScaleFactor:1,mobile:false,screenWidth:width,screenHeight:imageHeight});
    await sleep(180);
    const shot=await cmd('Page.captureScreenshot',{format:'png',fromSurface:true,captureBeyondViewport:false});
    const name=`visual-qa/around-sk8/around-sk8-${width}.png`;
    await writeFile(name,Buffer.from(shot.data,'base64'));
    console.log(`PASS: ${width}px page layout, ${metrics.quick.length} shortcuts, ${metrics.area.length} neighbourhoods, ${metrics.images.length} images, one form; saved ${name}`);
  }

  // Synthetic MailerLite error and success: intercept requests in Chrome.
  // We do not submit any real email, create any record or call MailerLite.
  await cmd('Emulation.setDeviceMetricsOverride',{width:390,height:900,deviceScaleFactor:1,mobile:false,screenWidth:390,screenHeight:900});
  await cmd('Page.navigate',{url:BASE+'/around-sk8/'});
  await wait("document.readyState==='complete'&&!!document.querySelector('.around-signup-form')",'newsletter form');
  await cmd('Fetch.enable',{patterns:[{urlPattern:'https://assets.mailerlite.com/*',requestStage:'Request'}]});
  interceptMode='error';
  await evaluate(`(()=>{const f=document.querySelector('.around-signup-form');f.querySelector('input').value='around-sk8-preview-test@example.invalid';f.requestSubmit();return true;})()`);
  await wait("document.querySelector('.around-signup-form+.signup-status')?.classList.contains('error')",'simulated signup error');
  const error=await evaluate("(()=>({message:document.querySelector('.around-signup-form+.signup-status')?.textContent,enabled:!document.querySelector('.around-signup-form button').disabled}))()");
  console.log('MailerLite mocked rejection detail:',JSON.stringify({error,interceptHits}));
  expect(interceptHits===1,'Expected intercepted MailerLite rejection; intercepted='+interceptHits);
  expect(error.enabled,'Mock signup rejection must restore enabled button');
  expect(error.message&&error.message.trim()&&!error.message.includes('You’re in'),'Mock signup rejection must not claim success');
  console.log('PASS: MailerLite rejected signup shows error, with button restored');

  interceptMode='success';
  await evaluate("(()=>{const f=document.querySelector('.around-signup-form');f.requestSubmit();return true;})()");
  await wait("location.pathname==='/signup-success/'",'simulated success redirection');
  expect(interceptHits===2,'Expected exactly two mocked MailerLite requests, received '+interceptHits);
  console.log('PASS: Mocked MailerLite success redirects to success page; zero real subscriptions made');
  console.log('PASS: Around SK8 complete desktop, tablet, phone, links, images, CSS, and mocked signup QA');
}finally{
  try{socket?.close();}catch{}
  try{chrome.kill('SIGTERM');}catch{}
}
