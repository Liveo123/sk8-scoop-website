import fs from 'node:fs';

const read = path => fs.readFileSync(path, 'utf8');
const assert = (condition, message) => {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exitCode = 1;
  } else {
    console.log(`OK: ${message}`);
  }
};

const finderHtml = read('advertise/finder/index.html');
const finderJs = read('assets/campaign-finder.js');
const advertiseHtml = read('advertise.html');
const advertiseJs = read('assets/advertise.js');
const advertiseV6 = read('assets/advertise-v6.css');
const advertiseHeroCss = read('assets/advertise-hero-refresh.css');
const advertiseApprovedXmas = read('assets/advertise-approved-xmas.css');
const advertiseApprovedCafe = read('assets/advertise-approved-cafe.css');
const opportunity = read('advertise/christmas-eating-out/index.html');
const pay = read('advertise/pay/index.html');
const wrapper = read('worker-business-v2.js');

assert(finderHtml.includes('id="campaign-finder"'), 'Campaign Finder form exists');
assert(finderHtml.includes('noindex,follow'), 'Campaign Finder stays noindex during preview');
for (const value of ['book','enquire','visit','register','buy','awareness']) {
  assert(finderHtml.includes(`value="${value}"`), `Campaign Finder includes ${value} goal`);
}
for (const name of ['category','area','timing','value','specific','route','freecheap','none']) {
  assert(finderHtml.includes(`name="${name}"`), `Campaign Finder includes ${name} input`);
}
for (const label of ['TEST','£40','FIX FIRST','WAIT','NOT A FIT','HUMAN REVIEW']) {
  assert(finderJs.includes(label), `Decision logic includes ${label}`);
}
assert(finderJs.includes("params.set('finder_source', 'campaign_finder')"), 'Finder hands recommendations to advertiser enquiry');
assert(advertiseJs.includes("allowedFinderPackages = new Set(['starter_newsletter', 'human_review'])"), 'Advertiser page only accepts current starter Finder package and review routes');
assert(advertiseJs.includes('/advertise/finder/'), 'Advertiser page links to Campaign Finder');
assert(advertiseHtml.includes('/advertise/finder/'), 'Main Advertise page visibly links to Campaign Finder');
assert(advertiseHtml.includes('/advertise/christmas-eating-out/'), 'Main Advertise page visibly links to Christmas Eating Out');
assert(advertiseHtml.includes('halloween-scene-v6') && advertiseHtml.includes('halloween-advertising-card-4a.webp'), 'Advertise page uses the richer Halloween visual');
assert(advertiseHtml.includes('ad-proof-grid-v7') && advertiseHtml.includes('ad-proof-pictogram'), 'Advertise proof strip uses the corrected icon-led treatment');
assert(advertiseHtml.includes('ad-route-help-card') && advertiseHtml.includes('Find the smallest sensible campaign'), 'Advertise route grid fills the fourth slot with decision help rather than a weak advert teaser');
assert(advertiseHtml.includes('ad-placement-demo-v6') && advertiseHtml.includes('maple-bean-cafe-2026-final-v2.png'), 'Advertise example placement uses the approved final cafe image');
assert(advertiseHtml.includes('starter-support-panel') && advertiseHtml.includes('WHAT HAPPENS NEXT'), 'Starter campaign section fills the former right-side empty space with useful support');
assert(advertiseHtml.includes('audience-pills-v6') && advertiseHtml.includes('audience-fit-board'), 'Audience section uses icon chips and the crisp local-fit board');
assert(advertiseHtml.includes('ad-process-grid-v6') && advertiseHtml.includes('ad-process-icon'), 'Campaign process uses the richer visual treatment');
assert(advertiseV6.includes('body.advertiser-page [hidden]{display:none!important}'), 'Hidden seasonal package radios cannot render as stray circles');
assert(advertiseV6.includes('.ad-route-grid') && advertiseV6.includes('grid-template-columns:repeat(2,minmax(0,1fr))'), 'Advertiser route grid is deliberately balanced as a 2x2 layout');
assert(opportunity.includes('/advertise/finder/?opportunity=christmas-eating-out'), 'Christmas acquisition page feeds Campaign Finder');
assert(finderJs.includes("opportunity !== 'christmas-eating-out'"), 'Campaign Finder recognises the Christmas opportunity route');
assert(finderJs.includes("category.value = 'hospitality'"), 'Christmas opportunity preselects hospitality');
assert(finderJs.includes("finder_opportunity"), 'Campaign Finder carries opportunity context into advertiser handoff');
assert(advertiseJs.includes('allowedFinderOpportunities'), 'Advertiser enquiry preserves approved opportunity context');
assert(opportunity.includes('£40'), 'Christmas acquisition page defaults to the restored newsletter TEST rate');
assert(!opportunity.includes('GROW £90'), 'Christmas acquisition page no longer promotes historical GROW pricing');
assert(opportunity.includes('noindex,follow'), 'Christmas acquisition page stays noindex during preview');
assert(pay.includes('Payment follows campaign approval'), 'Payment page remains approval-gated');
assert(!/£35|£40|£75|£110|£150|buy\.stripe\.com/i.test(pay), 'Payment page exposes no public campaign price or public Stripe checkout');
assert(wrapper.includes("import siteWorker from './worker-protected.js'"), 'Advertiser wrapper composes with current NUE worker');
assert(wrapper.includes('RESEND_API_KEY'), 'Advertiser wrapper reads Resend runtime secret');
assert(wrapper.includes('/api/advertiser-enquiries'), 'Advertiser wrapper provides private enquiry API');
assert(wrapper.includes('ADMIN_TOKEN'), 'Private enquiry API remains token protected');
const saveIndex = wrapper.indexOf('await siteWorker.fetch(request, env, ctx)');
const notifyIndex = wrapper.indexOf('await notifyAdvertiserInbox');
assert(saveIndex >= 0 && notifyIndex > saveIndex, 'D1-backed site handler completes before email notification');
assert(!finderJs.includes("price: '£20'") && !opportunity.includes('NEWSLETTER STARTER £20'), 'Growth-engine surfaces do not restore the abandoned £20 starter experiment');
assert(!wrapper.includes('TEST DIAGNOSTIC') && !wrapper.includes('SK8 Scoop TEST ONLY'), 'Preview-only advertiser diagnostic response is not shipped');
assert(wrapper.includes('/api/stripe-webhook'), 'Advertiser wrapper exposes the signed Stripe webhook route');
assert(wrapper.includes('STRIPE_WEBHOOK_SECRET'), 'Stripe webhook requires its signing secret');
assert(wrapper.includes('verifyStripeSignature'), 'Stripe webhook verifies signatures before recording payments');
assert(wrapper.includes('advertiser_payments'), 'Stripe webhook records advertiser payments in D1');
assert(wrapper.includes("status='paid'"), 'Successful Stripe payment marks the advertiser enquiry paid');
assert(wrapper.includes('starter_newsletter: 4000') && wrapper.includes('halloween_guide: 3500') && wrapper.includes('halloween_combo: 7500') && wrapper.includes('halloween_section: 11000') && wrapper.includes('halloween_main: 15000'), 'Stripe webhook validates restored newsletter and Halloween amounts before marking paid');
assert(wrapper.includes("'review_required'"), 'Wrong Stripe amount is held for review rather than marked paid');
assert(wrapper.includes('Stripe mode mismatch'), 'Stripe webhook rejects live/test environment mismatches');
assert(wrapper.includes("approval_required") && wrapper.includes("session.mode"), 'Stripe webhook requires approved one-time payment metadata');
assert(wrapper.includes("packageMatches") && wrapper.includes("statusAllowsPayment"), 'Stripe webhook checks enquiry package and state before marking paid');
assert(wrapper.includes('samePaidSession'), 'Stripe webhook treats retries for the same paid session idempotently');
assert(wrapper.includes('advertiser_payment_notifications'), 'Payment email notification state is recorded in D1');
assert(wrapper.includes('sendPaymentNotifications'), 'Successful live payments trigger owner and advertiser notifications');
assert(wrapper.includes("'owner_paid'") && wrapper.includes("'advertiser_paid'"), 'Payment notifications are deduplicated by notification type');
assert(wrapper.includes('Advertising remains separate from editorial coverage'), 'Advertiser payment confirmation preserves editorial/commercial separation');
assert(!wrapper.includes('/api/stripe-e2e-test-status'), 'Temporary Stripe E2E status endpoint is not shipped');
assert(pay.includes('site-header'), 'Approved payment page uses the standard site header');
assert(wrapper.includes("x-content-type-options") && wrapper.includes("frame-ancestors 'none'"), 'Worker adds baseline browser security headers');
assert(wrapper.includes("strict-transport-security"), 'Production SK8 domains receive HSTS');
assert(wrapper.includes("company_fax") && wrapper.includes("sk8_started_at"), 'Advertiser submission applies bot screening');




/* Twenty explicit hero quality gates from the October 2026 criticism pass.
   These are structural regression checks; visual/browser tests run in the site QA workflow. */
const heroCriticismChecks = [
  ['01. Business-first headline', advertiseHtml.includes('Got something worth <em>telling SK8?</em>')],
  ['02. Specific SK8 locality', advertiseHtml.includes('Cheadle · Cheadle Hulme · Gatley · Heald Green')],
  ['03. Useful business hooks', advertiseHtml.includes('A class, an offer, an event')],
  ['04. Clear production promise', advertiseHtml.includes('We prepare the advert. You approve it')],
  ['05. Main CTA above the page proof section', advertiseHtml.indexOf('data-ad-hero-action="see_example"') < advertiseHtml.indexOf('ad-proof-bar')],
  ['06. Immediate campaign finder alternative', advertiseHtml.includes('data-ad-hero-action="campaign_finder" href="/advertise/finder/"')],
  ['07. Dynamic audience rather than a frozen number', advertiseHtml.includes('data-stat="subscriberCount"')],
  ['08. Stale issues-published tile removed from hero', !advertiseHtml.slice(advertiseHtml.indexOf('ad-conversion-hero'),advertiseHtml.indexOf('ad-proof-bar')).includes('issuesPublished')],
  ['09. Goal-picker no longer crowds the first screen', advertiseHtml.indexOf('class="ad-goal-grid"') > advertiseHtml.indexOf('id="what-you-buy"')],
  ['10. Six existing outcome shortcuts remain available', (advertiseHtml.match(/data-ad-goal=/g)||[]).length === 6],
  ['11. Sponsor label visible in example', advertiseHtml.includes('ad-specimen-masthead') && advertiseHtml.includes('<span>SPONSORED</span>')],
  ['12. Example explicitly not a real campaign', advertiseHtml.includes('FICTIONAL FORMAT EXAMPLE') && advertiseHtml.includes('not a real advertiser')],
  ['13. Clear example next action', advertiseHtml.includes('data-ad-hero-action="sample_link" href="#what-you-buy"') || advertiseHtml.includes('href="#what-you-buy" data-ad-hero-action="sample_link"')],
  ['14. Introductory newsletter price retained', advertiseHtml.includes('Introductory newsletter test') && advertiseHtml.includes('£40')],
  ['15. Full advertising example comes before seasonal upsell', advertiseHtml.indexOf('id="what-you-buy"') < advertiseHtml.indexOf('id="halloween-half-term"')],
  ['16. Halloween and Christmas routes retained', advertiseHtml.includes('id="halloween-half-term"') && advertiseHtml.includes('/advertise/christmas-eating-out/')],
  ['17. Editorial and sponsored independence explicit', advertiseHtml.includes('never buys favourable editorial coverage')],
  ['18. Accessible mobile treatment and link focus', advertiseHeroCss.includes('@media(max-width:600px)') && advertiseHeroCss.includes('a:focus-visible')],
  ['19. Respect for reduced motion and responsive graphics', advertiseHeroCss.includes('prefers-reduced-motion:reduce') && advertiseHeroCss.includes('minmax(0,1.06fr)')],
  ['20. Intent events separated from submissions', advertiseJs.includes('advertiser_hero_action') && advertiseJs.includes("variant: 'local_hero_v2'")],
];
for (const [name,passed] of heroCriticismChecks) assert(passed, 'Hero criticism pass '+name);

assert(advertiseHtml.includes('assets/images/advertise/sk8-local-map-sunset-2026.webp'), 'Approved SK8 sunset artwork is used in the advertiser hero');
assert(advertiseHtml.includes('width="1100" height="393"'), 'Approved hero image reserves its layout space');
assert(!advertiseHtml.includes('ad-specimen-art-glow') && !advertiseHtml.includes('ad-specimen-area') && !advertiseHtml.includes('ad-specimen-art-title'), 'Old placeholder labels and overlays are removed');
assert(advertiseHeroCss.includes('aspect-ratio:2098 / 750') && advertiseHeroCss.includes('object-fit:contain'), 'Hero illustration displays at full aspect ratio without cropping');


if (process.exitCode) process.exit(process.exitCode);
console.log('Advertiser growth-engine static checks passed.');

assert(!advertiseHtml.includes('href="#what-you-buy">See the fictional advert'), 'Weak half-page fictional-ad anchor is removed from the route grid');

assert(advertiseHtml.includes('assets/advertise-approved-xmas.css') && advertiseHtml.includes('assets/advertise-approved-cafe.css'), 'Advertise page loads the approved photo treatments after the main advertiser CSS');
assert(advertiseApprovedXmas.includes('data:image/webp;base64,') && advertiseApprovedXmas.includes('.ad-christmas-scene'), 'Approved Christmas treatment embeds the detailed generated image');
assert(advertiseApprovedCafe.includes('data:image/webp;base64,') && advertiseApprovedCafe.includes('.cafe-machine-scene') && advertiseApprovedCafe.includes('.starter-visual-machine'), 'Approved cafe treatment embeds the detailed generated image in both relevant placements');
assert(advertiseHtml.includes('ad-christmas-photo') && advertiseHtml.includes('christmas-hospitality-2026-final-v2.png'), 'Christmas hospitality card uses the approved final festive image');
assert(advertiseHtml.includes('maple-bean-cafe-2026-final-v2.png'), 'Fictional cafe advert uses the approved final coffee-machine image');
assert(advertiseV6.includes('maple-bean-cafe-2026-sharp.png'), 'Starter visual reuses the approved detailed cafe photo');

assert(!advertiseHtml.includes('assets/images/cafe-local-business.webp'), 'Old people-focused cafe image is not used on the Advertise page');

assert(!advertiseHtml.includes('test-canva-thumb.webp') && !advertiseHtml.includes('test-canva-cafe-thumb.webp'), 'No thumbnail-derived advertiser images remain');
assert(!advertiseHtml.includes('e_gen_restore'), 'Advertiser HTML does not upscale low-resolution source images');
assert(!advertiseV6.includes('e_gen_restore'), 'Advertiser CSS does not upscale low-resolution source images');

assert(advertiseHtml.includes('halloween-scene-caption'), 'Halloween campaign copy sits below the artwork instead of covering it');
assert(!advertiseHtml.includes('<span>CHRISTMAS 2026 · HOSPITALITY</span>'), 'Christmas label is not duplicated over the final artwork');
assert(!advertiseHtml.includes('ad-demo-fake-stamp'), 'Cafe image does not receive a duplicate fictional-example overlay');
assert(!advertiseHtml.includes('<div class="ad-demo-photo-brand">'), 'Cafe image does not receive a duplicate Maple & Bean lock-up');
assert(advertiseV6.includes('aspect-ratio:1916 / 821') && advertiseV6.includes('aspect-ratio:1672 / 941'), 'Final approved images retain their supplied aspect ratios');
assert(advertiseV6.includes('object-fit:contain!important'), 'Final approved images are not cropped');
