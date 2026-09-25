import existingWorker from './worker.js';

const MAILERLITE_GROUPS = {
  main: ['190964754190174086'],
  qr: ['190964754190174086', '193441557512193685'],
  'guide:free-cheap': ['190964754190174086', '197763144685192678'],
  'guide:52-adventures': ['190964754190174086', '199227746568635453']
};

const ISSUE_12_POLL_ANSWERS = [
  'empty_shops_buildings',
  'best_value_pub_meals',
  'hidden_paths_shortcuts',
  'odd_planning_applications',
  'local_history_mysteries'
];

const ISSUE_13_POLL_ANSWERS = [
  'mainly_sk8',
  'nearby_stockport_cheshire',
  'manchester_if_worth_it'
];

const SEARCH_TABLE_SQL = `CREATE TABLE IF NOT EXISTS search_events (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 query_text TEXT NOT NULL,
 query_normalised TEXT NOT NULL,
 result_count INTEGER NOT NULL DEFAULT 0,
 search_type TEXT NOT NULL DEFAULT 'all',
 search_area TEXT NOT NULL DEFAULT 'all',
 source TEXT NOT NULL DEFAULT 'search_page',
 created_at TEXT NOT NULL
)`;

const GUIDE_ACCESS_SQL = `CREATE TABLE IF NOT EXISTS guide_access_tokens (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 token_hash TEXT NOT NULL UNIQUE,
 guide_key TEXT NOT NULL,
 created_at TEXT NOT NULL,
 expires_at TEXT NOT NULL
)`;

const GUIDE_ACCESS = {
  '52-adventures': {
    cookie: 'sk8_guide_52',
    cookiePath: '/52-adventures/',
    landing: '/52-adventures/#get-guide',
    route: '/52-adventures/guide'
  },
  'free-cheap': {
    cookie: 'sk8_guide_fc',
    cookiePath: '/free-cheap-guide/',
    landing: '/free-cheap-guide/#get-guide',
    route: '/free-cheap-guide/guide'
  }
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === '/api/signup-config' && request.method === 'GET') {
      const siteKey = String(env.TURNSTILE_SITE_KEY || '').trim();
      if (!siteKey) return json({ error: 'Signup protection is not configured.' }, 503);
      return json({ siteKey });
    }

    if (url.pathname === '/api/newsletter-signup' && request.method === 'POST') {
      return handleNewsletterSignup(request, env);
    }

    if (url.pathname === '/api/poll/issue-12' && request.method === 'GET') {
      return handleIssue12PollResults(env);
    }

    if (url.pathname === '/api/poll/issue-12' && request.method === 'POST') {
      return handleIssue12PollVote(request, env);
    }

    if (url.pathname === '/api/poll/issue-13' && request.method === 'GET') {
      return handleIssue13PollResults(env);
    }

    if (url.pathname === '/api/poll/issue-13' && request.method === 'POST') {
      return handleIssue13PollVote(request, env);
    }

    if (url.pathname === '/api/search-event' && request.method === 'POST') {
      return handleSearchEvent(request, env);
    }

    if (url.pathname === '/api/search-stats' && request.method === 'GET') {
      return handleSearchStats(request, env);
    }

    const protectedGuide = getProtectedGuide(url.pathname);
    if (protectedGuide && (request.method === 'GET' || request.method === 'HEAD')) {
      return handleProtectedGuideRequest(request, env, ctx, protectedGuide);
    }

    return existingWorker.fetch(request, env, ctx);
  }
};

async function handleNewsletterSignup(request, env) {
  const turnstileSecret = String(env.TURNSTILE_SECRET_KEY || '').trim();
  if (!turnstileSecret) return json({ error: 'Signup protection is temporarily unavailable.' }, 503);

  const mailerLiteToken = String(env.MAILERLITE_API_TOKEN || '').trim();
  if (!mailerLiteToken) return json({ error: 'Newsletter signup is temporarily unavailable.' }, 503);

  let form;
  try {
    form = await request.formData();
  } catch {
    return json({ error: 'The signup could not be read.' }, 400);
  }

  if (String(form.get('website') || '').trim()) {
    return json({ success: true });
  }

  const email = String(form.get('fields[email]') || '').trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return json({ error: 'Please enter a valid email address.' }, 400);
  }

  const startedAt = Number(form.get('sk8_started_at') || 0);
  const ageMs = Date.now() - startedAt;
  if (!Number.isFinite(startedAt) || startedAt <= 0 || ageMs < 1200 || ageMs > 6 * 60 * 60 * 1000) {
    return json({ error: 'Please refresh the page and try again.' }, 400);
  }

  const token = String(form.get('cf-turnstile-response') || '').trim();
  if (!token) return json({ error: 'Please complete the quick human check.' }, 400);

  const verifyBody = new URLSearchParams();
  verifyBody.set('secret', turnstileSecret);
  verifyBody.set('response', token);
  const remoteIp = request.headers.get('CF-Connecting-IP');
  if (remoteIp) verifyBody.set('remoteip', remoteIp);

  let verification;
  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: verifyBody
    });
    verification = await response.json();
  } catch {
    return json({ error: 'The human check could not be verified. Please try again.' }, 502);
  }

  if (!verification || verification.success !== true) {
    return json({ error: 'The human check did not complete. Please try again.' }, 403);
  }

  if (String(verification.action || '') !== 'newsletter_signup') {
    return json({ error: 'The human check was not valid for this signup. Please try again.' }, 403);
  }

  const requestedKind = String(form.get('sk8_form_kind') || 'main');
  const kind = requestedKind === 'qr' ? 'qr' : requestedKind === 'guide' ? 'guide' : 'main';
  const guideKey = kind === 'guide' ? String(form.get('sk8_guide_key') || '').trim().toLowerCase() : '';
  if (kind === 'guide' && !GUIDE_ACCESS[guideKey]) {
    return json({ error: 'Please refresh the guide page and try again.' }, 400);
  }
  if (kind === 'guide') {
    try {
      await ensureGuideAccessTable(env.DB);
    } catch (error) {
      console.error('Guide access storage unavailable', error);
      return json({ error: 'Guide access is temporarily unavailable. Please try again shortly.' }, 503);
    }
  }

  const fields = {};
  for (const [key, value] of form.entries()) {
    if (typeof value !== 'string') continue;
    const match = /^fields\[([^\]]+)\]$/.exec(key);
    if (!match || match[1] === 'email') continue;
    fields[match[1]] = value;
  }

  const groupKey = kind === 'guide' ? `guide:${guideKey}` : kind;
  const groups = MAILERLITE_GROUPS[groupKey];
  if (!groups) return json({ error: 'Signup audience is not configured.' }, 503);

  const payload = {
    email,
    fields,
    groups,
    status: 'active'
  };
  if (remoteIp) payload.ip_address = remoteIp;

  let result;
  try {
    const response = await fetch('https://connect.mailerlite.com/api/subscribers', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        authorization: `Bearer ${mailerLiteToken}`,
        'content-type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    try {
      result = await response.json();
    } catch {
      return json({ error: 'The newsletter service returned an unreadable response.' }, 502);
    }

    if (!response.ok) {
      const apiMessage = result && (result.message || result.error);
      return json({ error: apiMessage || 'The newsletter service did not accept this signup.' }, 502);
    }
  } catch {
    return json({ error: 'The newsletter service could not be reached. Please try again.' }, 502);
  }

  const signupResponse = json({ success: true, kind, guideKey: guideKey || undefined });
  if (kind === 'guide') {
    try {
      const cookie = await issueGuideAccessToken(env.DB, guideKey);
      signupResponse.headers.append('set-cookie', cookie);
    } catch (error) {
      console.error('Guide access token issue failed', error);
      return json({ error: 'Your signup was saved, but the guide could not be unlocked. Please try again.' }, 503);
    }
  }
  return signupResponse;
}

function getProtectedGuide(pathname) {
  for (const [key, config] of Object.entries(GUIDE_ACCESS)) {
    if (pathname === config.route || pathname.startsWith(`${config.route}/`)) {
      return { key, ...config };
    }
  }
  return null;
}

async function handleProtectedGuideRequest(request, env, ctx, guide) {
  let allowed = false;
  try {
    allowed = await hasGuideAccess(request, env.DB, guide.key);
  } catch (error) {
    console.error('Guide access check failed', error);
  }

  if (!allowed) {
    const target = new URL(guide.landing, request.url).toString();
    return new Response(null, {
      status: 302,
      headers: {
        location: target,
        'cache-control': 'no-store',
        'x-robots-tag': 'noindex, follow'
      }
    });
  }

  let response = await existingWorker.fetch(request, env, ctx);
  const contentType = response.headers.get('content-type') || '';
  if (
    guide.key === 'free-cheap' &&
    request.method === 'GET' &&
    contentType.includes('text/html')
  ) {
    response = new HTMLRewriter()
      .on('body', {
        element(element) {
          element.append('<script src="/assets/free-cheap-guide-analytics.js" defer></script>', { html: true });
        }
      })
      .transform(response);
  }

  const headers = new Headers(response.headers);
  headers.set('x-robots-tag', 'noindex, follow');
  headers.set('cache-control', 'private, no-store');
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

async function ensureGuideAccessTable(db) {
  if (!db) throw new Error('Guide access database unavailable');
  await db.prepare(GUIDE_ACCESS_SQL).run();
  await db.prepare('CREATE INDEX IF NOT EXISTS idx_guide_access_tokens_key_expiry ON guide_access_tokens(guide_key, expires_at)').run();
}

function readCookie(request, name) {
  const header = request.headers.get('cookie') || '';
  const parts = header.split(';');
  for (const part of parts) {
    const index = part.indexOf('=');
    if (index < 0) continue;
    const key = part.slice(0, index).trim();
    if (key !== name) continue;
    return part.slice(index + 1).trim();
  }
  return '';
}

function randomAccessToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

async function hashAccessToken(token) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

async function issueGuideAccessToken(db, guideKey) {
  const config = GUIDE_ACCESS[guideKey];
  if (!config) throw new Error('Unknown guide key');
  await ensureGuideAccessTable(db);
  const token = randomAccessToken();
  const tokenHash = await hashAccessToken(token);
  await db.prepare(`INSERT INTO guide_access_tokens (token_hash, guide_key, created_at, expires_at)
    VALUES (?, ?, datetime('now'), datetime('now', '+365 days'))`)
    .bind(tokenHash, guideKey)
    .run();
  await db.prepare(`DELETE FROM guide_access_tokens WHERE expires_at <= datetime('now')`).run();
  return `${config.cookie}=${token}; Path=${config.cookiePath}; Max-Age=31536000; HttpOnly; Secure; SameSite=Lax`;
}

async function hasGuideAccess(request, db, guideKey) {
  const config = GUIDE_ACCESS[guideKey];
  if (!config || !db) return false;
  const token = readCookie(request, config.cookie);
  if (!token || !/^[A-Za-z0-9_-]{40,60}$/.test(token)) return false;
  await ensureGuideAccessTable(db);
  const tokenHash = await hashAccessToken(token);
  const row = await db.prepare(`SELECT id FROM guide_access_tokens
    WHERE token_hash = ? AND guide_key = ? AND expires_at > datetime('now')
    LIMIT 1`)
    .bind(tokenHash, guideKey)
    .first();
  return Boolean(row && row.id);
}

async function ensureIssue12PollTable(db) {
  if (!db) throw new Error('Poll database unavailable');
  await db.prepare(`CREATE TABLE IF NOT EXISTS newsletter_poll_votes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    issue TEXT NOT NULL,
    answer TEXT NOT NULL,
    voter_token TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE(issue, voter_token)
  )`).run();
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_newsletter_poll_votes_issue_answer ON newsletter_poll_votes(issue, answer)`).run();
}

async function getIssue12PollResults(db) {
  await ensureIssue12PollTable(db);
  const result = await db.prepare(`SELECT answer, COUNT(*) AS votes FROM newsletter_poll_votes WHERE issue = '12' GROUP BY answer`).all();
  const counts = Object.fromEntries(ISSUE_12_POLL_ANSWERS.map(answer => [answer, 0]));
  for (const row of result.results || []) {
    if (Object.prototype.hasOwnProperty.call(counts, row.answer)) counts[row.answer] = Number(row.votes || 0);
  }
  const total = Object.values(counts).reduce((sum, value) => sum + value, 0);
  return { issue: 12, counts, total };
}

async function handleIssue12PollResults(env) {
  try {
    return json(await getIssue12PollResults(env.DB));
  } catch (error) {
    console.error('Issue 12 poll results error', error);
    return json({ error: 'Poll results are temporarily unavailable.' }, 503);
  }
}

async function handleIssue12PollVote(request, env) {
  let data;
  try {
    data = await request.json();
  } catch {
    return json({ error: 'The vote could not be read.' }, 400);
  }

  const answer = String(data.answer || '').trim();
  const voterToken = String(data.voter_token || '').trim();
  if (!ISSUE_12_POLL_ANSWERS.includes(answer)) return json({ error: 'Please choose one of the poll options.' }, 400);
  if (!/^[A-Za-z0-9_-]{12,100}$/.test(voterToken)) return json({ error: 'Please refresh the poll and try again.' }, 400);

  try {
    await ensureIssue12PollTable(env.DB);
    await env.DB.prepare(`INSERT INTO newsletter_poll_votes (issue, answer, voter_token, created_at, updated_at)
      VALUES ('12', ?, ?, datetime('now'), datetime('now'))
      ON CONFLICT(issue, voter_token) DO UPDATE SET answer = excluded.answer, updated_at = datetime('now')`)
      .bind(answer, voterToken)
      .run();
    const results = await getIssue12PollResults(env.DB);
    return json({ success: true, answer, ...results });
  } catch (error) {
    console.error('Issue 12 poll vote error', error);
    return json({ error: 'The vote could not be saved. Please try again.' }, 503);
  }
}

async function getIssue13PollResults(db) {
  await ensureIssue12PollTable(db);
  const result = await db.prepare(`SELECT answer, COUNT(*) AS votes FROM newsletter_poll_votes WHERE issue = '13' GROUP BY answer`).all();
  const counts = Object.fromEntries(ISSUE_13_POLL_ANSWERS.map(answer => [answer, 0]));
  for (const row of result.results || []) {
    if (Object.prototype.hasOwnProperty.call(counts, row.answer)) counts[row.answer] = Number(row.votes || 0);
  }
  const total = Object.values(counts).reduce((sum, value) => sum + value, 0);
  return { issue: 13, counts, total };
}

async function handleIssue13PollResults(env) {
  try {
    return json(await getIssue13PollResults(env.DB));
  } catch (error) {
    console.error('Issue 13 poll results error', error);
    return json({ error: 'Poll results are temporarily unavailable.' }, 503);
  }
}

async function handleIssue13PollVote(request, env) {
  let data;
  try {
    data = await request.json();
  } catch {
    return json({ error: 'The vote could not be read.' }, 400);
  }

  const answer = String(data.answer || '').trim();
  const voterToken = String(data.voter_token || '').trim();
  if (!ISSUE_13_POLL_ANSWERS.includes(answer)) return json({ error: 'Please choose one of the poll options.' }, 400);
  if (!/^[A-Za-z0-9_-]{12,100}$/.test(voterToken)) return json({ error: 'Please refresh the poll and try again.' }, 400);

  try {
    await ensureIssue12PollTable(env.DB);
    await env.DB.prepare(`INSERT INTO newsletter_poll_votes (issue, answer, voter_token, created_at, updated_at)
      VALUES ('13', ?, ?, datetime('now'), datetime('now'))
      ON CONFLICT(issue, voter_token) DO UPDATE SET answer = excluded.answer, updated_at = datetime('now')`)
      .bind(answer, voterToken)
      .run();
    const results = await getIssue13PollResults(env.DB);
    return json({ success: true, answer, ...results });
  } catch (error) {
    console.error('Issue 13 poll vote error', error);
    return json({ error: 'The vote could not be saved. Please try again.' }, 503);
  }
}

async function ensureSearchTable(db) {
  if (!db) throw new Error('Search database unavailable');
  await db.prepare(SEARCH_TABLE_SQL).run();
  await db.prepare('CREATE INDEX IF NOT EXISTS idx_search_events_query ON search_events(query_normalised)').run();
  await db.prepare('CREATE INDEX IF NOT EXISTS idx_search_events_created ON search_events(created_at)').run();
  await db.prepare('CREATE INDEX IF NOT EXISTS idx_search_events_results ON search_events(result_count)').run();
}

function cleanSearchQuery(value) {
  let text = String(value || '').trim().replace(/\s+/g, ' ').slice(0, 160);
  text = text
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[email]')
    .replace(/(?:https?:\/\/|www\.)\S+/gi, '[link]')
    .replace(/(?:\+?\d[\d\s().-]{7,}\d)/g, '[phone]');
  return text;
}

function normaliseSearchQuery(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[’‘]/g, "'")
    .replace(/[^a-zA-Z0-9£\[\]]+/g, ' ')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 160);
}

function cleanSearchLabel(value, fallback) {
  return String(value || fallback).trim().slice(0, 60) || fallback;
}

async function handleSearchEvent(request, env) {
  if (!env.DB) return json({ error: 'Search storage unavailable.' }, 503);

  let data;
  try {
    data = await request.json();
  } catch {
    return json({ error: 'The search event could not be read.' }, 400);
  }

  const queryText = cleanSearchQuery(data.query);
  const queryNormalised = normaliseSearchQuery(queryText);
  if (queryNormalised.length < 2) return json({ error: 'Search term too short.' }, 400);

  const resultCount = Math.max(0, Math.min(999, Number.parseInt(data.result_count, 10) || 0));
  const searchType = cleanSearchLabel(data.search_type, 'all');
  const searchArea = cleanSearchLabel(data.search_area, 'all');
  const baseSource = ['homepage', 'search_page', 'direct', 'header'].includes(String(data.source || '')) ? String(data.source) : 'search_page';
  const host = new URL(request.url).hostname.toLowerCase();
  const source = host.endsWith('.workers.dev') ? `preview_${baseSource}` : baseSource;

  try {
    await ensureSearchTable(env.DB);
    await env.DB.prepare(`INSERT INTO search_events (query_text,query_normalised,result_count,search_type,search_area,source,created_at) VALUES (?,?,?,?,?,?,datetime('now'))`)
      .bind(queryText, queryNormalised, resultCount, searchType, searchArea, source)
      .run();
    await env.DB.prepare(`DELETE FROM search_events WHERE created_at < datetime('now','-365 days')`).run();
    return json({ ok: true, scope: source.startsWith('preview_') ? 'preview' : 'live' });
  } catch (error) {
    console.error('Search event storage error', error);
    return json({ error: 'Could not record search.' }, 500);
  }
}

async function handleSearchStats(request, env) {
  const auth = request.headers.get('authorization') || '';
  if (!env.ADMIN_TOKEN) return json({ error: 'The admin token has not been configured.' }, 503);
  if (auth !== `Bearer ${env.ADMIN_TOKEN}`) return json({ error: 'Unauthorised.' }, 401);
  if (!env.DB) return json({ error: 'Search storage unavailable.' }, 503);

  try {
    await ensureSearchTable(env.DB);
    const url = new URL(request.url);
    const requested = Number.parseInt(url.searchParams.get('days'), 10) || 30;
    const days = [7, 30, 90, 365].includes(requested) ? requested : 30;
    const scope = url.searchParams.get('scope') === 'preview' ? 'preview' : 'live';
    const modifier = `-${days} days`;
    const sourceClause = scope === 'preview' ? `source LIKE 'preview_%'` : `source NOT LIKE 'preview_%'`;

    const totals = (await env.DB.prepare(`SELECT COUNT(*) searches,COUNT(DISTINCT query_normalised) unique_queries,SUM(CASE WHEN result_count=0 THEN 1 ELSE 0 END) zero_results,ROUND(AVG(result_count),1) avg_results FROM search_events WHERE created_at >= datetime('now',?) AND ${sourceClause}`).bind(modifier).first()) || {};

    const top = (await env.DB.prepare(`SELECT query_normalised,MAX(query_text) query_text,COUNT(*) searches,ROUND(AVG(result_count),1) avg_results,SUM(CASE WHEN result_count=0 THEN 1 ELSE 0 END) zero_results,MAX(created_at) last_seen FROM search_events WHERE created_at >= datetime('now',?) AND ${sourceClause} GROUP BY query_normalised ORDER BY searches DESC,last_seen DESC LIMIT 25`).bind(modifier).all()).results || [];

    const unmet = (await env.DB.prepare(`SELECT query_normalised,MAX(query_text) query_text,COUNT(*) searches,MAX(created_at) last_seen FROM search_events WHERE created_at >= datetime('now',?) AND ${sourceClause} AND result_count=0 GROUP BY query_normalised ORDER BY searches DESC,last_seen DESC LIMIT 25`).bind(modifier).all()).results || [];

    const recent = (await env.DB.prepare(`SELECT query_text,result_count,search_type,search_area,source,created_at FROM search_events WHERE created_at >= datetime('now',?) AND ${sourceClause} ORDER BY created_at DESC LIMIT 50`).bind(modifier).all()).results || [];

    return json({ days, scope, totals, top, unmet, recent });
  } catch (error) {
    console.error('Search insight load error', error);
    return json({ error: 'Could not load search insights.' }, 500);
  }
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff'
    }
  });
}