export async function onRequestPost({request,env}){
  try{
    const data=await request.json();
    const allowed=['view','form_submit','form_success'];
    if(!allowed.includes(data.event_type)) return json({error:'Invalid event'},400);
    const clean=s=>String(s||'').slice(0,180);
    await env.DB.prepare(`INSERT INTO qr_events (event_type,qr_code,poster_id,venue,area,campaign,source,medium,path,created_at) VALUES (?,?,?,?,?,?,?,?,?,datetime('now'))`)
      .bind(clean(data.event_type),clean(data.qr_code),clean(data.poster_id),clean(data.venue),clean(data.area),clean(data.campaign),clean(data.source),clean(data.medium),clean(data.path)).run();
    return json({ok:true});
  }catch(e){return json({error:'Could not record event'},500);}
}
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json','cache-control':'no-store'}});
