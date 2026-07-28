const LIVE_POSTER_COUNT=17;
export async function onRequestGet({request,env}){
  const auth=request.headers.get('authorization')||'';
  if(!env.ADMIN_TOKEN||auth!==`Bearer ${env.ADMIN_TOKEN}`) return json({error:'Unauthorised'},401);
  const rows=(await env.DB.prepare(`SELECT poster_id,qr_code,MAX(venue) venue,MAX(area) area,SUM(CASE WHEN event_type='view' THEN 1 ELSE 0 END) views,SUM(CASE WHEN event_type='form_submit' THEN 1 ELSE 0 END) form_attempts,SUM(CASE WHEN event_type='form_success' THEN 1 ELSE 0 END) form_successes,MAX(created_at) last_seen FROM qr_events GROUP BY qr_code,poster_id ORDER BY poster_id`).all()).results||[];
  const totals=rows.reduce((a,r)=>({views:a.views+Number(r.views||0),form_attempts:a.form_attempts+Number(r.form_attempts||0),form_successes:a.form_successes+Number(r.form_successes||0),live_posters:LIVE_POSTER_COUNT}),{views:0,form_attempts:0,form_successes:0,live_posters:LIVE_POSTER_COUNT});
  return json({rows,totals});
}
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json','cache-control':'no-store'}});
