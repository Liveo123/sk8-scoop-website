// South Manchester Radar: one qualified referral earns the four-adventure Atlas.
// Independent referral confirmation is NOT the newsletter opt-in mechanism.
// All mutations are disabled unless RADAR_REFERRAL_ENABLED is explicitly true.
const RADAR_GROUP = '202394374779176114';
const CODE_RE = /^R[A-HJ-NP-Z2-9]{12}$/;
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const API = 'https://connect.mailerlite.com/api';
const PROD_HOSTS = new Set(['www.sk8scoop.com', 'sk8scoop.com']);
const SENDER = 'South Manchester Radar <alerts@notify.sk8scoop.com>';
const HOURS_48 = 48 * 3600 * 1000;
const json = (value, status=200) => new Response(JSON.stringify(value), {status, headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','referrer-policy':'no-referrer','x-content-type-options':'nosniff'}});
const validId = id => /^\d{7,22}$/.test(String(id||''));
const validCode = code => CODE_RE.test(String(code||''));
const normalizeEmail = email => String(email||'').trim().toLowerCase();
const isMember = user => !!user && user.status === 'active' && (user.groups||[]).some(g => String(g.id)===RADAR_GROUP);
const makeCode = () => { const r=crypto.getRandomValues(new Uint8Array(12));return 'R'+Array.from(r,b=>ALPHABET[b&31]).join(''); };
const tokenString = () => btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32)))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
async function hash(token){const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token));return Array.from(new Uint8Array(b)).map(x=>x.toString(16).padStart(2,'0')).join('');}
function requireOrigin(req,env){
  const url=new URL(req.url);const origin=req.headers.get('origin');const site=req.headers.get('sec-fetch-site');
  if(req.method!=='POST'||!PROD_HOSTS.has(url.hostname)||env.RADAR_REFERRAL_ENABLED!=='true')return false;
  return !!origin && origin===url.origin && (!site||['same-origin','none'].includes(site));
}
async function ensure(db){
  await db.prepare(`CREATE TABLE IF NOT EXISTS radar_referral_codes (
    subscriber_id TEXT PRIMARY KEY, code TEXT NOT NULL UNIQUE,
    last_sent_at TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')))` ).run();
  await db.prepare(`CREATE TABLE IF NOT EXISTS radar_referral_claims (
    referee_id TEXT PRIMARY KEY, referrer_id TEXT NOT NULL, code TEXT NOT NULL,
    token_hash TEXT NOT NULL UNIQUE, status TEXT NOT NULL DEFAULT 'pending',
    claimed_at TEXT NOT NULL DEFAULT (datetime('now')), expires_at TEXT NOT NULL,
    confirmed_at TEXT, last_error TEXT)` ).run();
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_radar_referral_claims_referrer ON radar_referral_claims(referrer_id,status)` ).run();
  await db.prepare(`CREATE TABLE IF NOT EXISTS radar_referral_rewards (
    referrer_id TEXT PRIMARY KEY, referee_id TEXT NOT NULL UNIQUE, status TEXT NOT NULL,
    claimed_at TEXT NOT NULL DEFAULT (datetime('now')), accepted_at TEXT, last_error TEXT)` ).run();
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
function validGuideUrl(value){
  try{const url=new URL(String(value||''));return url.protocol==='https:'&&!url.username&&!url.password}
  catch{return false}
}
// One verified, independent referral. Email fulfilment uses the already configured
// transactional sender, NOT the broken MailerLite MCP or a reward automation.
// Resend accepts an idempotency key; the durable D1 row prevents future re-awards.
async function deliverConfirmedReward(env,refereeId){
  if(env.RADAR_REFERRAL_ENABLED!=='true'||env.RADAR_REFERRAL_REWARD_ENABLED!=='true')
    return {ok:false,status:503,error:'Reward fulfilment is disabled.'};
  if(!env.DB||!env.MAILERLITE_API_TOKEN||!env.RESEND_API_KEY||
    !validGuideUrl(env.RADAR_GUIDE_WEB_URL)||!validGuideUrl(env.RADAR_GUIDE_PDF_URL))
    return {ok:false,status:503,error:'Reward fulfilment is not configured.'};
  await ensure(env.DB);
  const claim=await env.DB.prepare(
    'SELECT referee_id,referrer_id,status,confirmed_at FROM radar_referral_claims WHERE referee_id=?'
  ).bind(String(refereeId)).first();
  if(!claim)return {ok:false,status:409,error:'A confirmed referral is required.'};
  const previous=await env.DB.prepare('SELECT status FROM radar_referral_rewards WHERE referrer_id=?')
    .bind(claim.referrer_id).first();
  if(previous?.status==='accepted')return {ok:true,already_awarded:true,delivery_accepted:true,delivery_verified:false};
  if(claim.status!=='confirmed'||!claim.confirmed_at)
    return {ok:false,status:409,error:'Independent email confirmation is required.'};
  if(claim.referee_id===claim.referrer_id)
    return {ok:false,status:409,error:'Self-referrals do not qualify.'};
  const [referrer,referee]=await Promise.all([lookup(env,claim.referrer_id),lookup(env,claim.referee_id)]);
  if(!isMember(referrer)||!isMember(referee))
    return {ok:false,status:409,error:'Both readers must still be active Radar subscribers.'};
  if(previous?.status==='processing')
    return {ok:false,status:409,error:'Reward requires delivery reconciliation.'};
  if(!previous){
    const created=await env.DB.prepare(
      "INSERT OR IGNORE INTO radar_referral_rewards(referrer_id,referee_id,status) VALUES(?,?,'processing')"
    ).bind(claim.referrer_id,claim.referee_id).run();
    if(!created?.meta?.changes)
      return {ok:false,status:409,error:'This reward was already claimed.'};
  }else{
    const changed=await env.DB.prepare(
      "UPDATE radar_referral_rewards SET status='processing',last_error=NULL WHERE referrer_id=? AND status='failed'"
    ).bind(claim.referrer_id).run();
    if(!changed?.meta?.changes)
      return {ok:false,status:409,error:'Reward needs manual review.'};
  }
  const text=[
    'Your South Manchester Adventure Atlas is ready.',
    '',
    'One new reader has independently confirmed their Radar referral, so you have earned the four-adventure edition.',
    '',
    'Open the illustrated web guide: '+env.RADAR_GUIDE_WEB_URL,
    'Download the dated PDF: '+env.RADAR_GUIDE_PDF_URL,
    '',
    'Inside: Creepy Carnival, Mission: Mad Hatter, a flying lap at the velodrome, and a seasonal Mersey kayaking adventure.',
    'Mersey kayaking normally operates April to September; river conditions and individual bookings can change.',
    'Check current provider prices, age rules and availability before travelling. The activities themselves may cost money.',
    '',
    'This is the digital guide reward you earned, not a new newsletter signup.',
    'Questions? contact@sk8scoop.com'
  ].join('\n');
  let accepted=false;
  try{
    accepted=await send(env,referrer.email,'Your four South Manchester adventures are ready',text,
      'radar-atlas-four-'+claim.referrer_id);
  }catch{accepted=false}
  if(!accepted){
    await env.DB.prepare(
      "UPDATE radar_referral_rewards SET status='failed',last_error='transactional_email_not_accepted' WHERE referrer_id=? AND status='processing'"
    ).bind(claim.referrer_id).run();
    return {ok:false,status:502,error:'Reward email was not accepted; safe to review before retry.'};
  }
  await env.DB.prepare(
    "UPDATE radar_referral_rewards SET status='accepted',accepted_at=datetime('now'),last_error=NULL WHERE referrer_id=? AND status='processing'"
  ).bind(claim.referrer_id).run();
  await env.DB.prepare(
    "UPDATE radar_referral_claims SET status='rewarded' WHERE referee_id=? AND status='confirmed'"
  ).bind(claim.referee_id).run();
  return {ok:true,delivery_accepted:true,delivery_verified:false,
    message:'Reward email accepted by the transactional provider; delivery not yet confirmed.'};
}
async function turnstile(req,env,token){
  if(!env.TURNSTILE_SECRET_KEY||!token)return false;
  const f=new URLSearchParams({secret:env.TURNSTILE_SECRET_KEY,response:token});
  const ip=req.headers.get('CF-Connecting-IP');if(ip)f.set('remoteip',ip);
  const r=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:f});
  if(!r.ok)return false;
  const d=await r.json().catch(()=>null);return d?.success===true&&d.action==='newsletter_signup'&&d.hostname===new URL(req.url).hostname;
}
// Register/retain codes ONLY for successful independently requested Radar signups.
export async function registerRadarMember(env,user){
  if(env.RADAR_REFERRAL_ENABLED!=='true'||!env.DB||!validId(user?.id))return {ready:false};
  await ensure(env.DB);
  const old=await env.DB.prepare('SELECT code FROM radar_referral_codes WHERE subscriber_id=?').bind(String(user.id)).first();
  if(old?.code)return {ready:true,code:old.code};
  let code=String(user.fields?.radar_referral_code||'').toUpperCase();
  if(!validCode(code))code=makeCode();
  const result=await env.DB.prepare('INSERT OR IGNORE INTO radar_referral_codes(subscriber_id,code) VALUES (?,?)').bind(String(user.id),code).run();
  if(!result?.meta?.changes){const after=await env.DB.prepare('SELECT code FROM radar_referral_codes WHERE subscriber_id=?').bind(String(user.id)).first();return {ready:!!after?.code,code:after?.code||null};}
  return {ready:true,code};
}
// The signup API runs this AFTER MailerLite has confirmed a new Radar membership.
// Referrals never re-subscribe, alter status, or award points at signup.
export async function recordRadarReferral(env,{referee,claimedCode,existingRadar}){
  if(env.RADAR_REFERRAL_ENABLED!=='true'||!claimedCode)return {pending:false,reason:'disabled_or_unclaimed'};
  if(!env.DB||!validId(referee?.id)||!validCode(claimedCode)||existingRadar)return {pending:false,reason:'ineligible'};
  await ensure(env.DB);
  const owner=await env.DB.prepare('SELECT subscriber_id FROM radar_referral_codes WHERE code=?').bind(claimedCode).first();
  if(!owner?.subscriber_id||owner.subscriber_id===String(referee.id))return {pending:false,reason:'unrecognised_or_self'};
  const member=await lookup(env,owner.subscriber_id);
  if(!isMember(member))return {pending:false,reason:'referrer_inactive'};
  const old=await env.DB.prepare('SELECT status FROM radar_referral_claims WHERE referee_id=?').bind(String(referee.id)).first();
  if(old)return {pending:old.status==='pending',reason:'existing_claim'};
  const token=tokenString(),digest=await hash(token);
  const expires=new Date(Date.now()+HOURS_48).toISOString();
  const result=await env.DB.prepare(`INSERT OR IGNORE INTO radar_referral_claims(referee_id,referrer_id,code,token_hash,expires_at)
    VALUES(?,?,?,?,?)`).bind(String(referee.id),owner.subscriber_id,claimedCode,digest,expires).run();
  if(!result?.meta?.changes)return {pending:false,reason:'duplicate'};
  const link='https://www.sk8scoop.com/radar/referral/confirm/?token='+encodeURIComponent(token);
  const text='You used a South Manchester Radar referral code when you subscribed. To confirm that this is your email address and count your signup for the other reader’s free four-adventure guide, open the link below and press Confirm. Your newsletter subscription does not depend on doing this.\n\n'+link+'\n\nThis link expires in 48 hours. If you did not sign up for Radar, ignore this message and contact contact@sk8scoop.com.';
  const sent=await send(env,referee.email,'Confirm your Radar referral',text).catch(()=>false);
  if(!sent)await env.DB.prepare("UPDATE radar_referral_claims SET last_error='confirmation_delivery_failed' WHERE referee_id=?").bind(String(referee.id)).run();
  return {pending:true,email_sent:sent};
}
export async function requestReferralCode(request,env){
  if(!requireOrigin(request,env))return json({error:'Not available.'},403);
  if(!env.DB||!env.MAILERLITE_API_TOKEN||!env.RESEND_API_KEY)return json({error:'Referral service unavailable.'},503);
  let d;try{d=await request.json()}catch{return json({error:'Invalid request.'},400)};
  const email=normalizeEmail(d.email),token=String(d.turnstile||'');
  if(email.length>254||!/^\S+@\S+\.\S+$/.test(email))return json({error:'Enter a valid email address.'},400);
  if(!await turnstile(request,env,token))return json({error:'Complete the human verification.'},403);
  await ensure(env.DB);
  const user=await lookup(env,email);
  // Same response for registered and unknown accounts; no address enumeration.
  if(!isMember(user))return json({ok:true,message:'If this address is subscribed to Radar, a code will arrive by email.'});
  const current=await env.DB.prepare('SELECT code,last_sent_at FROM radar_referral_codes WHERE subscriber_id=?').bind(String(user.id)).first();
  if(current?.last_sent_at && Date.now()-Date.parse(current.last_sent_at.replace(' ','T')+'Z')<12*3600000)
    return json({ok:true,message:'If this address is subscribed to Radar, a code will arrive by email.'});
  const record=await registerRadarMember(env,user);
  if(record.ready){
    const code=record.code;
    const sent=await send(env,email,'Your South Manchester Radar referral code',
      'Your personal Radar referral code is '+code+'.\n\nWhen one genuinely new Radar reader voluntarily enters that code when joining the newsletter and confirms their own email address, you can unlock the South Manchester Adventure Atlas (four outings).\n\nThe programme is optional. Please do not provide other people’s contact details to Radar. Terms: https://www.sk8scoop.com/radar/referral/terms/').catch(()=>false);
    if(sent)await env.DB.prepare("UPDATE radar_referral_codes SET last_sent_at=datetime('now') WHERE subscriber_id=?").bind(String(user.id)).run();
  }
  return json({ok:true,message:'If this address is subscribed to Radar, a code will arrive by email.'});
}
export async function confirmReferral(request,env){
  if(!requireOrigin(request,env))return json({error:'Not available.'},403);
  if(!env.DB)return json({error:'Referral service unavailable.'},503);
  let d;try{d=await request.json()}catch{return json({error:'Invalid confirmation.'},400)};
  const token=String(d.token||'');if(!/^[A-Za-z0-9_-]{35,100}$/.test(token))return json({error:'Invalid or expired link.'},400);
  await ensure(env.DB);
  const digest=await hash(token);
  const claim=await env.DB.prepare('SELECT referee_id,status,expires_at FROM radar_referral_claims WHERE token_hash=?').bind(digest).first();
  if(!claim||claim.status!=='pending'||Date.parse(claim.expires_at)<=Date.now())return json({error:'This confirmation link has expired or was already used.'},410);
  // Prove mailbox ownership without changing newsletter's single-opt-in setting.
  const user=await lookup(env,claim.referee_id);
  if(!isMember(user))return json({error:'This Radar membership is not active.'},409);
  const result=await env.DB.prepare("UPDATE radar_referral_claims SET status='confirmed',confirmed_at=datetime('now') WHERE token_hash=? AND status='pending'").bind(digest).run();
  if(!result?.meta?.changes)return json({error:'Already confirmed.'},409);
  // Reward processing is independent of newsletter opt-in, and the flag
  // remains OFF until the owner signs off live guide URLs and tests.
  if(env.RADAR_REFERRAL_REWARD_ENABLED==='true'){
    try{
      const delivery=await deliverConfirmedReward(env,claim.referee_id);
      if(!delivery.ok)console.error('radar_reward_requires_manual_review',delivery.status);
    }catch{console.error('radar_reward_requires_manual_review',502)}
  }
  return json({ok:true,message:'Your email is confirmed for the referral reward. No other action is needed.'});
}
// Intentionally ADMIN-ONLY and OFF until a real reward URL/email is verified.
// Admin-only fallback for reconciling a failed transactional reward.
// Never bypass independent email confirmation or award twice.
export async function awardReferral(request,env){
  if(request.method!=='POST'||!PROD_HOSTS.has(new URL(request.url).hostname))
    return json({error:'Not found.'},404);
  if(!env.ADMIN_TOKEN||request.headers.get('authorization')!=='Bearer '+env.ADMIN_TOKEN)
    return json({error:'Unauthorised.'},401);
  let body;try{body=await request.json()}catch{return json({error:'Invalid request.'},400)}
  if(!validId(body?.referee_id))return json({error:'Invalid identifier.'},400);
  const award=await deliverConfirmedReward(env,String(body.referee_id));
  const {status,ok,...rest}=award;
  return json({ok,...rest},status||200);
}
// Existing daily Worker cron may call this after the pilot is enabled.
// Expired pending claims are removed; reward audit rows expire after one year.
export async function purgeOldRadarReferralRecords(env) {
  if (env.RADAR_REFERRAL_ENABLED !== 'true' || !env.DB) return {skipped:true};
  await ensure(env.DB);
  const oldClaims = await env.DB.prepare(`DELETE FROM radar_referral_claims
    WHERE (status='pending' AND datetime(expires_at) < datetime('now','-7 days'))
       OR datetime(claimed_at) < datetime('now','-365 days')`).run();
  const oldRewards = await env.DB.prepare(`DELETE FROM radar_referral_rewards
    WHERE datetime(claimed_at) < datetime('now','-365 days')`).run();
  return {claims_removed:oldClaims?.meta?.changes||0, rewards_removed:oldRewards?.meta?.changes||0};
}
