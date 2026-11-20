(()=>{'use strict';
const qs=id=>document.getElementById(id);const status=qs('launch-status'),ask=qs('request-form'),join=qs('join-form');
const ref=String(new URLSearchParams(location.search).get('ref')||'').trim().toUpperCase(),valid=/^BTM-[A-HJ-NP-Z2-9]{12}$/.test(ref);
if(valid){qs('missing-code').classList.add('hidden');qs('join-with-code').classList.remove('hidden');qs('claimed-code').value=ref;qs('code-display').textContent=ref;}
let askToken='',joinToken='',askWidget=null,joinWidget=null,turnstile=null;
function say(id,msg,error=false){const s=qs(id);s.textContent=msg;s.classList.toggle('error',error);}
async function loadTurnstile(){
 if(window.turnstile)return window.turnstile;
 return new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';script.async=true;script.onload=()=>window.turnstile?resolve(window.turnstile):reject(Error('Human verification unavailable'));script.onerror=()=>reject(Error('Human verification unavailable'));document.head.append(script);});
}
(async()=>{
 try{
  const rr=await fetch('/api/sk8-btm-referral-status',{cache:'no-store'}),feature=await rr.json();
  if(!rr.ok||feature.enabled!==true){status.textContent='The Birthday Time Machine referral programme is not open yet.';return;}
  const cfg=await fetch('/api/signup-config',{cache:'no-store'}),c=await cfg.json();
  if(!cfg.ok||!c.siteKey)throw Error('Human verification is unavailable');
  turnstile=await loadTurnstile();
  askWidget=turnstile.render('#request-turnstile',{sitekey:c.siteKey,action:'newsletter_signup',size:'flexible','response-field':false,
   callback:t=>{askToken=t;qs('request-submit').disabled=false;},'expired-callback':()=>{askToken='';qs('request-submit').disabled=true;}});
  if(valid)joinWidget=turnstile.render('#join-turnstile',{sitekey:c.siteKey,action:'newsletter_signup',size:'flexible','response-field':false,
   callback:t=>{joinToken=t;qs('join-turnstile-token').value=t;qs('join-submit').disabled=false;},'expired-callback':()=>{joinToken='';qs('join-turnstile-token').value='';qs('join-submit').disabled=true;}});
  status.textContent='The referral programme is open. Both subscriptions and email confirmation are required for a referral to count.';
 }catch{status.textContent='Referrals are temporarily unavailable. Please try again later.';}
})();
ask.addEventListener('submit',async e=>{
 e.preventDefault();if(!ask.reportValidity()||!askToken)return;
 const b=qs('request-submit');b.disabled=true;say('request-status','Checking…');
 try{
  const r=await fetch('/api/sk8-btm-referral-code',{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json'},body:JSON.stringify({email:qs('request-email').value,turnstile:askToken})}),j=await r.json();
  if(!r.ok||j.ok!==true)throw Error(j.error||'Unable to request your link');
  say('request-status',j.message||'Check your inbox for your personal link.');
 }catch(err){say('request-status',err.message||'Please try again.',true);}
 finally{askToken='';if(turnstile&&askWidget!==null)turnstile.reset(askWidget);b.disabled=true;}
});
join.addEventListener('submit',async e=>{
 e.preventDefault();if(!valid||!join.reportValidity()||!joinToken)return;
 const b=qs('join-submit');b.disabled=true;qs('joined-at').value=String(Date.now());say('join-status','Joining…');
 try{
  const r=await fetch('/api/sk8-btm-signup',{method:'POST',credentials:'same-origin',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams(new FormData(join))}),j=await r.json();
  if(!r.ok||j.success!==true)throw Error(j.error||'Signup could not be completed.');
  if(j.already_subscribed===true)say('join-status','This email is already subscribed to SK8 Scoop, so it cannot count as a new referral.');
  else say('join-status','You are subscribed. Please check your inbox and independently confirm the referral email within 48 hours to credit your friend.');
 }catch(err){say('join-status',err.message||'Please try again.',true);}
 finally{joinToken='';qs('join-turnstile-token').value='';if(turnstile&&joinWidget!==null)turnstile.reset(joinWidget);b.disabled=true;}
});
})();