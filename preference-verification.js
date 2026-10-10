const FIELDS=[
  'families_children','events','food_drink','offers_savings',
  'home_property','pets_outdoors','practical_updates'
];
const VALID_EMAIL=/^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const okJson=(value,status=200)=>new Response(JSON.stringify(value),{
  status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'}
});
const html=(heading,message,status=200,button='')=>new Response(
  '<!doctype html><html lang="en-GB"><head><meta charset="utf-8">'+
  '<meta name="viewport" content="width=device-width,initial-scale=1">'+
  '<meta name="robots" content="noindex,nofollow"><title>SK8 Scoop email interests</title>'+
  '<style>body{font:1.1rem/1.6 system-ui,sans-serif;color:#123d45;background:#f8faf9;margin:0;padding:3rem 1rem}'+
  'main{max-width:570px;margin:0 auto;padding:2rem;background:#fff;border:1px solid #ddd;border-radius:18px}'+
  'button{background:#075965;color:white;border:0;border-radius:9px;padding:.85rem 1.2rem;font:inherit;cursor:pointer}</style>'+
  '</head><body><main><h1>'+heading+'</h1><p>'+message+'</p>'+button+
  '<p><a href="https://www.sk8scoop.com/privacy">Privacy notice</a></p></main></body></html>',
  {status,headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store',
    // A strict-origin policy keeps the one-time token out of Referer without turning form POST Origin into null.
    'referrer-policy':'strict-origin','x-content-type-options':'nosniff','x-robots-tag':'noindex, nofollow'}}
);
function matchesOrigin(request){
  const origin=request.headers.get('origin');
  if(!origin)return true;
  try{return new URL(origin).origin===new URL(request.url).origin;}catch{return false;}
}
async function hashToken(token) {
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token));
  return [...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('');
}
function newToken(){
  return [...crypto.getRandomValues(new Uint8Array(24))]
    .map(x=>x.toString(16).padStart(2,'0')).join('');
}
async function ensure(db){
  await db.prepare('CREATE TABLE IF NOT EXISTS pending_interest_confirmations (token_hash TEXT PRIMARY KEY, email TEXT NOT NULL, interests_json TEXT NOT NULL, created_at TEXT NOT NULL, expires_at TEXT NOT NULL, used_at TEXT)').run();
  await db.prepare('CREATE INDEX IF NOT EXISTS idx_pending_interest_email_time ON pending_interest_confirmations(email,created_at)').run();
  await db.prepare('CREATE TABLE IF NOT EXISTS verified_subscriber_preferences (email TEXT PRIMARY KEY, families_children INTEGER NOT NULL DEFAULT 0, events INTEGER NOT NULL DEFAULT 0, food_drink INTEGER NOT NULL DEFAULT 0, offers_savings INTEGER NOT NULL DEFAULT 0, home_property INTEGER NOT NULL DEFAULT 0, pets_outdoors INTEGER NOT NULL DEFAULT 0, practical_updates INTEGER NOT NULL DEFAULT 0, verified_at TEXT NOT NULL)').run();
}
export async function startPreferenceVerification(request,env){
  if(!matchesOrigin(request))return okJson({error:'Invalid request origin.'},403);
  if(!env.DB || !env.RESEND_API_KEY)return okJson({error:'Preference confirmation is temporarily unavailable. Please email contact@sk8scoop.com.'},503);
  let d;try{d=await request.json();}catch{return okJson({error:'Invalid form submission.'},400);}
  if(String(d.company_website||'').trim())return okJson({message:'Check your email for a confirmation link.'});
  const email=String(d.email||'').trim().toLowerCase();
  if(email.length>200||!VALID_EMAIL.test(email))return okJson({error:'Please provide a valid email address.'},400);
  if(String(d.preference_consent||'')!=='yes')return okJson({error:'Please confirm that you want these interests saved.'},400);
  const interests=FIELDS.map(f=>String(d[f]||'')==='yes'?1:0);
  await ensure(env.DB);
  await env.DB.prepare("DELETE FROM pending_interest_confirmations WHERE expires_at < datetime('now','-2 days')").run();
  const recent=await env.DB.prepare("SELECT COUNT(*) AS amount FROM pending_interest_confirmations WHERE email=? AND created_at > datetime('now','-30 minutes')").bind(email).first();
  if(Number(recent?.amount||0)>=2)return okJson({message:'If confirmation was requested recently, please check your inbox before trying again.'});
  const volume=await env.DB.prepare("SELECT COUNT(*) AS amount FROM pending_interest_confirmations WHERE created_at > datetime('now','-1 hour')").first();
  if(Number(volume?.amount||0)>=50)return okJson({error:'Preference confirmation is temporarily busy. Please try again later.'},429);
  const token=newToken(),hash=await hashToken(token);
  await env.DB.prepare("INSERT INTO pending_interest_confirmations(token_hash,email,interests_json,created_at,expires_at,used_at) VALUES(?,?,?,datetime('now'),datetime('now','+30 minutes'),NULL)")
    .bind(hash,email,JSON.stringify(interests)).run();
  const url=new URL('/api/confirm-preferences',request.url);
  url.searchParams.set('token',token);
  const result=await fetch('https://api.resend.com/emails',{
    method:'POST',
    headers:{authorization:'Bearer '+env.RESEND_API_KEY,'content-type':'application/json'},
    body:JSON.stringify({
      from:'SK8 Scoop <alerts@notify.sk8scoop.com>',
      to:[email],reply_to:'contact@sk8scoop.com',
      subject:'Confirm your SK8 Scoop email interests',
      text:'To confirm your optional SK8 Scoop interests, open this link and press Confirm:\n'+url.toString()+'\n\nThis link expires after 30 minutes. If you did not request it, ignore this email. This does not subscribe you to a newsletter.\n\nSK8 Scoop, operated by Paul Livesey trading as JiveLoop.'
    })
  }).catch(()=>null);
  if(!result?.ok){
    await env.DB.prepare('DELETE FROM pending_interest_confirmations WHERE token_hash=?').bind(hash).run();
    return okJson({error:'The confirmation email could not be sent. Please try again later.'},503);
  }
  return okJson({message:'Please check your inbox for a confirmation link. Your interests will be saved only after you confirm.',pending:true});
}
export function renderPreferenceConfirmation(request){
  const token=new URL(request.url).searchParams.get('token')||'';
  if(!/^[0-9a-f]{48}$/.test(token))
    return html('Invalid confirmation link','Please request a fresh confirmation from the SK8 Scoop email interests page.',400);
  const button='<form method="POST" action="/api/confirm-preferences">'+
    '<input type="hidden" name="token" value="'+token+'">'+
    '<button type="submit">Confirm my email interests</button></form>';
  return html('Confirm your SK8 Scoop interests',
    'These optional choices will be saved only after confirmation. They do not subscribe you to the newsletter.',200,button);
}
export async function finishPreferenceVerification(request,env){
  if(!matchesOrigin(request))return html('Request rejected','This request came from an unexpected website.',403);
  if(!env.DB)return html('Service unavailable','Please try again later.',503);
  let form;try{form=await request.formData();}catch{return html('Invalid request','Please request another link.',400);}
  const token=String(form.get('token')||'');
  if(!/^[0-9a-f]{48}$/.test(token))return html('Invalid link','Please request another link.',400);
  await ensure(env.DB);
  const hash=await hashToken(token);
  const row=await env.DB.prepare("SELECT email, interests_json FROM pending_interest_confirmations WHERE token_hash=? AND used_at IS NULL AND expires_at > datetime('now')").bind(hash).first();
  if(!row)return html('Link expired or already used','Please return to the SK8 Scoop email interests page and request a fresh confirmation.',410);
  let values;try{values=JSON.parse(row.interests_json);}catch{return html('Invalid request','Please request another link.',400);}
  if(!Array.isArray(values)||values.length!==FIELDS.length||values.some(v=>v!==0&&v!==1))
    return html('Invalid request','Please request another link.',400);
  const claim=await env.DB.prepare("UPDATE pending_interest_confirmations SET used_at=datetime('now') WHERE token_hash=? AND used_at IS NULL AND expires_at > datetime('now')").bind(hash).run();
  if(Number(claim?.meta?.changes)!==1)return html('Link already used','Please request another link if you need to make changes.',410);
  try {
    await env.DB.prepare("INSERT INTO verified_subscriber_preferences(email,families_children,events,food_drink,offers_savings,home_property,pets_outdoors,practical_updates,verified_at) VALUES(?,?,?,?,?,?,?,?,datetime('now')) ON CONFLICT(email) DO UPDATE SET families_children=excluded.families_children,events=excluded.events,food_drink=excluded.food_drink,offers_savings=excluded.offers_savings,home_property=excluded.home_property,pets_outdoors=excluded.pets_outdoors,practical_updates=excluded.practical_updates,verified_at=excluded.verified_at")
      .bind(row.email,...values).run();
  } catch(err) {
    // Restore the link if saving fails, allowing a legitimate retry.
    await env.DB.prepare("UPDATE pending_interest_confirmations SET used_at=NULL WHERE token_hash=? AND used_at >= datetime('now','-1 minute')").bind(hash).run();
    throw err;
  }
  return html('Your interests are confirmed','Your optional choices have been saved. Thank you for helping make SK8 Scoop more useful.');
}
