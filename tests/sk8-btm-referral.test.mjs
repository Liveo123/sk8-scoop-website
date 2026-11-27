import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {
  registerSk8BtmMember, recordSk8BtmReferral,
  requestSk8BtmCode, confirmSk8BtmReferral, awardSk8BtmReferral,
  downloadSk8BtmReward
} from '../sk8-btm-referral-service.js';

import {handleSk8BtmSignup} from '../sk8-btm-signup-api.js';

const GROUP='190964754190174086';
const id=n=>String(300000000000000000n+BigInt(n));
const ownerId=id(1);
const owner={id:ownerId,email:'owner@example.test',status:'active',groups:[{id:GROUP}],fields:{}};
let people, emails, resendFail, turnstileOK, r2Head;
const previousFetch=globalThis.fetch;

function mkdb(){
 const db=new DatabaseSync(':memory:');
 return {
  prepare(sql){
   const stmt=db.prepare(sql);
   let args=[];
   return {
    bind(...values){args=values;return this},
    first(){return stmt.get(...args)||null},
    all(){return {results:stmt.all(...args)}},
    run(){const result=stmt.run(...args);return {meta:{changes:Number(result.changes)}}}
   };
  },
  raw:db
 };
}
const zip = new TextEncoder().encode('TEST ZIP BYTES');
function environment(flags={}){return {
 DB:mkdb(), MAILERLITE_API_TOKEN:'fake',TURNSTILE_SECRET_KEY:'fake',
 RESEND_API_KEY:'fake',ADMIN_TOKEN:'admin',
 SK8_BTM_REFERRAL_ENABLED:'true', SK8_BTM_REWARD_ENABLED:'true',
 BTM_REWARD_OBJECT_KEY:'birthday-time-machine/Test.zip',
 BTM_REWARDS:{
  head:async()=>r2Head?{size:zip.length}:null,
  get:async()=>r2Head?{body:new ReadableStream({start(c){c.enqueue(zip);c.close()}})}:null
 },
 ...flags
};}
function request(path, data, options={}){
 return new Request('https://www.sk8scoop.com'+path,{method:'POST',
  headers:{'content-type':'application/json','origin':'https://www.sk8scoop.com',...(options.headers||{})},
  body:JSON.stringify(data)
 });
}
async function fixture(){
 people=new Map([[ownerId,{...owner}]]);emails=[];resendFail=false;turnstileOK=true;r2Head=true;
 return environment();
}
globalThis.fetch=async(url,opts={})=>{
 const link=String(url);
 if(link==='https://connect.mailerlite.com/api/subscribers'&&opts.method==='POST'){
  const payload=JSON.parse(opts.body||'{}');
  const current=[...people.values()].find(p=>p.email===payload.email);
  const person={...(current||{}),id:current?.id||id(90+people.size),email:payload.email,status:'active',groups:payload.groups.map(id=>({id})),fields:{...(current?.fields||{}),...(payload.fields||{})}};
  people.set(person.id,person);
  return new Response(JSON.stringify({data:person}),{status:200});
 }
 if(link.includes('connect.mailerlite.com/api/subscribers/')){
  const who=decodeURIComponent(link.split('/').at(-1));
  const person=people.get(who)||[...people.values()].find(p=>p.email===who);
  return new Response(JSON.stringify({data:person||null}),{status:person?200:404});
 }
 if(link.includes('challenges.cloudflare.com/turnstile/v0/siteverify')){
  return new Response(JSON.stringify({success:turnstileOK,action:'newsletter_signup',hostname:'www.sk8scoop.com'}),{status:200});
 }
 if(link.includes('api.resend.com/emails')){
  const data=JSON.parse(opts.body||'{}');emails.push({data,opts});
  return new Response(JSON.stringify({id:'mock-'+emails.length}),{status:resendFail?500:200});
 }
 throw Error('Unexpected external fetch '+link);
};
test.after(()=>{globalThis.fetch=previousFetch;});
const addFriend=(n,email)=>{const p={id:id(n),email,status:'active',groups:[{id:GROUP}],fields:{}};people.set(p.id,p);return p;};
const confirmFromLatest=async(env,email)=>{
 const mail=emails.findLast(x=>x.data.to?.includes(email)&&x.data.subject?.startsWith('Confirm your'));
 assert.ok(mail,'Expected verification email for '+email);
 const link=mail.data.text.match(/https:\/\/www\.sk8scoop\.com\/adventures\/birthday-time-machine\/refer\/confirm\/\?token=[A-Za-z0-9_-]+/);
 assert.ok(link,'Expected independent confirmation URL');
 const token=new URL(link[0]).searchParams.get('token');
 const result=await confirmSk8BtmReferral(request('/api/sk8-btm-referral-confirm',{token}),env);
 return {status:result.status,body:await result.json(),token};
};
test('referral pilot: blocked when not explicitly enabled',async()=>{
 const env=await fixture();env.SK8_BTM_REFERRAL_ENABLED='false';
 const result=await requestSk8BtmCode(request('/api/sk8-btm-referral-code',{email:owner.email,turnstile:'mock'}),env);
 assert.equal(result.status,403);
});
test('referral pilot: no credit for unrecognised code, self-referral or alias',async()=>{
 const env=await fixture();
 const registered=await registerSk8BtmMember(env,owner);
 assert.match(registered.code,/^BTM-[A-HJ-NP-Z2-9]{12}$/);
 const friend=addFriend(2,'friend@example.test');
 assert.equal((await recordSk8BtmReferral(env,{referee:friend,claimedCode:'BTM-AAAAAAAAAAAA',existingSk8:false})).pending,false);
 assert.equal((await recordSk8BtmReferral(env,{referee:owner,claimedCode:registered.code,existingSk8:false})).pending,false);
 const gmailOwner={id:id(10),email:'first.person@gmail.com',status:'active',groups:[{id:GROUP}],fields:{}};
 people.set(gmailOwner.id,gmailOwner);
 const code=(await registerSk8BtmMember(env,gmailOwner)).code;
 const alias=addFriend(3,'firstperson+1@googlemail.com');
 assert.equal((await recordSk8BtmReferral(env,{referee:alias,claimedCode:code,existingSk8:false})).pending,false);
});
test('referral pilot: three independent confirmations trigger one email with gated download',async()=>{
 const env=await fixture();
 const code=(await registerSk8BtmMember(env,owner)).code;
 for(const i of [2,3,4]){
  const friend=addFriend(i,'reader'+i+'@example.test');
  const recorded=await recordSk8BtmReferral(env,{referee:friend,claimedCode:code,existingSk8:false});
  assert.equal(recorded.pending,true);
  const confirmation=await confirmFromLatest(env,friend.email);
  assert.equal(confirmation.status,200);
  assert.equal(confirmation.body.ok,true);
  if(i!==4)assert.equal(emails.filter(x=>x.data.subject==='Your Birthday Time Machine is ready').length,0);
 }
 const rewards=emails.filter(x=>x.data.subject==='Your Birthday Time Machine is ready');
 assert.equal(rewards.length,1);
 assert.deepEqual(rewards[0].data.to,[owner.email]);
 const download=rewards[0].data.text.match(/https:\/\/www\.sk8scoop\.com\/api\/sk8-btm-download\?token=[A-Za-z0-9_-]+/);
 assert.ok(download,'Private reward URL should be emailed');
 const url=download[0];
 for(let i=0;i<5;i++){
  const result=await downloadSk8BtmReward(new Request(url),env);
  assert.equal(result.status,200);
  assert.equal(result.headers.get('cache-control'),'private, no-store, max-age=0');
  assert.match(result.headers.get('content-disposition'),/attachment/);
  assert.equal(await result.text(),'TEST ZIP BYTES');
 }
 assert.equal((await downloadSk8BtmReward(new Request(url),env)).status,410);
 const repeated=await awardSk8BtmReferral(request('/api/admin/sk8-btm-referral-award',{referrer_id:owner.id},{headers:{authorization:'Bearer admin'}}),env);
 assert.equal((await repeated.json()).already_awarded,true);
 assert.equal(emails.filter(x=>x.data.subject==='Your Birthday Time Machine is ready').length,1);
});
test('referral pilot: two confirmed referrals do not earn a reward',async()=>{
 const env=await fixture();const code=(await registerSk8BtmMember(env,owner)).code;
 for(const i of [2,3]){const friend=addFriend(i,'reader'+i+'@example.test');await recordSk8BtmReferral(env,{referee:friend,claimedCode:code,existingSk8:false});await confirmFromLatest(env,friend.email);}
 const response=await awardSk8BtmReferral(request('/api/admin/sk8-btm-referral-award',{referrer_id:owner.id},{headers:{authorization:'Bearer admin'}}),env);
 assert.equal((await response.json()).awaiting,true);
 assert.equal(emails.filter(x=>x.data.subject==='Your Birthday Time Machine is ready').length,0);
});
test('referral pilot: missing ZIP fails closed and sends no reward',async()=>{
 const env=await fixture();const code=(await registerSk8BtmMember(env,owner)).code;r2Head=false;
 for(const i of [2,3,4]){const friend=addFriend(i,'reader'+i+'@example.test');await recordSk8BtmReferral(env,{referee:friend,claimedCode:code,existingSk8:false});await confirmFromLatest(env,friend.email);}
 assert.equal(emails.filter(x=>x.data.subject==='Your Birthday Time Machine is ready').length,0);
 const response=await awardSk8BtmReferral(request('/api/admin/sk8-btm-referral-award',{referrer_id:owner.id},{headers:{authorization:'Bearer admin'}}),env);
 assert.equal(response.status,503);
});
test('referral pilot: failed transactional email is not treated as delivered',async()=>{
 const env=await fixture();const code=(await registerSk8BtmMember(env,owner)).code;
 for(const i of [2,3]){const friend=addFriend(i,'reader'+i+'@example.test');await recordSk8BtmReferral(env,{referee:friend,claimedCode:code,existingSk8:false});await confirmFromLatest(env,friend.email);}
 const friend=addFriend(4,'reader4@example.test');await recordSk8BtmReferral(env,{referee:friend,claimedCode:code,existingSk8:false});resendFail=true;
 await confirmFromLatest(env,friend.email);
 const state=await env.DB.prepare('SELECT status FROM sk8_btm_referral_rewards WHERE referrer_id=?').bind(owner.id).first();
 assert.equal(state.status,'failed');
});
test('referral code delivery: only subscribed members receive a code; no address enumeration',async()=>{
 const env=await fixture();
 const requestBody={email:owner.email,turnstile:'mock'};
 const response=await requestSk8BtmCode(request('/api/sk8-btm-referral-code',requestBody),env);
 assert.equal(response.status,200);
 assert.match(emails.at(-1).data.subject,/referral code/i);
 const unknown=await requestSk8BtmCode(request('/api/sk8-btm-referral-code',{email:'not-a-member@example.test',turnstile:'mock'}),env);
 assert.equal(unknown.status,200);
 assert.equal(emails.length,1);
});

 
// All integrations below are mocked: no real subscriptions, inboxes, payments or storage.
function signupRequest(email,code,host='www.sk8scoop.com'){
 const origin='https://'+host;
 const body=new URLSearchParams({email,consent:'yes',referral_code:code||'',started_at:String(Date.now()-3000),'cf-turnstile-response':'mock',source:'issue22'});
 return new Request(origin+'/api/sk8-btm-signup',{method:'POST',headers:{origin,'content-type':'application/x-www-form-urlencoded'},body});
}
test('signup pilot: valid code reports email acceptance and stable attribution',async()=>{
 const env=await fixture();env.SK8_BTM_SIGNUP_ENABLED='true';
 const code=(await registerSk8BtmMember(env,owner)).code;
 const res=await handleSk8BtmSignup(signupRequest('valid-new@example.test',code),env);
 assert.equal(res.status,200);
 const out=await res.json();assert.equal(out.success,true);assert.equal(out.referral_confirmation_status,'email_accepted');
 const added=[...people.values()].find(x=>x.email==='valid-new@example.test');
 assert.equal(added.fields.signup_campaign,'btm_referral');
 assert.equal(added.fields.birthday_time_machine_referral_code,code);
 assert.equal(emails.filter(x=>x.data.subject.startsWith('Confirm your')).length,1);
});
test('signup pilot: unknown code does not falsely promise a confirmation email',async()=>{
 const env=await fixture();env.SK8_BTM_SIGNUP_ENABLED='true';
 const res=await handleSk8BtmSignup(signupRequest('unknown-code@example.test','BTM-AAAAAAAAAAAA'),env);
 assert.equal(res.status,200);assert.equal((await res.json()).referral_confirmation_status,'not_counted');assert.equal(emails.length,0);
});
test('signup pilot: provider failure preserves signup and reports uncertain delivery',async()=>{
 const env=await fixture();env.SK8_BTM_SIGNUP_ENABLED='true';
 const code=(await registerSk8BtmMember(env,owner)).code;resendFail=true;
 const res=await handleSk8BtmSignup(signupRequest('send-failure@example.test',code),env);
 assert.equal(res.status,200);const out=await res.json();assert.equal(out.success,true);assert.equal(out.referral_confirmation_status,'delivery_unverified');
 assert.ok([...people.values()].some(x=>x.email==='send-failure@example.test'&&x.status==='active'));
});
test('signup pilot: disabled and preview routes cannot add subscribers or send email',async()=>{
 const env=await fixture();
 assert.equal((await handleSk8BtmSignup(signupRequest('disabled@example.test',''),env)).status,503);
 env.SK8_BTM_SIGNUP_ENABLED='true';
 assert.equal((await handleSk8BtmSignup(signupRequest('preview@example.test','','previews.sk8scoop.com'),env)).status,503);
 assert.equal(people.size,1);assert.equal(emails.length,0);
});
test('signup pilot: existing subscriber cannot earn a new referral',async()=>{
 const env=await fixture();env.SK8_BTM_SIGNUP_ENABLED='true';
 const code=(await registerSk8BtmMember(env,owner)).code;
 const existing=addFriend(2,'existing@example.test');
 const res=await handleSk8BtmSignup(signupRequest(existing.email,code),env);
 assert.equal((await res.json()).already_subscribed,true);assert.equal(emails.length,0);
});
test('signup pilot: no code is a normal voluntary subscription',async()=>{
 const env=await fixture();env.SK8_BTM_SIGNUP_ENABLED='true';
 const res=await handleSk8BtmSignup(signupRequest('no-code@example.test',''),env);
 assert.equal(res.status,200);assert.equal((await res.json()).referral_confirmation_status,'not_requested');assert.equal(emails.length,0);
});
test('referral pilot: expired confirmation cannot count',async()=>{
 const env=await fixture();const code=(await registerSk8BtmMember(env,owner)).code;
 const friend=addFriend(2,'expired@example.test');
 await recordSk8BtmReferral(env,{referee:friend,claimedCode:code,existingSk8:false});
 await env.DB.prepare("UPDATE sk8_btm_referral_claims SET expires_at='2000-01-01T00:00:00Z' WHERE referee_id=?").bind(friend.id).run();
 assert.equal((await confirmFromLatest(env,friend.email)).status,410);
 assert.equal(emails.filter(x=>x.data.subject==='Your Birthday Time Machine is ready').length,0);
});
