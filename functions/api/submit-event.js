export async function onRequestPost({request,env}){
  try{
    const d=await request.json();
    const required=['event_name','event_date','venue','area','booking_url','description','contact_name','email','accuracy_confirmed','terms_accepted'];
    if(required.some(k=>!String(d[k]||'').trim())) return json({error:'Please complete all required fields.'},400);
    if(!/^https?:\/\//i.test(d.booking_url)) return json({error:'Please provide a valid official link.'},400);
    if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.email)) return json({error:'Please provide a valid email address.'},400);
    const c=(v,n=1200)=>String(v||'').trim().slice(0,n);
    await env.DB.prepare(`INSERT INTO event_submissions (event_name,event_date,event_time,venue,area,cost,booking_url,description,contact_name,email,image_note,status,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,'pending',datetime('now'))`)
      .bind(c(d.event_name,160),c(d.event_date,20),c(d.event_time,80),c(d.venue,220),c(d.area,80),c(d.cost,100),c(d.booking_url,500),c(d.description,1200),c(d.contact_name,120),c(d.email,200),c(d.image_note,400)).run();
    return json({message:'Thank you. The event is in the moderation queue for checking.'});
  }catch(e){return json({error:'Could not save the event.'},500);}
}
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json','cache-control':'no-store'}});
