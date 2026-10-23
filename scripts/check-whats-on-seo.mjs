import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Search hygiene for an indexable local event *collection*. Google Event rich
// result markup belongs only on an independently sourced, eligible leaf page.
const read = name => readFileSync(name,'utf8');
const html = read('whats-on/index.html');
const head = html.split('</head>')[0];
const sitemap = read('sitemap.xml');
const robots = read('robots.txt');
const review = read('docs/whats-on-seo-review-2026-10-23.md');
const eventJs = read('assets/whats-on.js');
const extract = pattern => {
  const m = head.match(pattern);
  assert.ok(m, 'Missing expected What’s On page metadata: '+String(pattern));
  return m[1];
};

const title=extract(/<title>([^<]+)<\/title>/);
const description=extract(/<meta name="description" content="([^"]+)">/);
const canonical=extract(/<link rel="canonical" href="([^"]+)">/);
const ogUrl=extract(/<meta property="og:url" content="([^"]+)">/);
const ogImage=extract(/<meta property="og:image" content="([^"]+)">/);
const ogImageAlt=extract(/<meta property="og:image:alt" content="([^"]+)">/);
const ogSiteName=extract(/<meta property="og:site_name" content="([^"]+)">/);
const card=extract(/<meta name="twitter:card" content="([^"]+)">/);
const canonicalUrl='https://www.sk8scoop.com/whats-on/';
assert.equal(canonical,canonicalUrl);
assert.equal(ogUrl,canonicalUrl,'Share identity must match canonical URL');
assert.equal(ogSiteName,'SK8 Scoop','Do not rename reader-facing publication');
assert.equal(card,'summary_large_image');
assert.ok(ogImage.startsWith('https://www.sk8scoop.com/assets/images/'),
  'Share graphic must remain on official publication host');
assert.ok(/Illustration/i.test(ogImageAlt),
  'Conceptual promotional artwork must not be presented as event documentary photography');
assert.ok(/what.s on/i.test(title));
for(const place of ['Cheadle','Cheadle Hulme','Gatley','Heald Green']){
  assert.ok(title.includes(place), 'Page title is missing a core local place: '+place);
  assert.ok(description.includes(place), 'Meta description is missing core locality: '+place);
}
assert.ok(description.includes('free')&&description.includes('family')&&
  description.includes('weekend'), 'Description must accurately summarise useful filters');
assert.ok(!/<meta\s+name="robots"\s+content="[^"]*noindex/i.test(head),
  'Canonical What’s On calendar must not be accidentally noindexed');
assert.ok(!robots.includes('Disallow: /whats-on/'),"Canonical What’s On route blocked by robots");
assert.ok(sitemap.includes('<loc>'+canonicalUrl+'</loc>'),'Canonical calendar absent from sitemap');
const leafEvents=JSON.parse(read('data/events.json')).filter(e=>e.seo);
assert.equal(leafEvents.length,2,'Exactly two fact-checked leaf pilots until release review');
for(const e of leafEvents){
  const leaf='https://www.sk8scoop.com/whats-on/events/'+e.seo.slug+'/';
  assert.ok(sitemap.includes('<loc>'+leaf+'</loc>'),'Source-checked event leaf missing from sitemap: '+e.id);
  assert.ok(html.includes('href="/whats-on/events/'+e.seo.slug+'/"'),'Calendar must contain crawlable event link: '+e.id);
}

assert.equal((html.match(/<h1\b/g)||[]).length,1,'Exactly one H1 expected');
assert.ok(html.includes('<h1>What’s on around SK8?</h1>'),'Visible on-page H1 should remain accurate');
assert.ok(!html.includes('See current listings</a>'),'No SEO-motivated reversion to a big decorative hero');
assert.ok(!eventJs.includes('whats-on-hero-visual'),'No giant hero should return from page JavaScript');

const entries=[...head.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)]
  .map(m => JSON.parse(m[1]));
assert.ok(entries.some(x=>x['@type']==='CollectionPage'&&x.url===canonicalUrl),
  'Index page should retain legitimate CollectionPage JSON-LD');
assert.ok(entries.every(x=>x['@type']!=='Event'),
  'Do not incorrectly claim single-event rich results on a multi-event calendar');
assert.ok(eventJs.includes("params.get('event')") &&
  eventJs.includes("const DATA_URL = '/data/events.json'"),
  'Actual events still use checked source and reader-facing event detail continuations');
assert.ok(!eventJs.includes("sk8-event-list-schema") &&
  !eventJs.includes("'@type': 'Event'"),
  'Collection page must never inject pretend individual Event entries into an ItemList');
assert.ok(review.includes('unique URL') && review.includes('PROPOSED, NOT IMPLEMENTED'),
  'Event leaf pages must stay approval-gated until source and content criteria are met');
assert.ok(review.includes('GSC Wizard connector refuses reads'),
  'Do not claim unverified Google indexing or SEO traffic measurements');

console.log('PASS What’s On SEO: local metadata, indexability signals, CollectionPage schema, accessible social previews, and honest Event-rich-result eligibility boundary.');
