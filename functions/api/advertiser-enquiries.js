export async function onRequestGet({request,env}){
  const auth=request.headers.get('authorization')||'';
  if(!env.ADMIN_TOKEN||auth!==`Bearer ${env.ADMIN_TOKEN}`) return json({error:'Unauthorised'},401);
  try{
    const rows=(await env.DB.prepare(`SELECT id,business_name,contact_name,email,phone,business_type,area,website,package,preferred_date,advert_copy,status,created_at FROM advertiser_enquiries ORDER BY created_at DESC LIMIT 100`).all()).results||[];
    const counts=rows.reduce((acc,row)=>{
      const key=String(row.status||'unknown');
      acc[key]=(acc[key]||0)+1;
      return acc;
    },{});
    return json({rows,counts,returned:rows.length});
  }catch(e){
    return json({error:'Could not load advertiser enquiries.'},500);
  }
}
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json','cache-control':'no-store'}});
