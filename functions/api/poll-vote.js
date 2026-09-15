const ISSUE_ID = 'issue-12-event-distance';
const OPTIONS = ['sk8','15min','30min','further'];

export async function onRequestPost({ request, env }) {
  try {
    const data = await request.json();
    const option = String(data.option || '');
    const token = String(data.token || '').slice(0, 80);
    if (!OPTIONS.includes(option) || token.length < 8) return json({ error: 'Invalid vote' }, 400);

    await env.DB.prepare(`
      INSERT INTO poll_votes (issue_id, option_key, voter_token, created_at)
      VALUES (?, ?, ?, datetime('now'))
      ON CONFLICT(issue_id, voter_token)
      DO UPDATE SET option_key = excluded.option_key, created_at = datetime('now')
    `).bind(ISSUE_ID, option, token).run();

    return results(env);
  } catch (e) {
    return json({ error: 'Could not record vote' }, 500);
  }
}

async function results(env) {
  const rows = await env.DB.prepare(`
    SELECT option_key, COUNT(*) AS votes
    FROM poll_votes WHERE issue_id = ? GROUP BY option_key
  `).bind(ISSUE_ID).all();
  const counts = Object.fromEntries(OPTIONS.map(k => [k, 0]));
  for (const row of rows.results || []) counts[row.option_key] = Number(row.votes || 0);
  const total = Object.values(counts).reduce((a,b) => a + b, 0);
  return json({ ok: true, counts, total });
}

const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'content-type': 'application/json', 'cache-control': 'no-store' }
});
