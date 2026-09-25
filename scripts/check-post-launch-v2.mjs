import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = p => fs.readFileSync(path.join(root,p),'utf8');
const fail = message => { throw new Error(message); };
const expect = (condition, message) => { if (!condition) fail(message); };
const contains = (file, text) => expect(read(file).includes(text), `${file} missing: ${text}`);
const excludes = (file, text) => expect(!read(file).includes(text), `${file} must not contain: ${text}`);

// Production NUE architecture.
expect(fs.existsSync(path.join(root,'assets/nue.css')), 'assets/nue.css is missing');
expect(!fs.existsSync(path.join(root,'assets/nue-preview.css')), 'legacy assets/nue-preview.css still exists');
const walk = dir => fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry => {
  const rel = path.relative(root,path.join(dir,entry.name));
  if (rel.startsWith('.git')) return [];
  return entry.isDirectory() ? walk(path.join(dir,entry.name)) : [rel];
});
for (const file of walk(root).filter(file => /\.(html|js|css)$/.test(file))) {
  excludes(file,'nue-preview.css');
}
contains('assets/config.js','nue-analytics.js');
contains('assets/config.js','nue-links.js');
contains('assets/config.js',"sk8SecondaryDesign = 'production'");

// Indexable launched reader destinations.
const indexablePages = [
  'whats-on/index.html','food-drink/index.html','kids-family/index.html','outdoors/index.html',
  'local-history/index.html','planning/index.html','updates/index.html','around-sk8/index.html'
];
for (const file of indexablePages) excludes(file,'noindex');
excludes('robots.txt','Disallow: /whats-on/');
contains('robots.txt','Sitemap: https://www.sk8scoop.com/sitemap.xml');
for (const route of ['/whats-on/','/food-drink/','/kids-family/','/outdoors/','/local-history/','/planning/','/updates/','/around-sk8/']) {
  contains('sitemap.xml',`https://www.sk8scoop.com${route}`);
  contains('sitemap.html',`href="${route.replace(/^\//,'')}"`);
}

// What’s On usefulness and search structure.
contains('whats-on/index.html','data-event-area="Cheadle"');
contains('whats-on/index.html','data-event-area="Cheadle Hulme"');
contains('whats-on/index.html','data-event-area="Gatley"');
contains('whats-on/index.html','data-event-area="Heald Green"');
contains('whats-on/index.html','data-event-filter="today"');
contains('whats-on/index.html','data-event-filter="week"');
contains('whats-on/index.html','"@type":"CollectionPage"');
contains('assets/whats-on.js','sk8-event-list-schema');
contains('assets/whats-on.js','activeArea');
contains('assets/whats-on.js','event_detail_click');

// Homepage proposition experiment.
contains('index.html','data-experiment="homepage-utility-promise-v1"');
contains('index.html','Things to do, useful local updates and money-saving ideas');

// Current visual-refresh contracts.
contains('index.html','home-resource-adventures');
contains('index.html','52 Adventures Guide logo');
expect(fs.existsSync(path.join(root,'assets/images/52-adventures-guide-logo.webp')), '52 Adventures logo asset is missing');
for (const file of ['index.html','guides/index.html','52-adventures/index.html']) {
  contains(file,'/assets/images/52-adventures-guide-logo.webp');
  excludes(file,'data:image/webp;base64');
}
contains('latest/index.html','/assets/latest-polish.css');
contains('latest/index.html','latest-issue-mosaic');
contains('latest/index.html','latest-feature-card');
contains('latest/index.html','/planning/heald-green-local-plan-2026/');
contains('latest/index.html','/local-history/heald-green-north-history-walk/');
contains('latest/index.html','/local-history/cheadle-war-memorial-air-raid-victims/');
excludes('assets/latest-polish.css','NEXT FRIDAY');
const latestHtml = read('latest/index.html');
expect((latestHtml.match(/<section\b/g) || []).length === (latestHtml.match(/<\/section>/g) || []).length, 'latest/index.html has unbalanced section tags');
contains('advertise.html','ad-product-grid ad-route-grid');
contains('assets/advertise-v5.css','#advertiser-tools .ad-route-grid');

// Current advertiser offer and backend contract.
// Temporary operating mode: TEST £40 and GROW £90 are the only standard public products.
contains('advertise.html','TEST · £40');
contains('advertise.html','GROW · £90');
contains('advertise.html','value="temp_test"');
contains('advertise.html','value="temp_grow"');
excludes('advertise.html','WEBSITE · price by scope');
excludes('advertise.html','value="temp_website"');
contains('advertise.html','data-experiment="advertiser-goal-first-v1"');
excludes('advertise.html','Placements start from £35');
contains('advertise.html','Halloween & Half-Term Guide 2026 from £35');
contains('advertise.html','GUIDE ADVERT');
contains('advertise.html','<div class="halloween-price">£35</div>');
contains('worker.js',"'temp_test'");
contains('worker.js',"'temp_grow'");
contains('functions/api/advertiser-enquiry.js',"'temp_test'");
contains('functions/api/advertiser-enquiry.js',"'temp_grow'");

// Public input form contracts, checked without creating production records.
contains('submit/index.html','action="/api/reader-submission"');
contains('submit/index.html','name="privacy_confirmed"');
contains('worker.js',"url.pathname === '/api/reader-submission'");
contains('contact/index.html','data-form-kind="contact-message"');
contains('contact/index.html','assets/formspark-contact.js');
contains('assets/config.js','https://submit-form.com/X3MWnWHXI');
contains('submit-event/index.html','action="/api/submit-event"');
contains('worker.js',"url.pathname === '/api/submit-event'");
contains('advertise.html','action="/api/advertiser-enquiry"');
contains('worker.js',"url.pathname === '/api/advertiser-enquiry'");

// Connected experience measurement.
for (const eventName of ['join_page_visit','where_to_start_page_visit','reader_submission_page_visit','contact_page_visit','food_drink_page_visit','kids_family_page_visit','outdoors_page_visit','local_history_page_visit','planning_page_visit','useful_updates_page_visit','around_sk8_page_visit','nue_continuation']) {
  contains('assets/nue-analytics.js',eventName);
}

// Rights-cleared local photography added with visible attribution.
contains('assets/nue-links.js','john-millington-cc-david-dixon.jpg');
contains('assets/nue-links.js','Photo: David Dixon / Geograph, CC BY-SA 2.0');
contains('assets/nue-links.js','abney-hall-cc-benjamin-shaw.jpg');
contains('assets/nue-links.js','Photo: Benjamin Shaw, CC BY-SA 4.0');

// Search & Discovery contract: every curated internal search result must resolve to a repository route.
expect(fs.existsSync(path.join(root,'search/index.html')), 'search/index.html is missing');
expect(fs.existsSync(path.join(root,'assets/search.js')), 'assets/search.js is missing');
const discovery = JSON.parse(read('data/discovery.json'));
expect(Array.isArray(discovery.records), 'data/discovery.json records must be an array');
for (const record of discovery.records) {
  if (!String(record.href || '').startsWith('/')) continue;
  const route = String(record.href).split(/[?#]/)[0];
  let rel;
  if (route === '/') rel = 'index.html';
  else if (route.endsWith('/')) rel = `${route.replace(/^\//,'')}index.html`;
  else rel = route.replace(/^\//,'');
  expect(fs.existsSync(path.join(root,rel)), `Discovery record ${record.id || record.title} points to missing route: ${record.href}`);
}

// Newsletter archive extraction: selected articles only, never wholesale archive indexing.
const selectedArchiveRecords = [
  ['gatley-shouter','/local-history/gatley-shouter/'],
  ['cheadle-station-cheshire-line-tavern','/local-history/cheadle-station-cheshire-line-tavern/'],
  ['heald-green-mercury-frog','/local-history/heald-green-mercury-frog/'],
  ['heald-green-east','/planning/heald-green-east/'],
  ['secondary-school-applications-2027','/kids-family/secondary-school-applications-2027/'],
  ['cheadle-eco-park','/planning/cheadle-eco-park/']
];
for (const [id,href] of selectedArchiveRecords) {
  const record = discovery.records.find(item => item.id === id);
  expect(record, `Missing newsletter archive discovery record: ${id}`);
  expect(record.href === href, `${id} has unexpected discovery href: ${record.href}`);
}
const schoolRecord = discovery.records.find(item => item.id === 'secondary-school-applications-2027');
expect(schoolRecord.expires === '2026-10-31', 'School application guide must expire from current search after 31 October 2026');
for (const area of ['Cheadle','Cheadle Hulme','Gatley','Heald Green']) {
  expect((schoolRecord.areas || []).includes(area), `School application guide missing area search coverage: ${area}`);
}
contains('local-history/index.html','/local-history/gatley-shouter/');
contains('local-history/index.html','/local-history/cheadle-station-cheshire-line-tavern/');
contains('local-history/index.html','/local-history/heald-green-mercury-frog/');
contains('planning/index.html','/planning/heald-green-east/');
contains('planning/index.html','/planning/cheadle-eco-park/');
contains('kids-family/index.html','/kids-family/secondary-school-applications-2027/');
for (const file of [
  'local-history/gatley-shouter/index.html',
  'local-history/cheadle-station-cheshire-line-tavern/index.html',
  'local-history/heald-green-mercury-frog/index.html',
  'planning/heald-green-east/index.html',
  'planning/cheadle-eco-park/index.html',
  'kids-family/secondary-school-applications-2027/index.html'
]) {
  excludes(file,'storage.mlcdn.com');
}

// Global header search: one reusable utility, no second search engine.
expect(fs.existsSync(path.join(root,'assets/global-search.js')), 'assets/global-search.js is missing');
expect(fs.existsSync(path.join(root,'assets/global-search.css')), 'assets/global-search.css is missing');
contains('assets/config.js','/assets/global-search.css');
contains('assets/config.js','/assets/global-search.js');
contains('assets/global-search.js',"form.action = '/search/'");
contains('assets/global-search.js','header_search_open');
contains('assets/global-search.js','header_search_submit');
contains('assets/global-search.js','query_length: queryLength');
contains('assets/global-search.js',"event.key !== '/'");
contains('assets/global-search.js',"window.matchMedia('(min-width: 821px)')");
contains('assets/global-search.css','@media(min-width:1200px)');
contains('assets/global-search.css','@media(min-width:821px) and (max-width:1199px)');
contains('assets/global-search.css','@media(max-width:820px)');
contains('assets/global-search.css','width:min(1320px,calc(100% - 24px))');
contains('assets/global-search.css','.global-search-form:focus-within');
excludes('assets/global-search.js','query_text');
contains('assets/search.js','hasEnoughQueryCoverage');
contains('assets/search.js','minimumMatches = terms.length === 1 ? 1 : Math.ceil(terms.length * 0.6)');

console.log('Post-launch NUE v2 preflight passed.');
