(()=>{'use strict';
const b=document.getElementById('confirm'),s=document.getElementById('status');
const token=new URLSearchParams(location.search).get('token')||'';
history.replaceState(null,'',location.pathname);
if(!/^[A-Za-z0-9_-]{35,100}$/.test(token)){b.disabled=true;s.textContent='This confirmation link is invalid or has expired.';return;}
b.addEventListener('click',async()=>{
 b.disabled=true;s.textContent='Checking confirmation…';
 try{const r=await fetch('/api/sk8-btm-referral-confirm',{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json'},body:JSON.stringify({token})}),j=await r.json();
 if(!r.ok||j.ok!==true)throw Error(j.error||'Confirmation could not be completed');
 s.textContent=j.message||'Your referral was confirmed. Thank you.';b.hidden=true;
 }catch(e){s.textContent=e.message||'Please try again.';b.disabled=false;}
});
})();