import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';

const BASE=(process.env.FREE_CHEAP_QA_BASE_URL||'https://www.sk8scoop.com').replace(/\/$/,'');
const CHROME=process.env.CHROME||'google-chrome';
const PORT=9237;
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const targets=[
  ['hat-works-stockport','HAT WORKS'],
  ['stockport-museum-market-place','STOCKPORT MUSEUM'],
  ['stockport-air-raid-shelters','STOCKPORT AIR RAID SHELTERS'],
  ['staircase-house-stockport-market-place','STAIRCASE HOUSE'],
  ['bramall-hall-bramhall','BRAMALL HALL'],
  ['explore-stockports-underbanks','EXPLORE STOCKPORT'],
  ['manchester-museum','MANCHESTER MUSEUM'],
  ['science-and-industry-museum-manchester','SCIENCE AND INDUSTRY MUSEUM'],
  ['john-rylands-library-manchester','JOHN RYLANDS LIBRARY'],
  ['the-whitworth-manchester','THE WHITWORTH'],
  ['bruntwood-park-cheadle','BRUNTWOOD PARK'],
  ['gatley-skatepark','GATLEY SKATEPARK'],
  ['play-zone-by-autisk-adswood','PLAY ZONE BY AUTISK'],
  ['free-disability-swim-cheadle','FREE DISABILITY SWIM']
];
const fail=m=>{throw Error('Free & Cheap browser QA: '+m)};
const chrome=spawn(CHROME,['--headless=new','--disable-gpu','--no-sandbox','--hide-scrollbars',
  '--remote-debugging-port='+PORT,'--user-data-dir=/tmp/sk8-free-cheap-'+process.pid,
  '--window-size=1440,900','about:blank'],{stdio:['ignore','pipe','pipe']});
let socket;
try{
  let ready=false;
  for(let i=0;i<100;i++){try{ready=(await fetch('http://127.0.0.1:'+PORT+'/json/version')).ok}catch{}if(ready)break;await sleep(150)}
  if(!ready)fail('Chrome debugging port not available');
  const target=await (await fetch('http://127.0.0.1:'+PORT+'/json/new?about:blank',{method:'PUT'})).json();
  socket=new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve,reject)=>{socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',reject,{once:true})});
  let seq=0;const pending=new Map();
  socket.addEventListener('message',event=>{const v=JSON.parse(String(event.data));const p=pending.get(v.id);if(!p)return;pending.delete(v.id);v.error?p.reject(Error(v.error.message||'CDP error')):p.resolve(v.result)});
  const cmd=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}))});
  const evaluate=async exp=>{const r=await cmd('Runtime.evaluate',{expression:exp,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)fail(r.exceptionDetails.text||'page JavaScript error');return r.result.value};
  const wait=async exp=>{for(let i=0;i<120;i++){try{if(await evaluate(exp))return}catch{}await sleep(150)}fail('Timed out '+exp)};
  await cmd('Page.enable');await cmd('Runtime.enable');
  await mkdir('visual-qa/free-cheap-guide',{recursive:true});
  for(const width of [320,390,768,1280]){
    await cmd('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false,screenWidth:width,screenHeight:900});
    await cmd('Page.navigate',{url:BASE+'/free-cheap-guide/guide/'});
    await wait("document.readyState==='complete' && document.querySelector('.secondary-pick') && document.getElementById('hat-works-stockport')");
    await sleep(650);
    const state=await evaluate("(()=>({width:innerWidth,docWidth:document.documentElement.scrollWidth,path:location.pathname,headingCount:document.querySelectorAll('h1').length,cards:[...document.querySelectorAll('.secondary-pick')].map(el=>{const b=el.getBoundingClientRect(),arrow=el.querySelector('.secondary-pick-arrow')?.getBoundingClientRect();return {left:b.left,right:b.right,arrowLeft:arrow?.left,arrowRight:arrow?.right}})}))()");
    if(state.path!=='/free-cheap-guide/guide/')fail(width+'px: redirected to '+state.path);
    if(state.headingCount!==1)fail(width+'px: expected one H1');
    if(state.docWidth>width+1)fail(width+'px: horizontal overflow '+state.docWidth);
    if(state.cards.length<2)fail(width+'px: missing secondary cards');
    for(const c of state.cards)if(c.left<-1||c.right>width+1||c.arrowLeft<c.left-1||c.arrowRight>c.right+1)fail(width+'px: arrow/card clipping '+JSON.stringify(c));
    const chosen=width===390?targets:targets.filter(x=>['hat-works-stockport','gatley-skatepark','play-zone-by-autisk-adswood','free-disability-swim-cheadle'].includes(x[0]));
    for(const [id,prefix] of chosen){
      const result=await evaluate("(()=>{const a=document.getElementById("+JSON.stringify(id)+");if(!a)return null;a.scrollIntoView({block:'start',behavior:'instant'});const b=a.getBoundingClientRect();return {top:b.top,left:b.left,right:b.right,title:a.querySelector('.entry-title')?.textContent.trim()||''}})()");
      if(!result||!result.title.startsWith(prefix))fail(width+'px: fragment '+id+' lands in wrong entry');
      if(result.left<-1||result.right>width+1)fail(width+'px: linked card clipped '+id);
      if(result.top<-2||result.top>150)fail(width+'px: linked heading hidden '+id+' top='+result.top);
    }
    await evaluate("window.scrollTo({top:0,behavior:'instant'});true");
    const shot=await cmd('Page.captureScreenshot',{format:'png',fromSurface:true,captureBeyondViewport:false});
    await writeFile('visual-qa/free-cheap-guide/guide-'+width+'.png',Buffer.from(shot.data,'base64'));
    console.log('PASS Free & Cheap browser '+width+'px, '+chosen.length+' linked article positions');
  }
  console.log('PASS Free & Cheap direct guide access, mobile layout and 14 listing anchors');
}finally{try{socket?.close()}catch{}try{chrome.kill('SIGTERM')}catch{}}
