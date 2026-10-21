import assert from 'node:assert/strict';
import {
  LINK_STATES, classifyLinkProbe, validateClaim, eligibleForAction,
  gbpAmounts, audit52Finder, resolveGuideLink, validateSuccessJourney,
  collectHtmlAnchors
} from '../scripts/guide-reliability-core.mjs';

assert.equal(classifyLinkProbe(200), LINK_STATES.WORKING);
assert.equal(classifyLinkProbe(204), LINK_STATES.WORKING);
assert.equal(classifyLinkProbe(301), LINK_STATES.UNKNOWN);
assert.equal(classifyLinkProbe(403), LINK_STATES.BLOCKED);
assert.equal(classifyLinkProbe(429), LINK_STATES.BLOCKED);
assert.equal(classifyLinkProbe(404), LINK_STATES.BROKEN);
assert.equal(classifyLinkProbe(503), LINK_STATES.UNKNOWN);
assert.equal(classifyLinkProbe(null, 'captcha challenge'), LINK_STATES.BLOCKED);
assert.equal(classifyLinkProbe(null, 'DNS failed'), LINK_STATES.UNKNOWN);

const checkedPrice = {
  claim_id:'P-001', entry_id:'A-1', claim_type:'price',
  value:'Adult ticket £9', amount:9, product_name:'Adult ticket',
  unit:'per adult', currency:'GBP', verification_status:'VERIFIED',
  source_url:'https://example.org/admission', checked_at:'2026-10-20'
};
assert.deepEqual(validateClaim(checkedPrice), []);
assert.equal(eligibleForAction(checkedPrice,'under-10'),true);
assert.equal(eligibleForAction(checkedPrice,'free'),false);
assert.equal(eligibleForAction({ ...checkedPrice, amount:0 },'free'),true);
assert.equal(eligibleForAction({ ...checkedPrice, amount:10.01 },'under-10'),false);

const unverifiedPrice={...checkedPrice, verification_status:'UNVERIFIED', caveat:'Price not confirmed by organiser'};
assert.deepEqual(validateClaim(unverifiedPrice),[]);
assert.equal(eligibleForAction(unverifiedPrice,'under-10'),false);
assert.equal(eligibleForAction({...checkedPrice,verification_status:'CONFLICT',caveat:'Two adult prices on current pages'},'under-10'),false);
assert.ok(validateClaim({...checkedPrice,product_name:''}).some(x=>x.includes('product_name')));
assert.ok(validateClaim({...checkedPrice,source_url:''}).some(x=>x.includes('source_url')));
assert.ok(validateClaim({...checkedPrice,unit:''}).some(x=>x.includes('unit')));
assert.ok(validateClaim({...checkedPrice,currency:'USD'}).some(x=>x.includes('GBP')));
assert.ok(validateClaim({...checkedPrice,amount:-1}).some(x=>x.includes('nonnegative')));
assert.ok(validateClaim({...unverifiedPrice,caveat:''}).some(x=>x.includes('caveat')));

const date = {
  claim_id:'D-1',entry_id:'A-1',claim_type:'date',value:'2026-10-31',
  verification_status:'VERIFIED',source_url:'https://example.org/event',
  checked_at:'2026-10-20'
};
assert.deepEqual(validateClaim(date),[]);
assert.equal(eligibleForAction(date,'calendar'),true);
assert.equal(eligibleForAction({...date,verification_status:'CONFLICT',caveat:'Organiser lists two dates'},'calendar'),false);
assert.ok(validateClaim({...date,value:'31 Oct'}).some(x=>x.includes('ISO')));

assert.deepEqual(gbpAmounts('Adults £6.50, children £3, booking £1.25'),[1.25,3,6.5]);
// Apostrophes inside double-quoted attributes must not truncate quoted prices.
assert.equal(audit52Finder('<script id="adventure-data" type="application/json">'+JSON.stringify(Object.fromEntries(Array.from({length:52},(_,i)=>[i+1,{num:i+1,kind:'walk',region:'stockport',meta:{Allow:'2 hours',Cost:"Rudyard\'s entry £5"}}])))+'</script>'+[1,2].map(()=>Array.from({length:52},(_,i)=>'<article class="finder-card" data-num="'+(i+1)+'" data-kind="walk" data-region="stockport" data-time="2 hours" data-cost="rudyard\'s entry £5"></article>').join('')).join('')).errors.length,0);
assert.equal(resolveGuideLink('../guide/','/halloween-half-term-guide/success/'),'/halloween-half-term-guide/guide/');
assert.equal(validateSuccessJourney('<a href="../guide/">Open full guide</a>','/halloween-half-term-guide/success/','/halloween-half-term-guide/guide/'),true);
assert.equal(validateSuccessJourney('<a href="/">Homepage</a>','/halloween-half-term-guide/success/','/halloween-half-term-guide/guide/'),false);
assert.deepEqual(collectHtmlAnchors('<h2 id="one"></h2><h3 id="one"></h3><a href="#one">x</a>').duplicates,['one']);

const adventure = {};
for(let n=1;n<=52;n++) adventure[n]={
  num:n, kind:'heritage',region:'stockport',meta:{Allow:'2 hours',Cost:'Adults £9; children £3'}
};
const listing = n => '<article class="finder-card" data-num="'+n+'" data-kind="heritage" data-region="stockport" data-time="2 hours" data-cost="adults £9; children £3"></article>';
const html='<script id="adventure-data" type="application/json">'+JSON.stringify(adventure)+'</script>'+
  [1,2].map(()=>Array.from({length:52},(_,i)=>listing(i+1)).join('')).join('');
assert.deepEqual(audit52Finder(html).errors,[]);
assert.ok(audit52Finder(html.replace('children £3','children £31')).errors.some(x=>x.includes('GBP amounts mismatch')));
assert.ok(audit52Finder(html.replace('data-region="stockport"','data-region="cheshire"')).errors.some(x=>x.includes('data-region')));
assert.ok(audit52Finder(html.replace('data-time="2 hours"','data-time="1 hour"')).errors.some(x=>x.includes('data-time')));
assert.ok(audit52Finder(html.replace(listing(1),'')).errors.some(x=>x.includes('Finder')));
console.log('PASS: Guide Reliability fixtures cover verified and disputed claims, prices, dates, parity, link triage and negative cases.');
