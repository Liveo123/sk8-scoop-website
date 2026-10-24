import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';

const BASE=(process.env.GUIDE_QA_BASE_URL||'http://127.0.0.1:8769').replace(/\/$/,'');
const CHROME=process.env.CHROME||'google-chrome';
const PORT=9243;
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const report=[];
const record=(label,ok,detail='')=>{
  report.push({label,status:ok?'PASS':'FAIL',detail});
  console.log((ok?'PASS ':'FAIL ')+label+(detail?' | '+detail:''));
};
let socket;
const chrome=spawn(CHROME,['--headless=new','--no-sandbox','--disable-gpu',
  '--remote-debugging-port='+PORT,'--user-data-dir=/tmp/sk8-guide-failures-'+process.pid,
  '--window-size=1280,900','about:blank'],{stdio:'ignore'});
try {
  let ready=false;
  for(let i=0;i<100;i++){try{ready=(await fetch('http://127.0.0.1:'+PORT+'/json/version')).ok}catch{}if(ready)break;await sleep(160)}
  if(!ready)throw Error('Chrome DevTools server not ready');
  const target=await (await fetch('http://127.0.0.1:'+PORT+'/json/new?about:blank',{method:'PUT'})).json();
  socket=new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve,reject)=>{socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',reject,{once:true})});
  const pending=new Map();let seq=0;const dialogs=[];
  socket.addEventListener('message',event=>{
    const msg=JSON.parse(String(event.data));
    if(msg.method==='Page.javascriptDialogOpening'){
      dialogs.push(msg.params);
      socket.send(JSON.stringify({id:++seq,method:'Page.handleJavaScriptDialog',params:{accept:false}}));
      return;
    }
    if(!msg.id)return;
    const entry=pending.get(msg.id);if(!entry)return;pending.delete(msg.id);
    msg.error?entry.reject(Error(msg.error.message)):entry.resolve(msg.result);
  });
  const cmd=(method,params={})=>new Promise((resolve,reject)=>{
    const id=++seq;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));
  });
  const evaluate=async expression=>{
    const r=await cmd('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});
    if(r.exceptionDetails)throw Error(r.exceptionDetails.text||'browser JavaScript error');
    return r.result?.value;
  };
  const wait=async expression=>{
    for(let i=0;i<75;i++){try{if(await evaluate(expression))return true}catch{}await sleep(120)}
    return false;
  };
  const navigate=async path=>{
    await cmd('Page.navigate',{url:BASE+path});
    if(!await wait("document.readyState==='complete'"))throw Error('Navigation timeout '+path);
    await sleep(380);
  };
  const click=selector=>evaluate("(()=>{let b=document.querySelector("+JSON.stringify(selector)+");if(!b)return false;b.focus();b.click();return true})()");
  await cmd('Page.enable'); await cmd('Runtime.enable');
  await mkdir('visual-qa/guide-reliability',{recursive:true});
  for(const width of [320,390]){
    await cmd('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false,screenWidth:width,screenHeight:900});
    for(const [name,slug] of [['Halloween','halloween-half-term-guide'],['Free & Cheap','free-cheap-guide'],['52 Adventures','52-adventures']]){
      await navigate('/'+slug+'/guide/');
      const s=await evaluate("({path:location.pathname,w:innerWidth,doc:document.documentElement.scrollWidth,h1:[...document.querySelectorAll('h1')].filter(x=>x.getClientRects().length>0 && !x.closest('[hidden]')).length,body:document.body.textContent.length})");
      record(name+' direct access '+width+'px',s.path==='/'+slug+'/guide/' && s.h1===1 && s.body>500,JSON.stringify(s));
      record(name+' no horizontal overflow '+width+'px',s.doc<=width+2,JSON.stringify({viewport:width,document:s.doc}));
      if (width===390) {
        const decoded=await evaluate("(async()=>{const images=[...document.querySelectorAll('img[src]')].filter(img=>img.getAttribute('src')?.trim() && img.currentSrc).slice(0,3);"+
          "return await Promise.all(images.map(async img=>{"+
          "try{await Promise.race([img.decode(),new Promise((_,reject)=>setTimeout(()=>reject(new Error('image decode timeout')),4500))]);return {ok:img.naturalWidth>0,width:img.naturalWidth,url:img.currentSrc}}"+
          "catch(e){return {ok:false,url:img.currentSrc,error:String(e)}}}));})()");
        record(name+' actual browser image decoding',decoded.length>0 && decoded.every(x=>x.ok),JSON.stringify(decoded));
      }
    }
  }
  await cmd('Emulation.setDeviceMetricsOverride',{width:390,height:900,deviceScaleFactor:1,mobile:false,screenWidth:390,screenHeight:900});
  await navigate('/52-adventures/guide/');
  const illustrationSourceAudit=await evaluate("(()=>{const data=JSON.parse(document.querySelector('#image-data').textContent);"+
    "const adventureData=JSON.parse(document.querySelector('#adventure-data').textContent);"+
    "const keys=['a2','a10','a32-illustration','chapter01-illustration','chapter03-illustration'];"+
    "return {sources:keys.map(key=>({key,src:data[key]||null,sharp:Boolean(data[key]&&data[key].includes('owner-1200x904'))})),"+
    "plazaOriginal:Boolean(data.a6&&data.a6.includes('issue17/chess-editorial-original-v7')),"+
    "originalRhsPhoto:data.a32,"+
    "rhsSelectedKey:adventureData[32].imgKey,"+
    "chapterCards:[...document.querySelectorAll('.chapter-card-image[data-editorial-cover]')].map(fig=>({alt:fig.querySelector('img')?.alt||'',label:fig.querySelector('figcaption')?.textContent||''}))};})()");
  record('52 Adventures: five selected owner illustrations use sharp source files',
    illustrationSourceAudit.sources.length===5 &&
    illustrationSourceAudit.sources.every(x=>x.sharp),JSON.stringify(illustrationSourceAudit.sources));
  record('52 Adventures: Plaza art and licensed RHS photo kept distinct',
    illustrationSourceAudit.plazaOriginal &&
    illustrationSourceAudit.originalRhsPhoto==='/52-adventures/guide/assets/adventure-32.webp' &&
    illustrationSourceAudit.rhsSelectedKey==='a32-illustration',
    JSON.stringify({plazaOriginal:illustrationSourceAudit.plazaOriginal,
      rhsOriginal:illustrationSourceAudit.originalRhsPhoto,
      rhsSelected:illustrationSourceAudit.rhsSelectedKey}));
  record('52 Adventures: both chapter illustrations have reader-visible labels',
    illustrationSourceAudit.chapterCards.length===2 &&
    illustrationSourceAudit.chapterCards.every(x=>/illustration/i.test(x.label) && x.alt.length>30),
    JSON.stringify(illustrationSourceAudit.chapterCards));

  // Test the actual browser-decoded image resolution, not just URLs or metadata.
  const chapterRender=await evaluate("(async()=>{"+
    "const keys=['chapter01-illustration','a10','chapter03-illustration'];"+
    "const out=[];for(const key of keys){"+
    "const img=[...document.querySelectorAll('.chapter-card-image img')].find(x=>x.dataset.imgkey===key);"+
    "if(!img){out.push({key,found:false});continue;}"+
    "img.loading='eager';img.scrollIntoView({block:'nearest'});"+
    "try{await Promise.race([img.decode(),new Promise((_,reject)=>setTimeout(()=>reject(Error('decode timeout')),12000))]);}"+
    "catch(e){out.push({key,found:true,width:img.naturalWidth,height:img.naturalHeight,error:String(e)});continue;}"+
    "out.push({key,found:true,width:img.naturalWidth,height:img.naturalHeight,label:img.closest('figure')?.querySelector('figcaption')?.textContent});"+
    "}return out;})()");
  record('52 Adventures: actual mobile chapter-card images decode at 900px+ width',
    chapterRender.length===3 &&
    chapterRender.every(x=>x.found && x.width>=900 && x.height>=650 && /illustration/i.test(x.label||'')),
    JSON.stringify(chapterRender));

  await evaluate("document.querySelector('.chapter-cards')?.scrollIntoView({block:'start'})");
  await sleep(350);
  const mobileArtScreenshot=await cmd('Page.captureScreenshot',{format:'png',fromSurface:true,captureBeyondViewport:false});
  await writeFile('visual-qa/guide-reliability/52-adventures-chapters-mobile-390.png',
    Buffer.from(mobileArtScreenshot.data,'base64'));
  await cmd('Emulation.setDeviceMetricsOverride',
    {width:1280,height:900,deviceScaleFactor:1,mobile:false,screenWidth:1280,screenHeight:900});
  await navigate('/52-adventures/guide/');
  await evaluate("document.querySelector('.chapter-cards')?.scrollIntoView({block:'start'})");
  await sleep(350);
  const desktopArtScreenshot=await cmd('Page.captureScreenshot',{format:'png',fromSurface:true,captureBeyondViewport:false});
  await writeFile('visual-qa/guide-reliability/52-adventures-chapters-desktop-1280.png',
    Buffer.from(desktopArtScreenshot.data,'base64'));

  // The image-review page previously fell back to fuzzy 199px proofs.
  // Check its rendered pixels separately from the full guide so it cannot silently regress.
  await navigate('/52-adventures/image-review-2026-10-23/');
  const comparisonImages=await evaluate("(async()=>{"+
    "const imgs=[...document.querySelectorAll('.card img')];"+
    "const out=[];for(const [i,img] of imgs.entries()){img.loading='eager';"+
    "img.scrollIntoView({block:'nearest'});"+
    "try{await Promise.race([img.decode(),new Promise((_,reject)=>setTimeout(()=>reject(Error('decode timeout')),12000))]);}"+
    "catch(e){out.push({index:i,alt:img.alt,width:img.naturalWidth,error:String(e)});continue;}"+
    "out.push({index:i,alt:img.alt,width:img.naturalWidth,height:img.naturalHeight,"+
    "fallback:img.currentSrc.startsWith('data:'),source:img.currentSrc.slice(0,130)});"+
    "}return out;})()");
  record('52 Adventures: comparison page displays all five sharp images, plus Plaza',
    comparisonImages.length===6 &&
    comparisonImages.every((x,i)=>i===1?x.width>=700:
      x.width>=1000 && x.height>=750 && x.fallback===false),
    JSON.stringify(comparisonImages));

  await evaluate("document.querySelector('.grid')?.scrollIntoView({block:'start'})");
  await sleep(350);
  const comparisonDesktopScreenshot=await cmd('Page.captureScreenshot',
    {format:'png',fromSurface:true,captureBeyondViewport:false});
  await writeFile('visual-qa/guide-reliability/52-adventures-comparison-desktop-1280.png',
    Buffer.from(comparisonDesktopScreenshot.data,'base64'));
  await cmd('Emulation.setDeviceMetricsOverride',
    {width:390,height:900,deviceScaleFactor:1,mobile:false,screenWidth:390,screenHeight:900});
  await navigate('/52-adventures/image-review-2026-10-23/');
  await evaluate("document.querySelector('.grid')?.scrollIntoView({block:'start'})");
  await sleep(350);
  const comparisonMobileScreenshot=await cmd('Page.captureScreenshot',
    {format:'png',fromSurface:true,captureBeyondViewport:false});
  await writeFile('visual-qa/guide-reliability/52-adventures-comparison-mobile-390.png',
    Buffer.from(comparisonMobileScreenshot.data,'base64'));

  // Owner's 24 October image choices: five alternative photos have individually
  // licensed source files and two owner illustrations appear in adventure modals.
  await navigate('/52-adventures/image-selections-2026-10-24/');
  const licensedReview=await evaluate("(async()=>{"+
    "const imgs=[...document.querySelectorAll('.licensed-card img')];const out=[];"+
    "for(const img of imgs){img.loading='eager';img.scrollIntoView({block:'nearest'});"+
    "try{await Promise.race([img.decode(),new Promise((_,reject)=>setTimeout(()=>reject(Error('decode timeout')),12000))]);}"+
    "catch(e){out.push({width:img.naturalWidth,error:String(e)});continue;}"+
    "out.push({width:img.naturalWidth,height:img.naturalHeight,src:img.currentSrc});}"+
    "return {photos:out,chosen:document.querySelectorAll('.card:not(.licensed-card)').length,"+
    "rights:[...document.querySelectorAll('.licensed-card .rights')].map(x=>x.textContent)};})()");
  record('Owner selected-image board keeps nine original choices and five licensed alternatives',
    licensedReview.chosen===12 && licensedReview.photos.length===5 &&
    licensedReview.photos.every(x=>x.width>=1200 && x.height>=800) &&
    licensedReview.rights.every(x=>/licensed/i.test(x)),
    JSON.stringify({chosen:licensedReview.chosen,photos:licensedReview.photos,rights:licensedReview.rights}));
  await evaluate("document.querySelector('#licenced-alternatives')?.scrollIntoView({block:'start'})");
  await sleep(350);
  const rightsScreenshot=await cmd('Page.captureScreenshot',
    {format:'png',fromSurface:true,captureBeyondViewport:false});
  await writeFile('visual-qa/guide-reliability/52-adventures-licensed-alternatives-mobile.png',
    Buffer.from(rightsScreenshot.data,'base64'));
  await navigate('/52-adventures/guide/');
  for(const [num,key] of [[5,'underbanks-editorial-illustration'],[7,'foodie-friday-editorial-illustration']]){
    const insetResult=await evaluate("(async()=>{"+
      "const btn=[...document.querySelectorAll('[data-open]')].find(x=>Number(x.dataset.open)==="+num+");"+
      "if(!btn)return {error:'button missing'};btn.click();"+
      "const dlg=document.querySelector('#adventure-dialog'),img=dlg?.querySelector('.guide-editorial-inset img');"+
      "if(!img)return {opened:dlg?.open,error:'inset missing'};"+
      "img.loading='eager';img.scrollIntoView({block:'nearest'});"+
      "try{await Promise.race([img.decode(),new Promise((_,reject)=>setTimeout(()=>reject(Error('decode timeout')),12000))]);}"+
      "catch(e){return{opened:dlg.open,key:img.dataset.imgkey,error:String(e)}};"+
      "return {opened:dlg.open,key:img.dataset.imgkey,width:img.naturalWidth,"+
      "height:img.naturalHeight,caption:img.closest('figure')?.querySelector('figcaption')?.textContent};})()");
    record('Owner Midjourney illustration '+num+' opens, decodes sharply, and is labelled',
      insetResult.opened===true && insetResult.key===key &&
      insetResult.width>=1000 && insetResult.height>=750 &&
      /illustration/i.test(insetResult.caption||''),
      JSON.stringify(insetResult));
    if(num===5){
      const insetShot=await cmd('Page.captureScreenshot',
        {format:'png',fromSurface:true,captureBeyondViewport:false});
      await writeFile('visual-qa/guide-reliability/52-adventures-underbanks-illustration-mobile.png',
        Buffer.from(insetShot.data,'base64'));
    }
    await evaluate("document.querySelector('#adventure-dialog')?.close()");
  }
  await navigate('/52-adventures/guide/');
  record('Finder view opens',await click('[data-view="finder"]'));
  const searchResult=await evaluate("(()=>{"+
    "const p=document.querySelector('#view-finder .finder-panel');if(!p)return {error:'finder panel missing'};"+
    "const input=p.querySelector('[data-filter=\"search\"]');if(!input)return {error:'finder search missing'};"+
    "input.value='__this_activity_does_not_exist_89261';"+
    "input.dispatchEvent(new Event('input',{bubbles:true}));"+
    "return {visible:p.querySelectorAll('.finder-card:not([hidden])').length,"+
    "summary:p.querySelector('[data-finder-summary]')?.textContent||'',hash:location.hash};})()");
  record('Finder impossible query yields honest zero result',
    searchResult.visible===0 && /^0 adventures match/.test(searchResult.summary||''),JSON.stringify(searchResult));
  const filterReset=await evaluate("(()=>{"+
    "const input=document.querySelector('#view-finder .finder-panel [data-filter=\"search\"]');"+
    "input.value='';input.dispatchEvent(new Event('input',{bubbles:true}));"+
    "return document.querySelectorAll('#view-finder .finder-card:not([hidden])').length;})()");
  record('Clearing Finder query restores results',filterReset>0,'visible='+filterReset);
  const openedAdventure=await evaluate("document.querySelector('#view-finder .finder-card:not([hidden]) [data-open]')?.dataset.open || ''");
  record('Adventure dialog trigger available',await click('#view-finder .finder-card:not([hidden]) [data-open]'));
  record('Adventure dialog modal state',await evaluate("Boolean(document.querySelector('dialog.adventure-dialog')?.open)"));
  await cmd('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
  await cmd('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
  await sleep(300);
  record('Escape closes adventure dialog',!(await evaluate("Boolean(document.querySelector('dialog.adventure-dialog')?.open)")));
  const restored=await evaluate("document.activeElement?.dataset?.open || ''");
  record('Escape restores focus to previous adventure trigger',Boolean(openedAdventure) && restored===openedAdventure,'open='+openedAdventure+' focused='+restored);
  const screen=await cmd('Page.captureScreenshot',{format:'png',fromSurface:true,captureBeyondViewport:false});
  await writeFile('visual-qa/guide-reliability/52-adventures-mobile-390.png',Buffer.from(screen.data,'base64'));

  // A new navigation with storage denied simulates privacy/hardened browsers.
  await cmd('Page.addScriptToEvaluateOnNewDocument',{source:
    "Object.defineProperty(window,'localStorage',{configurable:true,get(){throw new DOMException('Storage blocked','SecurityError')}});"+
    "try{Object.defineProperty(navigator,'clipboard',{configurable:true,value:undefined})}catch{}"
  });
  await navigate('/52-adventures/guide/');
  const storageState=await evaluate("({"+
    "fallback:[...document.querySelectorAll('[data-storage-note]')].some(x=>/this visit only|unavailable/i.test(x.textContent)),"+
    "title:Boolean(document.querySelector('h1')),"+
    "save:Boolean(document.querySelector('[data-utility-save]'))})");
  record('52 Adventures works with blocked local storage',
    storageState.title&&storageState.fallback&&storageState.save,JSON.stringify(storageState));
  if(storageState.save){
    await click('[data-utility-save]');
    const saved=await evaluate("Boolean(document.querySelector('[data-utility-save]')?.getAttribute('aria-pressed')==='true')");
    record('Temporary visit-only saved state works',saved);
  }
  record('Share/copy control remains available without clipboard',
    await evaluate("Boolean(document.querySelector('[data-guide-share]'))"));
  await click('[data-view="saved"]');
  await click('[data-share-saved]');
  await sleep(450);
  const promptFallback=dialogs.find(d=>d.type==='prompt' && /Copy this shortlist link/.test(d.message||''));
  record('Clipboard-denied shortlist provides manual copy fallback',Boolean(promptFallback),
    'prompt='+(promptFallback?.message||'none'));
} catch(e) {
  record('Browser test infrastructure',false,String(e.stack||e));
} finally {
  try{socket?.close()}catch{}
  try{chrome.kill('SIGTERM')}catch{}
  await mkdir('visual-qa/guide-reliability',{recursive:true});
  await writeFile('visual-qa/guide-reliability/browser-results.json',
    JSON.stringify({base:BASE,checkedAt:new Date().toISOString(),results:report},null,2)+'\n');
}
if(report.some(x=>x.status==='FAIL'))process.exitCode=1;
