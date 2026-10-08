import fs from 'node:fs';

const read = path => fs.readFileSync(path, 'utf8');
const page = read('advertise.html');
const css = read('assets/advertise-rework-oct8.css');
const js = read('assets/advertise.js');
const finderPage = read('advertise/finder/index.html');
const finderJs = read('assets/campaign-finder.js');
const christmas = read('advertise/christmas-eating-out/index.html');
const worker = read('worker-business-v2.js');
const router = read('worker.js');
const api = read('functions/api/advertiser-enquiry.js');
const site = read('assets/site.js');
const pay = read('advertise/pay/index.html');
let failures = 0;
const check = (ok, label) => {
  if (ok) console.log('PASS: ' + label);
  else { console.error('FAIL: ' + label); failures++; }
};
const has = (text, literal, label) => check(text.includes(literal), label);
const lacks = (text, literal, label) => check(!text.includes(literal), label);

has(page,'Advertise <em>with SK8</em>','01. Unambiguous three-word hero title');
has(page,'Reach local readers through SK8 Scoop','02. Short and clear hero introduction');
has(page,'ad-hero-quick-grid','03. Three compact hero choices');
has(page,'ad-sk8-map-backdrop','SK8 map backdrop replaces newsletter artwork');
has(read('assets/advertise-concrete-offer.css'), 'data:image/webp;base64,', 'Locality map served as self-contained WebP');
lacks(read('assets/advertise-concrete-offer.css'), 'sk8-local-area-map.svg', 'SVG map is not served');
lacks(page, 'ad-newsletter-cover', 'Old newsletter backdrop no longer rendered');
has(read('assets/advertise-concrete-offer.css'),'#products .ad-simple-card.ad-simple-featured','Featured card matched to hero colours');
has(page,'name="artwork_option"','Artwork options in enquiry');
has(page,'/advertise/example/','Dedicated example linked');
check((page.match(/class="ad-hero-quick-item/g) || []).length === 3,'04. Exactly three hero quick prices');
has(page,'href="#products"','05. Main comparison jump');
const index = id => page.indexOf('id="'+id+'"');
check(index('products') >= 0 && index('products') < index('campaign-enquiry') && index('campaign-enquiry') < index('what-you-buy'),'06. Prices precede enquiry and example');
for (const [key,price,label] of [
  ['starter_newsletter','£35','Newsletter'],
  ['guide_card','£28','Any-Guide card'],
  ['guide_bundle','£60','Guide + newsletter'],
  ['guide_section','£96','Guide section sponsor'],
  ['guide_main','£125','Main Guide sponsor']
]) {
  has(page,'data-ad-package="'+key+'"',label+' selection available');
  has(page,'value="'+key+'"',label+' form radio visible');
  has(page,price,label+' price present');
  has(js,key,label+' JS route supported');
  has(router,"'"+key+"'",label+' backend supported');
  has(api,"'"+key+"'",label+' Pages fallback supported');
}
has(page,'ad-premium-grid','07. Both sponsor prices always visible');
lacks(page,'ad-simple-extras','08. Premium offer not hidden inside disclosure');
has(page,'ad-help-grid','09. Campaign Finder and Christmas routes visibly highlighted');
has(page,'/advertise/christmas-eating-out/','10. Festive campaign link remains');
has(page,'/advertise/finder/','11. Finder link remains');
has(page,'data-guide-choice-wrap','12. Guide selection present in enquiry');
has(page,'name="guide_choice"','13. Guide value included in form');
for(const name of ['52 Adventures','Free &amp; Cheap Things to Do','SK8 Summer Guide','50 Secrets of SK8','Getting around SK8','Christmas Guide']){
  has(page,name,'14. Guide option: '+name);
}
has(js,'guideSelect.disabled = !includesGuide','15. Guide choice applies only to relevant paid packages');
has(js,'guidePackages','16. Generic all-Guide selection controls');
lacks(js,"preferredMonthField.value = '2026-10'",'17. No Halloween date forced on other Guides');
has(page,'30 days','18. Ongoing Guide duration is explicit');
has(page,'send a simple report','19. Reporting made clear in process');
lacks(page,'id="reporting"','20. Duplicate metrics section removed');
lacks(page,'Who it is for','21. Unneeded audience section removed');
has(page,'ad-example-only','22. Only the fictional example remains in the example section');
has(page,'ad-placement-demo-v6','23. Fictional example remains visible');
has(page,'ad-example-only','24. Sample is the only example section content');
lacks(page,'ad-goal-panel','25. Unnecessary goal selector removed');
lacks(page,'ad-goal-details','26. No goal dropdown');
check(!page.includes('data-ad-goal='),'27. No duplicate goal buttons');
has(page,'ad-policy-short','28. Clear editorial policy statement remains');
has(page,'/editorial-policy.html','29. Policy source linked');
lacks(page,'ad-evidence-section" id="reporting"','30. No dedicated analytics section');
has(page,'Advertising FAQs','31. Reader-first FAQ');
has(page,'What do £96 and £125 sponsorships include?','32. FAQ explains premium options');
has(page,'Will I receive a results report?','33. FAQ explains end-of-period results');
has(page,'How long will my Guide advert stay live?','34. FAQ explains durations');
has(page,'When and how do I pay?','35. FAQ explains approval-gated payment');
has(page,'Payment follows approval of the draft and dates','36. No direct checkout before approval');
has(page,'FICTIONAL EXAMPLE','37. Sample is disclosed as fictional');
has(page,'SPONSORED','38. Commercial labels remain visible');
has(css,'.ad-hero-quick-item:focus-visible','39. Quick prices have keyboard focus');
has(css,'min-height:81px','40. Hero selection easy to tap');
has(css,'.ad-premium-grid','41. Premium blocks responsive');
has(css,'@media(max-width:445px)','42. Small phones handled');

has(finderPage,'id="campaign-finder"','43. Campaign Finder remains usable');
has(finderJs,"params.set('finder_source', 'campaign_finder')",'44. Finder selection carries into enquiry');
has(js,"allowedFinderPackages = new Set(['starter_newsletter', 'human_review'])",'45. Existing Finder handoff compatible');
has(christmas,'/advertise/finder/?opportunity=christmas-eating-out','46. Christmas route remains connected');
lacks(finderJs,'£40','47. Outdated generic offer removed from Finder');
lacks(christmas,'£40','48. Outdated Christmas starter rate removed');

has(router,'Requested Guide:','49. Guide choice saved in existing D1 record');
has(api,'Requested Guide:','50. Guide choice saved in fallback API');
has(worker,'Requested Guide:','51. Requested Guide included in owner and customer notices');
has(worker,'a.invoice_details','52. Requested Guide visible to admin API');
has(site,'guide_section:','53. £96 option has customer success label');
has(site,'guide_main:','54. £125 option has customer success label');
has(site,"btn.dataset.enquirySubmitted='yes'",'55. Duplicate post-success submissions prevented');
has(worker,"STRIPE_WEBHOOK_SECRET",'56. Stripe webhook signing secret required');
has(worker,'verifyStripeSignature','57. Stripe event signature checked');
has(worker,'approval_required','58. Payment still needs approved enquiry');
has(worker,'packageMatches','59. Payment tied to original package key');
has(worker,"'review_required'",'60. Wrong amounts go to review');
has(worker,'guide_card: 2800','61. £28 in payment amounts');
has(worker,'guide_bundle: 6000','62. £60 in payment amounts');
has(worker,'guide_section: 9600','63. £96 in payment amounts');
has(worker,'guide_main: 12500','64. £125 in payment amounts');
has(worker,"'2026-10-v3'",'65. New price version enforced');
has(worker,'previousPricesPence','66. Prior price-version sessions preserved');
has(worker,'historicalPricesPence','67. Older existing bookings preserved');
has(worker,'advertiser_payment_notifications','68. Payment confirmations deduplicated');
has(worker,'sendPaymentNotifications','69. Approved payment confirmations retained');
has(worker,'company_fax','70. Bot honeypot retained');
has(worker,'sk8_started_at','71. Spam timing check retained');
has(worker,'strict-transport-security','72. HTTPS/HSTS policy retained');
has(worker,"frame-ancestors 'none'",'73. Anti-clickjacking header retained');
has(pay,'Payment follows campaign approval','74. Existing approval-only payment guidance retained');
check(!/buy\.stripe\.com/i.test(pay),'75. No public Stripe link on payment explainer');

if(failures) process.exit(1);
console.log('All current advertiser contract checks passed.');
