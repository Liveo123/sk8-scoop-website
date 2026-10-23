import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = file => fs.readFileSync(file,'utf8');
const files = {
  config:read('assets/config.js'),
  site:read('assets/site.js'),
  search:read('assets/search.js'),
  searchPage:read('search/index.html'),
  events:read('assets/whats-on.js'),
  whatsonPage:read('whats-on/index.html'),
  guide:read('guides/index.html'),
  icon:read('assets/global-search.js'),
  iconCss:read('assets/global-search.css'),
  css:read('assets/sitewide-ux.css'),
  sitemap:read('sitemap.xml'),
  review:read('docs/sitewide-ux-audit-2026-10-23.md')
};
const contains = (content,needle,context) =>
  assert.ok(content.includes(needle),context+': missing '+needle);

contains(files.site,'sitewide-ux.css','Shared accessible style');
contains(files.site,"['Explore SK8','/around-sk8/']",'Navigation directly exposes local content');
for(const route of ['Cheadle','Cheadle Hulme','Gatley','Heald Green']){
  assert.ok(files.site.includes('around-sk8')&&files.site.includes('currentPath'),'Area and topic active navigation must be grouped');
}
assert.ok(!files.config.includes('nav.innerHTML'),'No competing config.js navigation builder');
assert.ok(files.site.includes('nav.replaceChildren()'),'One authoritative shared navigation');
for(const path of ['/','/whats-on/','/guides/','/around-sk8/','/start/','/my-sk8/']){
  assert.ok(files.site.includes(path),'Established route must remain accessible: '+path);
}
assert.ok(!files.icon.includes('<svg'),'Shared search icon must not inject reader-facing SVG markup');
contains(files.icon,'sk8-search-glass','Semantic CSS search lens');
contains(files.iconCss,'.sk8-search-glass::before','Lens visual in stylesheet');
contains(files.iconCss,'.sk8-search-glass::after','Lens handle in stylesheet');
assert.ok(!files.iconCss.includes('.global-search-submit svg'),'No legacy SVG-only icon styling');
contains(files.css,'sitewide-clear-filters','Accessible filter resets');
contains(files.css,'min-height:44px','Usable pointer targets');
contains(files.css,'focus-visible','Visible focus');
contains(files.css,'.sitewide-developing-grid','Future guide disclosure');

contains(files.searchPage,'sk8-calendar-core.js','Shared verified event date semantics');
assert.ok(files.searchPage.indexOf('sk8-calendar-core.js') < files.searchPage.indexOf('src="../assets/search.js"'),
  'Shared date core loads before site search');
contains(files.searchPage,'data-search-clear-filters','Search reset action is visible when required');
contains(files.searchPage,'No checked results for this search','Honest no-results state');
contains(files.search,"event.status === 'verified'",'Only verified events enter search');
contains(files.search,"eventCore.confirmedDates(event)",'Recurring sessions are never invented');
contains(files.search,"mode === 'range_unspecified'",'Unconfirmed date ranges handled separately');
contains(files.search,"'/whats-on/?event=' + encodeURIComponent(id)",'Exact checked event detail first');
assert.ok(!files.search.includes('href: event.booking_url || event.source_url'),'No blind external jump in search result');
contains(files.search,'search_filters_cleared','Aggregate no-PII recovery measurement');
contains(files.search,'clearFilters.hidden','Clear control represents active state');

contains(files.whatsonPage,'data-whats-on-clear-filters','One-step reset for event filters');
contains(files.events,'whats_on_filters_cleared','Measured recovery from over-filtering');
contains(files.events,"activeArea = 'all'","Area reset");
contains(files.events,"selectedDate = ''","Date reset");

contains(files.guide,'sitewide-guide-disclosure','Concise optional explanation of subscriber access');
contains(files.guide,'<h1>Find a useful local guide.</h1>','Phone-first guide heading');
contains(files.guide,'class="guide-finder-cell" href="/kids-family/"',
  'Guide chooser should favour a working family route over future-only projects');
assert.ok(!files.guide.includes('class="guide-finder-cell is-development"'),
  'No dead-end shortcut to a collapsed unreleased guide');
contains(files.css,'body:not(.reader-first-mode) .privacy-choices-actions',
  'Compact balanced consent choices on the rest of the website');
contains(files.whatsonPage,'reader-link sitewide-hero-secondary',
  'Secondary events actions are links, not competing primary buttons');
contains(files.css,'sitewide-hero-secondary',
  'Mobile secondary actions remain readable with keyboard focus');

contains(files.guide,'sitewide-developing','Future-only resources must not dilute live shelf');
contains(files.guide,'Evergreen guide · Updated 17 October 2026','Match source guide updated date');
assert.ok(!files.guide.includes('Evergreen guide · Updated 30 September 2026'),
  'Stale guide update date must not return');
assert.ok(!files.guide.includes('Forty family activities around SK8'),
  'Guide count unverified across versions');
assert.ok(files.guide.indexOf('id="halloween"') < files.guide.indexOf('id="secrets"'),
  'Available seasonal guides appear before future concepts');
assert.ok(files.guide.indexOf('id="52-adventures"') < files.guide.indexOf('class="sitewide-developing"'),
  'Available flagship guides come first');
assert.ok(files.guide.includes('data-subscriber-guide="/52-adventures/guide/"'),
  'Existing recognised-reader guide routes retained');
assert.ok(files.guide.includes('data-subscriber-guide="/free-cheap-guide/guide/"'),
  'Existing recognised-reader free guide route retained');

for(const route of ['/','/guides/','/whats-on/']){
  contains(files.sitemap,'<loc>https://www.sk8scoop.com'+route+'</loc><lastmod>2026-10-23</lastmod>',
    'Sitemap dates follow actual changed routes');
}
assert.equal((files.sitemap.match(/<url>/g)||[]).length,66,
  'Do not silently drop indexable pages during sitewide UX work');
const holiday = read('kids-family/holiday-club-finder/index.html');
contains(holiday,'name="robots" content="noindex,follow"','Respect intentionally noindex seasonal tool');
assert.ok(!files.sitemap.includes('https://www.sk8scoop.com/kids-family/holiday-club-finder/'),
  'Do not index purposely excluded private/seasonal tool without separate editorial decision');

for(let n=1;n<=20;n++){
  const mark=String(n).padStart(2,'0');
  contains(files.review,'| '+mark+' |','Documented criticism pass '+mark);
}
contains(files.review,'Ten concrete site-wide change packages implemented','Implementation map');
contains(files.review,'NUE (Next Useful Experience)','Independent NUE release gate');
contains(files.review,'JiveLoop Collective / media group','Independent publisher asset gate');
contains(files.review,'production release not authorised','Do not accidentally publish next preview');
console.log('PASS sitewide UX source checks: navigation, verified events, direct NUE, filter resets, guides, SVG, accessibility, 66 sitemap routes and 20-pass review.');
