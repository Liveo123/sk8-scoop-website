import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {handleEngagementForms} from '../engagement-forms.js';
// D1 emulator keeps intentional test submissions local and never sends emails.
let inserted=0,updates=0;
const db={prepare(sql){return {bind(...args){this.args=args;return this},async first(){if(sql.includes('COUNT'))return {n:0};return null},async run(){if(sql.startsWith('INSERT'))inserted++;else updates++;return {meta:{last_row_id:inserted,changes:1}}},async all(){return {results:[]}}}}};
const env={DB:db};
let emails=[];
const notify=async(to,subject,text)=>{emails.push({to,subject,text});return {status:'sent'}};
const post=(pathname,body,opts={})=>new Request('https://www.sk8scoop.com'+pathname,{method:'POST',headers:{'content-type':'application/json','origin':opts.origin||'https://www.sk8scoop.com'},body:JSON.stringify(body)});
const started_at=Date.now()-5500;
const shared={started_at,privacy_acknowledged:true};
let r=await handleEngagementForms(post('/api/advertiser-interest',{...shared,business_name:'Cheadle Demo',interest:'enquiries',email:'business@example.com'}),env,{notify});assert.equal(r.status,200);let j=await r.json();assert.equal(j.emailed,true);assert.equal(emails[0].to,'contact@sk8scoop.com');assert.equal(inserted,1);
r=await handleEngagementForms(post('/api/advertiser-interest',{...shared,business_name:'Demo',interest:'wrong',email:'business@example.com'}),env,{notify});assert.equal(r.status,400);assert.equal(emails.length,1);
r=await handleEngagementForms(post('/api/advertiser-interest',{...shared,business_name:'Demo',interest:'visits',email:'business@example.com'},{origin:'https://evil.example'}),env,{notify});assert.equal(r.status,403);
r=await handleEngagementForms(post('/api/advertiser-interest',{...shared,business_name:'Demo',interest:'visits',email:'business@example.com',company_fax:'bot'}),env,{notify});assert.equal(r.status,200);assert.equal(inserted,1);
r=await handleEngagementForms(post('/api/reader-demographics',{...shared,area:'gatley',relationship:'live',age_band:'35_44',children_bands:['age_5_11'],interests:['daily_updates','history']}),env,{notify});assert.equal(r.status,200);j=await r.json();assert.equal(j.linked,false);assert.equal(emails.length,1);
r=await handleEngagementForms(post('/api/reader-demographics',{...shared,area:'gatley',relationship:'live',age_band:'35_44',children_bands:['none','age_5_11'],interests:['daily_updates']}),env,{notify});assert.equal(r.status,400);
r=await handleEngagementForms(post('/api/reader-demographics',{...shared,area:'gatley',relationship:'live',age_band:'prefer_not',children_bands:[],interests:['history'],email:'subscriber@example.com'}),env,{notify});assert.equal(r.status,400);
r=await handleEngagementForms(new Request('https://www.sk8scoop.com/api/reader-demographics/summary',{headers:{}}),env,{notify});assert.equal(r.status,401);
r=await handleEngagementForms(post('/api/reader-demographics/confirm',{...shared,token:'ABC'}),env,{notify});assert.equal(r.status,400);
for(const p of ['advertise/ask/index.html','reader-survey/index.html','reader-survey/verify/index.html']){let html=readFileSync(new URL('../'+p,import.meta.url),'utf8');assert.ok(html.includes('/assets/sk8-scoop-logo.webp'));assert.ok(html.includes('privacy'));}
console.log('PASS: 10 API / form-structure checks, no external email deliveries, mocked database only.');
