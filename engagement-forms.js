// Issue 17: two deliberately separate, opt-in SK8 Scoop workflows.
// Called from worker-business-v2.js, preserving the existing poll system.
const inbox = 'contact@sk8scoop.com';
const areas = ['cheadle','cheadle_hulme','gatley','heald_green','nearby','stockport_elsewhere','further_afield','prefer_not'];
const ages = ['under_25','25_34','35_44','45_54','55_64','65_plus','prefer_not'];
const relations = ['live','work','visit','former_resident','prefer_not'];
const children = ['none','under_5','age_5_11','age_12_16','age_17_plus','prefer_not'];
const interests = ['daily_updates','free_cheap','weekend_events','family','food_drink','history','walks_outdoors','clubs_classes','offers'];
const goals = ['enquiries','bookings','visits','awareness','not_sure'];
const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const output = (data, status=200) => new Response(JSON.stringify(data), {status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'}});
const trim = (x,max=150) => String(x??'').trim().slice(0,max);
function sameOrigin(req){const origin=req.headers.get('origin');if(!origin)return true;try{return new URL(origin).origin===new URL(req.url).origin}catch{return false}}
async function requestJson(req){if(Number(req.headers.get('content-length')||0)>14000)throw new Error('Submission is too large.');try{return await req.json()}catch{throw new Error('Please refresh the page and try again.')}}
function timing(d){const t=Number(d.started_at);const elapsed=Date.now()-t;return Number.isFinite(elapsed)&&t>0&&elapsed>=1200&&elapsed<=6*60*60*1000}
function validOne(x,allowed){return allowed.includes(x)}
function multi(x,allowed,limit){return Array.isArray(x)&&x.length<=limit&&x.every(v=>allowed.includes(v))&&new Set(x).size===x.length}
function formError(error,status=400){return output({error},status)}
async function notifyOwner(notify,to,subject,text){try{return await notify(to,subject,text)}catch(e){return {status:'failed',code:'EMAIL_ERROR'}}}
async function sha256(value){const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));return Array.from(new Uint8Array(bytes)).map(v=>v.toString(16).padStart(2,'0')).join('')}
function newToken(){return Array.from(crypto.getRandomValues(new Uint8Array(32))).map(v=>v.toString(16).padStart(2,'0')).join('')}
function requiredDb(env){return env&&env.DB}
async function verifiedFieldSync(env,email,profile){
  if(!env.MAILERLITE_API_TOKEN)return 'not_configured';
  const auth={authorization:'Bearer '+env.MAILERLITE_API_TOKEN,accept:'application/json'};
  try {
    // GET never creates or resubscribes a contact. Only current active members can be updated.
    const found=await fetch('https://connect.mailerlite.com/api/subscribers/'+encodeURIComponent(email),{headers:auth});
    if(found.status===404)return 'not_existing_subscriber';
    if(!found.ok)return 'lookup_failed';
    const subscriber=(await found.json()).data;
    if(subscriber.status!=='active'||!subscriber.id)return 'not_active';
    const fieldsResp=await fetch('https://connect.mailerlite.com/api/fields?limit=100',{headers:auth});
    if(!fieldsResp.ok)return 'field_lookup_failed';
    const keys=new Set(((await fieldsResp.json()).data||[]).map(item=>item.key));
    const values={sk8_area:profile.area,sk8_age_band:profile.age_band,sk8_relationship:profile.relationship,sk8_children:profile.children_bands.join(','),sk8_interests:profile.interests.join(',')};
    // Do not partially update attributes if the required custom fields are not configured.
    if(Object.keys(values).some(k=>!keys.has(k)))return 'fields_missing';
    const update=await fetch('https://connect.mailerlite.com/api/subscribers/'+encodeURIComponent(subscriber.id),{method:'PUT',headers:{...auth,'content-type':'application/json'},body:JSON.stringify({fields:values})});
    return update.ok?'synced':'update_failed';
  }catch{return 'connection_failed'}
}

export async function handleEngagementForms(req,env,{notify}){
 const url=new URL(req.url); const path=url.pathname;
 if(!['/api/advertiser-interest','/api/reader-demographics','/api/reader-demographics/confirm','/api/reader-demographics/summary'].includes(path))return null;
 if(!requiredDb(env))return formError('This form is not available yet. Please try later.',503);
 if(!sameOrigin(req))return formError('Invalid form origin.',403);
 if(path==='/api/reader-demographics/summary'){
   if(req.method!=='GET')return formError('Method not allowed.',405);
   const secret=trim(env.ADMIN_TOKEN,250);
   if(!secret||req.headers.get('authorization')!=='Bearer '+secret)return formError('Not authorised.',401);
   try{
     const rows=await env.DB.prepare('SELECT area,age_band,relationship,children_bands,interests FROM sk8_reader_demographics').all();
     const counts={area:{},age_band:{},relationship:{},children_bands:{},interests:{}};
     for(const item of rows.results||[]){for(const k of Object.keys(counts)){const vals=k==='children_bands'||k==='interests'?JSON.parse(item[k]||'[]'):[item[k]];for(const val of vals)counts[k][val]=(counts[k][val]||0)+1}}
     return output({total:(rows.results||[]).length,counts,sample:'Self-selected respondents only, not representative of all subscribers.'});
   }catch{return formError('Statistics unavailable until the database migration is applied.',503)}
 }
 if(req.method!=='POST')return formError('Method not allowed.',405);
 let d;try{d=await requestJson(req)}catch(e){return formError(e.message)}
 if(trim(d.company_fax,200))return output({message:'Thank you. Your response has been recorded.'});
 if(!timing(d))return formError('Please refresh this page and try again.');
 if(d.privacy_acknowledged!==true)return formError('Please read and acknowledge the privacy notice.');
 if(path==='/api/advertiser-interest'){
   const name=trim(d.business_name,180),area=trim(d.area,75),interest=trim(d.interest,60),contact=trim(d.contact_name,120),email=trim(d.email,200).toLowerCase(),phone=trim(d.phone,60),notes=trim(d.notes,450);
   if(!name||!validOne(interest,goals)||!emailRegex.test(email))return formError('Please provide your business name, one advertising goal and a valid contact email.');
   try{
     const last=await env.DB.prepare("SELECT COUNT(*) AS n FROM sk8_advertiser_interest WHERE email=? AND created_at>datetime('now','-1 day')").bind(email).first();
     if(Number(last?.n||0)>=3)return formError('Thanks. That address has already sent several enquiries today; please email us directly.',429);
     const all=await env.DB.prepare("SELECT COUNT(*) AS n FROM sk8_advertiser_interest WHERE created_at>datetime('now','-1 hour')").first();
     if(Number(all?.n||0)>=70)return formError('The form is busy. Please email contact@sk8scoop.com.',429);
     const ins=await env.DB.prepare("INSERT INTO sk8_advertiser_interest(business_name,area,interest,notes,contact_name,email,phone,source,notification_status,created_at) VALUES(?,?,?,?,?,?,?,?,?,datetime('now'))").bind(name,area,interest,notes,contact,email,phone,trim(d.source,60)||'newsletter_issue17','pending').run();
     const id=ins.meta?.last_row_id;
     const txt=['New SK8 Scoop advertiser discovery enquiry','', 'Business: '+name, 'Area: '+(area||'Not stated'),'Goal: '+interest, 'Contact: '+(contact||'Not stated'),'Email: '+email,'Telephone: '+(phone||'Not stated'),'Additional information: '+(notes||'None'), 'Source: '+(trim(d.source,60)||'newsletter_issue17'),'Enquiry ID: '+id,'','No payment has been taken. Suitability and pricing need human review.'].join('\n');
     const result=await notifyOwner(notify,inbox,'SK8 Scoop advertiser enquiry: '+name,txt);
     const status=result.status==='sent'?'sent':'failed';
     // A notification audit-write failure must not misreport a successfully saved enquiry.
     try {
       await env.DB.prepare("UPDATE sk8_advertiser_interest SET notification_status=?,notified_at=CASE WHEN ?='sent' THEN datetime('now') ELSE NULL END WHERE id=?").bind(status,status,id).run();
     } catch (error) {
       console.error('Advertiser enquiry was saved; notification-status update failed', error);
     }
     return output({saved:true,emailed:status==='sent',message:status==='sent'?'Thanks. Your enquiry has been received by SK8 Scoop.':'Thanks. Your enquiry was saved, but the email notification is delayed. You can also email contact@sk8scoop.com.'});
   }catch(e){return formError('We could not save the enquiry. Please email contact@sk8scoop.com.',503)}
 }
 if(path==='/api/reader-demographics'){
   const area=trim(d.area,40),relationship=trim(d.relationship,40)||'prefer_not',age=trim(d.age_band,40)||'prefer_not';
   const kids=d.children_bands||[],interest=d.interests||[],email=trim(d.email,200).toLowerCase(),consent=d.link_profile_consent===true;
   if(!validOne(area,areas)||!validOne(age,ages)||!validOne(relationship,relations)||!multi(kids,children,5)||!multi(interest,interests,3)||interest.length<1)return formError('Check your area, age option and up to three interests.');
   if(kids.includes('none')&&kids.length>1||kids.includes('prefer_not')&&kids.length>1)return formError('Choose either no children, prefer not to say, or relevant age bands.');
   if((email&&!emailRegex.test(email))||!!email!==consent)return formError('To link results to your newsletter profile, provide your email and explicitly agree to that optional step.');
   try{
     if(consent){
       const recent=await env.DB.prepare("SELECT COUNT(*) AS n FROM sk8_demographics_confirmations WHERE email=? AND created_at>datetime('now','-1 hour')").bind(email).first();
       if(Number(recent?.n||0)>=2)return formError('Please check for a recent confirmation email before trying again.',429);
       const volume=await env.DB.prepare("SELECT COUNT(*) AS n FROM sk8_demographics_confirmations WHERE created_at>datetime('now','-1 hour')").first();
       if(Number(volume?.n||0)>=60)return formError('Email confirmation is temporarily busy. You may submit without an email instead.',429);
     }
     const ins=await env.DB.prepare("INSERT INTO sk8_reader_demographics(area,relationship,age_band,children_bands,interests,link_consent,link_status,created_at) VALUES(?,?,?,?,?,?,?,datetime('now'))").bind(area,relationship,age,JSON.stringify(kids),JSON.stringify(interest),consent?1:0,consent?'pending_email':'anonymous').run();
     const id=ins.meta?.last_row_id;
     if(!consent)return output({saved:true,linked:false,message:'Thank you. Your anonymous answers have been recorded.'});
     const token=newToken(),hash=await sha256(token);
     await env.DB.prepare("INSERT INTO sk8_demographics_confirmations(token_hash,response_id,email,expires_at,created_at) VALUES(?,?,?,datetime('now','+2 days'),datetime('now'))").bind(hash,id,email).run();
     const confirmUrl=new URL('/reader-survey/verify/',req.url);confirmUrl.searchParams.set('token',token);
     const msg=['Thank you for completing the SK8 Scoop reader survey.','', 'To link your voluntary answers to your existing subscription, confirm this email address:',confirmUrl.toString(),'', 'The link expires after 48 hours. If you did not request this, ignore it.','SK8 Scoop'].join('\n');
     const res=await notifyOwner(notify,email,'Confirm your optional SK8 Scoop reader survey profile',msg);
     if(res.status!=='sent')return output({saved:true,linked:false,message:'Your answers were saved. The optional confirmation email could not be delivered; no subscriber record has been changed.'});
     return output({saved:true,linked:false,confirmation_sent:true,message:'Thanks. Please check your email to confirm before we link these answers to your subscriber profile.'});
   }catch(e){return formError('Sorry, answers could not be saved. Please try again later.',503)}
 }
 if(path==='/api/reader-demographics/confirm'){
   const token=trim(d.token,90);if(!/^[a-f0-9]{64}$/.test(token))return formError('This link is invalid.');
   try{
     const hash=await sha256(token),pending=await env.DB.prepare("SELECT response_id,email FROM sk8_demographics_confirmations WHERE token_hash=? AND used_at IS NULL AND expires_at>datetime('now')").bind(hash).first();
     if(!pending)return formError('This confirmation link has expired or already been used.',410);
     const prof=await env.DB.prepare('SELECT area,relationship,age_band,children_bands,interests FROM sk8_reader_demographics WHERE id=? AND link_consent=1').bind(pending.response_id).first();
     if(!prof)return formError('This response no longer exists.',410);
     const snapshot={...prof,children_bands:JSON.parse(prof.children_bands),interests:JSON.parse(prof.interests)};
     // Record confirmation separately so temporary MailerLite failures do not erase verified consent.
     await env.DB.prepare("UPDATE sk8_reader_demographics SET linked_email=?,confirmed_at=COALESCE(confirmed_at,datetime('now')),link_status='verified_pending_sync' WHERE id=?").bind(pending.email,pending.response_id).run();
     const sync=await verifiedFieldSync(env,pending.email,snapshot);
     await env.DB.prepare('UPDATE sk8_reader_demographics SET link_status=? WHERE id=?').bind(sync,pending.response_id).run();
     const terminal=['synced','not_existing_subscriber','not_active'].includes(sync);
     // Preserve retry eligibility for recoverable API and field-configuration failures.
     if(terminal) {
       const update=await env.DB.prepare("UPDATE sk8_demographics_confirmations SET used_at=datetime('now') WHERE token_hash=? AND used_at IS NULL").bind(hash).run();
       if(!update.meta||update.meta.changes!==1)return formError('Already confirmed.',410);
     }
     const message=sync==='synced'
       ? 'Email confirmed. Your preferences were added to your existing subscriber profile.'
       : sync==='not_existing_subscriber'||sync==='not_active'
         ? 'Email confirmed, but there is no active SK8 Scoop subscription at that address. No subscriber profile was changed.'
         : 'Email confirmed. Your answers are saved, but the profile update is temporarily pending. You may retry while the link remains valid.';
     return output({confirmed:true,message,profile_sync:sync==='synced'?'updated':sync,can_retry:!terminal});
   }catch(e){return formError('Unable to confirm at present. Please contact SK8 Scoop.',503)}
 }
 return formError('Not found.',404);
}
