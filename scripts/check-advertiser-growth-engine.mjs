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
assert(advertiseHtml.includes('ad-placement-demo-v6') && advertiseHtml.includes('cafe-local-business.webp'), 'Advertise example placement uses the high-resolution cafe source rather than the old low-resolution image');
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



if (process.exitCode) process.exit(process.exitCode);
console.log('Advertiser growth-engine static checks passed.');

assert(!advertiseHtml.includes('href="#what-you-buy">See the fictional advert'), 'Weak half-page fictional-ad anchor is removed from the route grid');

assert(advertiseHtml.includes('assets/images/advertise/christmas-hospitality-2026.webp'), 'Christmas hospitality card uses the dedicated festive dining image');
assert(advertiseHtml.includes('assets/images/advertise/cafe-machine-no-people.webp'), 'Fictional cafe advert uses a people-free coffee-machine image');
assert(advertiseV6.includes('cafe-machine-no-people.webp'), 'Starter visual uses the people-free coffee-machine image');
