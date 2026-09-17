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

async function ensureTable(db){
  await db.prepare(TABLE_SQL).run();
  await db.prepare('CREATE INDEX IF NOT EXISTS idx_search_events_query ON search_events(query_normalised)').run();
  await db.prepare('CREATE INDEX IF NOT EXISTS idx_search_events_created ON search_events(created_at)').run();
  await db.prepare('CREATE INDEX IF NOT EXISTS idx_search_events_results ON search_events(result_count)').run();
}

export async function onRequestGet({request,env}){
  const auth=request.headers.get('authorization')||'';
  if(!env.ADMIN_TOKEN||auth!==`Bearer ${env.ADMIN_TOKEN}`) return json({error:'Unauthorised'},401);
  if(!env.DB) return json({error:'Search storage unavailable'},503);

  try{
    await ensureTable(env.DB);
    const url=new URL(request.url);
    const requested=Number.parseInt(url.searchParams.get('days'),10)||30;
    const days=[7,30,90,365].includes(requested)?requested:30;
    const modifier=`-${days} days`;

    const totals=(await env.DB.prepare(`SELECT COUNT(*) searches,COUNT(DISTINCT query_normalised) unique_queries,SUM(CASE WHEN result_count=0 THEN 1 ELSE 0 END) zero_results,ROUND(AVG(result_count),1) avg_results FROM search_events WHERE created_at >= datetime('now',?)`).bind(modifier).first())||{};

    const top=(await env.DB.prepare(`SELECT query_normalised,MAX(query_text) query_text,COUNT(*) searches,ROUND(AVG(result_count),1) avg_results,SUM(CASE WHEN result_count=0 THEN 1 ELSE 0 END) zero_results,MAX(created_at) last_seen FROM search_events WHERE created_at >= datetime('now',?) GROUP BY query_normalised ORDER BY searches DESC,last_seen DESC LIMIT 25`).bind(modifier).all()).results||[];

    const unmet=(await env.DB.prepare(`SELECT query_normalised,MAX(query_text) query_text,COUNT(*) searches,MAX(created_at) last_seen FROM search_events WHERE created_at >= datetime('now',?) AND result_count=0 GROUP BY query_normalised ORDER BY searches DESC,last_seen DESC LIMIT 25`).bind(modifier).all()).results||[];

    const recent=(await env.DB.prepare(`SELECT query_text,result_count,search_type,search_area,source,created_at FROM search_events WHERE created_at >= datetime('now',?) ORDER BY created_at DESC LIMIT 50`).bind(modifier).all()).results||[];

    return json({days,totals,top,unmet,recent});
  }catch(e){
    return json({error:'Could not load search insights'},500);
  }
}

const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json','cache-control':'no-store'}});
