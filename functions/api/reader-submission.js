export async function onRequestPost({request,env}){
  try{
    const d=await request.json();

    // Honeypot: return a normal success response without storing spam.
    if(String(d.website||'').trim()){
      return json({message:'Thank you. Your submission has been received for review.'});
    }

    const required=['submission_type','message','email','privacy_confirmed'];
    if(required.some(k=>!String(d[k]||'').trim())){
      return json({error:'Please complete all required fields.'},400);
    }

    const allowed=['competition_answer','puzzle_answer','comment','local_tip','story_idea','photo','other'];
    if(!allowed.includes(String(d.submission_type))){
      return json({error:'Please choose a valid submission type.'},400);
    }

    if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(d.email||'').trim())){
      return json({error:'Please provide a valid email address.'},400);
    }

    const link=String(d.link||'').trim();
    if(link && !/^https?:\/\//i.test(link)){
      return json({error:'Please provide a valid link beginning with http:// or https://.'},400);
    }

    const c=(v,n=4000)=>String(v||'').trim().slice(0,n);
    await env.DB.prepare(`INSERT INTO reader_submissions (submission_type,message,reference,link,name,email,status,notification_status,created_at) VALUES (?,?,?,?,?,?,'pending','pending',datetime('now'))`)
      .bind(
        c(d.submission_type,60),
        c(d.message,4000),
        c(d.reference,240),
        c(link,500),
        c(d.name,120),
        c(d.email,200)
      ).run();

    return json({message:'Thank you. Your submission has been saved for review.'});
  }catch(e){
    return json({error:'Could not save the submission.'},500);
  }
}

const json=(body,status=200)=>new Response(JSON.stringify(body),{
  status,
  headers:{'content-type':'application/json','cache-control':'no-store'}
});
