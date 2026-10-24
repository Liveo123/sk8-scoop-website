import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import calendar from '../assets/sk8-calendar-core.js';

const read = name => fs.readFileSync(name, 'utf8');
const html = read('index.html');
const css = read('assets/reader-first.css');
const js = read('assets/reader-first-home.js');
const events = JSON.parse(read('data/events.json'));
const homepageData = JSON.parse(read('data/homepage.json'));
const homepageJs = read('assets/homepage-nue.js');
const releaseReview = read('docs/reader-first-ux-review-2026-10-23.md');
const assertIncludes = (text, value, label) =>
  assert.ok(text.includes(value), label + ': missing ' + value);

const finder = html.indexOf('<section class="section reader-first-discovery"');
const subscriber = html.indexOf('<section class="reader-hero reader-hero-photo"');
const editorial = html.indexOf('<section class="section reader-worth"');
assert.ok(finder > 0 && subscriber > finder && editorial > subscriber,
  'Homepage must open with useful activity finder, followed by newsletter then editorial');
assert.equal((html.match(/<h1\b/g) || []).length, 1, 'Exactly one page H1');
assertIncludes(html, '<h1 id="reader-first-heading">Find something to do around SK8</h1>',
  'Reader need names the first heading');
assertIncludes(html, 'body class="reader-home reader-first-mode"', 'Scoped reader-first design');
assert.ok(!html.includes('home-quick-answers'), 'Remove duplicate secondary quick-answer system');
assert.ok(!html.includes('home-explore-search-shell'), 'Remove duplicate lower site search');
assertIncludes(html, 'assets/reader-first.css', 'Reader-first stylesheet');
assertIncludes(html, 'assets/reader-first-home.js', 'Checked event finder script');
assert.ok(html.indexOf('assets/sk8-calendar-core.js') < html.indexOf('assets/reader-first-home.js'),
  'Load shared date and status rules before homepage finder');
assertIncludes(html, 'id="reader-first-search-input"', 'Labelled finder search');
assertIncludes(html, 'action="/search/"', 'Reuse existing publication-wide search');
for (const slug of ['today','weekend','free','family']) {
  assertIncludes(html, '/whats-on/?filter='+slug, "Supported What\'s On filter "+slug);
}
for (const area of ['Cheadle','Cheadle%20Hulme','Gatley','Heald%20Green']) {
  assertIncludes(html, '/whats-on/?area='+area, 'Core-local area route '+area);
}
for (const route of ['/whats-on/','/search/','/outdoors/','/my-sk8/',
  '/kids-family/holiday-club-finder/','/free-cheap-guide/guide/']) {
  assert.ok(fs.existsSync(path.join('.',route,'index.html')),
    'Linked route must be in source tree: '+route);
}
assertIncludes(js, 'core.localToday()', 'Use shared UK local date');
assertIncludes(js, "core.mode(event)", 'Use verified date occurrence semantics');
assertIncludes(js, "core.withinHorizon(item.session, today)", 'Apply date horizon');
assertIncludes(js, "event.status === 'verified'", 'Never show unverified listings');
assertIncludes(js, "'/whats-on/?event='", 'Direct specific-event detail link');
assertIncludes(js, "guide.href = '/free-cheap-guide/guide/'",
  'Unambiguous working evergreen guide fallback');
assertIncludes(js, "link.dataset.trackEvent = 'homepage_finder_event_detail_click'",
  'Measured first useful event action');
assertIncludes(js, "window.sk8Track('homepage_finder_search_submit'",
  'Measured search action without search term');
assert.ok(!js.includes('search_term:'), 'Never send raw search text to analytics');
assert.ok(Array.isArray(events) && events.length > 0, 'Expected a structured events feed');
assert.ok(events.every(x=>typeof x.id === 'string' && x.id),
  'Every source event must have a stable detail-link ID');
assert.ok(calendar.validDate(calendar.localToday()), 'Valid shared UK-date calculation');
const today=calendar.localToday();
const later=calendar.dayAfter(today), third=calendar.dayAfter(later);
const unconfirmedRange={date:today,end_date:third,date_mode:'range_unspecified'};
assert.equal(calendar.withinRange(unconfirmedRange,later,third),false,
  'Unspecified range cannot be treated as confirmed sessions on intermediate dates');
assert.equal(calendar.onDate(unconfirmedRange,later),false,
  'Unspecified date ranges are not automatically daily events');
const series={date:today,end_date:third,date_mode:'specific_dates',occurrences:[today,third]};
assert.equal(calendar.onDate(series,later),false,
  'Only declared occurrences are valid for non-daily series');
assert.equal(calendar.onDate(series,third),true, 'Declared occurrences remain discoverable');
assertIncludes(css, '@media(max-width:720px)', 'Single-column phone card layout');
assertIncludes(css, ':focus-visible', 'Keyboard focus styling');
assertIncludes(css, 'prefers-reduced-motion', 'Reduced-motion support');
assertIncludes(css, 'reader-first-mode', 'Homepage hero inversion is styled');
// Whole-page editorial/NUE consistency beyond the top-of-page finder.
assertIncludes(html, '<h2>Good local ideas, every Friday</h2>', 'Newsletter purpose differs from the event H1');
assertIncludes(html, 'home-newsletter-usefulness', 'Concrete newsletter benefit summary');
assertIncludes(html, 'Get it free</button>', 'Benefit-led email signup');
// Public numbers are interpolated by assets/homepage-nue.js, not typed into page HTML.
assertIncludes(homepageJs, 'stats.subscriberProof || stats.subscriberCount', 'Subscriber proof source of truth');
assertIncludes(html, 'data-experiment="homepage-utility-promise-v1"', 'Newsletter acquisition experiment retained');
assertIncludes(css, 'filter:saturate(1.20) contrast(1.10) brightness(1.025)', 'Non-destructive image enhancement');
assertIncludes(css, 'reader-hero-shade', 'Text legibility overlay retained');
assert.ok((html.match(/<section\b/g)||[]).length >= 6, 'Homepage must retain distinct useful sections');
assert.equal((html.match(/reader-explore-tile/g)||[]).length,6, 'Six non-duplicated static discover routes');
const priority=['Kids & Family','Outdoors','Food & Drink','Useful Updates','Local History','Planning & Development'];
assert.deepEqual(homepageData.explore.map(x=>x.title), priority,
  'Six useful non-duplicated categories match reader intent and live fallback');
assert.ok(homepageData.explore.every(x=>x.status==='OPEN' && x.href && !x.href.includes('coming-soon')),
  'Category navigation must use live available pages');
const featured=homepageData.stories.find(x=>x.mode==='DO' && x.title.includes('Woodford Bonfire'));
assert.ok(featured, 'Current checked, time-bound event must be in authoritative homepage data');
assert.equal(featured?.href,'/whats-on/?event=woodford-community-bonfire-2026-11-05',
  'Featured event must link to the checked event listing, not the newsletter archive');
assertIncludes(html,featured.href,'Fallback story URL matches live dynamic source');
assertIncludes(html,'data-nue-type="verified-event-detail"','Featured event is a useful, checkable continuation');
assertIncludes(homepageJs,"'/free-cheap-guide/': '/free-cheap-guide/guide/'",
  'Returning subscribers get the full free/cheap guide');
assertIncludes(homepageJs,"'/52-adventures/': '/52-adventures/guide/'",
  'Returning subscribers get the full adventure guide');
assert.ok(!homepageJs.includes('<svg') && !homepageJs.includes('storyGraphicSvg'),
  'Legacy generic inline SVG illustrations are not a permitted SK8 visual fallback');
const issueNumber=Number((read('assets/config.js').match(/currentIssue:\\s*\\{\\s*number:\\s*(\\d+)/)||[])[1]);
assert.ok(issueNumber > 0, 'Current issue is configured');
assertIncludes(html,`<h3>Issue ${issueNumber}</h3>`,'Card title is subordinate to resources section heading');
assertIncludes(html,'Share a local tip','Visitor contribution route remains useful and explicit');
assertIncludes(html,'Questions or corrections?','Correction route remains easy to find');
for(const route of ['/kids-family/','/food-drink/','/local-history/','/planning/','/updates/']){
  assert.ok(fs.existsSync(path.join('.',route,'index.html')), 'An editorial card must point to a present route: '+route);
}
assertIncludes(css,'@media(max-width:430px)','Phone-wide compact editorial-category layout');
assertIncludes(css,'max-width:480px','Compact and balanced mobile consent choices');

// The supporting review must stay internally consistent with the published draft.
for(let n=1;n<=20;n++){
  const id=String(n).padStart(2,'0');
  assertIncludes(releaseReview, '| '+id+' |', 'Documented homepage criticism pass '+id);
}
for(const phrase of [
  'Ten improvements implemented in this whole-homepage pass',
  'JiveLoop Collective',
  'NUE',
  '774 active subscribers',
  '750+',
  'not a production release',
  'human release gate',
  'two checked mobile picks'
]){
  if(phrase==='human release gate'){
    assert.ok(/human release gate/i.test(releaseReview), 'Owner release boundary must remain documented');
  } else if(phrase==='two checked mobile picks'){
    assertIncludes(releaseReview,'two checked mobile picks','Documented mobile results density');
  } else {
    assertIncludes(releaseReview,phrase,'Whole-homepage strategy/release QA');
  }
}
const fallbackOrder=[...html.matchAll(/class="reader-explore-tile"[^>]*>.*?<strong>([^<]+)<\/strong>/g)].map(m=>m[1]);
assert.deepEqual(fallbackOrder,[
  'Kids &amp; Family','Outdoors','Food &amp; Drink','Useful Updates','Local History','Planning &amp; Development'
], 'Static no-JavaScript category order matches the authoritative live data');

console.log('PASS whole-homepage regression: 6 complementary categories, verified stories, direct NUE, known-reader guides, clear newsletter CTA, approved media and practical corrections.');

console.log('PASS reader-first structural/NUE checks: first-screen order, unique H1, routes, source facts, safe links, 4 filters, 4 areas, UK dates and responsive CSS.');
