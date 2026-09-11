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
for (const route of ['/whats-on/','/food-drink/','/kids-family/','/outdoors/','/local-history/','/planning/','/updates/','/around-sk8/']) {
  contains('sitemap.xml',`https://www.sk8scoop.com${route}`);
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

// Current advertiser offer and backend contract.
contains('advertise.html','TEST · £40');
contains('advertise.html','GROW · £90');
contains('advertise.html','value="temp_test"');
contains('advertise.html','value="temp_grow"');
contains('advertise.html','data-experiment="advertiser-goal-first-v1"');
excludes('advertise.html','from £35');
excludes('advertise.html','Placements start from £35');
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

console.log('Post-launch NUE v2 preflight passed.');
