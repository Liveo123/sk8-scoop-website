import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
const base=(process.env.PREVIEW_URL||'').replace(/\/$/,'');
if(!base)throw Error('PREVIEW_URL required');
const port=19471;
const sleep=ms=>new Promise(done=>setTimeout(done,ms));
const chrome=spawn(process.env.CHROME||'google-chrome',[
 '--headless=new','--disable-gpu','--no-sandbox','--disable-dev-shm-usage',
 '--remote-debugging-port='+port,'--user-data-dir=/tmp/sk8-ux-20-'+process.pid,
 '--window-size=1366,900','about:blank'
],{stdio:'ignore'});
let ws,serial=0;const pending=new Map();
const check=(ok,note)=>{if(!ok)throw Error('FAIL: '+note);console.log('PASS: '+note);};
const rpc=(method,params={})=>new Promise((resolve,reject)=>{
 const id=++serial;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));
});
const evaluate=async expr=>{
 const response=await rpc('Runtime.evaluate',{expression:expr,returnByValue:true,awaitPromise:true});
 if(response.exceptionDetails)throw Error(response.exceptionDetails.exception?.description||response.exceptionDetails.text);
 return response.result?.value;
};
const waitFor=async expr=>{
 for(let attempt=0;attempt<110;attempt++){try{if(await evaluate(expr))return;}catch{}await sleep(150);}
 throw Error('Timed out: '+expr);
};
const click=selector=>evaluate("(() => {const e=document.querySelector("+JSON.stringify(selector)+");if(!e)return false;e.click();return true;})()");
const navigate=async path=>{await rpc('Page.navigate',{url:base+path});await waitFor('document.readyState==="complete"');};
const viewport=(width,height)=>rpc('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<800});
const shot=async name=>{
 const r=await rpc('Page.captureScreenshot',{format:'png',captureBeyondViewport:false,fromSurface:true});
 await writeFile('visual-qa/usability/'+name,Buffer.from(r.data,'base64'));
};
try{
 await mkdir('visual-qa/usability',{recursive:true});
 let ready=false;
 for(let i=0;i<120;i++){
  try{if((await fetch('http://127.0.0.1:'+port+'/json/version')).ok){ready=true;break;}}catch{}
  await sleep(150);
 }
 check(ready,'Chromium starts');
 const tab=await(await fetch('http://127.0.0.1:'+port+'/json/new?about:blank',{method:'PUT'})).json();
 ws=new WebSocket(tab.webSocketDebuggerUrl);
 await new Promise((resolve,reject)=>{ws.addEventListener('open',resolve,{once:true});ws.addEventListener('error',reject,{once:true});});
 ws.addEventListener('message',event=>{
  const message=JSON.parse(String(event.data));if(!message.id)return;
  const p=pending.get(message.id);if(!p)return;pending.delete(message.id);
  if(message.error)p.reject(Error(message.error.message));else p.resolve(message.result);
 });
 await rpc('Page.enable');await rpc('Runtime.enable');
 await viewport(1366,900);
 await navigate('/');
 await waitFor('Boolean(document.querySelector(".site-header .nav-more"))');
 check(await evaluate("['/start/','/submit/','/contact/','/advertise.html'].every(p=>[...document.querySelectorAll('.nav-more-menu a')].some(a=>new URL(a.href).pathname===p))"),'All secondary destinations kept');
 check(await evaluate("document.querySelectorAll('.site-header .nav>a:not(.button)').length===5"),'Five primary reader routes');
 check(await evaluate("document.querySelectorAll('.reader-first-chips > a').length===4"),'Four immediate task shortcuts');
 check(await evaluate("Boolean(document.querySelector('input[aria-describedby=\"reader-first-search-help\"]'))"),'Search scope accessible');
  check(await evaluate("fetch('/kids-family/holiday-club-finder/',{cache:'no-store'}).then(r=>r.ok&&r.text().then(t=>t.includes('Holiday clubs, without the 14 open tabs.')))"),'Planner page is available from the deployed preview, not just a valid-looking link');
 check(await evaluate("(() => {const p=Object.fromEntries(new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date()).map(x=>[x.type,x.value]));const current=p.year+'-'+p.month+'-'+p.day;const active=current<='2026-10-30';const feature=document.querySelector('.holiday-club-spotlight-home');return active?Boolean(feature&&document.querySelector('.holiday-club-spotlight-home a')?.pathname==='/kids-family/holiday-club-finder/'&&feature.getBoundingClientRect().height>=70):!feature})()"),'Holiday club shortcut appears before expiry and disappears once the October sessions are over');
 if(await evaluate("Boolean(document.querySelector('.holiday-club-spotlight-home'))")){
   check(await evaluate("(() => {const hero=document.querySelector('.reader-hero');const section=hero?.nextElementSibling;return !!(section?.classList.contains('holiday-club-home-section')&&section.querySelector('.holiday-club-spotlight-home')&&section.dataset.expireAfter==='2026-10-30');})()"),'Holiday club banner sits immediately beneath the newsletter hero');
   await evaluate("document.querySelector('.holiday-club-spotlight-home').scrollIntoView({block:'start',behavior:'instant'});window.scrollBy({top:-160,behavior:'instant'});true");
    check(await evaluate("(() => {const r=document.querySelector('.holiday-club-spotlight-home').getBoundingClientRect();return r.top>=75&&r.bottom<innerHeight;})()"),'Planner card fits fully below the sticky header in review screenshot');
   await sleep(80);await shot('holiday-club-home-desktop.png');
   check(await evaluate("getComputedStyle(document.querySelector('.holiday-club-spotlight-cta')).color==='rgb(255, 255, 255)'"),'Holiday club CTA retains white button text');
 }

 await shot('homepage-desktop.png');

 await waitFor("document.querySelectorAll('[data-explore-grid] .reader-explore-tile').length===6");
 check(await evaluate("(() => {const tiles=[...document.querySelectorAll('.home-locality-links a')];return tiles.length===4&&tiles.every(x=>x.getBoundingClientRect().height>=100&&getComputedStyle(x).backgroundImage.includes('gradient'))})()"),'Four colourful area tiles remain large enough to use');
 check(await evaluate("(() => {const banners=[...document.querySelectorAll('[data-explore-grid] .reader-explore-photo')];return banners.length===6&&banners.every(x=>getComputedStyle(x).backgroundImage.includes('gradient')&&!getComputedStyle(x).backgroundImage.includes('url(')&&getComputedStyle(x,'::before').content!=='none')})()"),'Six category covers replace blurred file thumbnails with scalable artwork');
 check(await evaluate("(() => {const panel=document.querySelector('.home-resource-free-cheap .home-resource-visual');const art=getComputedStyle(panel,'::before').backgroundImage;return art.includes('free-guide-bg-user-20261024.png') && getComputedStyle(panel.querySelector('.home-poster-headline')).color==='rgb(16, 72, 80)';})()"),'Faded Free & Cheap MidJourney art sits behind dark teal live text');
 check(await evaluate("(() => {const panel=document.querySelector('.home-resource-adventures .home-resource-visual');const style=getComputedStyle(panel,'::before');return style.backgroundImage.includes('52-adventures-user-artwork-fallback-20261024.png')&&getComputedStyle(panel.querySelector('.home-poster-headline')).color==='rgb(16, 72, 80)';})()"),'Selected 52 Adventures artwork loaded behind sharp dark teal text');
 check(await evaluate("(() => {const grid=document.querySelector('.home-resource-grid');const issue=grid.querySelector('.reader-latest-panel');const guide=grid.querySelector('.home-resource-free-cheap');return grid.children.length===3&&issue.getBoundingClientRect().height>guide.getBoundingClientRect().height&&document.querySelectorAll('.home-resource-visual .home-poster').length===2})()"),'One featured issue and two clear guide posters create visual hierarchy');
 check(await evaluate("(() => [...document.querySelectorAll('.home-resource-guide .home-resource-visual img')].every(x=>getComputedStyle(x).display==='none'))()"),'Old floating guide thumbnails are hidden');
 await evaluate("document.querySelector('#your-area').scrollIntoView({block:'start',behavior:'instant'});true");
 await sleep(100);await shot('home-places-categories-desktop.png');
 await evaluate("document.querySelector('.home-resources-section').scrollIntoView({block:'start',behavior:'instant'});true");
 await sleep(100);await shot('home-resource-selector-desktop.png');
 await navigate('/whats-on/?filter=weekend&type=free-family&area=Cheadle');
 await waitFor('window.SK8_EVENT_DATA && document.querySelector("[data-events-count]")?.textContent.includes("current checked")');
 if(await evaluate("Boolean(document.querySelector('[data-consent-none]'))&&!document.querySelector('.privacy-choices')?.hidden")){
  await click('[data-consent-none]');await sleep(180);
 }
 check(await evaluate('window.SK8_EVENT_DATA.length>0'),'Checked event feed loads');
 check(await evaluate("(() => {const p=Object.fromEntries(new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date()).map(x=>[x.type,x.value]));const current=p.year+'-'+p.month+'-'+p.day;const feature=document.querySelector('.whats-on-holiday-quicklink');return current<='2026-10-30'?Boolean(feature&&feature.pathname==='/kids-family/holiday-club-finder/'&&feature.getBoundingClientRect().height>=44):!feature})()"),'What’s On displays the holiday club planner above event filters during the relevant half-term only');
 if(await evaluate("Boolean(document.querySelector('.whats-on-holiday-quicklink'))")){
   await evaluate("document.querySelector('.whats-on-holiday-quicklink').scrollIntoView({block:'start',behavior:'instant'});window.scrollBy({top:-160,behavior:'instant'});true");
    check(await evaluate("(() => {const r=document.querySelector('.whats-on-holiday-quicklink').getBoundingClientRect();return r.top>=75&&r.bottom<innerHeight;})()"),'Planner card fits fully below the sticky header in review screenshot');
   await sleep(80);await shot('holiday-club-whats-on-desktop.png');
 }

 check(await evaluate("(() => {const core=window.SK8CalendarCore;const now=core.localToday();const day=new Date(now+'T00:00:00Z').getUTCDay();const add=(s,n)=>{const d=new Date(s+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);};const sat=day===0?now:add(now,(6-day+7)%7);const sun=day===0?now:add(sat,1);const wanted=window.SK8_EVENT_DATA.filter(e=>e.area==='Cheadle'&&core.isFree(e)&&core.isFamily(e)&&core.withinRange(e,sat,sun)).length;return wanted===document.querySelectorAll('.event-listing-card').length;})()"),'Weekend, Free, Family and Cheadle filters combine correctly');
 check(await evaluate("['weekend','free','family'].every(k=>document.querySelector('[data-event-filter=\"'+k+'\"]')?.getAttribute('aria-pressed')==='true')"),'Combined selections visible to screen readers');
 check(await evaluate("document.querySelector('[data-whats-on-selection]')?.textContent.includes('free & family-friendly')"),'Plain-language combined result label');
 check(await evaluate("new URL(location.href).searchParams.get('type')==='free-family'"),'Selection survives in sharable URL');
 await shot('whatson-desktop.png');
 check(await click('[data-calendar-view="month"]'),'Month calendar available with active conditions');
 check(await evaluate("document.querySelector('[data-event-filter=\"weekend\"]')?.getAttribute('aria-pressed')==='true'"),'Month view preserves weekend filter');
 check(await evaluate("[...document.querySelectorAll('.sk8-calendar-day.has-events')].every(el=>[0,6].includes(new Date(el.dataset.calendarDay+'T00:00:00Z').getUTCDay()))"),'Month view does not highlight non-weekend dates for weekend-only results');
 check(await click('[data-calendar-view="agenda"]'),'Return to agenda');
 check(await click('[data-event-filter="all"]'),'All dates available');
 check(await evaluate("['free','family'].every(k=>document.querySelector('[data-event-filter=\"'+k+'\"]')?.getAttribute('aria-pressed')==='true')"),'All dates preserves Free and Family');
 check(await click('[data-whats-on-clear-filters]'),'Explicit clear all works');
 check(await evaluate("['free','family'].every(k=>document.querySelector('[data-event-filter=\"'+k+'\"]')?.getAttribute('aria-pressed')==='false')"),'Clear all resets all refinements');
 await navigate('/whats-on/?filter=free');
 await waitFor('window.SK8_EVENT_DATA && document.querySelector("[data-events-count]")?.textContent.includes("current checked")');
 check(await evaluate("document.querySelector('[data-event-filter=\"free\"]')?.getAttribute('aria-pressed')==='true'"),'Old free preset works');
 check(await evaluate("document.querySelectorAll('.event-listing-card').length===window.SK8_EVENT_DATA.filter(window.SK8CalendarCore.isFree).length"),'Old free preset results correct');
 await viewport(390,844);
 await navigate('/');
 await waitFor('Boolean(document.querySelector(".site-header .nav-more"))');
 check(await evaluate('document.documentElement.scrollWidth<=window.innerWidth+3'),'Homepage has no mobile horizontal overflow');
 if(await evaluate("Boolean(document.querySelector('.holiday-club-spotlight-home'))")){
   check(await evaluate("(() => {const f=document.querySelector('.holiday-club-spotlight-home'),c=f.querySelector('.holiday-club-spotlight-cta');return f.getBoundingClientRect().right<=innerWidth+2&&c.getBoundingClientRect().height>=44&&c.getBoundingClientRect().width>=180})()"),'Holiday club planner fits narrow mobile width with an accessible full-size action');
   await evaluate("document.querySelector('.holiday-club-spotlight-home').scrollIntoView({block:'start',behavior:'instant'});window.scrollBy({top:-160,behavior:'instant'});true");
    check(await evaluate("(() => {const r=document.querySelector('.holiday-club-spotlight-home').getBoundingClientRect();return r.top>=75&&r.bottom<innerHeight;})()"),'Planner card fits fully below the sticky header in review screenshot');
   await sleep(80);await shot('holiday-club-home-mobile.png');
 }

 check(await click('.site-header .menu-btn'),'Mobile menu opens');
 check(await evaluate("document.querySelector('.site-header .nav').classList.contains('open')"),'Mobile menu visible');
 check(await click('.site-header .nav-more summary'),'Mobile More disclosure opens');
 check(await evaluate("document.querySelector('.site-header .nav-more').open"),'More links accessible');
 await evaluate("document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));true");
 check(await evaluate("!document.querySelector('.site-header .nav-more').open"),'Escape closes secondary menu');
 await evaluate("document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));true");
 check(await evaluate("!document.querySelector('.site-header .nav').classList.contains('open')"),'Escape closes mobile navigation');
 await shot('homepage-mobile.png');

 check(await evaluate("(() => {const els=[...document.querySelectorAll('.home-locality-links a')];return els.length===4&&els.every(x=>x.getBoundingClientRect().width>=130)})()"),'Local area tiles remain readable on a phone');
 check(await evaluate("(() => {const issue=document.querySelector('.reader-latest-panel');const guide=document.querySelector('.home-resource-free-cheap');return issue.getBoundingClientRect().width<=innerWidth&&guide.getBoundingClientRect().width<=innerWidth})()"),'Featured issue and guides fit a mobile screen');
 await evaluate("document.querySelector('#your-area').scrollIntoView({block:'start',behavior:'instant'});true");
 await sleep(100);await shot('home-places-categories-mobile.png');
 await evaluate("document.querySelector('.home-resources-section').scrollIntoView({block:'start',behavior:'instant'});true");
 await sleep(100);await shot('home-resource-selector-mobile.png');
 await navigate('/whats-on/?filter=weekend&type=free-family');
 await waitFor('window.SK8_EVENT_DATA && document.querySelector("[data-events-count]")?.textContent.includes("current checked")');
 check(await evaluate('document.documentElement.scrollWidth<=window.innerWidth+3'),"What's On has no mobile horizontal overflow");
 if(await evaluate("Boolean(document.querySelector('.whats-on-holiday-quicklink'))")){
   check(await evaluate("(() => {const c=document.querySelector('.whats-on-holiday-quicklink');return c.getBoundingClientRect().right<=innerWidth+2&&c.getBoundingClientRect().height>=44&&c.getBoundingClientRect().width>=180})()"),'Holiday club shortcut on What’s On stays readable and tappable on mobile');
   await evaluate("document.querySelector('.whats-on-holiday-quicklink').scrollIntoView({block:'start',behavior:'instant'});window.scrollBy({top:-160,behavior:'instant'});true");
    check(await evaluate("(() => {const r=document.querySelector('.whats-on-holiday-quicklink').getBoundingClientRect();return r.top>=75&&r.bottom<innerHeight;})()"),'Planner card fits fully below the sticky header in review screenshot');
   await sleep(80);await shot('holiday-club-whats-on-mobile.png');
 }

 check(await evaluate("[...document.querySelectorAll('.whats-on-filter-buttons button')].every(el=>el.getBoundingClientRect().height>=43)"),'All mobile filters meet practical touch-target size');
 await shot('whatson-mobile.png');
 console.log('PASS 20-pass usability browser QA completed');
}catch(error){console.error(error);process.exitCode=1;}
finally{try{ws?.close();}catch{}chrome.kill('SIGTERM');}
