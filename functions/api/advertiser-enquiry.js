export async function onRequestPost({request,env}){
  try{
    const d=await request.json();
    const required=['business_name','email','package','terms_accepted'];
    if(required.some(k=>!String(d[k]||'').trim())) return json({error:'Please complete all required fields.'},400);
    if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(d.email||''))) return json({error:'Please provide a valid email address.'},400);
    if(String(d.website||'').trim()&&!/^https?:\/\//i.test(String(d.website||''))) return json({error:'Please provide a valid website or landing page.'},400);
    const allowed=['starter_newsletter','guide_card','guide_bundle','guide_section','guide_main','halloween_guide','halloween_combo','halloween_section','halloween_main','temp_test','temp_grow','human_review','local_spotlight','monthly_partner','category_partner','bespoke'];
    if(!allowed.includes(String(d.package))) return json({error:'Please choose a valid campaign option.'},400);
    const c=(v,n=1000)=>String(v||'').trim().slice(0,n);
    const guideLabels={not_sure:'Help me choose',halloween:'Halloween & Half-Term Guide',christmas:'Christmas Guide','52-adventures':'52 Adventures','free-cheap':'Free & Cheap Things to Do',summer:'SK8 Summer Guide',secrets:'50 Secrets of SK8',transport:'Getting around SK8',other:'Another SK8 Scoop Guide'};
    const selectedGuide=String(d.guide_choice||'').trim();
    if(selectedGuide&&!Object.prototype.hasOwnProperty.call(guideLabels,selectedGuide)) return json({error:'Please choose a valid Guide.'},400);
    const guideRequest=['guide_card','guide_bundle','guide_section','guide_main'].includes(String(d.package))&&selectedGuide?`Requested Guide: ${guideLabels[selectedGuide]}`:'';
  const artworkOption = ['create','logo','finished'].includes(String(d.artwork_option||'')) ? String(d.artwork_option) : 'create';
  const artworkUrl = String(d.artwork_url||'').trim().slice(0,400);
  if (artworkUrl && (!/^https:\/\//i.test(artworkUrl) || /[\r\n]/.test(artworkUrl))) return json({error:'Please provide a valid secure artwork link.'},400);
  const artworkNote = 'Artwork: ' + artworkOption + (artworkUrl ? '; link: ' + artworkUrl : '; send by reply if supplied');
  const invoiceDetails = [guideRequest,artworkNote].filter(Boolean).join(' | ').slice(0,500);

    await env.DB.prepare(`INSERT INTO advertiser_enquiries (business_name,contact_name,email,phone,business_type,area,website,package,preferred_date,advert_copy,image_link,invoice_details,status,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?, 'pending',datetime('now'))`)
      .bind(c(d.business_name,180),c(d.contact_name||'Not provided',120),c(d.email,200),c(d.phone,80),c(d.business_type,120),c(d.area,100),c(d.website||'Not provided',500),c(d.package,80),c(d.preferred_date||'To be agreed',30),c(d.advert_copy,1000),c(d.image_link,500),c(invoiceDetails,500)).run();
    const message=String(d.package)==='human_review'
      ? 'Thanks. Your local-fit check has been sent to SK8 Scoop. We will review whether your business is a sensible match for SK8 readers before suggesting any paid option.'
      : 'Thank you. Your campaign enquiry has been saved for suitability and availability checks.';
    return json({message});
  }catch(e){return json({error:'Could not save the enquiry.'},500);}
}
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json','cache-control':'no-store'}});
