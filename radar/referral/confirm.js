(()=>{'use strict';const b=document.getElementById('confirm'),s=document.getElementById('status');const token=new URLSearchParams(location.search).get('token')||'';
// Remove token from visible URL, history, browser referral metadata and subsequent navigations.
history.replaceState(null,'',location.pathname);
if(!/^[A-Za-z0-9_-]{35,100}$/.test(token)){b.disabled=true;s.textContent='This confirmation link is invalid or has expired.';return;}
b.addEventListener('click',async()=>{b.disabled=true;s.textContent='Checking confirmation…';try{const r=await fetch('/api/radar-referral-confirm',{method:'POST',headers:{'content-type':'application/json'},credentials:'same-origin',body:JSON.stringify({token})});const d=await r.json();if(!r.ok)throw Error(d.error||'Could not confirm.');s.textContent=d.message;b.hidden=true;}catch(e){s.textContent=e.message}});
})();