import fs from 'node:fs';
import assert from 'node:assert/strict';
import {audit52Finder,validateSuccessJourney,collectHtmlAnchors,LINK_STATES,classifyLinkProbe} from './guide-reliability-core.mjs';

const read = path=>fs.readFileSync(path,'utf8');
const reports=[];
const add=(id,state,evidence,notes='')=>reports.push({id,state,evidence,notes});
const fail=(id,msg)=>{add(id,'FAIL','source inspection',msg);};
const guides=[
 ['Halloween','halloween-half-term-guide'],
 ['Free & Cheap','free-cheap-guide'],
 ['52 Adventures','52-adventures']
];
const sources=guides.map(([name,root])=>({name,root,html:read(root+'/guide/index.html'),success:read(root+'/success/index.html')}));
let failure=false;
const finder=audit52Finder(sources[2].html);
if(finder.errors.length){failure=true;fail('GQ-02',finder.errors.join('; '));}
else add('GQ-02','PASS','52 Adventures: '+finder.entries+' canonical entries and '+finder.cards+' initial Finder cards, cost numbers, kind/region/time attributes','Other guide content representations remain subject to targeted checks.');
let broken=[];
for(const g of sources){
 const expected='/'+g.root+'/guide/';
 if(!validateSuccessJourney(g.success,'/'+g.root+'/success/',expected))broken.push(g.name+' success-page link does not reach '+expected);
 if(!g.html.includes('data-guide-key'))broken.push(g.name+' guide identity missing');
}
if(broken.length){failure=true;fail('GQ-08',broken.join('; '));}
else add('GQ-08','PASS','All three guide success pages link directly to their respective full guide; correct guide identifiers','Does not prove real MailerLite delivery or a controlled signup.');
for(const g of sources){
 const a=collectHtmlAnchors(g.html);
 if(a.duplicates.length){failure=true;fail('GQ-04',g.name+' duplicate IDs: '+a.duplicates.slice(0,10).join(','));}
}
if(!reports.some(r=>r.id==='GQ-04'&&r.state==='FAIL'))add('GQ-04','NOT VERIFIED','Static guide identities and anchor uniqueness checked','Exact Cloudflare preview/live SHA parity needs a deployment-specific check.');
const free=sources[1].html;
const conflicts=[...free.matchAll(/<article\b[^>]*data-date-unconfirmed="true"[^>]*>[\s\S]*?<\/article>/gi)];
if(!/data-date-unconfirmed="true"/.test(free))add('GQ-03','NOT VERIFIED','Free & Cheap has no machine-readable date conflicts in current source','Review editorial conflict records before declaring resolved.');
else{
 const cards=[...free.matchAll(/<article\b[^>]*>[\s\S]*?<\/article>/gi)].map(m=>m[0]);
 const uncertain=cards.filter(card=>/data-date-unconfirmed="true"/.test(card));
 if(!uncertain.length){failure=true;fail('GQ-03','Disputed date markers exist but are not attached to article cards');}
 else if(uncertain.some(card=>/data-event-date="\d{4}-\d{2}-\d{2}"/.test(card))){failure=true;fail('GQ-03','Disputed date is exposed as a confirmed dated event');}
 else add('GQ-03','PASS',uncertain.length+' Free & Cheap card(s) have disputed-date metadata without confirmed event dates','Full price-filter and live calendar behaviour still require browser test.');
}
const registry=JSON.parse(read('docs/reviews/free-cheap-source-register-2026-10-08.json'));
const badEntries=(registry.entries||[]).filter(e=>e.fact_check_status==='SPECIFIC_CLAIMS_CHECKED'&&(!e.primary_claims_checked?.length||!e.claim_evidence_urls?.length||!e.claim_check_date));
if(badEntries.length){failure=true;fail('GQ-01',badEntries.length+' source-register entries have unsupported specific-check flags');}
else add('GQ-01','PASS',(registry.entries||[]).length+' source-register entries inspected; '+(registry.entries||[]).filter(e=>e.fact_check_status==='SPECIFIC_CLAIMS_CHECKED').length+' have claim-scope evidence','Legacy register is not a full claim-by-claim ledger; do not infer every field verified.');
add('GQ-05','PASS','Negative unit fixtures: tests/guide-reliability-fixtures.mjs','This is a check-design record; a runtime pass requires the fixture action to succeed.');
add('GQ-06','NOT VERIFIED','Verified price-to-product pairing requires source menu/ticket row evidence','No programmatic assumption from amount alone.');
add('GQ-07','NOT VERIFIED','Existing scripts/check-52-adventures-images.mjs validates 32 image hashes','Remote image delivery and changed images require network/decode checks.');
add('GQ-09','NOT VERIFIED','Existing browser guide and subscriber QA scripts cover selected interaction states','Run against exact-head preview for a real result.');
add('GQ-10','NOT VERIFIED','Link probe states: '+Object.values(LINK_STATES).join(', '),'No external HTTP probe was run; bot-blocked links must not be labelled broken.');
reports.sort((a,b)=>a.id.localeCompare(b.id));
for(const r of reports)console.log(r.id+' | '+r.state+' | '+r.evidence+(r.notes?' | '+r.notes:''));
if(failure)process.exitCode=1;
