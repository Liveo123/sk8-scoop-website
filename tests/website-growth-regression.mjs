import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const join=read('join/index.html'), config=read('assets/config.js'), style=read('assets/styles.css'), searchCss=read('assets/global-search.css'), searchJs=read('assets/global-search.js'), script=read('assets/site.js'), header=read('scripts/check-header-layout.mjs'), sitemap=read('sitemap.xml');

test('no stale newsletter/reader fallbacks, SEO metadata, direct latest link',()=>{
  const current=Number(config.match(/currentIssue:\s*\{[\s\S]*?number:\s*(\d+)/)?.[1]);
  const people=config.match(/subscriberCount:\s*"([^"]+)"/)?.[1];
  assert.ok(current>=18 && people,'Current public issue and reader count required');
  assert.ok(join.includes('data-current-issue-number>'+current));
  assert.ok(join.includes('data-stat="subscriberCount">'+people));
  assert.ok(join.includes('data-current-issue-url href="/latest/"'));
  assert.ok(!join.includes('preview.mailerlite.io'));
  assert.ok(!join.includes('Issue 12'));
  for(const prop of ['og:type','og:title','og:description','og:url','og:image'])assert.ok(join.includes('property="'+prop+'"'),prop);
  assert.ok(join.includes('name="twitter:card"'));
});
test('navigation breakpoints match CSS, JS and browser QA',()=>{
  assert.ok(style.includes('@media(max-width:1359px)'));
  assert.ok(searchCss.includes('@media(min-width:1360px)'));
  assert.ok(searchCss.includes('@media(max-width:1359px)'));
  assert.ok(searchCss.includes('(max-width:1359px)'));
  assert.ok(searchJs.includes('max-width: 1359px'));
  assert.ok(config.includes('20261026-headerwidth1'));
  assert.ok(script.includes('20261026-headerwidth1'));
  assert.ok(header.includes('1199, 1200, 1279, 1280, 1359, 1360, 1366, 1440'));
});
test('white text on dark-orange Join CTA meets WCAG AA normal text',()=>{
  const block=style.match(/\.nav \.reader-nav-join\{([^}]*)\}/)?.[1]||'';
  assert.match(block,/background:#b84e00!important/);
  assert.match(block,/color:#fff!important/);
  const luminance=hex=>{const [r,g,b]=hex.match(/\w\w/g).map(v=>parseInt(v,16)/255).map(v=>v<=0.04045?v/12.92:Math.pow((v+0.055)/1.055,2.4));return 0.2126*r+0.7152*g+0.0722*b};
  assert.ok(1.05/(luminance('b84e00')+.05)>=4.5);
});
test('sitemap preserves approved pages without adding private/noindex routes',()=>{
  const loc=[...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(x=>x[1]);
  assert.equal(new Set(loc).size,loc.length);
  for(const path of ['/whats-on/events/cheadle-library-christmas-craft-night-2026/','/whats-on/events/lum-head-gatley-nursery-reception-open-day-2026/','/join/'])assert.ok(loc.includes('https://www.sk8scoop.com'+path));
  for(const path of ['/search/','/my-sk8/','/kids-family/holiday-club-finder/'])assert.ok(!loc.includes('https://www.sk8scoop.com'+path));
  assert.match(sitemap,/<loc>https:\/\/www\.sk8scoop\.com\/join\/<\/loc><lastmod>2026-10-26<\/lastmod>/);
});
