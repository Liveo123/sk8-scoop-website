export async function onRequestPost({request,env}){
  try{
    const d=await request.json();
    const required=['submission_type','organisation_name','title','area','official_url','details','contact_name','email','accuracy_confirmed','terms_accepted'];
    if(required.some(k=>!String(d[k]||'').trim())) return json({error:'Please complete all required fields.'},400);
    if(!/^https?:\/\//i.test(d.official_url)) return json({error:'Please provide a valid official link.'},400);
    if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.email)) return json({error:'Please provide a valid email address.'},400);
    const allowed=['event','opening','offer','class','job','community_information','advertising_enquiry'];
    if(!allowed.includes(String(d.submission_type))) return json({error:'Please choose a valid submission type.'},400);
    const c=(v,n=1800)=>String(v||'').trim().slice(0,n);
    await env.DB.prepare(`INSERT INTO business_submissions (submission_type,organisation_name,title,area,relevant_date,cost_or_pay,official_url,details,image_note,contact_name,email,sponsored_interest,status,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?, 'pending',datetime('now'))`)
      .bind(c(d.submission_type,60),c(d.organisation_name,180),c(d.title,180),c(d.area,80),c(d.relevant_date,20),c(d.cost_or_pay,160),c(d.official_url,500),c(d.details,1800),c(d.image_note,500),c(d.contact_name,120),c(d.email,200),c(d.sponsored_interest,30)).run();
    return json({message:'Thank you. Your local information has been saved for verification and review.'});
  }catch(e){return json({error:'Could not save the submission.'},500);}
}
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json','cache-control':'no-store'}});
