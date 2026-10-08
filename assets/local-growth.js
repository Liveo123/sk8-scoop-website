/* SK8 Local Growth pilot interaction and enquiry. No automatic payment or subscription. */
(() => {
  'use strict';
  const examples = {
    quotes: {
      number:'01', overline:'HOME IMPROVEMENT', headline:'A better first step than “get in touch”.',
      description:'Make the free quotation the focus. Explain what the customer should send, how to ask and what happens next.',
      action:'Request a quotation →',
      measure:'Visits to the enquiry route and quotation requests that the business can actually confirm.'
    },
    bookings: {
      number:'02', overline:'VENUES & APPOINTMENTS', headline:'Give people a reason to book this week.',
      description:'Put the actual offer, available dates and booking route first. Remove the steps that get between interest and action.',
      action:'Check availability →',
      measure:'Visits to the booking route and confirmed bookings, if the business can identify them.'
    },
    classes: {
      number:'03', overline:'CLASSES & MEMBERSHIPS', headline:'Turn “that looks good” into a first session.',
      description:'Explain who the class is for, when it runs and the simplest way to try it. Keep the next step obvious.',
      action:'Enquire about a place →',
      measure:'Class-page visits and real trial-session enquiries or sign-ups reported by the organiser.'
    }
  };
  const nodes = {
    number:document.getElementById('lg-example-number'),
    overline:document.getElementById('lg-example-overline'),
    headline:document.getElementById('lg-example-headline'),
    description:document.getElementById('lg-example-description'),
    action:document.getElementById('lg-example-action'),
    measure:document.getElementById('lg-example-measure')
  };
  document.querySelectorAll('[data-lg-example]').forEach(btn => {
    btn.addEventListener('click',() => {
      const name=btn.getAttribute('data-lg-example');
      const example=examples[name];
      if(!example) return;
      Object.keys(nodes).forEach(key=>{if(nodes[key]) nodes[key].textContent=example[key]});
      document.querySelectorAll('[data-lg-example]').forEach(other=>{
        const active=other===btn; other.classList.toggle('is-active',active);
        other.setAttribute('aria-pressed',active?'true':'false');
      });
      if(typeof window.sk8Track==='function') window.sk8Track('local_growth_example_selected',{goal:name});
    });
  });
  document.querySelectorAll('[data-lg-cta]').forEach(link=>link.addEventListener('click',()=>{
    if(typeof window.sk8Track==='function') window.sk8Track('local_growth_enquiry_cta_click',{position:link.dataset.lgCta});
  }));
  const form=document.getElementById('lg-enquiry-form');
  if(!form) return;
  const status=document.getElementById('lg-form-status');
  const button=form.querySelector('button[type=submit]');
  form.elements.sk8_started_at.value=String(Date.now());
  function message(text,kind) {
    if(!status)return;
    status.hidden=false;status.textContent=text;status.dataset.kind=kind||'error';
  }
  form.addEventListener('submit',async event=>{
    event.preventDefault();
    if(!form.reportValidity())return;
    if(form.elements.company_fax.value.trim())return;
    const data=Object.fromEntries(new FormData(form).entries());
    data.advert_copy=[
      'SK8 LOCAL GROWTH PILOT ENQUIRY',
      'Goal: '+String(data.campaign_goal||'').slice(0,120),
      'Offer / service: '+String(data.campaign_details||'').slice(0,650)
    ].join('\n');
    delete data.campaign_goal;
    delete data.campaign_details;
    delete data.company_fax;
    button.disabled=true; message('Sending your pilot enquiry…','pending');
    if(typeof window.sk8Track==='function')window.sk8Track('local_growth_enquiry_attempt',{route:'pilot'});
    try{
      const response=await fetch(form.action,{
        method:'POST',
        headers:{'content-type':'application/json','accept':'application/json'},
        body:JSON.stringify(data),
        credentials:'same-origin'
      });
      const output=await response.json().catch(()=>({}));
      if(!response.ok)throw new Error(output.error||'Unable to save the enquiry.');
      message('Thanks. Your enquiry has been saved for review. No payment has been taken. We will check fit and reply using your contact details.','success');
      if(typeof window.sk8Track==='function')window.sk8Track('local_growth_enquiry_success',{route:'pilot'});
      form.reset(); form.elements.sk8_started_at.value=String(Date.now());
    }catch(error){
      message('The form could not be completed: '+String(error.message||'unexpected error')+' You can email contact@sk8scoop.com instead.','error');
      if(typeof window.sk8Track==='function')window.sk8Track('form_error',{form_kind:'local_growth_pilot',error_type:'api_submission_failed'});
    }finally{button.disabled=false}
  });
})();
