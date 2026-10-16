// Integrated Chromium QA for 52 Adventures premium gallery, preview only.
// All advertiser content is fictional and exists only in a disposable browser tab.
import { spawn } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const BASE=(process.env.CLOUDFLARE_PREVIEW_BASE || process.env.PREMIUM_QA_BASE_URL || '').replace(/\/$/,'');
const CHROME=process.env.CHROME || 'google-chrome';
if(!/^https:\/\//.test(BASE) || !BASE.includes('.previews.sk8scoop.com'))
  throw new Error('Only a Cloudflare pull-request preview may receive a fictional QA placement');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const gallerySource=await readFile('assets/52-adventures-premium-gallery.js','utf8');
await mkdir('visual-qa/52-premium-gallery',{recursive:true});
const chrome=spawn(CHROME,['--headless=new','--disable-gpu','--no-sandbox','--hide-scrollbars',
  '--remote-debugging-port=9236','--user-data-dir=/tmp/sk8-premium-gallery-browser',
  '--window-size=1440,980','about:blank'],{stdio:'ignore'});
let ws;
const pending=new Map();
let sequence=0;
try {
  let started=false;
  for(let i=0;i<120;i++){
    try{const r=await fetch('http://127.0.0.1:9236/json/version');if(r.ok){started=true;break;}}catch{}
    await sleep(200);
  }
  assert.ok(started,'Chrome DevTools must start');
  const tab=await (await fetch('http://127.0.0.1:9236/json/new?about:blank',{method:'PUT'})).json();
  ws=new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise((resolve,reject)=>{
    ws.addEventListener('open',resolve,{once:true});
    ws.addEventListener('error',reject,{once:true});
  });
  ws.addEventListener('message',evt=>{
    const value=JSON.parse(String(evt.data)),task=pending.get(value.id);
    if(!task)return;
    pending.delete(value.id);
    if(value.error)task.reject(new Error(value.error.message));
    else task.resolve(value.result);
  });
  const send=(method,params={})=>new Promise((resolve,reject)=>{
    const id=++sequence;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));
  });
  const evaluate=async expression=>{
    const value=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
    if(value.exceptionDetails)
      throw new Error('Browser evaluation: '+(value.exceptionDetails.exception?.description||value.exceptionDetails.text));
    return value.result?.value;
  };
  const waitFor=async(expr,timeout=20000)=>{
    const started=Date.now();
    while(Date.now()-started<timeout){
      try{if(await evaluate(expr))return true;}catch{}
      await sleep(150);
    }
    return false;
  };
  const viewport=width=>send('Emulation.setDeviceMetricsOverride',
    {width,height:980,screenWidth:width,screenHeight:980,deviceScaleFactor:1,mobile:false});
  async function screenshot(width){
    const r=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false,fromSurface:true});
    await writeFile('visual-qa/52-premium-gallery/gallery-'+width+'.png',Buffer.from(r.data,'base64'));
  }
  await send('Page.enable');await send('Runtime.enable');
  await viewport(1440);
  await send('Page.navigate',{url:BASE+'/52-adventures/guide/'});
  assert.ok(await waitFor("document.readyState === 'complete' && !!document.getElementById('sk8-52-premium-slot')"),'Guide preview load');
  assert.ok(await waitFor("document.querySelectorAll('img[data-imgkey][src]').length>=2"),'Existing guide photographs');
  const before=await evaluate("({hidden:document.getElementById('sk8-52-premium-slot').hidden,cards:document.querySelectorAll('.sk8-premium').length,adventures:Object.keys(JSON.parse(document.getElementById('adventure-data').textContent)).length})");
  assert.deepEqual(before,{hidden:true,cards:0,adventures:52});
  console.log('PASS hidden by default; original 52 adventures preserved');

  function injectFictionalOnlyInPage(){
    const sources=[...document.querySelectorAll('img[data-imgkey][src]')]
      .map(img=>({src:img.currentSrc||img.src,alt:img.alt||'Existing guide photograph'}))
      .filter(photo=>photo.src.startsWith('https://'));
    const unique=[...new Map(sources.map(photo=>[photo.src,photo])).values()].slice(0,5);
    if(unique.length<2)return{ok:false,available:unique.length};
    const datePieces=new Intl.DateTimeFormat('en-GB',{
      timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit'
    }).formatToParts(new Date());
    const get=type=>(datePieces.find(item=>item.type===type)||{}).value;
    const startDate=[get('year'),get('month'),get('day')].join('-');
    const endDate=new Date(Date.parse(startDate+'T00:00:00Z')+29*86400000).toISOString().slice(0,10);
    window.__premiumQaEvents=[];
    window.sk8Track=(name,params)=>window.__premiumQaEvents.push({name,params});
    window.SK8_52_PREMIUM={
      enabled:true,ownerApproved:true,advertiserArtworkApproved:true,imageRightsCleared:true,
      placementId:'qa-fictional-NOT-FOR-SALE',businessName:'Fictional Adventures QA',
      headline:'An illustrative adventure in the woods',
      description:'Design demonstration only. Not a real venue or bookable activity.',
      location:'Example only',duration:'Two-hour example',suitableFor:'Illustrative only',
      priceFrom:'Not a real booking',actionLabel:'Example link',
      actionUrl:'https://example.org/',startDate,endDate,
      photos:unique.map(photo=>({src:photo.src,alt:photo.alt,
        credit:'Existing guide photo used only in test',rightsBasis:'LICENCE'}))
    };
    return{ok:true,photoCount:unique.length};
  }
  const setup=await evaluate('('+injectFictionalOnlyInPage.toString()+')()');
  assert.ok(setup.ok&&setup.photoCount>=2,'Could not create temporary QA images');
  await evaluate(gallerySource+'\ntrue;');
  const after=await evaluate("({hidden:document.getElementById('sk8-52-premium-slot').hidden,cards:document.querySelectorAll('.sk8-premium').length,label:document.querySelector('.sk8-premium-label')?.textContent,adventures:Object.keys(JSON.parse(document.getElementById('adventure-data').textContent)).length})");
  assert.equal(after.hidden,false);assert.equal(after.cards,1);assert.equal(after.label,'ADVERTISEMENT');assert.equal(after.adventures,52);
  console.log('PASS fictional gallery in actual 52 Adventures guide');

  function measureInPage(){
    const card=document.querySelector('.sk8-premium'),slot=document.querySelector('#sk8-52-premium-slot');
    slot.scrollIntoView({block:'center'});
    const a=card.getBoundingClientRect(),b=card.querySelector('.sk8-premium-action').getBoundingClientRect();
    return{viewport:innerWidth,documentWidth:document.documentElement.scrollWidth,
      cardLeft:a.left,cardRight:a.right,ctaLeft:b.left,ctaRight:b.right,
      thumbs:card.querySelectorAll('.sk8-premium-thumbs button').length,
      label:card.querySelector('.sk8-premium-label')?.textContent};
  }
  for(const width of [390,740,900,1440]){
    await viewport(width);await sleep(450);
    const m=await evaluate('('+measureInPage.toString()+')()');
    assert.equal(m.thumbs,setup.photoCount,'Thumbnail count '+width);
    assert.ok(m.cardLeft>=-2&&m.cardRight<=width+2,'Card clipped at '+width+': '+JSON.stringify(m));
    assert.ok(m.ctaLeft>=-2&&m.ctaRight<=width+2,'CTA clipped at '+width);
    assert.ok(m.documentWidth<=width+1,'Page overflow at '+width+': '+JSON.stringify(m));
    await sleep(200);await screenshot(width);
    console.log('PASS gallery layout '+width+'px');
  }
  assert.ok(await waitFor("document.querySelector('.sk8-premium-stage>img')?.complete && document.querySelector('.sk8-premium-stage>img')?.naturalWidth>0"),'Primary image loads');

  function interactInPage(){
    const card=document.querySelector('.sk8-premium');
    const photo=card.querySelector('.sk8-premium-stage>img');
    const original=photo.src;
    card.querySelector('.sk8-premium-arrow.next').click();
    const forward=photo.src!==original;
    card.querySelector('.sk8-premium-thumbs button').click();
    const back=photo.src===original;
    const stage=card.querySelector('.sk8-premium-stage');
    stage.focus();
    stage.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));
    const keyboard=photo.src!==original;
    document.addEventListener('click',e=>{
      if(e.target.closest('.sk8-premium-action'))e.preventDefault();
    },true);
    card.querySelector('.sk8-premium-action').dispatchEvent(
      new MouseEvent('click',{bubbles:true,cancelable:true}));
    return{forward,back,keyboard,
      galleryEvents:window.__premiumQaEvents.filter(evt=>evt.name==='guide_advertiser_gallery').length,
      commercialClicks:window.__premiumQaEvents.filter(evt=>evt.name==='guide_advertiser_click').length};
  }
  const interaction=await evaluate('('+interactInPage.toString()+')()');
  assert.ok(interaction.forward&&interaction.back&&interaction.keyboard,'Photo navigation/keyboard');
  assert.equal(interaction.galleryEvents,3);
  assert.equal(interaction.commercialClicks,1);
  console.log('PASS arrows, thumbnails, keyboard, separated paid click');

  await send('Page.navigate',{url:BASE+'/52-adventures/guide/?galleryQaReload=1'});
  assert.ok(await waitFor("document.readyState==='complete' && !!document.getElementById('sk8-52-premium-slot')"),'Reload');
  assert.deepEqual(await evaluate("({hidden:document.getElementById('sk8-52-premium-slot').hidden,cards:document.querySelectorAll('.sk8-premium').length})"),{hidden:true,cards:0});
  console.log('PASS fictional advert never persisted; production gate still disabled');
}finally{
  try{ws?.close();}catch{}
  try{chrome.kill('SIGTERM');}catch{}
}
