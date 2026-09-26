import fs from 'node:fs';

const read = path => fs.readFileSync(path, 'utf8');
const manifest = JSON.parse(read('data/guide-public-samples.json'));
const discovery = JSON.parse(read('data/discovery.json'));
const sitemapXml = read('sitemap.xml');
const sitemapHtml = read('sitemap.html');
const adventuresLanding = read('52-adventures/index.html');
const freeCheapLanding = read('free-cheap-guide/index.html');
const signupJs = read('assets/signup-protection.js');
const protectedWorker = read('worker-protected.js');

const failures = [];
const assert = (condition, message) => {
  if (!condition) failures.push(message);
};

const discoveryHrefs = new Set((discovery.records || []).map(record => record.href));
const normaliseRoute = route => route.replace(/^\/+|\/+$/g, '');
const fileForRoute = route => `${normaliseRoute(route)}/index.html`;
const xmlUrl = route => `https://www.sk8scoop.com${route}`;

const expectedGuides = ['52-adventures', 'free-cheap'];
for (const key of expectedGuides) {
  const guide = manifest.guides && manifest.guides[key];
  assert(Boolean(guide), `Missing public-sample manifest entry for ${key}.`);
  if (!guide) continue;
  assert(guide.target_public_samples === 10, `${key} target_public_samples must remain 10.`);
  assert(Array.isArray(guide.samples) && guide.samples.length === 10, `${key} must list exactly 10 public samples.`);
  const unique = new Set(guide.samples || []);
  assert(unique.size === (guide.samples || []).length, `${key} public samples must not contain duplicates.`);

  for (const route of guide.samples || []) {
    const file = fileForRoute(route);
    assert(fs.existsSync(file), `${key} public sample is missing its page: ${route}`);
    if (fs.existsSync(file)) {
      const html = read(file);
      assert(!/<meta[^>]+name=["']robots["'][^>]+noindex/i.test(html), `${key} public sample must remain indexable: ${route}`);
      const expectedSignup = key === '52-adventures' ? '/52-adventures/#get-guide' : '/free-cheap-guide/#get-guide';
      assert(
        html.includes(expectedSignup),
        `${key} public sample must contain its own guide signup CTA: ${route}`
      );
      const guideForms = [...html.matchAll(/<form[^>]*data-signup-kind=["']guide["'][^>]*>/gi)].map(match => match[0]);
      for (const form of guideForms) {
        assert(/data-guide-key=["'](?:52-adventures|free-cheap)["']/i.test(form), `Inline guide signup is missing data-guide-key: ${route}`);
        assert(/data-success-url=["']\/(?:52-adventures|free-cheap-guide)\/success\/["']/i.test(form), `Inline guide signup is missing an explicit guide success URL: ${route}`);
      }
      const section = normaliseRoute(route).split('/')[0];
      const sectionIndex = `${section}/index.html`;
      assert(fs.existsSync(sectionIndex), `Missing section index for public sample: ${route}`);
      if (fs.existsSync(sectionIndex)) {
        assert(read(sectionIndex).includes(route), `${key} public sample must be linked from its section page: ${route}`);
      }
    }
    assert(discoveryHrefs.has(route), `${key} public sample is missing from site search discovery: ${route}`);
    assert(sitemapXml.includes(xmlUrl(route)), `${key} public sample is missing from sitemap.xml: ${route}`);
  }
}

const subscriberOnlyTeasers = [
  '/local-history/staircase-house/',
  '/food-drink/foodie-friday-stockport/',
  '/outdoors/reddish-vale-country-park/',
  '/outdoors/middlewood-way/',
  '/outdoors/new-mills-torrs-millennium-walkway/',
  '/local-history/quarry-bank-styal/',
  '/outdoors/alderley-edge/',
  '/local-history/lyme-house-park-cage/',
  '/local-history/little-moreton-hall/',
  '/kids-family/jodrell-bank/'
];

for (const route of subscriberOnlyTeasers) {
  const file = fileForRoute(route);
  assert(fs.existsSync(file), `Subscriber-only teaser page is missing: ${route}`);
  if (fs.existsSync(file)) {
    const html = read(file);
    assert(/<meta[^>]+name=["']robots["'][^>]+noindex/i.test(html), `Subscriber-only teaser must be noindex: ${route}`);
    assert(html.includes('#get-guide'), `Subscriber-only teaser must point readers to guide signup: ${route}`);
  }
  assert(!discoveryHrefs.has(route), `Subscriber-only teaser must not appear in site search discovery: ${route}`);
  assert(!sitemapXml.includes(xmlUrl(route)), `Subscriber-only teaser must not appear in sitemap.xml: ${route}`);
  assert(!sitemapHtml.includes(`href="${normaliseRoute(route)}/"`), `Subscriber-only teaser must not appear in sitemap.html: ${route}`);
}

for (const forbidden of ['/52-adventures/guide/', '/free-cheap-guide/guide/']) {
  assert(!sitemapXml.includes(forbidden), `Full subscriber guide must not appear in sitemap.xml: ${forbidden}`);
  assert(!sitemapHtml.includes(forbidden), `Full subscriber guide must not appear in sitemap.html: ${forbidden}`);
  assert(!JSON.stringify(discovery).includes(forbidden), `Full subscriber guide must not appear in site search discovery: ${forbidden}`);
}

assert(adventuresLanding.includes('data-guide-key="52-adventures"'), '52 Adventures signup forms must identify the guide key.');
assert(adventuresLanding.includes('data-success-url="/52-adventures/success/"'), '52 Adventures signup must keep its own success route.');
assert(!adventuresLanding.includes('href="/52-adventures/guide/"'), '52 Adventures public landing page must not bypass signup.');

assert(freeCheapLanding.includes('data-guide-key="free-cheap"'), 'Free & Cheap signup forms must identify the guide key.');
assert(freeCheapLanding.includes('data-success-url="/free-cheap-guide/success/"'), 'Free & Cheap signup must keep its own success route.');
assert(!freeCheapLanding.includes('href="/free-cheap-guide/guide/"'), 'Free & Cheap public landing page must not bypass signup.');

assert(signupJs.includes('dataset.successUrl'), 'Signup protection must honour each form\'s configured success URL.');
assert(signupJs.includes('sk8_guide_key'), 'Signup protection must submit the guide key.');

assert(protectedWorker.includes('guide_access_tokens'), 'Protected worker must retain guide access-token storage.');
assert(protectedWorker.includes("'guide:52-adventures'"), 'Protected worker must route 52 Adventures signups to their MailerLite group.');
assert(protectedWorker.includes("'guide:free-cheap'"), 'Protected worker must route Free & Cheap signups to their MailerLite group.');
assert(protectedWorker.includes("cookie: 'sk8_guide_52'"), 'Protected worker must gate 52 Adventures with its access cookie.');
assert(protectedWorker.includes("cookie: 'sk8_guide_fc'"), 'Protected worker must gate Free & Cheap with its access cookie.');
assert(protectedWorker.includes("'x-robots-tag': 'noindex, follow'") || protectedWorker.includes("headers.set('x-robots-tag', 'noindex, follow')"), 'Protected guide responses must remain noindex.');

if (failures.length) {
  console.error('Guide public-sample/subscriber-gate check failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Guide public-sample/subscriber-gate check passed: 10 public samples per guide and full-guide access remains gated.');
