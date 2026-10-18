import assert from 'node:assert/strict';
import {handleEngagementForms} from '../engagement-forms.js';

const post=(p,d)=>new Request('https://www.sk8scoop.com'+p,{method:'POST',headers:{origin:'https://www.sk8scoop.com','content-type':'application/json'},body:JSON.stringify(d)});
const base={started_at:Date.now()-5000,privacy_acknowledged:true};
let saved=false,statusFailed=false;
const failingDB={prepare(sql){return{bind(){return this},async first(){return{n:0}},async run(){if(sql.startsWith('INSERT')){saved=true;return{meta:{last_row_id:1,changes:1}}}statusFailed=true;throw Error('Injected database failure')}}}};
const originalError=console.error;console.error=()=>{};
const lead=await handleEngagementForms(post('/api/advertiser-interest',{...base,business_name:'Test',interest:'visits',email:'owner@example.com'}),{DB:failingDB},{notify:async()=>({status:'sent'})});
console.error=originalError;
assert.equal(lead.status,200);assert.equal((await lead.json()).saved,true);assert.ok(saved&&statusFailed);

let pending=false,used=false,mode='missing',profileStatus='',calls=[],emailBody='';
const db={prepare(sql){return{args:[],bind(...a){this.args=a;return this},async first(){
 if(sql.includes('COUNT'))return{n:0};
 if(sql.startsWith('SELECT response_id,email'))return pending&&!used?{response_id:2,email:'subscriber@example.com'}:null;
 if(sql.startsWith('SELECT area,relationship'))return{area:'cheadle',relationship:'live',age_band:'35_44',children_bands:'["none"]',interests:'["history"]'};
 throw Error('Unknown query: '+sql)
},async run(){
 if(sql.startsWith('INSERT INTO sk8_reader_demographics'))return{meta:{last_row_id:2,changes:1}};
 if(sql.startsWith('INSERT INTO sk8_demographics_confirmations')){pending=true;return{meta:{changes:1}}}
 if(sql.startsWith('UPDATE sk8_demographics_confirmations')){used=true;return{meta:{changes:1}}}
 if(sql.startsWith('UPDATE sk8_reader_demographics SET link_status'))profileStatus=this.args[0];
 return{meta:{changes:1}}
}}}};
const notice=async(_to,_subject,body)=>{emailBody=body;return{status:'sent'}};
const submitted=await handleEngagementForms(post('/api/reader-demographics',{...base,area:'cheadle',relationship:'live',age_band:'35_44',children_bands:['none'],interests:['history'],email:'subscriber@example.com',link_profile_consent:true}),{DB:db},{notify:notice});
assert.equal(submitted.status,200);
const token=new URL(emailBody.match(/https?:\/\/[^\s]+/)[0]).searchParams.get('token');
const oldFetch=globalThis.fetch;
globalThis.fetch=async(url,options={})=>{
 const method=options.method||'GET';calls.push(method);
 if(url.includes('/api/fields'))return new Response(JSON.stringify({data:mode==='missing'?[]:['sk8_area','sk8_age_band','sk8_relationship','sk8_children','sk8_interests'].map(key=>({key}))}),{status:200});
 if(method==='GET')return new Response(JSON.stringify({data:{id:'123',status:'active'}}),{status:200});
 if(method==='PUT')return new Response('{}',{status:200});
 throw Error('Unexpected HTTP method '+method)
};
try{
 const env={DB:db,MAILERLITE_API_TOKEN:'fake'};
 const run=()=>handleEngagementForms(post('/api/reader-demographics/confirm',{...base,token}),env,{notify:notice});
 let r=await run();let j=await r.json();assert.equal(j.can_retry,true);assert.equal(j.profile_sync,'fields_missing');assert.equal(used,false);
 mode='ready';r=await run();j=await r.json();assert.equal(j.profile_sync,'updated');assert.equal(j.can_retry,false);
 assert.ok(used);assert.equal(profileStatus,'synced');assert.deepEqual(calls.filter(x=>x==='PUT'),['PUT']);assert.ok(!calls.includes('POST'));assert.equal((await run()).status,410);
}finally{globalThis.fetch=oldFetch}
console.log('PASS: notification-status failure, retriable verification and no subscriber creation');
