const TABLE_SQL=`CREATE TABLE IF NOT EXISTS search_events (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 query_text TEXT NOT NULL,
 query_normalised TEXT NOT NULL,
 result_count INTEGER NOT NULL DEFAULT 0,
 search_type TEXT NOT NULL DEFAULT 'all',
 search_area TEXT NOT NULL DEFAULT 'all',
 source TEXT NOT NULL DEFAULT 'search_page',
 created_at TEXT NOT NULL
)`;

const cleanQuery=value=>{
  let text=String(value||'').trim().replace(/\s+/g,' ').slice(0,160);
  text=text
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,'[email]')
    .replace(/(?:https?:\/\/|www\.)\S+/gi,'[link]')
    .replace(/(?:\+?\d[\d\s().-]{7,}\d)/g,'[phone]');
  return text;
};

const normalise=value=>String(value||'')
  .normalize('NFKD')
  .replace(/[’‘]/g,"'")
  .replace(/[^a-zA-Z0-9£\[\]]+/g,' ')
  .toLowerCase()
  .replace(/\s+/g,' ')
  .trim()
  .slice(0,160);

const cleanLabel=(value,fallback)=>String(value||fallback).trim().slice(0,60)||fallback;

async function ensureTable(db){
  await db.prepare(TABLE_SQL).run();
  await db.prepare('CREATE INDEX IF NOT EXISTS idx_search_events_query ON search_events(query_normalised)').run();
  await db.prepare('CREATE INDEX IF NOT EXISTS idx_search_events_created ON search_events(created_at)').run();
  await db.prepare('CREATE INDEX IF NOT EXISTS idx_search_events_results ON search_events(result_count)').run();
}

export async function onRequestPost({request,env}){
  try{
    if(!env.DB) return json({error:'Search storage unavailable'},503);
    const data=await request.json();
    const queryText=cleanQuery(data.query);
    const queryNormalised=normalise(queryText);
    if(queryNormalised.length<2) return json({error:'Search term too short'},400);

    const resultCount=Math.max(0,Math.min(999,Number.parseInt(data.result_count,10)||0));
    const searchType=cleanLabel(data.search_type,'all');
    const searchArea=cleanLabel(data.search_area,'all');
    const source=['homepage','search_page','direct'].includes(String(data.source||''))?String(data.source):'search_page';

    await ensureTable(env.DB);
    await env.DB.prepare(`INSERT INTO search_events (query_text,query_normalised,result_count,search_type,search_area,source,created_at) VALUES (?,?,?,?,?,?,datetime('now'))`)
      .bind(queryText,queryNormalised,resultCount,searchType,searchArea,source).run();

    // Keep raw search intent long enough for seasonal learning without creating an indefinite log.
    await env.DB.prepare(`DELETE FROM search_events WHERE created_at < datetime('now','-365 days')`).run();

    return json({ok:true});
  }catch(e){
    return json({error:'Could not record search'},500);
  }
}

const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json','cache-control':'no-store'}});
