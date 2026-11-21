// Birthday Time Machine: three independently confirmed new SK8 Scoop readers earn one digital game.
// Independent referral confirmation is NOT the newsletter opt-in mechanism.
// All mutations are disabled unless SK8_BTM_REFERRAL_ENABLED is explicitly true.
const SK8_GROUP = '190964754190174086';
const CODE_RE = /^BTM-[A-HJ-NP-Z2-9]{12}$/;
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const API = 'https://connect.mailerlite.com/api';
const PROD_HOSTS = new Set(['www.sk8scoop.com', 'sk8scoop.com']);
const SENDER = 'SK8 Scoop <alerts@notify.sk8scoop.com>';
const HOURS_48 = 48 * 3600 * 1000;
const json = (value, status=200) => new Response(JSON.stringify(value), {status, headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','referrer-policy':'no-referrer','x-content-type-options':'nosniff'}});
const validId = id => /^\d{7,22}$/.test(String(id||''));
const validCode = code => CODE_RE.test(String(code||''));
const normalizeEmail = email => String(email||'').trim().toLowerCase();
// Gmail and Googlemail plus aliases (and dots) address the same mailbox.
// Distinct subscriber IDs alone are not proof of independent referrals.
function mailboxIdentity(email){
  const value=normalizeEmail(email),at=value.lastIndexOf('@');
  if(at<1)return value;
  const domain=value.slice(at+1);
  if(domain!=='gmail.com'&&domain!=='googlemail.com')return value;
  const local=value.slice(0,at).split('+')[0].replace(/\./g,'');
  return local+'@gmail.com';
}
const isMember = user => !!user && user.status === 'active' && (user.groups||[]).some(g => String(g.id)===SK8_GROUP);
const makeCode = () => { const r=crypto.getRandomValues(new Uint8Array(12));return 'BTM-'+Array.from(r,b=>ALPHABET[b&31]).join(''); };
const tokenString = () => btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32)))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
async function hash(token){const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token));return Array.from(new Uint8Array(b)).map(x=>x.toString(16).padStart(2,'0')).join('');}
function requireOrigin(req,env){
  const url=new URL(req.url);const origin=req.headers.get('origin');const site=req.headers.get('sec-fetch-site');
  if(req.method!=='POST'||!PROD_HOSTS.has(url.hostname)||env.SK8_BTM_REFERRAL_ENABLED!=='true')return false;
  return !!origin && origin===url.origin && (!site||['same-origin','none'].includes(site));
}
async function ensure(db){
  await db.prepare(`CREATE TABLE IF NOT EXISTS sk8_btm_referral_codes (
    subscriber_id TEXT PRIMARY KEY, code TEXT NOT NULL UNIQUE,
    last_sent_at TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')))` ).run();
  await db.prepare(`CREATE TABLE IF NOT EXISTS sk8_btm_referral_claims (
    referee_id TEXT PRIMARY KEY, referrer_id TEXT NOT NULL, code TEXT NOT NULL,
    token_hash TEXT NOT NULL UNIQUE, status TEXT NOT NULL DEFAULT 'pending',
    claimed_at TEXT NOT NULL DEFAULT (datetime('now')), expires_at TEXT NOT NULL,
    confirmed_at TEXT, last_error TEXT)` ).run();
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_sk8_btm_referral_claims_referrer ON sk8_btm_referral_claims(referrer_id,status)` ).run();
  await db.prepare(`CREATE TABLE IF NOT EXISTS sk8_btm_referral_rewards (
    referrer_id TEXT PRIMARY KEY, status TEXT NOT NULL, token_hash TEXT UNIQUE,
    expires_at TEXT, download_count INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')), accepted_at TEXT, last_error TEXT)` ).run();
}
async function mailer(env,path,options={}){
  const res=await fetch(API+path,{...options,headers:{accept:'application/json',authorization:'Bearer '+String(env.MAILERLITE_API_TOKEN||''),...(options.body?{'content-type':'application/json'}:{})}});
  if(!res.ok)return null;
  return (await res.json().catch(()=>null))?.data||null;
}
async function lookup(env,id){return mailer(env,'/subscribers/'+encodeURIComponent(id));}
async function send(env,to,subject,text,idempotencyKey=''){
  if(!env.RESEND_API_KEY)return false;
  const headers={authorization:'Bearer '+env.RESEND_API_KEY,'content-type':'application/json'};
  if(idempotencyKey)headers['Idempotency-Key']=idempotencyKey;
  const res=await fetch('https://api.resend.com/emails',{method:'POST',headers,
    body:JSON.stringify({from:SENDER,to:[to],subject,text,reply_to:'contact@sk8scoop.com'})});
  return res.ok;
}
// Three verified, independent referrals. Email fulfilment uses the already configured
// transactional sender, NOT the broken MailerLite MCP or a reward automation.
// Resend accepts an idempotency key; the durable D1 row prevents future re-awards.
// One reward per eligible SK8 subscriber. A D1 compare-and-set prevents duplicate
// reward emails; a private R2 object means the paid ZIP is never a public site asset.
async function deliverConfirmedReward(env,referrerId){
  if(env.SK8_BTM_REFERRAL_ENABLED!=='true'||env.SK8_BTM_REWARD_ENABLED!=='true')
    return {ok:false,status:503,error:'Reward fulfilment is disabled.'};
  if(!env.DB||!env.MAILERLITE_API_TOKEN||!env.RESEND_API_KEY||
     !env.BTM_REWARDS||typeof env.BTM_REWARDS.get!=='function'||
     !/^[-a-zA-Z0-9/_\.]+\.zip$/.test(String(env.BTM_REWARD_OBJECT_KEY||'')))
    return {ok:false,status:503,error:'Private digital reward not configured.'};
  await ensure(env.DB);
  const previous=await env.DB.prepare('SELECT status FROM sk8_btm_referral_rewards WHERE referrer_id=?')
    .bind(String(referrerId)).first();
  if(previous?.status==='accepted')return {ok:true,already_awarded:true,delivery_accepted:true};
  if(previous?.status==='processing'||previous?.status==='failed')
    return {ok:false,status:409,error:'Reward requires delivery reconciliation by an administrator.'};
  const referrer=await lookup(env,referrerId);
  if(!isMember(referrer)||!referrer.email)
    return {ok:false,status:409,error:'Referrer must remain an active SK8 Scoop subscriber.'};
  const claims=(await env.DB.prepare(
    "SELECT referee_id FROM sk8_btm_referral_claims WHERE referrer_id=? AND status IN ('confirmed','rewarded') ORDER BY confirmed_at ASC"
  ).bind(String(referrerId)).all())?.results||[];
  if(claims.length<3)return {ok:true,awaiting:true,confirmed:claims.length};
  const identities=new Set([mailboxIdentity(referrer.email)]),qualified=[];
  // Fewer than 100 lookups for one claimant in the pilot; no private addresses
  // are stored in D1 or returned in the public API.
  for(const claim of claims.slice(0,100)){
    const reader=await lookup(env,claim.referee_id);
    if(!isMember(reader)||!reader.email)continue;
    const identity=mailboxIdentity(reader.email);
    if(identities.has(identity))continue;
    identities.add(identity);
    qualified.push(claim.referee_id);
    if(qualified.length===3)break;
  }
  if(qualified.length<3)return {ok:true,awaiting:true,confirmed:qualified.length};
  // Fail closed if the private object does not exist, before issuing any token.
  const file=await env.BTM_REWARDS.head(String(env.BTM_REWARD_OBJECT_KEY));
  if(!file)return {ok:false,status:503,error:'Reward archive has not been uploaded.'};
  const token=tokenString(),digest=await hash(token);
  const expires=new Date(Date.now()+30*24*3600*1000).toISOString();
  const inserted=await env.DB.prepare(
    "INSERT OR IGNORE INTO sk8_btm_referral_rewards(referrer_id,status,token_hash,expires_at) VALUES(?,'processing',?,?)"
  ).bind(String(referrerId),digest,expires).run();
  if(!inserted?.meta?.changes)return {ok:false,status:409,error:'Reward already being processed.'};
  const download='https://www.sk8scoop.com/api/sk8-btm-download?token='+encodeURIComponent(token);
  const letter=[
    'Your Birthday Time Machine is ready.',
    '',
    'Three separate new SK8 Scoop readers joined with your personal code and confirmed their email addresses. You have earned one free digital copy of The Clockmaker’s Archive.',
    '',
    'Download your game here (private link, valid for 30 days):',
    download,
    '',
    'Save the ZIP somewhere safe. Extract it, then open START_HERE.html or 00_START_HERE.html as instructed in the package. The game works offline.',
    'This link supports up to five downloads. If you have trouble opening the game, reply to this email.',
    '',
    'Thank you for helping more local people discover SK8 Scoop.',
    'Paul and Sapura at SK8 Scoop'
  ].join('\n');
  let accepted=false;
  try{accepted=await send(env,referrer.email,'Your Birthday Time Machine is ready',letter,'sk8-btm-3-'+String(referrerId));}
  catch{accepted=false;}
  if(!accepted){
    await env.DB.prepare(
      "UPDATE sk8_btm_referral_rewards SET status='failed',last_error='resend_not_accepted' WHERE referrer_id=? AND status='processing'"
    ).bind(String(referrerId)).run();
    return {ok:false,status:502,error:'Transactional provider did not accept reward email.'};
  }
  await env.DB.prepare(
    "UPDATE sk8_btm_referral_rewards SET status='accepted',accepted_at=datetime('now'),last_error=NULL WHERE referrer_id=? AND status='processing'"
  ).bind(String(referrerId)).run();
  for(const id of qualified)await env.DB.prepare(
    "UPDATE sk8_btm_referral_claims SET status='rewarded' WHERE referee_id=? AND status='confirmed'"
  ).bind(id).run();
  return {ok:true,delivery_accepted:true,delivery_verified:false};
}
export async function downloadSk8BtmReward(request,env){
  if(request.method!=='GET'||!PROD_HOSTS.has(new URL(request.url).hostname))
    return json({error:'Not found.'},404);
  if(env.SK8_BTM_REWARD_ENABLED!=='true'||!env.DB||!env.BTM_REWARDS)
    return json({error:'Unavailable.'},503);
  const token=String(new URL(request.url).searchParams.get('token')||'');
  if(!/^[A-Za-z0-9_-]{35,100}$/.test(token))return json({error:'Invalid link.'},400);
  await ensure(env.DB);
  const digest=await hash(token);
  const row=await env.DB.prepare(
    "SELECT referrer_id,expires_at,download_count FROM sk8_btm_referral_rewards WHERE token_hash=? AND status='accepted'"
  ).bind(digest).first();
  if(!row||Date.parse(row.expires_at)<=Date.now()||Number(row.download_count)>=5)
    return json({error:'This download link has expired or reached its limit.'},410);
  const archive=await env.BTM_REWARDS.get(String(env.BTM_REWARD_OBJECT_KEY||''));
  if(!archive)return json({error:'Download temporarily unavailable.'},503);
  const used=await env.DB.prepare(
    "UPDATE sk8_btm_referral_rewards SET download_count=download_count+1 WHERE referrer_id=? AND status='accepted' AND token_hash=? AND download_count<5"
  ).bind(row.referrer_id,digest).run();
  if(!used?.meta?.changes)return json({error:'Download limit reached.'},410);
  return new Response(archive.body,{status:200,headers:{
    'content-type':'application/zip',
    'content-disposition':'attachment; filename="Birthday_Time_Machine.zip"',
    'cache-control':'private, no-store, max-age=0',
    'content-security-policy':"default-src 'none'",
    'referrer-policy':'no-referrer',
    'x-content-type-options':'nosniff',
    'x-robots-tag':'noindex, nofollow'
  }});
}

async function turnstile(req,env,token){
  if(!env.TURNSTILE_SECRET_KEY||!token)return false;
  const f=new URLSearchParams({secret:env.TURNSTILE_SECRET_KEY,response:token});
  const ip=req.headers.get('CF-Connecting-IP');if(ip)f.set('remoteip',ip);
  const r=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:f});
  if(!r.ok)return false;
  const d=await r.json().catch(()=>null);return d?.success===true&&d.action==='newsletter_signup'&&d.hostname===new URL(req.url).hostname;
}
// Register/retain codes ONLY for successful independently requested SK8 Scoop signups.
export async function registerSk8BtmMember(env,user){
  if(env.SK8_BTM_REFERRAL_ENABLED!=='true'||!env.DB||!validId(user?.id))return {ready:false};
  await ensure(env.DB);
  const old=await env.DB.prepare('SELECT code FROM sk8_btm_referral_codes WHERE subscriber_id=?').bind(String(user.id)).first();
  if(old?.code)return {ready:true,code:old.code};
  const code=makeCode();
  const result=await env.DB.prepare('INSERT OR IGNORE INTO sk8_btm_referral_codes(subscriber_id,code) VALUES (?,?)').bind(String(user.id),code).run();
  if(!result?.meta?.changes){const after=await env.DB.prepare('SELECT code FROM sk8_btm_referral_codes WHERE subscriber_id=?').bind(String(user.id)).first();return {ready:!!after?.code,code:after?.code||null};}
  return {ready:true,code};
}
// The signup API runs this only after MailerLite has confirmed new SK8 Scoop membership.
// Referrals never re-subscribe, alter status, or award points at signup.
export async function recordSk8BtmReferral(env,{referee,claimedCode,existingSk8}){
  if(env.SK8_BTM_REFERRAL_ENABLED!=='true'||!claimedCode)return {pending:false,reason:'disabled_or_unclaimed'};
  if(!env.DB||!validId(referee?.id)||!validCode(claimedCode)||existingSk8)return {pending:false,reason:'ineligible'};
  await ensure(env.DB);
  const owner=await env.DB.prepare('SELECT subscriber_id FROM sk8_btm_referral_codes WHERE code=?').bind(claimedCode).first();
  if(!owner?.subscriber_id||owner.subscriber_id===String(referee.id))return {pending:false,reason:'unrecognised_or_self'};
  const member=await lookup(env,owner.subscriber_id);
  if(!isMember(member))return {pending:false,reason:'referrer_inactive'};
  if(!referee?.email||!member.email||mailboxIdentity(member.email)===mailboxIdentity(referee.email))
    return {pending:false,reason:'same_mailbox'};
  const old=await env.DB.prepare('SELECT status FROM sk8_btm_referral_claims WHERE referee_id=?').bind(String(referee.id)).first();
  if(old)return {pending:old.status==='pending',reason:'existing_claim'};
  const token=tokenString(),digest=await hash(token);
  const expires=new Date(Date.now()+HOURS_48).toISOString();
  const result=await env.DB.prepare(`INSERT OR IGNORE INTO sk8_btm_referral_claims(referee_id,referrer_id,code,token_hash,expires_at)
    VALUES(?,?,?,?,?)`).bind(String(referee.id),owner.subscriber_id,claimedCode,digest,expires).run();
  if(!result?.meta?.changes)return {pending:false,reason:'duplicate'};
  const link='https://www.sk8scoop.com/adventures/birthday-time-machine/refer/confirm/?token='+encodeURIComponent(token);
  const text='You joined SK8 Scoop using a Birthday Time Machine referral code. To confirm your email address and count this signup towards the other reader’s free game, open the link and press Confirm. Your newsletter subscription does not depend on this separate optional verification.\n\n'+link+'\n\nThis link expires in 48 hours. If you did not join SK8 Scoop, ignore this message.';
  const sent=await send(env,referee.email,'Confirm your SK8 Scoop Birthday Time Machine referral',text).catch(()=>false);
  if(!sent)await env.DB.prepare("UPDATE sk8_btm_referral_claims SET last_error='confirmation_delivery_failed' WHERE referee_id=?").bind(String(referee.id)).run();
  return {pending:true,email_sent:sent};
}
export async function requestSk8BtmCode(request,env){
  if(!requireOrigin(request,env))return json({error:'Not available.'},403);
  if(!env.DB||!env.MAILERLITE_API_TOKEN||!env.RESEND_API_KEY)return json({error:'Referral service unavailable.'},503);
  let d;try{d=await request.json()}catch{return json({error:'Invalid request.'},400)};
  const email=normalizeEmail(d.email),token=String(d.turnstile||'');
  if(email.length>254||!/^\S+@\S+\.\S+$/.test(email))return json({error:'Enter a valid email address.'},400);
  if(!await turnstile(request,env,token))return json({error:'Complete the human verification.'},403);
  await ensure(env.DB);
  const user=await lookup(env,email);
  // Same response for registered and unknown accounts; no address enumeration.
  if(!isMember(user))return json({ok:true,message:'If this address receives SK8 Scoop, a code will arrive by email.'});
  // Use the same database clock that records last_sent_at, avoiding timezone
  // parsing differences between Cloudflare runtimes and SQLite.
  const current=await env.DB.prepare(`SELECT code,last_sent_at,
    CASE WHEN last_sent_at IS NOT NULL
           AND datetime(last_sent_at)>datetime('now','-12 hours')
         THEN 1 ELSE 0 END AS sent_recently
    FROM sk8_btm_referral_codes WHERE subscriber_id=?`).bind(String(user.id)).first();
  if(Number(current?.sent_recently)===1)
    return json({ok:true,message:'If this address receives SK8 Scoop, a code will arrive by email.'});
  const record=await registerSk8BtmMember(env,user);
  if(record.ready){
    const code=record.code;
    const signupUrl='https://www.sk8scoop.com/adventures/birthday-time-machine/refer/?ref='+encodeURIComponent(code);
    const emailText=[
       'Your personal Birthday Time Machine referral code is '+code+'.',
       '',
       'Your personal invite link: '+signupUrl,
       '',
       'Share this link with three genuinely new SK8 Scoop readers. They join for free using their own email address, and independently confirm the separate referral-verification email within 48 hours.',
       'After three distinct confirmed referrals, you automatically receive one free digital copy of The Clockmaker’s Archive.',
       '',
       'Existing SK8 readers, self-referrals and duplicate mailboxes do not qualify. Do not send us anyone else’s email address. This does not enrol anyone automatically.',
       'Terms: https://www.sk8scoop.com/adventures/birthday-time-machine/refer/terms/'
     ].join('\n');
    const sent=await send(env,email,'Your SK8 Scoop Birthday Time Machine referral code',emailText).catch(()=>false);
    if(sent)await env.DB.prepare("UPDATE sk8_btm_referral_codes SET last_sent_at=datetime('now') WHERE subscriber_id=?").bind(String(user.id)).run();
  }
  return json({ok:true,message:'If this address receives SK8 Scoop, a code will arrive by email.'});
}
export async function confirmSk8BtmReferral(request,env){
  if(!requireOrigin(request,env))return json({error:'Not available.'},403);
  if(!env.DB)return json({error:'Referral service unavailable.'},503);
  let d;try{d=await request.json()}catch{return json({error:'Invalid confirmation.'},400)};
  const token=String(d.token||'');if(!/^[A-Za-z0-9_-]{35,100}$/.test(token))return json({error:'Invalid or expired link.'},400);
  await ensure(env.DB);
  const digest=await hash(token);
  const claim=await env.DB.prepare('SELECT referee_id,referrer_id,status,expires_at FROM sk8_btm_referral_claims WHERE token_hash=?').bind(digest).first();
  if(!claim||claim.status!=='pending'||Date.parse(claim.expires_at)<=Date.now())return json({error:'This confirmation link has expired or was already used.'},410);
  // Prove mailbox ownership without changing newsletter's single-opt-in setting.
  const user=await lookup(env,claim.referee_id);
  if(!isMember(user))return json({error:'This SK8 Scoop membership is not active.'},409);
  const result=await env.DB.prepare("UPDATE sk8_btm_referral_claims SET status='confirmed',confirmed_at=datetime('now') WHERE token_hash=? AND status='pending'").bind(digest).run();
  if(!result?.meta?.changes)return json({error:'Already confirmed.'},409);
  // Reward processing is independent of newsletter opt-in, and the flag
  // remains OFF until the owner signs off live guide URLs and tests.
  if(env.SK8_BTM_REWARD_ENABLED==='true'){
    try{
      const delivery=await deliverConfirmedReward(env,claim.referrer_id);
      if(!delivery.ok)console.error('sk8_btm_reward_requires_manual_review',delivery.status);
    }catch{console.error('sk8_btm_reward_requires_manual_review',502)}
  }
  return json({ok:true,message:'Your email is confirmed for the optional Birthday Time Machine referral. No other action is needed.'});
}
// Intentionally ADMIN-ONLY and OFF until a real reward URL/email is verified.
// Admin-only fallback for reconciling a failed transactional reward.
// Never bypass independent email confirmation or award twice.
export async function awardSk8BtmReferral(request,env){
  if(request.method!=='POST'||!PROD_HOSTS.has(new URL(request.url).hostname))
    return json({error:'Not found.'},404);
  if(!env.ADMIN_TOKEN||request.headers.get('authorization')!=='Bearer '+env.ADMIN_TOKEN)
    return json({error:'Unauthorised.'},401);
  let body;try{body=await request.json()}catch{return json({error:'Invalid request.'},400)}
  if(!validId(body?.referrer_id))return json({error:'Invalid identifier.'},400);
  const award=await deliverConfirmedReward(env,String(body.referrer_id));
  const {status,ok,...rest}=award;
  return json({ok,...rest},status||200);
}
// Existing daily Worker cron may call this after the pilot is enabled.
// Expired pending claims are removed; reward audit rows expire after one year.
export async function purgeOldSk8BtmRecords(env) {
  if (env.SK8_BTM_REFERRAL_ENABLED !== 'true' || !env.DB) return {skipped:true};
  await ensure(env.DB);
  const oldClaims = await env.DB.prepare(`DELETE FROM sk8_btm_referral_claims
    WHERE (status='pending' AND datetime(expires_at) < datetime('now','-7 days'))
       OR datetime(claimed_at) < datetime('now','-365 days')`).run();
  const oldRewards = await env.DB.prepare(`DELETE FROM sk8_btm_referral_rewards
    WHERE datetime(created_at) < datetime('now','-365 days')`).run();
  return {claims_removed:oldClaims?.meta?.changes||0, rewards_removed:oldRewards?.meta?.changes||0};
}
