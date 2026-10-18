// Progressive first-party questionnaires: nothing is sent until the last step.
(function(){
 const form=document.querySelector('[data-sk8-steps]');if(!form)return;
 const steps=Array.from(form.querySelectorAll('.step'));
 let step=0;const progress=form.querySelector('[data-progress]');
 const error=form.querySelector('[data-form-error]'),result=document.querySelector('[data-form-result]');
 const allOptions=(name)=>Array.from(form.querySelectorAll('input[name="'+name+'"]:checked')).map(x=>x.value);
 const checked=(name)=>form.querySelector('input[name="'+name+'"]:checked')?.value||'';
 function show(i){step=i;steps.forEach((x,n)=>x.hidden=n!==step);progress.textContent='Step '+(i+1)+' of '+steps.length;document.querySelectorAll('[data-progress-bar]').forEach((x,n)=>x.classList.toggle('done',n<=i));error.textContent='';form.querySelector('.step:not([hidden]) h2')?.setAttribute('tabindex','-1');form.querySelector('.step:not([hidden]) h2')?.focus();}
 function validate(){const current=steps[step];for(const field of current.querySelectorAll('input[required],select[required]')){if(!field.checkValidity()){field.reportValidity();return false;}}if(form.dataset.kind==='reader'&&step===1){if(!allOptions('interests').length){error.textContent='Please choose at least one topic.';return false;}if(allOptions('interests').length>3){error.textContent='Choose up to three topics.';return false;}const kids=allOptions('children_bands');if(kids.length>1&&(kids.includes('none')||kids.includes('prefer_not'))){error.textContent='Choose age bands or the single “none/prefer not” option.';return false;}}if(form.dataset.kind==='reader'&&step===2){const email=form.querySelector('[name="email"]').value.trim();const consent=form.querySelector('[name="link_profile_consent"]').checked;if(Boolean(email)!==consent){error.textContent='To link responses to your profile, enter your email and tick the optional consent box. Otherwise leave both blank.';return false;}}return true;}
 const back=form.querySelectorAll('[data-back]');back.forEach(b=>b.addEventListener('click',()=>show(step-1)));
 form.querySelectorAll('[data-next]').forEach(b=>b.addEventListener('click',()=>{if(validate())show(step+1)}));
 const start=Date.now();
 form.addEventListener('submit',async function(e){e.preventDefault();if(!validate())return;const btn=form.querySelector('[data-submit]');btn.disabled=true;btn.textContent='SENDING…';error.textContent='';const kind=form.dataset.kind;const raw=Object.fromEntries(new FormData(form).entries());const data={...raw,started_at:start,company_fax:raw.company_fax||'',privacy_acknowledged:!!form.querySelector('[name="privacy_acknowledged"]:checked')};
 if(kind==='reader'){data.children_bands=allOptions('children_bands');data.interests=allOptions('interests');data.link_profile_consent=!!form.querySelector('[name="link_profile_consent"]:checked');}
 else{data.interest=checked('interest');const q=new URLSearchParams(location.search);const campaign=q.get('utm_campaign');const src=q.get('utm_source');data.source=src==='sk8scoop'&&campaign==='issue17'?'newsletter_issue17':('website_'+String(src||'direct').replace(/[^a-z0-9_-]/gi,'').slice(0,40));}
 try{const res=await fetch(form.dataset.endpoint,{method:'POST',headers:{'content-type':'application/json','accept':'application/json'},body:JSON.stringify(data)});const response=await res.json();if(!res.ok)throw new Error(response.error||'Please try again.');form.hidden=true;result.hidden=false;result.querySelector('[data-success-text]').textContent=response.message||'Thank you for taking part.';result.querySelector('[data-success-title]').textContent=response.saved?'Thank you.':'Response received.';result.setAttribute('tabindex','-1');result.focus();}
 catch(err){error.textContent=err.message||'The form did not send. Please try again.';btn.disabled=false;btn.textContent=kind==='reader'?'SEND MY ANSWERS':'SEND MY ENQUIRY';}
 });
 show(0);
})();
