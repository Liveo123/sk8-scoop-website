// Staging candidate: two sequential Christmas experiments; no live change.
// No MailerLite writes, cookies, localStorage, or third-party analytics.
const ENTRY = new Set(['/radar/christmas','/radar/christmas/']);
const HOSTS = new Set(['www.sk8scoop.com','sk8scoop.com']);
const CAMPAIGNS = new Map([
 ['radar_christmas_2026_creative',{stage:'creative',lane:'paid'}],
 ['radar_christmas_2026_creative_qa',{stage:'creative',lane:'qa'}],
 ['radar_christmas_2026_pages',{stage:'pages',lane:'paid'}],
 ['radar_christmas_2026_pages_qa',{stage:'pages',lane:'qa'}]
]);
const CREATIVES=new Set(['nostalgia','curiosity','practical']);
const MAX_AGE = 6 * 60 * 60;
const ENC = new TextEncoder();
const INSERT = `INSERT INTO radar_christmas_experiment_daily (day_utc, lane, stage, creative, variant, arrivals, new_subscriptions) VALUES (?, ?, ?, ?, ?, 1, 0) ON CONFLICT(day_utc, lane, stage, creative, variant) DO UPDATE SET arrivals = arrivals + 1`;
const UPDATE = `UPDATE radar_christmas_experiment_daily SET new_subscriptions = new_subscriptions + 1 WHERE day_utc = ? AND lane = ? AND stage = ? AND creative = ? AND variant = ?`;
const hex = a => Array.from(new Uint8Array(a), v=>v.toString(16).padStart(2,'0')).join('');
const unhex = s => Uint8Array.from(s.match(/../g), x=>parseInt(x,16));
const nowSeconds = () => Math.floor(Date.now()/1000);
const dayOf = sec => new Date(sec*1000).toISOString().slice(0,10);
const privacyOff = request => request.headers.get('sec-gpc')==='1' || request.headers.get('dnt')==='1' || new URL(request.url).searchParams.get('ab_measurement')==='off';
// Bounded clone read. Do not await cancellation of one tee branch before the
// original signup handler consumes the other branch.
async function readSmallForm(request) {
  const clone=request.clone();
  if(!clone.body) return '';
  const reader=clone.body.getReader();
  const parts=[];let size=0;
  while(true) {
    const {done,value}=await reader.read();
    if(done) break;
    size+=value.byteLength;
    if(size>8192){reader.cancel().catch(()=>{});return null;}
    parts.push(value);
  }
  const bytes=new Uint8Array(size);let offset=0;
  for(const part of parts){bytes.set(part,offset);offset+=part.byteLength;}
  return new TextDecoder().decode(bytes);
}
const onHost = url => url.protocol === 'https:' && HOSTS.has(url.hostname);
const configured = env => env.RADAR_CHRISTMAS_AB_ENABLED === 'true' && !!env.DB && typeof env.RADAR_CHRISTMAS_AB_SECRET === 'string' && env.RADAR_CHRISTMAS_AB_SECRET.length >= 32;
const key = env => crypto.subtle.importKey('raw',ENC.encode(env.RADAR_CHRISTMAS_AB_SECRET),{name:'HMAC',hash:'SHA-256'},false,['sign','verify']);
function experimentOf(url) {
  const p=url.searchParams;
  if(p.get('utm_source')!=='meta'||p.get('utm_medium')!=='paid_social'||!['utm_source','utm_medium','utm_campaign','utm_content'].every(k=>p.getAll(k).length===1))return null;
  const campaign=CAMPAIGNS.get(p.get('utm_campaign')), creative=p.get('utm_content');
  return campaign&&CREATIVES.has(creative)?{...campaign,creative}:null;
}
function humanNavigation(request) {
  if (request.method!=='GET') return false;
  const h=request.headers;
  if (/prefetch|prerender/i.test((h.get('purpose')||'')+' '+(h.get('sec-purpose')||''))) return false;
  const dest=h.get('sec-fetch-dest');
  if(dest && dest!=='document') return false;
  if(/facebookexternalhit|facebot|bot\b|crawler|spider|preview|slackbot|discordbot/i.test(h.get('user-agent')||'')) return false;
  return true;
}
async function issue(env, variant, experiment, sec) {
  // Shared, minute-level cohort credential; deliberately not a unique visitor ID.
  const payload=`v2.${variant}.${experiment.lane}.${experiment.stage}.${experiment.creative}.${sec}`;
  return payload+'.'+hex(await crypto.subtle.sign('HMAC',await key(env),ENC.encode(payload)));
}
async function verify(env, token, variant) {
  if(typeof token!=='string' || token.length>200) return null;
  const m=token.match(/^v2\.([AB])\.(paid|qa)\.(creative|pages)\.(nostalgia|curiosity|practical)\.(\d{10})\.([0-9a-f]{64})$/);
  if(!m || m[1]!==variant || (m[3]==='creative'&&m[1]!=='A')) return null;
  const sec=Number(m[5]), age=nowSeconds()-sec;
  if(age<0 || age>MAX_AGE) return null;
  const payload=token.slice(0,token.lastIndexOf('.'));
  if(!await crypto.subtle.verify('HMAC',await key(env),unhex(m[6]),ENC.encode(payload))) return null;
  return {variant:m[1],lane:m[2],stage:m[3],creative:m[4],day:dayOf(sec)};
}
// Shared URL: equal-probability server assignment; preserve campaign query,
// discard any caller-supplied experiment token, and never cache redirects.
export async function christmasEntry(request,env) {
  const url=new URL(request.url);
  if(!ENTRY.has(url.pathname) || !['GET','HEAD'].includes(request.method)) return null;
  const experiment=experimentOf(url);
  // Creative comparison always uses A, including when measurement is off.
  const variant=experiment?.stage==='creative'?'A':crypto.getRandomValues(new Uint8Array(1))[0]%2===0?'A':'B';
  const target=new URL('/radar/christmas/'+variant.toLowerCase(),url.origin);
  target.search=url.search;
  target.searchParams.delete('christmas_assignment');
  if(onHost(url)&&configured(env)&&experiment&&humanNavigation(request)&&!privacyOff(request)) {
    try {
      const sec=Math.floor(nowSeconds()/60)*60;
      const token=await issue(env,variant,experiment,sec);
      await env.DB.prepare(INSERT).bind(dayOf(sec),experiment.lane,experiment.stage,experiment.creative,variant).run();
      target.searchParams.set('christmas_assignment',token);
    } catch {
      // Readers can still access the guide; incomplete measurement must stop paid launch.
      console.error('radar_christmas_ab_arrival_write_failed');
    }
  }
  return new Response(null,{status:302,headers:{location:target.pathname+target.search,'cache-control':'no-store','referrer-policy':'strict-origin'}});
}
// Wrap the EXISTING signup handler. Its explicit success/new-membership response
// is the authority. Honeypot success, duplicates and errors never count.
export async function christmasSignup(request,env,existingHandler) {
  if(!onHost(new URL(request.url)) || !configured(env) || privacyOff(request)) return existingHandler(request,env);
  let attribution=null;
  try {
    // Respect existing request size limit; only inspect the clone.
    if(Number(request.headers.get('content-length')||0)<=8192 && (request.headers.get('content-type')||'').toLowerCase().startsWith('application/x-www-form-urlencoded')) {
      const raw=await readSmallForm(request);
      if(raw!==null){
        const body=new URLSearchParams(raw);
        if(body.getAll('christmas_variant').length===1 && body.getAll('christmas_assignment').length===1) attribution=await verify(env,body.get('christmas_assignment'),body.get('christmas_variant'));
      }
    }
  } catch { console.error('radar_christmas_ab_attribution_unavailable'); }
  const response=await existingHandler(request,env);
  if(attribution && response.ok) {
    try {
      const result=await response.clone().json();
      if(result.success===true && result.already_subscribed===false) {
        const written=await env.DB.prepare(UPDATE).bind(attribution.day,attribution.lane,attribution.stage,attribution.creative,attribution.variant).run();
        if(written.meta?.changes!==1) console.error('radar_christmas_ab_conversion_without_arrival');
      }
    } catch { console.error('radar_christmas_ab_conversion_write_failed'); }
  }
  return response;
}
