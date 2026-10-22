import fs from 'node:fs';
import {writeFile,mkdir} from 'node:fs/promises';
import {audit52Finder,validateSuccessJourney} from './guide-reliability-core.mjs';

const output='visual-qa/guide-reliability/gq-evidence.json';
const load=path=>fs.existsSync(path)?JSON.parse(fs.readFileSync(path,'utf8')):null;
const hosted=load('visual-qa/guide-reliability/hosted-audit.json');
const browser=load('visual-qa/guide-reliability/browser-results.json');
const guides=['halloween-half-term-guide','free-cheap-guide','52-adventures'];
const results=browser?.results||[];
const failures=results.filter(x=>x.status==='FAIL');
const guidesAudited=hosted?.checks||[];
const allParity=guidesAudited.length===3 && guidesAudited.every(x=>x.parity==='PASS');
const probedImages=guidesAudited.reduce((a,g)=>a+(g.images?.length||0),0);
const totalImages=guidesAudited.reduce((a,g)=>a+(g.imageTotal||0),0);
const imageFailures=guidesAudited.flatMap(g=>(g.images||[]).filter(x=>x.status==='FAIL'));
const imagePassed=guidesAudited.reduce((a,g)=>a+(g.images||[]).filter(x=>x.status==='PASS').length,0);
const links=guidesAudited.flatMap(g=>g.links||[]);
const counts=links.reduce((map,x)=>{map[x.kind]=(map[x.kind]||0)+1;return map;},{});
const decoded=results.filter(x=>x.label.includes('actual browser image decoding'));
const direct=results.filter(x=>x.label.includes('direct access'));
const features=results.filter(x=>/Finder|dialog|storage|visit-only|clipboard|Clipboard|focus/.test(x.label));
const status=(ok)=>ok?'PASS':'NOT VERIFIED';
const evidence={
  schema:'sk8-guide-gq-evidence-v1',
  checkedAt:new Date().toISOString(),
  branchHeadSha:process.env.GUIDE_QA_HEAD_SHA||null,
  base:hosted?.base||null,
  releaseDecision:'NOT VERIFIED (separate owner approval and complete release evidence required)',
  interpretation:'PASS only applies to the individual sampled/subset tests shown. Unverified release-wide controls remain NOT VERIFIED.',
  checks:{
    'GQ-01':{overall:'NOT VERIFIED',reason:'Full claim-by-claim source and freshness review remains a separate editorial gate.'},
    'GQ-02':{overall:'NOT VERIFIED',reason:'52 Adventures Finder coverage is tested; other guide representation parity is not complete.'},
    'GQ-03':{overall:'NOT VERIFIED',reason:'Date/uncertainty static guards are separately tested; all dynamic price/date states are not covered.'},
    'GQ-04':{overall:'NOT VERIFIED',subcheck:{contentParity:status(allParity),guidesVerified:guidesAudited.map(g=>({name:g.name,parity:g.parity,sha256:g.sourceSha256}))},reason:'Cloudflare active deployment/expected commit identity requires an external deployment check.'},
    'GQ-05':{overall:'NOT VERIFIED',reason:'Negative test fixtures run earlier in the job; require confirmed result in CI logs.'},
    'GQ-06':{overall:'NOT VERIFIED',reason:'Menu/ticket item-to-price pairing requires primary table-row source evidence.'},
    'GQ-07':{overall:imageFailures.length?'FAIL':'NOT VERIFIED',subcheck:{sampledImages:imagePassed+'/'+probedImages+' checked; '+totalImages+' inventoried',chromeDecode:status(decoded.length===3&&decoded.every(x=>x.status==='PASS')),decodedGuides:decoded.map(x=>({guide:x.label,status:x.status})),failures:imageFailures},reason:'Hosted byte and Chrome decoding tests are samples, not full rights or asset verification.'},
    'GQ-08':{overall:'NOT VERIFIED',subcheck:{cookieFreeDirectAccess:status(direct.length===6 && direct.every(x=>x.status==='PASS')),successToGuide:status(guides.every(slug=>validateSuccessJourney(fs.readFileSync(slug+'/success/index.html','utf8'),'/'+slug+'/success/','/'+slug+'/guide/')))},reason:'MailerLite group, controlled signup, delivered email and second-device access not exercised.'},
    'GQ-09':{overall:failures.length?'FAIL':'NOT VERIFIED',subcheck:{testedBrowserCases:results.length,failures,coveredInteractions:features.map(x=>({label:x.label,status:x.status}))},reason:'Sampled browser/edge states passed but exhaustive browser, clipboard and storage combinations remain separate release checks.'},
    'GQ-10':{overall:(counts['CONFIRMED BROKEN']||0)?'FAIL':'NOT VERIFIED',subcheck:{linksProbed:links.length,classifications:counts,unverified:links.filter(x=>x.kind!=='VERIFIED WORKING')},reason:'HTTP accessibility of sampled official links is not full link, booking, price or destination-content verification.'}
  }
};
if(fs.existsSync('52-adventures/guide/index.html')){
 const finder=audit52Finder(fs.readFileSync('52-adventures/guide/index.html','utf8'));
 evidence.checks['GQ-02'].subcheck={finder:finder.errors.length?'FAIL':'PASS',entries:finder.entries,cards:finder.cards,errors:finder.errors};
}
if(process.env.GUIDE_QA_FIXTURES_PASSED==='1') {
 evidence.checks['GQ-05'].subcheck={deterministicFixtures:'PASS',source:'GitHub Actions prior verified fixture step'};
}
await mkdir('visual-qa/guide-reliability',{recursive:true});
await writeFile(output,JSON.stringify(evidence,null,2)+'\n');
for(const [id,x] of Object.entries(evidence.checks))
  console.log(id+' | overall '+x.overall+' | '+(x.reason||''));
console.log('One compact QA evidence record: '+output);
if(['GQ-07','GQ-09','GQ-10'].some(id=>evidence.checks[id].overall==='FAIL'))process.exitCode=1;
