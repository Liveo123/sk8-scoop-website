import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {registerRadarMember,recordRadarReferral,requestReferralCode,confirmReferral,awardReferral} from '../radar-referral-service.js';
const RADAR='202394374779176114';
const owner={id:'202394374779100001',email:'reader@example.test',status:'active',groups:[{id:RADAR}],fields:{}};
const friend={id:'202394374779100002',email:'friend@example.test',status:'active',groups:[{id:RADAR}],fields:{}};
const mkdb=()=>{
 const d=new DatabaseSync(':memory:');
 return {prepare(sql){let args=[];return {bind(...a){args=a;return this},async first(){return d.prepare(sql).get(...args)||null},async run(){const r=d.prepare(sql).run(...args);return {meta:{changes:r.changes}}},async all(){return {results:d.prepare(sql).all(...args)}}}},__raw:d};
};
const makeEnv=()=>({DB:mkdb(),RADAR_REFERRAL_ENABLED:'true',RADAR_REFERRAL_REWARD_ENABLED:'false',MAILERLITE_API_TOKEN:'fake',TURNSTILE_SECRET_KEY:'fake',RESEND_API_KEY:'fake',ADMIN_TOKEN:'admin',RADAR_GUIDE_WEB_URL:'https://www.sk8scoop.com/radar/adventure-atlas/',RADAR_GUIDE_PDF_URL:'https://www.sk8scoop.com/radar/adventure-atlas/download.pdf'});
const request=(path,body,opts={})=>new Request('https://www.sk8scoop.com'+path,{method:'POST',headers:{origin:opts.origin??'https://www.sk8scoop.com','sec-fetch-site':'same-origin','content-type':'application/json',...(opts.auth?{authorization:opts.auth}:{})},body:JSON.stringify(body)});
const calls=[];let recipients=[];let failResend=false;let allowTurnstile=true;
const fetched=globalThis.fetch;
globalThis.fetch=async (url,options={})=>{
 const u=String(url);calls.push({url:u,method:options.method||'GET',body:options.body,headers:options.headers});
 if(u.includes('siteverify'))return new Response(JSON.stringify({success:allowTurnstile,hostname:'www.sk8scoop.com',action:'newsletter_signup'}),{status:200});
 if(u.includes('/subscribers/')){
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
 await t.test('Gmail plus aliases and dotted variants cannot create a genuine referral or reward',async()=>{
  const trial=makeEnv();
  const samePerson={...owner,email:'same.reader+first@gmail.com'};
  const alias={...friend,email:'samereader+second@googlemail.com'};
  recipients=[samePerson,alias];
  try{
    const ownCode=(await registerRadarMember(trial,samePerson)).code;
    const beforeConfirm=calls.filter(x=>x.url.includes('api.resend.com')).length;
    const claimed=await recordRadarReferral(trial,{referee:alias,claimedCode:ownCode,existingRadar:false});
    assert.equal(claimed.pending,false);
    assert.equal(claimed.reason,'same_mailbox');
    assert.equal(calls.filter(x=>x.url.includes('api.resend.com')).length,beforeConfirm);
    // Defense in depth: even if an earlier version had a confirmed claim,
    // a reward must not be sent to two aliases of the same Gmail inbox.
    await trial.DB.prepare(`INSERT INTO radar_referral_claims
      (referee_id,referrer_id,code,token_hash,status,expires_at,confirmed_at)
      VALUES(?,?,?,'synthetic-hash','confirmed',datetime('now','+1 hour'),datetime('now'))`
    ).bind(alias.id,samePerson.id,ownCode).run();
    trial.RADAR_REFERRAL_REWARD_ENABLED='true';
    const award=await awardReferral(
      request('/api/admin/radar-referral-award',{referee_id:alias.id},{auth:'Bearer admin'}),trial
    );
    assert.equal(award.status,409);
    assert.match((await award.json()).error,/independent mailboxes/);
    assert.equal(calls.filter(x=>x.url.includes('api.resend.com')).length,beforeConfirm);
  }finally{
    recipients=[structuredClone(owner),structuredClone(friend)];
  }
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
 await t.test('no reward is sent while the launch flag is disabled',async()=>{
  const before=calls.filter(x=>x.url.includes('api.resend.com')&&String(x.body).includes('four South Manchester adventures are ready')).length;
  const r=await awardReferral(request('/api/admin/radar-referral-award',{referee_id:friend.id},{auth:'Bearer admin'}),env);
  assert.equal(r.status,503);
  assert.equal(calls.filter(x=>x.url.includes('api.resend.com')&&String(x.body).includes('four South Manchester adventures are ready')).length,before);
 });
 await t.test('Resend accepts one earned guide reward, with audited D1 status and deduplication',async()=>{
  env.RADAR_REFERRAL_REWARD_ENABLED='true';
  const r=await awardReferral(request('/api/admin/radar-referral-award',{referee_id:friend.id},{auth:'Bearer admin'}),env);
  assert.equal(r.status,200);
  const result=await r.json();assert.equal(result.delivery_accepted,true);assert.equal(result.delivery_verified,false);
  let sent=calls.filter(x=>x.url.includes('api.resend.com')&&String(x.body).includes('four South Manchester adventures are ready'));
  assert.equal(sent.length,1);
  assert.equal(sent[0].headers['Idempotency-Key'],'radar-atlas-four-'+owner.id);
  assert.equal(JSON.parse(sent[0].body).to[0],owner.email);
  const state=await env.DB.prepare('SELECT status,accepted_at FROM radar_referral_rewards WHERE referrer_id=?').bind(owner.id).first();
  assert.equal(state.status,'accepted');assert.ok(state.accepted_at);
  const again=await awardReferral(request('/api/admin/radar-referral-award',{referee_id:friend.id},{auth:'Bearer admin'}),env);
  assert.equal(again.status,200);assert.equal((await again.json()).already_awarded,true);
  sent=calls.filter(x=>x.url.includes('api.resend.com')&&String(x.body).includes('four South Manchester adventures are ready'));
  assert.equal(sent.length,1);
 });
 await t.test('automatically accepts a reward only after independent confirmation',async()=>{
  const fresh=makeEnv();fresh.RADAR_REFERRAL_REWARD_ENABLED='true';
  const code=(await registerRadarMember(fresh,owner)).code;
  const count=calls.length;
  const started=await recordRadarReferral(fresh,{referee:friend,claimedCode:code,existingRadar:false});
  assert.equal(started.pending,true);
  const mail=calls.slice(count).find(x=>x.url.includes('api.resend.com')&&String(x.body).includes('Confirm your Radar referral'));
  const token=JSON.parse(mail.body).text.match(/token=([^\s]+)/)[1];
  const before=calls.filter(x=>x.url.includes('api.resend.com')&&String(x.body).includes('four South Manchester adventures are ready')).length;
  const confirmed=await confirmReferral(request('/api/radar-referral-confirm',{token}),fresh);
  assert.equal(confirmed.status,200);
  const added=calls.filter(x=>x.url.includes('api.resend.com')&&String(x.body).includes('four South Manchester adventures are ready')).length;
  assert.equal(added,before+1);
  const reward=await fresh.DB.prepare('SELECT status FROM radar_referral_rewards WHERE referrer_id=?').bind(owner.id).first();
  assert.equal(reward.status,'accepted');
  assert.equal((await confirmReferral(request('/api/radar-referral-confirm',{token}),fresh)).status,410);
  assert.equal(calls.filter(x=>x.url.includes('api.resend.com')&&String(x.body).includes('four South Manchester adventures are ready')).length,added);
 });
 await t.test('failed reward acceptance keeps confirmation and allows admin reconciliation',async()=>{
  const fresh=makeEnv();
  const code=(await registerRadarMember(fresh,owner)).code;
  const start=calls.length;
  await recordRadarReferral(fresh,{referee:friend,claimedCode:code,existingRadar:false});
  const msg=calls.slice(start).find(x=>x.url.includes('api.resend.com')&&String(x.body).includes('Confirm your Radar referral'));
  const token=JSON.parse(msg.body).text.match(/token=([^\s]+)/)[1];
  fresh.RADAR_REFERRAL_REWARD_ENABLED='true';
  failResend=true;
  assert.equal((await confirmReferral(request('/api/radar-referral-confirm',{token}),fresh)).status,200);
  const state=await fresh.DB.prepare('SELECT status FROM radar_referral_rewards WHERE referrer_id=?').bind(owner.id).first();
  assert.equal(state.status,'failed');
  failResend=false;
  const retry=await awardReferral(request('/api/admin/radar-referral-award',{referee_id:friend.id},{auth:'Bearer admin'}),fresh);
  assert.equal(retry.status,200);
  const accepted=await fresh.DB.prepare('SELECT status FROM radar_referral_rewards WHERE referrer_id=?').bind(owner.id).first();
  assert.equal(accepted.status,'accepted');
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