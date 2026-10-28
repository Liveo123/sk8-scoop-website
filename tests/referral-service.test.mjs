import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {registerRadarMember,recordRadarReferral,requestReferralCode,confirmReferral,awardReferral} from '../radar-referral-service.js';
const RADAR='202394374779176114';
const REWARD='202479259529250472';
const owner={id:'202394374779100001',email:'reader@example.test',status:'active',groups:[{id:RADAR}],fields:{}};
const friend={id:'202394374779100002',email:'friend@example.test',status:'active',groups:[{id:RADAR}],fields:{}};
const mkdb=()=>{
 const d=new DatabaseSync(':memory:');
 return {prepare(sql){let args=[];return {bind(...a){args=a;return this},async first(){return d.prepare(sql).get(...args)||null},async run(){const r=d.prepare(sql).run(...args);return {meta:{changes:r.changes}}},async all(){return {results:d.prepare(sql).all(...args)}}}},__raw:d};
};
const makeEnv=()=>({DB:mkdb(),RADAR_REFERRAL_ENABLED:'true',RADAR_REFERRAL_REWARD_ENABLED:'false',MAILERLITE_API_TOKEN:'fake',TURNSTILE_SECRET_KEY:'fake',RESEND_API_KEY:'fake',ADMIN_TOKEN:'admin',RADAR_GUIDE_WEB_URL:'https://www.sk8scoop.com/radar/adventure-atlas/',RADAR_GUIDE_PDF_URL:'https://www.sk8scoop.com/radar/adventure-atlas/download.pdf'});
const request=(path,body,opts={})=>new Request('https://www.sk8scoop.com'+path,{method:'POST',headers:{origin:opts.origin??'https://www.sk8scoop.com','sec-fetch-site':'same-origin','content-type':'application/json',...(opts.auth?{authorization:opts.auth}:{})},body:JSON.stringify(body)});
const calls=[];let recipients=[];let failResend=false;let assigned=0;let allowTurnstile=true;
const fetched=globalThis.fetch;
globalThis.fetch=async (url,options={})=>{
 const u=String(url);calls.push({url:u,method:options.method||'GET',body:options.body});
 if(u.includes('siteverify'))return new Response(JSON.stringify({success:allowTurnstile,hostname:'www.sk8scoop.com',action:'newsletter_signup'}),{status:200});
 if(u.includes('/subscribers/')){
   if(u.endsWith('/groups/'+REWARD)){assigned++;owner.groups.push({id:REWARD});return new Response(JSON.stringify({data:{id:REWARD}}),{status:201});}
   const id=decodeURIComponent(u.split('/subscribers/')[1]);let p=recipients.find(x=>x.email===id||x.id===id);
   return p?new Response(JSON.stringify({data:p}),{status:200}):new Response('{}',{status:404});
 }
 if(u.includes('api.resend.com'))return new Response(JSON.stringify({id:'message-1'}),{status:failResend?500:200});
 throw Error('Unknown test fetch '+u)
};
const inOrder=async (t,fn)=>await t.test(fn.name||'case',fn);

test('one-referral pilot: audited integration behaviours',async t=>{
 recipients=[structuredClone(owner),structuredClone(friend)]; let env=makeEnv();
 await t.test('issue and reuse opaque referral codes without exposing an email',async()=>{
  const a=await registerRadarMember(env,owner),b=await registerRadarMember(env,owner);
  assert.equal(a.ready,true);assert.match(a.code,/^R[A-HJ-NP-Z2-9]{12}$/);assert.equal(a.code,b.code);
  assert.ok(!a.code.includes('example'));
 });
 const code=(await registerRadarMember(env,owner)).code;
 await t.test('ignore unknown codes and self-referrals',async()=>{
  assert.equal((await recordRadarReferral(env,{referee:friend,claimedCode:'RZZZZZZZZZZZZ',existingRadar:false})).pending,false);
  const self={...friend,id:owner.id,email:owner.email};assert.equal((await recordRadarReferral(env,{referee:self,claimedCode:code,existingRadar:false})).pending,false);
 });
 await t.test('do not attribute previously subscribed Radar readers',async()=>{
  assert.equal((await recordRadarReferral(env,{referee:friend,claimedCode:code,existingRadar:true})).pending,false);
 });
 await t.test('create a pending claim and separate transactional confirmation',async()=>{
  const r=await recordRadarReferral(env,{referee:friend,claimedCode:code,existingRadar:false});assert.equal(r.pending,true);assert.equal(r.email_sent,true);
  const row=await env.DB.prepare('SELECT * FROM radar_referral_claims WHERE referee_id=?').bind(friend.id).first();
  assert.equal(row.status,'pending');assert.equal(row.referrer_id,owner.id);
  assert.match(row.token_hash,/^[0-9a-f]{64}$/);assert.equal(row.last_error,null);
  assert.ok(calls.some(x=>x.url.includes('api.resend.com') && String(x.body).includes('Confirm your Radar referral')));
 });
 await t.test('no duplicate claims or duplicate confirmation messages',async()=>{
  const before=calls.filter(x=>x.url.includes('api.resend.com')).length;
  const r=await recordRadarReferral(env,{referee:friend,claimedCode:code,existingRadar:false});assert.equal(r.reason,'existing_claim');
  assert.equal(calls.filter(x=>x.url.includes('api.resend.com')).length,before);
 });
 const email=calls.find(x=>x.url.includes('api.resend.com')&&String(x.body).includes('Confirm your Radar referral'));
 const link=JSON.parse(email.body).text.match(/https:\/\/www\.sk8scoop\.com\/radar\/referral\/confirm\/\?token=([^\s]+)/)[1];
 await t.test('confirmation is POST only, rejects cross-site origins',async()=>{
  const r=await confirmReferral(request('/api/radar-referral-confirm',{token:link},{origin:'https://bad.example'}),env);
  assert.equal(r.status,403);
 });
 await t.test('confirmed reader controls the mailbox; only their claim becomes eligible',async()=>{
  const r=await confirmReferral(request('/api/radar-referral-confirm',{token:link}),env);
  assert.equal(r.status,200);assert.equal((await r.json()).ok,true);
  const row=await env.DB.prepare('SELECT status,confirmed_at FROM radar_referral_claims WHERE referee_id=?').bind(friend.id).first();
  assert.equal(row.status,'confirmed');assert.ok(row.confirmed_at);
 });
 await t.test('confirmation cannot be replayed',async()=>{
  const r=await confirmReferral(request('/api/radar-referral-confirm',{token:link}),env);assert.equal(r.status,410);
 });
 await t.test('reward group remains untouched while disabled',async()=>{
  const r=await awardReferral(request('/api/admin/radar-referral-award',{referee_id:friend.id},{auth:'Bearer admin'}),env);
  assert.equal(r.status,503);assert.equal(assigned,0);
 });
 await t.test('reward group is assigned when explicitly enabled and exactly once',async()=>{
  env.RADAR_REFERRAL_REWARD_ENABLED='true';const r=await awardReferral(request('/api/admin/radar-referral-award',{referee_id:friend.id},{auth:'Bearer admin'}),env);
  assert.equal(r.status,200);assert.equal(assigned,1);
  const again=await awardReferral(request('/api/admin/radar-referral-award',{referee_id:friend.id},{auth:'Bearer admin'}),env);
  assert.equal(again.status,409);assert.equal(assigned,1);
 });
 await t.test('unauthorised rewards cannot be issued',async()=>{
  const r=await awardReferral(request('/api/admin/radar-referral-award',{referee_id:friend.id}),env);
  assert.equal(r.status,401);
 });
 await t.test('request code returns same response for unknown and known subscribers',async()=>{
  let env2=makeEnv();const r1=await requestReferralCode(request('/api/radar-referral-code',{email:'unknown@example.test',turnstile:'abc'}),env2);
  const r2=await requestReferralCode(request('/api/radar-referral-code',{email:owner.email,turnstile:'abc'}),env2);
  assert.equal((await r1.json()).message,(await r2.json()).message);
  const before=calls.filter(x=>x.url.includes('api.resend.com')).length;
  await requestReferralCode(request('/api/radar-referral-code',{email:owner.email,turnstile:'abc'}),env2);
  assert.equal(calls.filter(x=>x.url.includes('api.resend.com')).length,before);
 });
 await t.test('bot check failure rejects code requests',async()=>{
  allowTurnstile=false;const r=await requestReferralCode(request('/api/radar-referral-code',{email:owner.email,turnstile:'abc'}),env);
  assert.equal(r.status,403);allowTurnstile=true;
 });
 await t.test('newsletter remains single-opt-in and referral flags default off',async()=>{
  const disabled={...env,RADAR_REFERRAL_ENABLED:'false'};
  assert.equal((await registerRadarMember(disabled,owner)).ready,false);
  assert.equal((await requestReferralCode(request('/api/radar-referral-code',{email:owner.email,turnstile:'abc'}),disabled)).status,403);
 });
});
process.on('exit',()=>{globalThis.fetch=fetched});