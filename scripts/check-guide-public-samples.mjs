import fs from 'node:fs';

const read = path => fs.readFileSync(path, 'utf8');
const manifest = JSON.parse(read('data/guide-public-samples.json'));
const discovery = JSON.parse(read('data/discovery.json'));
const sitemapXml = read('sitemap.xml');
const sitemapHtml = read('sitemap.html');
const adventuresLanding = read('52-adventures/index.html');
const freeCheapLanding = read('free-cheap-guide/index.html');
const halloweenGuide = read('halloween-half-term-guide/guide/index.html');
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
      assert(
        html.includes('/52-adventures/#get-guide') || html.includes('/free-cheap-guide/#get-guide'),
        `${key} public sample must contain a signup CTA to a full guide: ${route}`
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

for (const directRoute of ['/52-adventures/guide/', '/free-cheap-guide/guide/', '/halloween-half-term-guide/guide/']) {
  assert(!sitemapXml.includes(directRoute), `Direct full-guide route must not appear in sitemap.xml: ${directRoute}`);
  assert(!sitemapHtml.includes(directRoute), `Direct full-guide route must not appear in sitemap.html: ${directRoute}`);
  assert(!JSON.stringify(discovery).includes(directRoute), `Direct full-guide route must not appear in site search discovery: ${directRoute}`);
}

assert(adventuresLanding.includes('data-guide-key="52-adventures"'), '52 Adventures signup forms must identify the guide key.');
assert(adventuresLanding.includes('data-success-url="/52-adventures/success/"'), '52 Adventures signup must keep its own success route.');
assert(!adventuresLanding.includes('href="/52-adventures/guide/"'), '52 Adventures public landing page must not bypass signup.');

assert(freeCheapLanding.includes('data-guide-key="free-cheap"'), 'Free & Cheap signup forms must identify the guide key.');
assert(freeCheapLanding.includes('data-success-url="/free-cheap-guide/success/"'), 'Free & Cheap signup must keep its own success route.');
assert(!freeCheapLanding.includes('href="/free-cheap-guide/guide/"'), 'Free & Cheap public landing page must not bypass signup.');

assert(signupJs.includes('dataset.successUrl'), 'Signup protection must honour each form\'s configured success URL.');
assert(signupJs.includes('sk8_guide_key'), 'Signup protection must submit the guide key.');

assert(protectedWorker.includes('guide_access_tokens'), 'Protected worker must retain subscriber-access storage for site features that still use it.');
assert(protectedWorker.includes("'guide:52-adventures'"), 'Protected worker must route 52 Adventures signups to their MailerLite group.');
assert(protectedWorker.includes("'guide:free-cheap'"), 'Protected worker must route Free & Cheap signups to their MailerLite group.');
assert(protectedWorker.includes("'guide:halloween'"), 'Protected worker must route Halloween Guide signups to their MailerLite group.');
assert(protectedWorker.includes("guideRequiresAccess(protectedGuide.key)"), 'Guide dispatch must honour the explicit public-by-link access decision before redirecting.');
assert((protectedWorker.match(/requiresAccess: false/g) || []).length >= 3, 'All current free guide direct routes must remain public-by-link.');
assert(halloweenGuide.includes('id="filters"'), 'Halloween Guide must retain the #filters anchor.');
for (const filter of ['local','free','under10','under5','primary','teen','rainy','send']) {
  assert(halloweenGuide.includes(`data-filter="${filter}"`), `Halloween Guide is missing filter state: ${filter}`);
}
assert(halloweenGuide.includes("new URLSearchParams(location.search).get('filter')"), 'Halloween Guide must read the filter query parameter.');
assert(halloweenGuide.includes("requestedGuideButton.click()"), 'Halloween Guide must apply the requested filter state.');
assert(halloweenGuide.includes("document.getElementById('filters')?.scrollIntoView"), 'Halloween Guide filter deep links must scroll to the filters.');

if (failures.length) {
  console.error('Guide public-sample/subscriber-gate check failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Guide public-sample/direct-route check passed: public discovery stays on landing/sample pages while direct full-guide links remain public-by-link and Halloween filters are supported.');
