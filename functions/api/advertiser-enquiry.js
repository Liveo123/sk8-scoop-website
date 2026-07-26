export async function onRequestPost({request,env}){
  try{
    const d=await request.json();
    const required=['business_name','contact_name','email','package','preferred_date','website','terms_accepted'];
    if(required.some(k=>!String(d[k]||'').trim())) return json({error:'Please complete all required fields.'},400);
    if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(d.email||''))) return json({error:'Please provide a valid email address.'},400);
    if(!/^https?:\/\//i.test(String(d.website||''))) return json({error:'Please provide a valid website or landing page.'},400);
    const allowed=['local_spotlight','monthly_partner','category_partner','bespoke'];
    if(!allowed.includes(String(d.package))) return json({error:'Please choose a valid campaign option.'},400);
    const c=(v,n=1000)=>String(v||'').trim().slice(0,n);
    await env.DB.prepare(`INSERT INTO advertiser_enquiries (business_name,contact_name,email,phone,business_type,area,website,package,preferred_date,advert_copy,image_link,invoice_details,status,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?, 'pending',datetime('now'))`)
      .bind(c(d.business_name,180),c(d.contact_name,120),c(d.email,200),c(d.phone,80),c(d.business_type,120),c(d.area,100),c(d.website,500),c(d.package,80),c(d.preferred_date,30),c(d.advert_copy,1000),c(d.image_link,500),c(d.invoice_details,500)).run();
    return json({message:'Thank you. Your campaign enquiry has been saved for suitability and availability checks.'});
  }catch(e){return json({error:'Could not save the enquiry.'},500);}
}
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json','cache-control':'no-store'}});
