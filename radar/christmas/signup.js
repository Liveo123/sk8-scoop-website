(() => {
  'use strict';
  const form=document.getElementById('radar-signup');
  const email=document.getElementById('email'), consent=document.getElementById('consent');
  const status=document.getElementById('form-message'), button=document.getElementById('join-button');
  const token=document.getElementById('turnstile-token'), started=document.getElementById('started-at');
  const source=document.getElementById('source'), box=document.getElementById('turnstile-container');
  const openAfter=document.getElementById('open-after');
  const label=button.textContent;
  const production=new Set(['www.sk8scoop.com','sk8scoop.com']).has(location.hostname)&&location.protocol==='https:';
  let widgetId=null, sending=false, complete=false;
  if(location.protocol==='https:'||location.protocol==='http:') document.querySelectorAll('.guide-link').forEach(a=>a.href='/radar/christmas/guide/');
  function message(text,error=false){status.textContent=text;status.classList.toggle('error',error);}
  function readyButton(){button.disabled=!production||sending||complete||!token.value||widgetId===null;}
  source.value=new URLSearchParams(location.search).get('via')==='sk8'?'sk8_invite':'radar_main';
  started.value=String(Date.now());
  function resetCheck(){token.value='';started.value=String(Date.now());if(window.turnstile&&widgetId!==null){try{window.turnstile.reset(widgetId)}catch(_){}}readyButton();}
  function loadTurnstile(){return new Promise((resolve,reject)=>{
    if(window.turnstile)return resolve(window.turnstile);
    const script=document.createElement('script');script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';script.async=true;
    script.onload=()=>window.turnstile?resolve(window.turnstile):reject(Error('Human check unavailable.'));
    script.onerror=()=>reject(Error('Human check could not load.'));document.head.append(script);
  });}
  form.addEventListener('submit',async event=>{
    event.preventDefault();
    if(!production||sending||complete)return;
    if(!form.reportValidity())return;
    if(!token.value||widgetId===null){message('Please complete the human check before subscribing.',true);return;}
    if(Date.now()-Number(started.value)<1200){message('Please wait a moment, then try again.',true);return;}
    sending=true;readyButton();button.textContent='Joining Radar…';message('');
    try{
      const body=new URLSearchParams(new FormData(form));
      // Ephemeral signed assignment from the shared campaign route; no browser storage.
      const assignment=new URLSearchParams(location.search).get('christmas_assignment');
      if(assignment) body.set('christmas_assignment',assignment);
      const res=await fetch('/api/radar-signup',{method:'POST',credentials:'same-origin',headers:{'content-type':'application/x-www-form-urlencoded'},body});
      const result=await res.json().catch(()=>({}));
      if(!res.ok||result.success!==true)throw Error(result.error||'The sign-up did not complete. Please try again.');
      complete=true;token.value='';email.value='';consent.checked=false;
      message(result.already_subscribed===true?'You are already on the Radar list. No changes were made. Your guide is ready.':'Your Radar subscription is confirmed. Your guide is ready.');
      openAfter.hidden=false;openAfter.focus();
    }catch(error){message(error&&error.message?error.message:'Please try again.',true);resetCheck();}
    finally{sending=false;button.textContent=label;readyButton();}
  });
  // In local files and isolated previews, never initialise the live service.
  if(!production){message('Signup is disabled in this private staging copy. You can still open the guide directly.');return;}
  (async()=>{
    try{
      const res=await fetch('/api/signup-config',{headers:{accept:'application/json'},cache:'no-store'});
      const config=await res.json();if(!res.ok||!config.siteKey)throw Error('Signup verification unavailable.');
      const turnstile=await loadTurnstile();
      widgetId=turnstile.render(box,{sitekey:String(config.siteKey),action:'newsletter_signup',theme:'light',appearance:'always',size:'flexible','response-field':false,
        callback:value=>{token.value=value;message('');readyButton();},
        'expired-callback':()=>{token.value='';message('Human verification expired. Please try again.',true);readyButton();},
        'error-callback':()=>{token.value='';message('Human verification failed. Please retry.',true);readyButton();}});
      readyButton();
    }catch(_){message('Sign-up is temporarily unavailable. Please email contact@sk8scoop.com, or open the guide directly.',true);readyButton();}
  })();
})();
