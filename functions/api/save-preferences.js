export async function onRequestPost({request,env}){
  try{
    const d=await request.json();
    if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(d.email||''))) return json({error:'Please provide a valid email address.'},400);
    if(String(d.preference_consent||'')!=='yes') return json({error:'Please confirm that you want these preferences saved.'},400);
    const yn=k=>String(d[k]||'')==='yes'?1:0;
    const email=String(d.email).trim().toLowerCase().slice(0,200);
    await env.DB.prepare(`INSERT INTO subscriber_preferences (email,families_children,events,food_drink,offers_savings,home_property,pets_outdoors,practical_updates,updated_at) VALUES (?,?,?,?,?,?,?,?,datetime('now')) ON CONFLICT(email) DO UPDATE SET families_children=excluded.families_children,events=excluded.events,food_drink=excluded.food_drink,offers_savings=excluded.offers_savings,home_property=excluded.home_property,pets_outdoors=excluded.pets_outdoors,practical_updates=excluded.practical_updates,updated_at=datetime('now')`)
      .bind(email,yn('families_children'),yn('events'),yn('food_drink'),yn('offers_savings'),yn('home_property'),yn('pets_outdoors'),yn('practical_updates')).run();
    return json({message:'Your optional SK8 Scoop interests have been saved.'});
  }catch(e){return json({error:'Could not save your preferences.'},500);}
}
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json','cache-control':'no-store'}});
