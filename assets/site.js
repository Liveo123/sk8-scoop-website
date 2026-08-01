const menu=document.querySelector('.menu-btn');
const nav=document.querySelector('.nav');
const setMenuLabel=(open)=>{if(!menu)return;menu.setAttribute('aria-expanded',String(open));const label=menu.querySelector('span:last-child');if(label)label.textContent=open?'Close':'Menu';else menu.textContent=open?'Close':'Menu';};
if(menu&&nav){menu.addEventListener('click',()=>{const open=nav.classList.toggle('open');setMenuLabel(open);});}
document.querySelectorAll('[data-year]').forEach(el=>el.textContent=new Date().getFullYear());

const SK8_CONFIG=window.SK8_CONFIG||{};
const SK8_CONSENT_KEY='sk8_privacy_choices_v1';
const SK8_CONSENT_DAYS=90;
const readConsent=()=>{
  try{
    const choice=JSON.parse(localStorage.getItem(SK8_CONSENT_KEY)||'null');
    if(!choice||choice.version!==1||!choice.expiresAt||Date.now()>choice.expiresAt){
      localStorage.removeItem(SK8_CONSENT_KEY);
      return null;
    }
    return choice;
  }catch(e){return null;}
};
let sk8Consent=readConsent();
let ga4Loaded=false;
let metaLoaded=false;

function loadAnalytics(){
  const ga4=String(SK8_CONFIG.ga4MeasurementId||'').trim();
  if(sk8Consent&&sk8Consent.analytics&&/^G-[A-Z0-9]+$/i.test(ga4)&&!ga4Loaded){
    ga4Loaded=true;
    window.dataLayer=window.dataLayer||[];
    window.gtag=window.gtag||function(){window.dataLayer.push(arguments);};
    window.gtag('consent','default',{
      analytics_storage:'granted',
      ad_storage:'denied',
      ad_user_data:'denied',
      ad_personalization:'denied'
    });
    const s=document.createElement('script');s.async=true;s.src=`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ga4)}`;s.dataset.sk8Ga4='true';document.head.appendChild(s);
    window.gtag('js',new Date());window.gtag('config',ga4,{
      send_page_view:true,
      allow_google_signals:false,
      allow_ad_personalization_signals:false,
      content_group:'SK8 Scoop website',
      transport_type:'beacon'
    });
  }
  const pixel=String(SK8_CONFIG.metaPixelId||'').trim();
  if(sk8Consent&&sk8Consent.marketing&&/^\d{10,20}$/.test(pixel)&&!metaLoaded){
    metaLoaded=true;
    const f=function(){f.callMethod?f.callMethod.apply(f,arguments):f.queue.push(arguments)};f.queue=[];f.loaded=true;f.version='2.0';window.fbq=f;
    const s=document.createElement('script');s.async=true;s.src='https://connect.facebook.net/en_US/fbevents.js';document.head.appendChild(s);
    window.fbq('init',pixel);window.fbq('track','PageView');
  }
}
loadAnalytics();

const sk8PageContext=()=>({
  page_name:document.body.dataset.page||'unknown',
  page_title:document.title,
  page_location:location.href,
  page_path:location.pathname,
  content_group:'SK8 Scoop website'
});
function sk8Track(name,params={}){
  const payload={...sk8PageContext(),...params};
  if(sk8Consent&&sk8Consent.analytics&&typeof window.gtag==='function') window.gtag('event',name,payload);
  if(sk8Consent&&sk8Consent.marketing&&typeof window.fbq==='function') window.fbq('trackCustom',name,payload);
}
window.sk8Track=sk8Track;

const sk8PageEventName=()=>{
  const page=document.body.dataset.page||'';
  return {
    home:'homepage_visit',
    advertise:'advertising_page_visit',
    'summer-guide':'summer_guide_visit',
    'business-submissions':'business_submission_page_visit',
    preferences:'preferences_page_visit',
    'latest-issue':'latest_issue_page_visit',
    about:'about_page_visit',
    archive:'archive_page_visit',
    'submit-event':'event_submission_page_visit',
    'whats-on':'whats_on_page_visit',
    'summer-guide-success':'summer_guide_signup_completed',
    'signup-success':'signup_completed'
  }[page]||'';
};
const sk8TrackCurrentPage=()=>{const name=sk8PageEventName();if(name)sk8Track(name);};

(function pageEvents(){
  sk8TrackCurrentPage();

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
      const linkDomain=u.hostname||'';
      const detailedParams={...params,link_domain:linkDomain};
      if(u.protocol==='mailto:') sk8Track('contact_click',{...detailedParams,contact_method:'email',link_url:'mailto:contact@sk8scoop.com'});
      else if(u.protocol==='tel:') sk8Track('contact_click',{...detailedParams,contact_method:'telephone',link_url:'telephone'});
      else if(u.origin!==location.origin) sk8Track('outbound_click',detailedParams);
      if(/(^|\.)preview\.mailerlite\.io$/i.test(linkDomain)&&eventName!=='latest_issue_click') sk8Track('latest_issue_click',detailedParams);
      if(/(^|\.)facebook\.com$/i.test(linkDomain)) sk8Track('social_click',{...detailedParams,social_network:'Facebook'});
      if(link.dataset.campaignLink!==undefined||[...u.searchParams.keys()].some(k=>k.startsWith('utm_'))) sk8Track('campaign_link_click',params);
    }catch(e){}
  });
})();

(function privacyChoices(){
  const panel=document.createElement('section');
  panel.className='privacy-choices';
  panel.hidden=true;
  panel.setAttribute('role','dialog');
  panel.setAttribute('aria-label','Privacy choices');
  panel.innerHTML=`<div class="privacy-choices-copy">
      <strong>Choose how this site measures visits</strong>
      <p>Optional Google Analytics helps improve SK8 Scoop. Meta Pixel measures Facebook advertising. Neither loads unless you allow it. <a href="/privacy.html">Privacy details</a>.</p>
    </div>
    <div class="privacy-choices-actions" data-privacy-summary>
      <button class="privacy-button allow" type="button" data-consent-all>Allow both</button>
      <button class="privacy-button reject" type="button" data-consent-none>Reject optional</button>
      <button class="privacy-text-button" type="button" data-consent-choose>Choose separately</button>
    </div>
    <div class="privacy-choices-settings" data-privacy-settings hidden>
      <label><input type="checkbox" data-consent-analytics> <span><strong>Google Analytics</strong><small>Page visits, referrals and useful actions.</small></span></label>
      <label><input type="checkbox" data-consent-marketing> <span><strong>Meta Pixel</strong><small>Facebook advert measurement and audience building.</small></span></label>
      <div class="privacy-settings-actions">
        <button class="privacy-button allow" type="button" data-consent-save>Save choices</button>
        <button class="privacy-text-button" type="button" data-consent-back>Back</button>
      </div>
    </div>`;
  document.body.appendChild(panel);

  const launcher=document.createElement('button');
  launcher.className='privacy-choices-launcher';
  launcher.type='button';
  launcher.textContent='Privacy choices';
  launcher.hidden=true;
  document.body.appendChild(launcher);

  const summary=panel.querySelector('[data-privacy-summary]');
  const settings=panel.querySelector('[data-privacy-settings]');
  const analytics=panel.querySelector('[data-consent-analytics]');
  const marketing=panel.querySelector('[data-consent-marketing]');
  const showSummary=()=>{summary.hidden=false;settings.hidden=true;};
  const showSettings=()=>{
    analytics.checked=Boolean(sk8Consent&&sk8Consent.analytics);
    marketing.checked=Boolean(sk8Consent&&sk8Consent.marketing);
    summary.hidden=true;settings.hidden=false;
  };
  const open=()=>{
    showSummary();panel.hidden=false;launcher.hidden=true;
    panel.querySelector('button').focus();
  };
  const clearTrackingCookies=()=>{
    document.cookie.split(';').map(item=>item.split('=')[0].trim()).filter(name=>/^(_ga|_fbp|_fbc)/.test(name)).forEach(name=>{
      document.cookie=`${name}=; Max-Age=0; path=/; SameSite=Lax`;
      document.cookie=`${name}=; Max-Age=0; path=/; domain=.${location.hostname.replace(/^www\./,'')}; SameSite=Lax`;
    });
  };
  const save=(allowAnalytics,allowMarketing)=>{
    const previousAnalytics=Boolean(sk8Consent&&sk8Consent.analytics);
    const previousMarketing=Boolean(sk8Consent&&sk8Consent.marketing);
    sk8Consent={
      version:1,
      analytics:Boolean(allowAnalytics),
      marketing:Boolean(allowMarketing),
      savedAt:new Date().toISOString(),
      expiresAt:Date.now()+(SK8_CONSENT_DAYS*24*60*60*1000)
    };
    try{localStorage.setItem(SK8_CONSENT_KEY,JSON.stringify(sk8Consent));}catch(e){}
    if((previousAnalytics&&!sk8Consent.analytics)||(previousMarketing&&!sk8Consent.marketing)){
      clearTrackingCookies();
      location.reload();
      return;
    }
    loadAnalytics();
    sk8TrackCurrentPage();
    panel.hidden=true;launcher.hidden=false;
  };

  panel.querySelector('[data-consent-all]').addEventListener('click',()=>save(true,true));
  panel.querySelector('[data-consent-none]').addEventListener('click',()=>save(false,false));
  panel.querySelector('[data-consent-choose]').addEventListener('click',showSettings);
  panel.querySelector('[data-consent-save]').addEventListener('click',()=>save(analytics.checked,marketing.checked));
  panel.querySelector('[data-consent-back]').addEventListener('click',showSummary);
  launcher.addEventListener('click',open);

  if(sk8Consent) launcher.hidden=false;
  else panel.hidden=false;
})();

// v8.2: submit MailerLite forms in the background, but only report success
// after MailerLite returns a readable {success:true} response.
(function mailerLiteSignup(){
  document.querySelectorAll('[data-signup-form]').forEach(form=>form.removeAttribute('target'));
  document.addEventListener('submit',async event=>{
    const form=event.target.closest&&event.target.closest('[data-signup-form]');
    if(!form)return;
    event.preventDefault();
    form.removeAttribute('target');
    if(!form.reportValidity())return;
    let status=form.nextElementSibling&&form.nextElementSibling.classList.contains('signup-status')?form.nextElementSibling:null;
    if(!status){status=document.createElement('p');status.className='signup-status';status.setAttribute('role','status');form.insertAdjacentElement('afterend',status);}
    const button=form.querySelector('button[type="submit"]');
    const original=button?button.textContent:'';
    if(button){button.disabled=true;button.textContent='Joining…';}
    status.className='signup-status show';status.textContent='Adding you to SK8 Scoop…';
    try{
      const body=new URLSearchParams();
      for(const [key,value] of new FormData(form).entries()) body.append(key,String(value));
      const response=await fetch(form.action,{method:'POST',headers:{accept:'application/json'},body});
      let result={};
      try{result=await response.json();}catch(error){throw new Error('MailerLite returned an unreadable response.');}
      if(!response.ok||result.success!==true){
        const fieldErrors=result&&result.errors&&result.errors.fields;
        const firstError=fieldErrors&&Object.values(fieldErrors).flat().find(Boolean);
        throw new Error(firstError||'MailerLite did not accept this subscription.');
      }
      const formPosition=form.dataset.formPosition||'unknown';
      const signupSource=form.matches('[data-qr-form]')?'local_qr':'website';
      sk8Track('sign_up',{method:'MailerLite',form_position:formPosition,signup_source:signupSource});
      form.dispatchEvent(new CustomEvent('sk8:mailerlite-success',{bubbles:true,detail:{result}}));
      status.className='signup-status show success';status.textContent='You’re in. Opening the welcome page…';
      const success=form.matches('[data-qr-form]')?'/qr-success/':'/signup-success/';
      window.setTimeout(()=>location.assign(success),350);
    }catch(error){
      sk8Track('form_error',{form_kind:'newsletter_signup',form_position:form.dataset.formPosition||'unknown',error_type:'mailerlite_rejected_or_unreadable'});
      status.className='signup-status show error';status.textContent=error&&error.message?error.message:'That did not complete. Please try again or email contact@sk8scoop.com.';
      if(button){button.disabled=false;button.textContent=original;}
    }
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
  const recordQrEvent=eventType=>{const sub={...payload,event_type:eventType};try{navigator.sendBeacon('/api/qr-event',new Blob([JSON.stringify(sub)],{type:'application/json'}));}catch(e){}};
  const form=document.querySelector('[data-qr-form]');
  if(form){
    form.addEventListener('submit',()=>recordQrEvent('form_submit'));
    form.addEventListener('sk8:mailerlite-success',()=>recordQrEvent('form_success'));
  }
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
    try{const formData=new FormData(form);const data={};for(const [k,v] of formData.entries()){if(data[k]) data[k]=Array.isArray(data[k])?[...data[k],v]:[data[k],v];else data[k]=v;}const r=await fetch(form.action,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(data)});const out=await r.json();if(!r.ok)throw new Error(out.error||'Submission failed');status.className='status-box show success';status.textContent=out.message||'Thank you. Your submission has been received for review.';const successEvent=form.dataset.successEvent;if(successEvent) sk8Track(successEvent,{form_action:form.action,form_kind:form.dataset.formKind||'unknown'});if(form.dataset.formKind==='advertiser')sk8Track('generate_lead',{lead_source:'advertising_enquiry',form_action:form.action});form.reset();}
    catch(e){sk8Track('form_error',{form_kind:form.dataset.formKind||'api_form',error_type:'api_submission_failed'});status.className='status-box show error';status.textContent='This could not be sent automatically. Please email contact@sk8scoop.com instead.';}finally{btn.disabled=false;}
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
  const normaliseCode=row=>{
    if(row.qr_code&&/^poster_\d{2}$/.test(row.qr_code))return row.qr_code;
    const id=String(row.poster_id||'').match(/\d{1,2}/);
    return id?`poster_${String(Number(id[0])).padStart(2,'0')}`:row.qr_code||'generic';
  };
  const renderRows=rows=>{
    body.replaceChildren();
    rows.forEach(row=>{
      const tr=document.createElement('tr');
      const values=[
        row.poster_id||'Generic',
        row.venue||'Unknown',
        row.area||'—',
        row.views||0,
        row.form_attempts||0,
        row.form_successes||0,
        `${row.views?Math.round(Number(row.form_successes||0)/Number(row.views)*100):0}%`,
        row.last_seen||'—'
      ];
      values.forEach(value=>{const td=document.createElement('td');td.textContent=String(value);tr.appendChild(td);});
      body.appendChild(tr);
    });
  };
  const load=async()=>{
    status.textContent='Loading…';
    try{
      const [r,locations]=await Promise.all([
        fetch('/api/qr-stats',{headers:{authorization:`Bearer ${token.value}`}}),
        sk8LoadQrLocations()
      ]);
      const out=await r.json();if(!r.ok)throw new Error(out.error||'Failed');
      const recorded=new Map((out.rows||[]).map(row=>[normaliseCode(row),row]));
      const liveLocations=Object.entries(locations).filter(([,record])=>record.status==='live');
      const merged=liveLocations.map(([code,record])=>{
        const existing=recorded.get(code)||{};
        recorded.delete(code);
        return {
          ...existing,
          qr_code:code,
          poster_id:code.replace('poster_',''),
          venue:record.venue||existing.venue||'Unknown',
          area:record.area||existing.area||'—',
          views:Number(existing.views||0),
          form_attempts:Number(existing.form_attempts||existing.form_submits||0),
          form_successes:Number(existing.form_successes||0)
        };
      });
      recorded.forEach(row=>merged.push(row));
      merged.sort((a,b)=>normaliseCode(a).localeCompare(normaliseCode(b),undefined,{numeric:true}));
      document.querySelector('[data-total-views]').textContent=out.totals.views||0;
      document.querySelector('[data-total-attempts]').textContent=out.totals.form_attempts||out.totals.form_submits||0;
      document.querySelector('[data-total-successes]').textContent=out.totals.form_successes||0;
      document.querySelector('[data-live-posters]').textContent=liveLocations.length||out.totals.live_posters||0;
      document.querySelector('[data-conversion]').textContent=out.totals.views?`${Math.round(Number(out.totals.form_successes||0)/Number(out.totals.views)*100)}%`:'0%';
      renderRows(merged);
      status.textContent=`Aggregate scan data loaded for ${liveLocations.length||out.totals.live_posters||0} live placements. “MailerLite accepted” means the form returned success; net-new subscribers must still be reconciled from MailerLite.`;
    }catch(e){
      status.textContent='The dashboard could not be loaded. Check the admin token and try again.';
    }
  };
  document.querySelector('[data-load-dashboard]').addEventListener('click',load);
})();


// v7 public statistics: one dated source in config, reused across pages.
(function renderPublicStats(){
  const stats=SK8_CONFIG.publicStats||{};
  const values={
    subscriberCount:stats.subscriberCount||'',
    subscriberCountPlus:stats.subscriberCount?`${stats.subscriberCount}+`:'',
    issuesPublished:stats.issuesPublished||'',
    latestMainSendRecipients:stats.latestMainSendRecipients||'',
    latestMainSendOpens:stats.latestMainSendOpens||'',
    latestMainOpenRate:stats.latestMainOpenRate||'',
    latestResendRecipients:stats.latestResendRecipients||'',
    latestResendOpens:stats.latestResendOpens||'',
    latestResendOpenRate:stats.latestResendOpenRate||'',
    latestCombinedOpens:stats.latestCombinedOpens||'',
    latestOpenRate:stats.latestOpenRate||'',
    latestCombinedClicks:stats.latestCombinedClicks||'',
    latestClickRate:stats.latestClickRate||'',
    checkedDate:stats.checkedDate||'',
    latestMetricsCheckedDate:stats.latestMetricsCheckedDate||''
  };
  document.querySelectorAll('[data-stat]').forEach(el=>{const key=el.dataset.stat;if(values[key]!==undefined&&values[key]!=='')el.textContent=values[key];});
})();

// Close mobile menu after a navigation choice and on Escape.
if(menu&&nav){
  nav.addEventListener('click',e=>{if(e.target.closest('a')&&nav.classList.contains('open')){nav.classList.remove('open');setMenuLabel(false);}});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&nav.classList.contains('open')){nav.classList.remove('open');setMenuLabel(false);menu.focus();}});
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
  const readerCount=Number(SK8_CONFIG.publicStats&&SK8_CONFIG.publicStats.subscriberCount)||300;
  const modal=document.createElement('div');
  modal.className='signup-modal';
  modal.hidden=true;
  modal.innerHTML=`<div class="signup-modal-backdrop" data-close-signup></div>
    <section class="signup-modal-card" role="dialog" aria-modal="true" aria-labelledby="signup-modal-title">
      <button class="signup-modal-close" type="button" aria-label="Close signup" data-close-signup>×</button>
      <div class="signup-modal-art"><span>ONE FREE LOCAL EMAIL</span><strong>Every Friday, without the endless scroll.</strong><small>Cheadle · Cheadle Hulme · Gatley · Heald Green</small></div>
      <div class="signup-modal-copy">
        <div class="eyebrow">Join ${readerCount}+ local readers</div>
        <h2 id="signup-modal-title">Get the free Friday Scoop.</h2>
        <p>Weekend plans, useful updates, new openings and money-saving local ideas in one quick email.</p>
        <form class="signup signup-modal-form" action="https://assets.mailerlite.com/jsonp/2462354/forms/193724501149615325/subscribe" method="post" data-signup-form data-form-position="modal">
          <label class="sr-only" for="modal-email">Email address</label>
          <input id="modal-email" type="email" name="fields[email]" inputmode="email" autocomplete="email" placeholder="Your email address" required>
          <button class="button" type="submit">Subscribe free</button>
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
