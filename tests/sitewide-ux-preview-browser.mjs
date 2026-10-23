import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';

const BASE = (process.env.PREVIEW_URL || '').replace(/\/$/, '');
assert.match(BASE, /^https:\/\/[a-z0-9-]+\.previews\.sk8scoop\.com$/i,
  'Browser verification is preview-only, never production');
const CHROME = process.env.CHROME || 'google-chrome';
const PORT = 9254;
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const results = [];
const check = (name, success, detail = '') => {
  results.push({ name, success: Boolean(success), detail });
  console.log((success ? 'PASS: ' : 'FAIL: ') + name + (detail ? ' (' + detail + ')' : ''));
  assert.ok(success, name + ': ' + detail);
};
await mkdir('visual-qa/sitewide', { recursive: true });
const chrome = spawn(CHROME, [
  '--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage',
  '--no-first-run', '--disable-background-networking', '--hide-scrollbars',
  '--remote-debugging-port=' + PORT, '--user-data-dir=/tmp/sk8-reader-first-' + process.pid,
  '--window-size=1366,900', 'about:blank'
], { stdio: ['ignore', 'ignore', 'pipe'] });
chrome.stderr.on('data', buf => {
  const line = String(buf);
  if (/FATAL|DevTools listening|ERROR/i.test(line)) process.stderr.write(line.slice(0, 900));
});
let ws;
try {
  let chromeReady = false;
  for (let i = 0; i < 150; i++) {
    try {
      chromeReady = (await fetch('http://127.0.0.1:' + PORT + '/json/version')).ok;
      if (chromeReady) break;
    } catch {}
    if (chrome.exitCode !== null) break;
    await sleep(200);
  }
  check('Headless browser started', chromeReady);
  const page = await (await fetch('http://127.0.0.1:' + PORT + '/json/new?about:blank', { method:'PUT' })).json();
  ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve, { once:true });
    ws.addEventListener('error', reject, { once:true });
  });
  let sequence = 0;
  const pending = new Map();
  ws.addEventListener('message', ev => {
    const m = JSON.parse(String(ev.data));
    if (!m.id || !pending.has(m.id)) return;
    const entry = pending.get(m.id);
    pending.delete(m.id);
    m.error ? entry.reject(new Error(m.error.message)) : entry.resolve(m.result);
  });
  const command = (method, params = {}) => new Promise((resolve,reject)=>{
    const id = ++sequence;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id,method,params }));
  });
  const evaluate = async expression => {
    const r = await command('Runtime.evaluate', { expression, awaitPromise:true, returnByValue:true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.text || 'Browser expression failed');
    return r.result?.value;
  };
  const waitFor = async (expression, label, timeout=20000) => {
    const started = Date.now();
    while (Date.now() - started < timeout) {
      try {
        if (await evaluate(expression)) return;
      } catch {}
      await sleep(200);
    }
    throw new Error('Timed out waiting for ' + label);
  };
  const viewport = async (width, height, mobile = false) => command(
    'Emulation.setDeviceMetricsOverride', {
      width, height, deviceScaleFactor:1, mobile, screenWidth:width, screenHeight:height
    }
  );
  const navigate = async path => {
    await command('Page.navigate', { url: BASE + path });
    await waitFor("document.readyState === 'complete'", 'page load ' + path);
    await sleep(500);
  };
  const screenshot = async filename => {
    const shot = await command('Page.captureScreenshot', {
      format:'png', fromSurface:true, captureBeyondViewport:false
    });
    await writeFile('visual-qa/sitewide/'+filename,Buffer.from(shot.data,'base64'));
  };
  const fullScreenshot = async filename => {
    const metrics = await command('Page.getLayoutMetrics');
    const size = metrics.cssContentSize || metrics.contentSize;
    const shot = await command('Page.captureScreenshot',{
      format:'png',fromSurface:true,captureBeyondViewport:true,
      clip:{x:0,y:0,width:size.width,height:Math.min(size.height,10000),scale:1}
    });
    await writeFile('visual-qa/sitewide/'+filename,Buffer.from(shot.data,'base64'));
  };
  await command('Page.enable');
  await command('Runtime.enable');
  await command('Network.enable');
  // Do not send subscription requests or load analytics and Meta tracking in tests.
  await command('Network.setBlockedURLs', { urls:[
    '*://*.googletagmanager.com/*','*://*.google-analytics.com/*',
    '*://connect.facebook.net/*','*://*.facebook.com/tr*'
  ]});
  for (const [width,height,mobile] of [[390,844,true],[768,1024,true],[1366,900,false]]) {
    await viewport(width,height,mobile);
    await navigate('/?reader-first-qa=' + width);
    await waitFor(
      "Boolean(document.querySelector('.reader-first-event-grid, .reader-first-fallback'))",
      'checked event cards or honest fallback at ' + width + 'px'
    );
    const v=await evaluate(`(() => {
      const finder=document.querySelector('.reader-first-discovery');
      const hero=document.querySelector('.reader-hero');
      const title=document.querySelector('h1');
      const search=document.querySelector('#reader-first-search-input');
      const a=finder.getBoundingClientRect(),b=hero.getBoundingClientRect(),s=search.getBoundingClientRect();
      return {
        width:innerWidth, viewport:innerHeight, contentWidth:document.documentElement.scrollWidth,
        clientWidth:document.documentElement.clientWidth,
        finderTop:a.top,finderBottom:a.bottom,heroTop:b.top,heroHeight:b.height,
        searchTop:s.top,searchHeight:s.height,searchWidth:s.width,
        topTitle:title?.textContent,h1Count:document.querySelectorAll('h1').length,
        h1InsideFinder:finder.contains(title),
        cards:document.querySelectorAll('.reader-first-event').length,
        fallback:!!document.querySelector('.reader-first-fallback'),
        doubleSearch:document.querySelectorAll('#reader-first-search-input').length,
        primaryLinks:[...document.querySelectorAll('.reader-first-event h3 a')].map(x=>x.getAttribute('href')),
        newsletterPresent:!!document.querySelector('.reader-hero form.reader-signup'),
        consentHeight:document.querySelector('.privacy-choices:not([hidden])')?.getBoundingClientRect().height || 0,
        consentRejectPresent:!!document.querySelector('.privacy-choices [data-consent-none]'),
        consentAllowPresent:!!document.querySelector('.privacy-choices [data-consent-all]')
      };
    })()`);
    check(width + 'px: first-screen finder before newsletter',
      v.finderTop >= -3 && v.finderTop < height*.35 && v.finderBottom<=v.heroTop+3,
      JSON.stringify({finderTop:v.finderTop,heroTop:v.heroTop,screen:height}));
    check(width + 'px: helpful H1 and search precede signup',
      v.h1InsideFinder && v.h1Count===1 && v.searchHeight>=44 && v.searchTop<height,
      JSON.stringify({h1:v.topTitle,searchTop:v.searchTop}));
    check(width + 'px: no horizontal overflow',
      v.contentWidth <= v.clientWidth + 2,
      JSON.stringify({scrollWidth:v.contentWidth,clientWidth:v.clientWidth}));
    check(width + 'px: newsletter is a compact second-stage invitation',
      v.newsletterPresent && v.heroHeight>100 && v.heroHeight<(mobile ? 560 : 420),
      'height='+v.heroHeight);
    check(width + 'px: checked feed has working direct event links or explicit fallback',
      (v.cards>0 && v.primaryLinks.every(x=>/^\/whats-on\/\?event=/.test(x))) ||
      (v.cards===0 && v.fallback), 'cards='+v.cards);
    if (!v.fallback) {
      const expected = width <= 720 ? 2 : 4;
      check(width + 'px: appropriate number of immediately useful highlights',
        v.cards===expected, 'expected '+expected+', found '+v.cards);
    }
    if(width===390 && v.consentHeight) {
      check('Mobile consent does not cover most of the first screen',
        v.consentHeight<300 && v.consentRejectPresent && v.consentAllowPresent,
        'height='+v.consentHeight);
      check('Newsletter is not buried below four full mobile cards',
        v.heroTop<1700, 'heroTop='+v.heroTop);
    }
    await screenshot('homepage-' + width + '.png');
    if(width===390 || width===1366) await fullScreenshot('homepage-full-' + width + '.png');
    console.log('METRICS '+width+' '+JSON.stringify(v));
  }
  await viewport(390,844,true);
  await navigate('/');
  await waitFor("document.querySelectorAll('[data-explore-grid] .reader-explore-tile').length === 6",
    'six refreshed editorial categories');
  await waitFor("document.querySelector('.reader-worth .reader-story:nth-child(2) .reader-link')?.href.includes('merseyday-of-the-dead')",
    'specific Merseyday story event continuation');
  const homeState=await evaluate(`(() => {
    const card=document.querySelector('.reader-worth .reader-story:nth-child(3)');
    const frame=card?.querySelector('.dicm-visual');
    const art=frame?.querySelector('.dicm-art');
    const visual=getComputedStyle(document.querySelector('.reader-hero-photo'),'::before');
    return {
      categoryNames:[...document.querySelectorAll('[data-explore-grid] .reader-explore-copy strong')]
        .map(x=>x.textContent.trim()),
      headline:document.querySelector('.reader-hero h2')?.textContent.trim(),
      newsletterButton:document.querySelector('.reader-signup button')?.textContent.trim(),
      usefulLine:document.querySelector('.home-newsletter-usefulness')?.textContent.trim(),
      featuredHref:document.querySelector('.reader-worth .reader-story:nth-child(2) .reader-link')?.getAttribute('href'),
      imageGrade:visual.filter,illustrationSource:visual.backgroundImage,
      thirdArtWidth:art?.getBoundingClientRect().width,
      thirdFrameWidth:frame?.getBoundingClientRect().width,
      thirdArtFit:art && getComputedStyle(art).objectFit,
      articleSvgCount:document.querySelectorAll('.reader-worth .reader-story svg').length
    };
  })()`);
  check('Whole-page category index is complementary, ordered and not duplicated',
    homeState.categoryNames.join('|')==='Kids & Family|Outdoors|Food & Drink|Useful Updates|Local History|Planning & Development',
    JSON.stringify(homeState.categoryNames));
  check('Newsletter has a distinct concrete weekly offer',
    homeState.headline==='Good local ideas, every Friday' &&
    homeState.newsletterButton==='Get it free' &&
    homeState.usefulLine.includes('Free things to do'));
  check('Dynamic featured story directs to the verified event',
    homeState.featuredHref==='/whats-on/?event=merseyday-of-the-dead-2026-10-24');
  check('Hero uses the current source artwork with non-destructive vivid contrast',
    homeState.imageGrade.includes('saturate(1.2)') &&
    homeState.illustrationSource.includes('sk8-miniature-hero-hires-v3.png'));
  check('Editorial art fills its intended media frame without generic SVG fallback',
    homeState.thirdArtFit==='cover' &&
    homeState.thirdArtWidth >= homeState.thirdFrameWidth-2 &&
    homeState.articleSvgCount===0);
  await evaluate("localStorage.setItem('sk8_subscriber_recognition_v1',JSON.stringify({version:1,recognised:true,savedAt:new Date().toISOString(),expiresAt:Date.now()+86400000}));true");
  await navigate('/?reader-full-preview=recognised');
  check('Recognised readers open useful guide content directly',
    await evaluate("['/free-cheap-guide/guide/','/52-adventures/guide/'].every(h => [...document.querySelectorAll('.home-resource-guide a[href]')].some(a => a.getAttribute('href') === h))"));
  await evaluate("localStorage.removeItem('sk8_subscriber_recognition_v1');true");
  await navigate('/');
  await waitFor("Boolean(document.querySelector('.reader-first-event h3 a'))",'first verified homepage event');
  const detailHref=await evaluate("document.querySelector('.reader-first-event h3 a')?.getAttribute('href')");
  const detailId=new URL(BASE+detailHref).searchParams.get('event');
  const detailMatches="Boolean([...document.querySelectorAll('[data-event-id]')].find(x=>x.dataset.eventId==="+JSON.stringify(detailId)+"||x.dataset.seriesId==="+JSON.stringify(detailId)+"))";
  await navigate(detailHref);
  await waitFor(detailMatches,'homepage event has an actual calendar detail card');
  check('NUE event continuation reaches the corresponding full event detail', await evaluate(detailMatches));
  await navigate('/whats-on/?filter=weekend');
  await waitFor(
    "document.querySelector('button[data-event-filter=weekend]')?.getAttribute('aria-pressed') === 'true'",
    'weekend preset');
  check('Weekend chip routes into the functioning calendar',
    await evaluate("document.querySelector('button[data-event-filter=weekend]')?.getAttribute('aria-pressed') === 'true'"));
  await navigate('/whats-on/?area=Gatley');
  await waitFor(
    "document.querySelector('button[data-event-area=Gatley]')?.getAttribute('aria-pressed') === 'true'",
    'Gatley area preset');
  check('Core-area links route into correct filters',
    await evaluate("document.querySelector('button[data-event-area=Gatley]')?.getAttribute('aria-pressed') === 'true'"));
  // Sitewide template contract: cross-product journeys must agree on a
  // single authoritative header, verified event data and reversible filters.
  await viewport(390,844,true);
  const routes=['/','/whats-on/','/search/','/guides/','/around-sk8/',
    '/cheadle/','/kids-family/','/my-sk8/','/join/','/advertise.html'];
  for (const route of routes) {
    await navigate(route);
    await waitFor("Boolean(document.querySelector('.site-header'))",'header on '+route);
    const v=await evaluate(`(() => ({
      title:document.title, heading:document.querySelector('main h1')?.textContent || '',
      width:innerWidth, scrollWidth:document.documentElement.scrollWidth,
      clientWidth:document.documentElement.clientWidth,
      style:!!document.querySelector('link[data-sitewide-ux]'),
      explore:!!document.querySelector('#main-nav a[href="/around-sk8/"]'),
      searchIcon:!!document.querySelector('.global-search-toggle .sk8-search-glass'),
      anySearchSvg:document.querySelectorAll('.global-search-utility svg').length,
      active:document.querySelector('#main-nav [aria-current="page"]')?.getAttribute('href')||''
    }))()`);
    check('Mobile '+route+' has one consistent real header and readable width',
      v.style && v.explore && v.searchIcon && !v.anySearchSvg &&
      v.scrollWidth <= v.clientWidth+2,
      JSON.stringify(v));
    if(['/search/','/whats-on/','/guides/','/cheadle/'].includes(route))
      await screenshot('mobile-'+route.replace(/[^a-z0-9]+/gi,'-')+'.png');
    if(route==='/cheadle/'){
      check('Place hub marks Explore SK8 as active',
        v.active==='/around-sk8/',JSON.stringify({active:v.active}));
    }
  }

  await navigate('/guides/');
  const guide=await evaluate(`(() => ({
    subscriberHelp:!!document.querySelector('.sitewide-guide-disclosure:not([open])'),
    futureClosed:!!document.querySelector('.sitewide-developing:not([open])'),
    available:document.querySelectorAll('.guide-grid > article.guide-card').length,
    status:document.querySelector('main')?.textContent.includes('Updated 17 October 2026'),
    countRemoved:!document.querySelector('main')?.textContent.includes('40 activities ·')
  }))()`);
  check('Guides prioritises four usable resources before optional future items',
    guide.subscriberHelp && guide.futureClosed && guide.available===4 &&
    guide.status && guide.countRemoved,JSON.stringify(guide));
  await evaluate("document.querySelector('.sitewide-developing summary').click(); true");
  check('Planned guides can still be found without false live promises',
    await evaluate("document.querySelector('.sitewide-developing').open && document.querySelectorAll('.sitewide-developing .guide-card').length===2"));

  await navigate('/search/?q=Gatley');
  await waitFor("document.querySelector('[data-search-status]') && !document.querySelector('[data-search-status]').textContent.includes('Loading')",
    'real search records');
  await evaluate("document.querySelector('[data-search-type=Stories]').click();document.querySelector('[data-search-area=Gatley]').click();true");
  check('Search shows clear-filters recovery after narrowing results',
    await evaluate("!document.querySelector('[data-search-clear-filters]').hidden"));
  await evaluate("document.querySelector('[data-search-clear-filters]').click();true");
  check('Search reset clears both type and area without deleting query',
    await evaluate("document.querySelector('[data-search-clear-filters]').hidden && document.querySelector('[data-search-area=all]').getAttribute('aria-pressed')==='true' && document.querySelector('[data-search-type=all]').getAttribute('aria-pressed')==='true' && new URLSearchParams(location.search).get('q')==='Gatley'"));

  // Use a currently checked event from the actual data rather than a hardcoded
  // stale calendar event; no fake search input or external booking submitted.
  const pick=await evaluate(`(async()=>{
    const list=await fetch('/data/events.json',{cache:'no-store'}).then(r=>r.json());
    const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
    const viable=list.filter(e=>e.status==='verified' && e.id && String(e.date||'')>=today);
    const item=viable[0]||list.find(e=>e.status==='verified' && e.id);
    return item?{id:item.id,title:item.title}:null;
  })()`);
  check('Verified source contains a real event for search QA',Boolean(pick));
  await navigate('/search/?q='+encodeURIComponent(pick.title));
  const exactLink=JSON.stringify('/whats-on/?event='+encodeURIComponent(pick.id));
  await waitFor("Boolean([...document.querySelectorAll('.search-result-card a')].find(a => a.getAttribute('href')==="+exactLink+"))",
    'current verified event deep-link');
  check('Search event routes to exact SK8 details before external booking',
    await evaluate("Boolean([...document.querySelectorAll('.search-result-card a')].find(a=>a.getAttribute('href')==="+exactLink+"))"));
  await screenshot('mobile-search-verified.png');

  await navigate('/whats-on/?filter=weekend&area=Gatley');
  await waitFor("document.querySelector('[data-whats-on-clear-filters]') && !document.querySelector('[data-whats-on-clear-filters]').hidden",
    'active calendar filters');
  await evaluate("document.querySelector('[data-whats-on-clear-filters]').click();true");
  check('What\'s On reset clears event type and area',
    await evaluate("document.querySelector('[data-event-filter=all]')?.getAttribute('aria-pressed')==='true' && document.querySelector('[data-event-area=all]')?.getAttribute('aria-pressed')==='true' && document.querySelector('[data-whats-on-clear-filters]').hidden"));
  await screenshot('mobile-whatson-reset.png');

  await viewport(1200,800,false);
  await navigate('/guides/');
  const desktop=await evaluate(`(() => ({
    doc:document.documentElement.scrollWidth,client:document.documentElement.clientWidth,
    nav:document.querySelector('#main-nav')?.getBoundingClientRect().width||0,
    header:document.querySelector('.header-row')?.getBoundingClientRect().width||0,
    explore:!!document.querySelector('#main-nav a[href="/around-sk8/"]')
  }))()`);
  check('1200px desktop nav does not create sideways scrolling',
    desktop.doc<=desktop.client+2 && desktop.explore,
    JSON.stringify(desktop));
  await screenshot('desktop-guides-1200.png');
  await viewport(1366,900,false);
  await navigate('/search/?q=free');
  await screenshot('desktop-search-1366.png');

  await writeFile('visual-qa/sitewide/results.json',JSON.stringify({
    base:BASE,mode:'read-only-preview',checks:results
  },null,2));
  console.log('Site-wide mobile/desktop preview verification passed: '+results.length+' assertions.');
} finally {
  try { ws?.close(); } catch {}
  try { chrome.kill('SIGTERM'); } catch {}
}
