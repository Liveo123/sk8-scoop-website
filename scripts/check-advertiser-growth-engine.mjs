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
const advertiseJs = read('assets/advertise.js');
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
for (const label of ['TEST £40','GROW £90','FIX FIRST','WAIT','NOT A FIT','HUMAN REVIEW']) {
  assert(finderJs.includes(label), `Decision logic includes ${label}`);
}
assert(finderJs.includes("params.set('finder_source', 'campaign_finder')"), 'Finder hands recommendations to advertiser enquiry');
assert(advertiseJs.includes("allowedFinderPackages = new Set(['temp_test', 'temp_grow'])"), 'Advertiser page only accepts current Finder package routes');
assert(advertiseJs.includes('/advertise/finder/'), 'Advertiser page links to Campaign Finder');
assert(opportunity.includes('/advertise/finder/?opportunity=christmas-eating-out'), 'Christmas acquisition page feeds Campaign Finder');
assert(finderJs.includes("opportunity !== 'christmas-eating-out'"), 'Campaign Finder recognises the Christmas opportunity route');
assert(finderJs.includes("category.value = 'hospitality'"), 'Christmas opportunity preselects hospitality');
assert(finderJs.includes("finder_opportunity"), 'Campaign Finder carries opportunity context into advertiser handoff');
assert(advertiseJs.includes('allowedFinderOpportunities'), 'Advertiser enquiry preserves approved opportunity context');
assert(opportunity.includes('TEST £40'), 'Christmas acquisition page defaults to current TEST route');
assert(opportunity.includes('GROW £90'), 'Christmas acquisition page explains current GROW route');
assert(opportunity.includes('noindex,follow'), 'Christmas acquisition page stays noindex during preview');
assert(pay.includes('Payment follows campaign approval'), 'Payment page remains approval-gated');
assert(!/£35|£110|buy\.stripe\.com/i.test(pay), 'Payment page exposes no stale price or public Stripe checkout');
assert(wrapper.includes("import siteWorker from './worker-protected.js'"), 'Advertiser wrapper composes with current NUE worker');
assert(wrapper.includes('RESEND_API_KEY'), 'Advertiser wrapper reads Resend runtime secret');
assert(wrapper.includes('/api/advertiser-enquiries'), 'Advertiser wrapper provides private enquiry API');
assert(wrapper.includes('ADMIN_TOKEN'), 'Private enquiry API remains token protected');
const saveIndex = wrapper.indexOf('await siteWorker.fetch(request, env, ctx)');
const notifyIndex = wrapper.indexOf('await notifyAdvertiserInbox');
assert(saveIndex >= 0 && notifyIndex > saveIndex, 'D1-backed site handler completes before email notification');
assert(!/£35|£110/.test(finderHtml + finderJs + opportunity), 'New growth-engine surfaces contain no legacy public prices');
assert(!wrapper.includes('TEST DIAGNOSTIC') && !wrapper.includes('SK8 Scoop TEST ONLY'), 'Preview-only advertiser diagnostic response is not shipped');
assert(wrapper.includes('/api/stripe-webhook'), 'Advertiser wrapper exposes the signed Stripe webhook route');
assert(wrapper.includes('STRIPE_WEBHOOK_SECRET'), 'Stripe webhook requires its signing secret');
assert(wrapper.includes('verifyStripeSignature'), 'Stripe webhook verifies signatures before recording payments');
assert(wrapper.includes('advertiser_payments'), 'Stripe webhook records advertiser payments in D1');
assert(wrapper.includes("status='paid'"), 'Successful Stripe payment marks the advertiser enquiry paid');
assert(!wrapper.includes('/api/stripe-e2e-test-status'), 'Temporary Stripe E2E status endpoint is not shipped');
assert(pay.includes('site-header'), 'Approved payment page uses the standard site header');


if (process.exitCode) process.exit(process.exitCode);
console.log('Advertiser growth-engine static checks passed.');
