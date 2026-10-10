import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { startPreferenceVerification, renderPreferenceConfirmation, finishPreferenceVerification } from '../preference-verification.js';

const sent=[],pending=new Map(),verified=new Map(),queries=[];
const db={
  prepare(sql){
    return {
      bind(...args){return {first:()=>queryOne(sql,args),run:()=>exec(sql,args)};},
      first:()=>queryOne(sql,[]),
      run:()=>exec(sql,[])
    };
  }
};
function queryOne(sql,args){
  if(sql.includes('COUNT(*) AS amount')&&sql.includes('WHERE email=?'))
    return Promise.resolve({amount:[...pending.values()].filter(x=>x.email===args[0]).length});
  if(sql.includes('COUNT(*) AS amount'))return Promise.resolve({amount:pending.size});
  if(sql.startsWith('SELECT email, interests_json FROM pending_interest_confirmations')){
    const r=pending.get(args[0]);
    return Promise.resolve(r&&!r.usedAt?{email:r.email,interests_json:r.interests_json}:null);
  }
  throw Error('Unexpected read query: '+sql);
}
async function exec(sql,args){
  queries.push(sql);
  if(/^CREATE (TABLE|INDEX)/.test(sql))return {meta:{changes:0}};
  if(sql.startsWith('DELETE FROM pending_interest_confirmations WHERE expires_at'))return {meta:{changes:0}};
  if(sql.startsWith('INSERT INTO pending_interest_confirmations')){
    pending.set(args[0],{email:args[1],interests_json:args[2],usedAt:false});
    return {meta:{changes:1}};
  }
  if(sql.startsWith('UPDATE pending_interest_confirmations SET used_at=datetime')){
    const v=pending.get(args[0]);if(!v||v.usedAt)return {meta:{changes:0}};
    v.usedAt=true;return {meta:{changes:1}};
  }
  if(sql.startsWith('INSERT INTO verified_subscriber_preferences')){
    verified.set(args[0],args.slice(1));return {meta:{changes:1}};
  }
  if(sql.startsWith('DELETE FROM pending_interest_confirmations WHERE token_hash')){
    pending.delete(args[0]);return {meta:{changes:1}};
  }
  if(sql.startsWith('UPDATE pending_interest_confirmations SET used_at=NULL')){
    pending.get(args[0]).usedAt=false;return {meta:{changes:1}};
  }
  throw Error('Unexpected write query: '+sql);
}
const oldFetch=globalThis.fetch;
globalThis.fetch=async(url,opts)=>{
  assert.equal(url,'https://api.resend.com/emails');
  sent.push(JSON.parse(opts.body));
  return new Response('{"id":"test"}',{status:200,headers:{'content-type':'application/json'}});
};
try{
  const env={DB:db,RESEND_API_KEY:'test-only-fake-secret'};
  const payload={email:'test@example.net',preference_consent:'yes',events:'yes',practical_updates:'yes'};
  const start=new Request('https://www.sk8scoop.com/api/save-preferences',{
    method:'POST',headers:{origin:'https://www.sk8scoop.com','content-type':'application/json'},
    body:JSON.stringify(payload)
  });
  const result=await startPreferenceVerification(start,env);
  assert.equal(result.status,200);
  assert.equal((await result.json()).pending,true);
  assert.equal(verified.size,0,'preferences must never be written before email confirmation');
  assert.equal(sent.length,1,'exactly one verification email');
  assert.equal(sent[0].to[0],payload.email);
  const link=sent[0].text.match(/https:\/\/www\.sk8scoop\.com\/api\/confirm-preferences\?token=[0-9a-f]{48}/)?.[0];
  assert.ok(link,'email must contain a random-token confirmation link');
  assert.ok(!link.includes(payload.email),'email address not included in verification URL');
  const page=renderPreferenceConfirmation(new Request(link));
  assert.equal(page.status,200);
  assert.match(await page.text(),/Confirm my email interests/);
  // The previous response header no-referrer made normal browser form POSTs send Origin: null.
  // strict-origin avoids that false rejection without exposing the URL's token in Referer.
  assert.equal(page.headers.get('referrer-policy'),'strict-origin');
  const wrapper=readFileSync(new URL('../worker-business-v2.js', import.meta.url),'utf8');
  assert.ok(wrapper.includes("if (url.pathname === '/api/confirm-preferences') headers.set('referrer-policy', 'strict-origin');"),
    'Production Worker must preserve the strict-origin response header');
  const token=new URL(link).searchParams.get('token');
  const rejectedNull=await finishPreferenceVerification(new Request('https://www.sk8scoop.com/api/confirm-preferences',{
    method:'POST',headers:{origin:'null','content-type':'application/x-www-form-urlencoded'},
    body:new URLSearchParams({token})
  }),env);
  assert.equal(rejectedNull.status,403,'opaque origins must not bypass ownership verification');
  const rejectedForeign=await finishPreferenceVerification(new Request('https://www.sk8scoop.com/api/confirm-preferences',{
    method:'POST',headers:{origin:'https://unrelated.example','content-type':'application/x-www-form-urlencoded'},
    body:new URLSearchParams({token})
  }),env);
  assert.equal(rejectedForeign.status,403,'foreign sites must not confirm email interests');
  assert.equal(verified.size,0,'rejected forms must not save interests');
  const verifiedResponse=await finishPreferenceVerification(new Request('https://www.sk8scoop.com/api/confirm-preferences',{
    method:'POST',headers:{origin:'https://www.sk8scoop.com','content-type':'application/x-www-form-urlencoded'},
    body:new URLSearchParams({token})
  }),env);
  assert.equal(verifiedResponse.status,200);
  assert.deepEqual(verified.get(payload.email),[0,1,0,0,0,0,1]);
  const replay=await finishPreferenceVerification(new Request('https://www.sk8scoop.com/api/confirm-preferences',{
    method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({token})
  }),env);
  assert.equal(replay.status,410,'verification links must not be reusable');
  const foreign=await startPreferenceVerification(new Request('https://www.sk8scoop.com/api/save-preferences',{
    method:'POST',headers:{origin:'https://unrelated.example','content-type':'application/json'},
    body:JSON.stringify(payload)
  }),env);
  assert.equal(foreign.status,403);
  assert.equal(sent.length,1,'cross-origin requests must not send confirmation emails');
  assert.ok(queries.every(q=>!q.includes('INSERT INTO subscriber_preferences(')),'legacy unverified table must never receive writes');
  console.log('PASS confirmed-only storage, strict-origin browser form policy, one-use links, no token referrer leakage, cross-origin protection and no legacy writes');
}finally{globalThis.fetch=oldFetch;}
