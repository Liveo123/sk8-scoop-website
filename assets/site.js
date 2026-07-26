const menu=document.querySelector('.menu-btn');
const nav=document.querySelector('.nav');
if(menu&&nav){menu.addEventListener('click',()=>{const open=nav.classList.toggle('open');menu.setAttribute('aria-expanded',String(open));menu.textContent=open?'Close':'Menu';});}
document.querySelectorAll('[data-year]').forEach(el=>el.textContent=new Date().getFullYear());

const SK8_CONFIG=window.SK8_CONFIG||{};
window.dataLayer=window.dataLayer||[];
window.gtag=window.gtag||function(){window.dataLayer.push(arguments);};

(function loadAnalytics(){
  const ga4=String(SK8_CONFIG.ga4MeasurementId||'').trim();
  if(ga4&&!document.querySelector('script[data-sk8-ga4]')){
    const s=document.createElement('script');s.async=true;s.src=`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ga4)}`;s.dataset.sk8Ga4='true';document.head.appendChild(s);
    window.gtag('js',new Date());window.gtag('config',ga4,{send_page_view:true});
  }
  const pixel=String(SK8_CONFIG.metaPixelId||'').trim();
  if(pixel&&!window.fbq){
    const f=function(){f.callMethod?f.callMethod.apply(f,arguments):f.queue.push(arguments)};f.queue=[];f.loaded=true;f.version='2.0';window.fbq=f;
    const s=document.createElement('script');s.async=true;s.src='https://connect.facebook.net/en_US/fbevents.js';document.head.appendChild(s);
    window.fbq('init',pixel);window.fbq('track','PageView');
  }
})();

function sk8Track(name,params={}){
  const payload={...params,page_path:location.pathname};
  window.dataLayer.push({event:name,...payload});
  if(typeof window.gtag==='function') window.gtag('event',name,payload);
  if(typeof window.fbq==='function') window.fbq('trackCustom',name,payload);
}
window.sk8Track=sk8Track;

(function pageEvents(){
  const page=document.body.dataset.page||'';
  const names={
    home:'homepage_visit',
    advertise:'advertising_page_visit',
    'summer-guide':'summer_guide_visit',
    'business-submissions':'business_submission_page_visit',
    preferences:'preferences_page_visit',
    'latest-issue':'latest_issue_page_visit',
    'signup-success':'signup_completed'
  };
  if(names[page]) sk8Track(names[page]);

  const observed=new WeakSet();
  const observer='IntersectionObserver' in window?new IntersectionObserver(entries=>entries.forEach(entry=>{
    if(entry.isIntersecting&&!observed.has(entry.target)){
      observed.add(entry.target);
      sk8Track('signup_form_view',{form_position:entry.target.dataset.formPosition||'unknown'});
      observer.unobserve(entry.target);
    }
  }),{threshold:.45}):null;
  document.querySelectorAll('[data-signup-form]').forEach(form=>{
    if(observer) observer.observe(form); else sk8Track('signup_form_view',{form_position:form.dataset.formPosition||'unknown'});
    form.addEventListener('submit',()=>sk8Track('signup_form_submit',{form_position:form.dataset.formPosition||'unknown'}));
  });

  document.addEventListener('click',event=>{
    const link=event.target.closest('a[href]');if(!link)return;
    const eventName=link.dataset.trackEvent;
    const href=link.href||'';
    const params={link_url:href,link_text:(link.textContent||'').trim().slice(0,120),link_location:link.dataset.linkLocation||'unknown'};
    if(eventName) sk8Track(eventName,params);
    try{
      const u=new URL(href,location.href);
      if(link.dataset.campaignLink!==undefined||[...u.searchParams.keys()].some(k=>k.startsWith('utm_'))) sk8Track('campaign_link_click',params);
    }catch(e){}
  });
})();

// Local poster QR attribution. Existing A5 posters use utm_content=poster_01 through poster_25.
(function trackLocalQr(){
  if(document.body.dataset.page!=='localqr') return;
  const p=new URLSearchParams(location.search);
  const rawContent=(p.get('utm_content')||p.get('code')||'generic_localqr').trim().toLowerCase();
  const match=rawContent.match(/poster[_-]?(\d{1,2})/i);
  const posterId=match?String(Number(match[1])).padStart(2,'0'):'';
  const code=posterId?`poster_${posterId}`:rawContent;
  const qr={code,poster_id:posterId,venue:(p.get('venue')||'').trim(),area:(p.get('area')||'SK8').trim(),source:(p.get('utm_source')||'local_business_display').trim(),medium:(p.get('utm_medium')||'qr').trim(),campaign:(p.get('utm_campaign')||'local_displays_2026').trim()};
  try{localStorage.setItem('sk8_qr_source',JSON.stringify({...qr,first_seen:new Date().toISOString()}));}catch(e){}
  document.querySelectorAll('[data-field-code]').forEach(el=>el.value=qr.code);
  document.querySelectorAll('[data-field-venue]').forEach(el=>el.value=qr.venue||'unknown');
  document.querySelectorAll('[data-field-area]').forEach(el=>el.value=qr.area);
  document.querySelectorAll('[data-field-campaign]').forEach(el=>el.value=qr.campaign);
  document.querySelectorAll('[data-field-source]').forEach(el=>el.value=posterId?`Local display poster ${posterId}`:'Local QR - generic print');
  const display=posterId?`Poster ${posterId}`:'General printed QR';
  document.querySelectorAll('[data-display-reference]').forEach(el=>el.textContent=display);
  const chip=document.querySelector('[data-poster-chip]');if(chip&&posterId){chip.hidden=false;chip.textContent=`Poster ${posterId}`;}
  const label=document.querySelector('[data-poster-label]');if(label){label.textContent=posterId?` We recorded this visit against Poster ${posterId}.`:'';}
  const eventData={qr_code:qr.code,poster_id:qr.poster_id||'generic',qr_venue:qr.venue||'unknown',qr_area:qr.area,qr_campaign:qr.campaign,utm_source:qr.source,utm_medium:qr.medium};
  sk8Track('qr_landing_view',eventData);
  const form=document.querySelector('[data-qr-form]');
  if(form) form.addEventListener('submit',()=>{
    try{sessionStorage.setItem('sk8_qr_submit',JSON.stringify({...eventData,submitted_at:new Date().toISOString()}));}catch(e){}
    sk8Track('qr_signup_submit',eventData);
  });
})();

async function sk8LoadQrLocations(){try{const r=await fetch('/assets/qr-locations.json',{cache:'no-store'});return r.ok?await r.json():{};}catch(e){return {};}}

(async function enrichQrVenue(){
  if(document.body.dataset.page!=='localqr') return;
  const p=new URLSearchParams(location.search);const raw=(p.get('utm_content')||p.get('code')||'generic_localqr').toLowerCase();const match=raw.match(/poster[_-]?(\d{1,2})/i);const code=match?`poster_${String(Number(match[1])).padStart(2,'0')}`:raw;
  const map=await sk8LoadQrLocations();const record=map[code]||{};const venue=p.get('venue')||record.venue||'';const area=p.get('area')||record.area||'';
  document.querySelectorAll('[data-field-venue]').forEach(el=>el.value=venue||'unknown');document.querySelectorAll('[data-field-area]').forEach(el=>el.value=area||'SK8');
  const venueLabel=document.querySelector('[data-venue-label]');if(venueLabel&&venue) venueLabel.textContent=`Thanks to ${venue} for displaying SK8 Scoop.`;
  const payload={event_type:'view',qr_code:code,poster_id:match?String(Number(match[1])).padStart(2,'0'):'',venue:venue||'unknown',area:area||'unknown',campaign:p.get('utm_campaign')||'local_displays_2026',source:p.get('utm_source')||'local_business_display',medium:p.get('utm_medium')||'qr',path:location.pathname};
  try{navigator.sendBeacon('/api/qr-event',new Blob([JSON.stringify(payload)],{type:'application/json'}));}catch(e){}
  const form=document.querySelector('[data-qr-form]');if(form) form.addEventListener('submit',()=>{const sub={...payload,event_type:'form_submit',email_domain:(new FormData(form).get('fields[email]')||'').toString().split('@')[1]||''};try{navigator.sendBeacon('/api/qr-event',new Blob([JSON.stringify(sub)],{type:'application/json'}));}catch(e){}});
})();

(function whatsOn(){
  const root=document.querySelector('[data-events-root]');if(!root)return;let events=[];
  const q=document.querySelector('[data-event-search]'),area=document.querySelector('[data-event-area]'),cat=document.querySelector('[data-event-category]'),cost=document.querySelector('[data-event-cost]');
  const esc=s=>String(s||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const render=()=>{const term=(q.value||'').toLowerCase();const filtered=events.filter(e=>e.status!=='example'||location.search.includes('show_examples=1')).filter(e=>(!term||[e.title,e.venue,e.area,e.description].join(' ').toLowerCase().includes(term))&&(!area.value||e.area===area.value)&&(!cat.value||e.category===cat.value)&&(!cost.value||(cost.value==='free'?String(e.cost).toLowerCase()==='free':String(e.cost).toLowerCase()!=='free')));root.innerHTML=filtered.length?filtered.map(e=>{const d=new Date(`${e.date}T12:00:00`);const date=isNaN(d)?e.date:d.toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'});return `<article class="event-card"><div class="event-date"><span>${esc(date.split(' ')[0])}</span><strong>${esc(date.split(' ')[1]||'')}</strong><span>${esc(date.split(' ').slice(2).join(' '))}</span></div><div><span class="tag">${esc(e.category)}</span><h2>${esc(e.title)}</h2><div class="event-meta"><span class="pill">${esc(e.area)}</span><span class="pill">${esc(e.venue)}</span><span class="pill">${esc(e.cost)}</span>${e.time?`<span class="pill">${esc(e.time)}</span>`:''}</div><p>${esc(e.description)}</p>${e.booking_url?`<a class="button secondary" href="${esc(e.booking_url)}" rel="noopener" data-campaign-link>Check details</a>`:''}</div></article>`}).join(''):'<div class="empty-state"><h2>No approved events match yet.</h2><p>Try clearing the filters, or submit useful local information for review.</p></div>';};
  fetch('/data/events.json').then(r=>r.json()).then(data=>{events=data;[...new Set(events.map(e=>e.area).filter(Boolean))].sort().forEach(v=>area.insertAdjacentHTML('beforeend',`<option>${esc(v)}</option>`));[...new Set(events.map(e=>e.category).filter(Boolean))].sort().forEach(v=>cat.insertAdjacentHTML('beforeend',`<option>${esc(v)}</option>`));render();}).catch(()=>root.innerHTML='<div class="empty-state">Events could not be loaded.</div>');
  [q,area,cat,cost].forEach(el=>el.addEventListener('input',render));
})();

(function apiForm(){
  document.querySelectorAll('[data-api-form]').forEach(form=>form.addEventListener('submit',async ev=>{
    ev.preventDefault();const status=form.querySelector('[data-form-status]');const btn=form.querySelector('button[type=submit]');btn.disabled=true;status.className='status-box show';status.textContent='Sending…';
    try{const formData=new FormData(form);const data={};for(const [k,v] of formData.entries()){if(data[k]) data[k]=Array.isArray(data[k])?[...data[k],v]:[data[k],v];else data[k]=v;}const r=await fetch(form.action,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(data)});const out=await r.json();if(!r.ok)throw new Error(out.error||'Submission failed');status.className='status-box show success';status.textContent=out.message||'Thank you. Your submission has been received for review.';const successEvent=form.dataset.successEvent;if(successEvent) sk8Track(successEvent,{form_action:form.action});form.reset();}
    catch(e){status.className='status-box show error';status.textContent='This could not be sent automatically. Please email contact@sk8scoop.com instead.';}finally{btn.disabled=false;}
  }));
})();

(function paymentPage(){
  const root=document.querySelector('[data-payment-root]');if(!root)return;const key=new URLSearchParams(location.search).get('package')||'local_spotlight';
  const names={local_spotlight:'Local Spotlight',monthly_partner:'Monthly Partner',category_partner:'Category Partner'};const prices={local_spotlight:'£35',monthly_partner:'£79 per month',category_partner:'£129 per month'};
  const selected=names[key]?key:'local_spotlight';root.querySelector('[data-package-name]').textContent=names[selected];root.querySelector('[data-package-price]').textContent=prices[selected];
  const link=(SK8_CONFIG.stripeLinks&&SK8_CONFIG.stripeLinks[selected])||'';const pay=root.querySelector('[data-pay-link]');if(link){pay.href=link;pay.hidden=false;}else{root.querySelector('[data-payment-pending]').hidden=false;}
})();

(function qrDashboard(){
  const root=document.querySelector('[data-qr-dashboard]');if(!root)return;const token=document.querySelector('[data-admin-token]');const status=document.querySelector('[data-dashboard-status]');const body=document.querySelector('[data-dashboard-body]');
  const load=async()=>{status.textContent='Loading…';try{const r=await fetch('/api/qr-stats',{headers:{authorization:`Bearer ${token.value}`}});const out=await r.json();if(!r.ok)throw new Error(out.error||'Failed');document.querySelector('[data-total-views]').textContent=out.totals.views||0;document.querySelector('[data-total-submits]').textContent=out.totals.form_submits||0;document.querySelector('[data-live-posters]').textContent=out.totals.live_posters||0;document.querySelector('[data-conversion]').textContent=out.totals.views?`${Math.round(out.totals.form_submits/out.totals.views*100)}%`:'0%';body.innerHTML=out.rows.map(r=>`<tr><td>${r.poster_id||'Generic'}</td><td>${r.venue||'Unknown'}</td><td>${r.area||'—'}</td><td>${r.views||0}</td><td>${r.form_submits||0}</td><td>${r.views?Math.round(r.form_submits/r.views*100):0}%</td><td>${r.last_seen||'—'}</td></tr>`).join('');status.textContent='Aggregate scan data loaded. Confirmed subscriber counts should be reconciled from MailerLite.';}catch(e){status.textContent='Enter the admin token configured in Cloudflare to load private statistics.';}};
  document.querySelector('[data-load-dashboard]').addEventListener('click',load);
})();


// v7 public statistics: one dated source in config, reused across pages.
(function renderPublicStats(){
  const stats=SK8_CONFIG.publicStats||{};
  const values={
    subscriberCount:stats.subscriberCount||'',
    subscriberCountPlus:stats.subscriberCount?`${stats.subscriberCount}+`:'',
    issuesPublished:stats.issuesPublished||'',
    latestOpenRate:stats.latestOpenRate||'',
    latestClickRate:stats.latestClickRate||'',
    checkedDate:stats.checkedDate||''
  };
  document.querySelectorAll('[data-stat]').forEach(el=>{const key=el.dataset.stat;if(values[key]!==undefined&&values[key]!=='')el.textContent=values[key];});
})();

// Close mobile menu after a navigation choice and on Escape.
if(menu&&nav){
  nav.addEventListener('click',e=>{if(e.target.closest('a')&&nav.classList.contains('open')){nav.classList.remove('open');menu.setAttribute('aria-expanded','false');menu.textContent='Menu';}});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&nav.classList.contains('open')){nav.classList.remove('open');menu.setAttribute('aria-expanded','false');menu.textContent='Menu';menu.focus();}});
}

// Track meaningful starts, package choices and standard lead/contact signals only after confirmed actions.
(function v7ConversionTracking(){
  document.querySelectorAll('form').forEach(form=>{
    let started=false;
    form.addEventListener('focusin',()=>{
      if(started)return;started=true;
      const kind=form.dataset.formKind|| (form.matches('[data-signup-form]')?'newsletter_signup':'other');
      sk8Track('form_start',{form_kind:kind,form_position:form.dataset.formPosition||'unknown'});
    });
  });
  document.querySelectorAll('[data-package-choice]').forEach(link=>link.addEventListener('click',()=>{
    const select=document.querySelector('#campaign-enquiry select[name="package"]');
    if(select){select.value=link.dataset.packageChoice;select.dispatchEvent(new Event('change',{bubbles:true}));}
    sk8Track('advertiser_package_click',{package:link.dataset.packageChoice});
  }));
  const packageSection=document.querySelector('#packages');
  if(packageSection&&'IntersectionObserver' in window){
    let fired=false;const observer=new IntersectionObserver(entries=>{if(!fired&&entries.some(e=>e.isIntersecting)){fired=true;sk8Track('advertiser_packages_view');observer.disconnect();}},{threshold:.3});observer.observe(packageSection);
  }
  document.addEventListener('change',e=>{
    if(e.target.matches('select[name="package"]')) sk8Track('advertiser_package_selected',{package:e.target.value||'none'});
    if(e.target.matches('select[name="submission_type"]')) sk8Track('business_submission_type_selected',{submission_type:e.target.value||'none'});
  });
})();

// v7.3: keep the header "Join free" action in place instead of jumping down the homepage.
(function signupModal(){
  const triggers=[...document.querySelectorAll('.nav-join,[data-open-signup]')];
  if(!triggers.length)return;
  const modal=document.createElement('div');
  modal.className='signup-modal';
  modal.hidden=true;
  modal.innerHTML=`<div class="signup-modal-backdrop" data-close-signup></div>
    <section class="signup-modal-card" role="dialog" aria-modal="true" aria-labelledby="signup-modal-title">
      <button class="signup-modal-close" type="button" aria-label="Close signup" data-close-signup>×</button>
      <div class="signup-modal-art"><span>FRIDAY</span><strong>The useful local stuff, before the group chat asks.</strong><small>Cheadle · Cheadle Hulme · Gatley · Heald Green</small></div>
      <div class="signup-modal-copy">
        <div class="eyebrow">Join 260+ local readers</div>
        <h2 id="signup-modal-title">Get the free Friday Scoop.</h2>
        <p>Weekend plans, useful updates, new openings and money-saving local ideas in one quick email.</p>
        <form class="signup signup-modal-form" action="https://assets.mailerlite.com/jsonp/2462354/forms/193724501149615325/subscribe" method="post" target="_blank" data-signup-form data-form-position="modal">
          <label class="sr-only" for="modal-email">Email address</label>
          <input id="modal-email" type="email" name="fields[email]" inputmode="email" autocomplete="email" placeholder="Your email address" required>
          <button class="button" type="submit">Send me the free Friday Scoop</button>
        </form>
        <small>Local, useful and free. No spam. Unsubscribe whenever you like. <a href="/privacy.html">Privacy</a>.</small>
      </div>
    </section>`;
  document.body.appendChild(modal);
  let lastTrigger=null;
  const open=trigger=>{
    lastTrigger=trigger;modal.hidden=false;document.body.classList.add('modal-open');
    requestAnimationFrame(()=>{modal.classList.add('is-open');const input=modal.querySelector('input[type=email]');if(input)input.focus();});
    sk8Track('signup_modal_open',{trigger_location:trigger.closest('header')?'header':'page'});
  };
  const close=()=>{
    modal.classList.remove('is-open');document.body.classList.remove('modal-open');
    setTimeout(()=>{modal.hidden=true;if(lastTrigger)lastTrigger.focus();},180);
  };
  triggers.forEach(trigger=>trigger.addEventListener('click',event=>{event.preventDefault();open(trigger);}));
  modal.querySelectorAll('[data-close-signup]').forEach(el=>el.addEventListener('click',close));
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!modal.hidden)close();});
})();
