const SCHEMA = `
CREATE TABLE IF NOT EXISTS qr_events (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 event_type TEXT NOT NULL,
 qr_code TEXT NOT NULL,
 poster_id TEXT,
 venue TEXT,
 area TEXT,
 campaign TEXT,
 source TEXT,
 medium TEXT,
 path TEXT,
 created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_qr_events_code ON qr_events(qr_code);
CREATE INDEX IF NOT EXISTS idx_qr_events_created ON qr_events(created_at);

CREATE TABLE IF NOT EXISTS event_submissions (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 event_name TEXT NOT NULL,
 event_date TEXT NOT NULL,
 event_time TEXT,
 venue TEXT NOT NULL,
 area TEXT NOT NULL,
 cost TEXT,
 booking_url TEXT NOT NULL,
 description TEXT NOT NULL,
 contact_name TEXT NOT NULL,
 email TEXT NOT NULL,
 image_note TEXT,
 status TEXT NOT NULL DEFAULT 'pending',
 created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS advertiser_enquiries (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 business_name TEXT NOT NULL,
 contact_name TEXT NOT NULL,
 email TEXT NOT NULL,
 phone TEXT,
 business_type TEXT,
 area TEXT,
 website TEXT NOT NULL,
 package TEXT NOT NULL,
 preferred_date TEXT NOT NULL,
 advert_copy TEXT,
 image_link TEXT,
 invoice_details TEXT,
 status TEXT NOT NULL DEFAULT 'pending',
 created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS business_submissions (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 submission_type TEXT NOT NULL,
 organisation_name TEXT NOT NULL,
 title TEXT NOT NULL,
 area TEXT NOT NULL,
 relevant_date TEXT,
 cost_or_pay TEXT,
 official_url TEXT NOT NULL,
 details TEXT NOT NULL,
 image_note TEXT,
 contact_name TEXT NOT NULL,
 email TEXT NOT NULL,
 sponsored_interest TEXT,
 status TEXT NOT NULL DEFAULT 'pending',
 created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_business_submissions_status ON business_submissions(status);
CREATE INDEX IF NOT EXISTS idx_business_submissions_type ON business_submissions(submission_type);

CREATE TABLE IF NOT EXISTS subscriber_preferences (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 email TEXT NOT NULL UNIQUE,
 families_children INTEGER NOT NULL DEFAULT 0,
 events INTEGER NOT NULL DEFAULT 0,
 food_drink INTEGER NOT NULL DEFAULT 0,
 offers_savings INTEGER NOT NULL DEFAULT 0,
 home_property INTEGER NOT NULL DEFAULT 0,
 pets_outdoors INTEGER NOT NULL DEFAULT 0,
 practical_updates INTEGER NOT NULL DEFAULT 0,
 updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS reader_submissions (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 submission_type TEXT NOT NULL,
 message TEXT NOT NULL,
 reference TEXT,
 link TEXT,
 name TEXT,
 email TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'pending',
 notification_status TEXT NOT NULL DEFAULT 'pending',
 created_at TEXT NOT NULL,
 notified_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_reader_submissions_status ON reader_submissions(status);
CREATE INDEX IF NOT EXISTS idx_reader_submissions_type ON reader_submissions(submission_type);

CREATE TABLE IF NOT EXISTS contact_messages (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 name TEXT NOT NULL,
 email TEXT NOT NULL,
 category TEXT NOT NULL,
 message TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'pending',
 notification_status TEXT NOT NULL DEFAULT 'pending',
 created_at TEXT NOT NULL,
 notified_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON contact_messages(status);
CREATE INDEX IF NOT EXISTS idx_contact_messages_category ON contact_messages(category);
`;

let schemaReady = false;
const LIVE_POSTER_COUNT = 17;
const CONTACT_INBOX = 'contact@sk8scoop.com';
const WEBSITE_SENDER = 'website@sk8scoop.com';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (!url.pathname.startsWith('/api/')) {
      return env.ASSETS.fetch(request);
    }

    try {
      if (!env.DB) {
        return json({ error: 'The website database is not connected yet.' }, 503);
      }

      await ensureSchema(env.DB);

      if (url.pathname === '/api/qr-event' && request.method === 'POST') {
        return handleQrEvent(request, env);
      }
      if (url.pathname === '/api/qr-stats' && request.method === 'GET') {
        return handleQrStats(request, env);
      }
      if (url.pathname === '/api/advertiser-enquiry' && request.method === 'POST') {
        return handleAdvertiserEnquiry(request, env);
      }
      if (url.pathname === '/api/business-submission' && request.method === 'POST') {
        return handleBusinessSubmission(request, env);
      }
      if (url.pathname === '/api/submit-event' && request.method === 'POST') {
        return handleSubmitEvent(request, env);
      }
      if (url.pathname === '/api/save-preferences' && request.method === 'POST') {
        return handleSavePreferences(request, env);
      }
      if (url.pathname === '/api/reader-submission' && request.method === 'POST') {
        return handleReaderSubmission(request, env);
      }
      if (url.pathname === '/api/contact-message' && request.method === 'POST') {
        return handleContactMessage(request, env);
      }

      return json({ error: 'Not found.' }, 404);
    } catch (error) {
      console.error('SK8 Scoop API error', error);
      return json({ error: 'The request could not be completed.' }, 500);
    }
  }
};

async function ensureSchema(db) {
  if (schemaReady) return;

  // The production schema is applied through the D1 console/migrations.
  // At request time, only verify the established tables are present.
  // New preview-only tables are checked inside their own handlers so a
  // missing migration cannot break unrelated production API routes.
  const requiredTables = [
    'advertiser_enquiries',
    'business_submissions',
    'event_submissions',
    'qr_events',
    'subscriber_preferences'
  ];

  const placeholders = requiredTables.map(() => '?').join(',');
  const result = await db
    .prepare(`SELECT name FROM sqlite_master WHERE type = 'table' AND name IN (${placeholders})`)
    .bind(...requiredTables)
    .all();

  const found = new Set((result.results || []).map(row => row.name));
  const missing = requiredTables.filter(name => !found.has(name));

  if (missing.length) {
    throw new Error(`Missing D1 tables: ${missing.join(', ')}`);
  }

  schemaReady = true;
}

async function tableExists(db, tableName) {
  const result = await db
    .prepare(`SELECT name FROM sqlite_master WHERE type = 'table' AND name = ? LIMIT 1`)
    .bind(tableName)
    .first();
  return Boolean(result && result.name === tableName);
}

async function handleQrEvent(request, env) {
  const data = await readJson(request);
  const allowed = ['view', 'form_submit', 'form_success'];
  if (!allowed.includes(data.event_type)) return json({ error: 'Invalid event.' }, 400);
  const clean = value => String(value || '').slice(0, 180);
  await env.DB.prepare(`INSERT INTO qr_events (event_type,qr_code,poster_id,venue,area,campaign,source,medium,path,created_at) VALUES (?,?,?,?,?,?,?,?,?,datetime('now'))`)
    .bind(clean(data.event_type), clean(data.qr_code), clean(data.poster_id), clean(data.venue), clean(data.area), clean(data.campaign), clean(data.source), clean(data.medium), clean(data.path)).run();
  return json({ ok: true });
}

async function handleQrStats(request, env) {
  const auth = request.headers.get('authorization') || '';
  if (!env.ADMIN_TOKEN) return json({ error: 'The admin token has not been configured.' }, 503);
  if (auth !== `Bearer ${env.ADMIN_TOKEN}`) return json({ error: 'Unauthorised.' }, 401);
  const rows = (await env.DB.prepare(`SELECT poster_id,qr_code,MAX(venue) venue,MAX(area) area,SUM(CASE WHEN event_type='view' THEN 1 ELSE 0 END) views,SUM(CASE WHEN event_type='form_submit' THEN 1 ELSE 0 END) form_attempts,SUM(CASE WHEN event_type='form_success' THEN 1 ELSE 0 END) form_successes,MAX(created_at) last_seen FROM qr_events GROUP BY qr_code,poster_id ORDER BY poster_id`).all()).results || [];
  const totals = rows.reduce((total, row) => ({
    views: total.views + Number(row.views || 0),
    form_attempts: total.form_attempts + Number(row.form_attempts || 0),
    form_successes: total.form_successes + Number(row.form_successes || 0),
    live_posters: LIVE_POSTER_COUNT
  }), { views: 0, form_attempts: 0, form_successes: 0, live_posters: LIVE_POSTER_COUNT });
  return json({ rows, totals });
}

async function handleAdvertiserEnquiry(request, env) {
  const d = await readJson(request);
  const required = ['business_name', 'contact_name', 'email', 'package', 'preferred_date', 'website', 'terms_accepted'];
  if (required.some(key => !String(d[key] || '').trim())) return json({ error: 'Please complete all required fields.' }, 400);
  if (!isEmail(d.email)) return json({ error: 'Please provide a valid email address.' }, 400);
  if (!isUrl(d.website)) return json({ error: 'Please provide a valid website or landing page.' }, 400);
  const allowed = ['local_spotlight', 'monthly_partner', 'category_partner', 'bespoke'];
  if (!allowed.includes(String(d.package))) return json({ error: 'Please choose a valid campaign option.' }, 400);
  const c = (value, length = 1000) => String(value || '').trim().slice(0, length);
  await env.DB.prepare(`INSERT INTO advertiser_enquiries (business_name,contact_name,email,phone,business_type,area,website,package,preferred_date,advert_copy,image_link,invoice_details,status,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?, 'pending',datetime('now'))`)
    .bind(c(d.business_name, 180), c(d.contact_name, 120), c(d.email, 200), c(d.phone, 80), c(d.business_type, 120), c(d.area, 100), c(d.website, 500), c(d.package, 80), c(d.preferred_date, 30), c(d.advert_copy, 1000), c(d.image_link, 500), c(d.invoice_details, 500)).run();
  return json({ message: 'Thank you. Your campaign enquiry has been saved for suitability and availability checks.' });
}

async function handleBusinessSubmission(request, env) {
  const d = await readJson(request);
  const required = ['submission_type', 'organisation_name', 'title', 'area', 'official_url', 'details', 'contact_name', 'email', 'accuracy_confirmed', 'terms_accepted'];
  if (required.some(key => !String(d[key] || '').trim())) return json({ error: 'Please complete all required fields.' }, 400);
  if (!isUrl(d.official_url)) return json({ error: 'Please provide a valid official link.' }, 400);
  if (!isEmail(d.email)) return json({ error: 'Please provide a valid email address.' }, 400);
  const allowed = ['event', 'opening', 'offer', 'class', 'job', 'community_information', 'advertising_enquiry'];
  if (!allowed.includes(String(d.submission_type))) return json({ error: 'Please choose a valid submission type.' }, 400);
  const c = (value, length = 1800) => String(value || '').trim().slice(0, length);
  await env.DB.prepare(`INSERT INTO business_submissions (submission_type,organisation_name,title,area,relevant_date,cost_or_pay,official_url,details,image_note,contact_name,email,sponsored_interest,status,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?, 'pending',datetime('now'))`)
    .bind(c(d.submission_type, 60), c(d.organisation_name, 180), c(d.title, 180), c(d.area, 80), c(d.relevant_date, 20), c(d.cost_or_pay, 160), c(d.official_url, 500), c(d.details, 1800), c(d.image_note, 500), c(d.contact_name, 120), c(d.email, 200), c(d.sponsored_interest, 30)).run();
  return json({ message: 'Thank you. Your local information has been saved for verification and review.' });
}

async function handleSubmitEvent(request, env) {
  const d = await readJson(request);
  const required = ['event_name', 'event_date', 'venue', 'area', 'booking_url', 'description', 'contact_name', 'email', 'accuracy_confirmed', 'terms_accepted'];
  if (required.some(key => !String(d[key] || '').trim())) return json({ error: 'Please complete all required fields.' }, 400);
  if (!isUrl(d.booking_url)) return json({ error: 'Please provide a valid official link.' }, 400);
  if (!isEmail(d.email)) return json({ error: 'Please provide a valid email address.' }, 400);
  const c = (value, length = 1200) => String(value || '').trim().slice(0, length);
  await env.DB.prepare(`INSERT INTO event_submissions (event_name,event_date,event_time,venue,area,cost,booking_url,description,contact_name,email,image_note,status,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,'pending',datetime('now'))`)
    .bind(c(d.event_name, 160), c(d.event_date, 20), c(d.event_time, 80), c(d.venue, 220), c(d.area, 80), c(d.cost, 100), c(d.booking_url, 500), c(d.description, 1200), c(d.contact_name, 120), c(d.email, 200), c(d.image_note, 400)).run();
  return json({ message: 'Thank you. The event is in the moderation queue for checking.' });
}

async function handleSavePreferences(request, env) {
  const d = await readJson(request);
  if (!isEmail(d.email)) return json({ error: 'Please provide a valid email address.' }, 400);
  if (String(d.preference_consent || '') !== 'yes') return json({ error: 'Please confirm that you want these preferences saved.' }, 400);
  const yn = key => String(d[key] || '') === 'yes' ? 1 : 0;
  const email = String(d.email).trim().toLowerCase().slice(0, 200);
  await env.DB.prepare(`INSERT INTO subscriber_preferences (email,families_children,events,food_drink,offers_savings,home_property,pets_outdoors,practical_updates,updated_at) VALUES (?,?,?,?,?,?,?,?,datetime('now')) ON CONFLICT(email) DO UPDATE SET families_children=excluded.families_children,events=excluded.events,food_drink=excluded.food_drink,offers_savings=excluded.offers_savings,home_property=excluded.home_property,pets_outdoors=excluded.pets_outdoors,practical_updates=excluded.practical_updates,updated_at=datetime('now')`)
    .bind(email, yn('families_children'), yn('events'), yn('food_drink'), yn('offers_savings'), yn('home_property'), yn('pets_outdoors'), yn('practical_updates')).run();
  return json({ message: 'Your optional SK8 Scoop interests have been saved.' });
}

async function handleReaderSubmission(request, env) {
  const d = await readJson(request);
  if (String(d.website || '').trim()) return json({ message: 'Thank you. Your submission has been received.' });
  if (!(await tableExists(env.DB, 'reader_submissions'))) return json({ error: 'Reader submissions need the pending database migration before this preview form can accept entries.' }, 503);

  const allowed = ['competition_answer', 'puzzle_answer', 'comment', 'local_tip', 'story_idea', 'photo', 'other'];
  if (!allowed.includes(String(d.submission_type || ''))) return json({ error: 'Please choose what you are sending.' }, 400);
  if (!String(d.message || '').trim()) return json({ error: 'Please enter your answer or message.' }, 400);
  if (!isEmail(d.email)) return json({ error: 'Please provide a valid email address.' }, 400);
  if (String(d.privacy_confirmed || '') !== 'yes') return json({ error: 'Please confirm that SK8 Scoop may use these details to review or respond to your submission.' }, 400);
  if (String(d.link || '').trim() && !isUrl(d.link)) return json({ error: 'Please provide a valid link beginning with http:// or https://.' }, 400);

  const c = (value, length = 4000) => String(value || '').trim().slice(0, length);
  const result = await env.DB.prepare(`INSERT INTO reader_submissions (submission_type,message,reference,link,name,email,status,notification_status,created_at) VALUES (?,?,?,?,?,?,'pending','pending',datetime('now'))`)
    .bind(c(d.submission_type, 60), c(d.message, 4000), c(d.reference, 240), c(d.link, 500), c(d.name, 120), c(d.email, 200).toLowerCase()).run();

  const rowId = result && result.meta ? result.meta.last_row_id : null;
  const notification = await notifyInbox(env, {
    subject: `[SK8 Scoop submission] ${labelSubmissionType(d.submission_type)}${d.reference ? ` - ${c(d.reference, 80)}` : ''}`,
    text: [
      'New SK8 Scoop reader submission',
      '',
      `Type: ${labelSubmissionType(d.submission_type)}`,
      `Name: ${c(d.name, 120) || 'Not supplied'}`,
      `Email: ${c(d.email, 200)}`,
      `Reference: ${c(d.reference, 240) || 'Not supplied'}`,
      `Link: ${c(d.link, 500) || 'Not supplied'}`,
      '',
      c(d.message, 4000)
    ].join('\n')
  });
  await updateNotificationStatus(env.DB, 'reader_submissions', rowId, notification);

  return json({ message: 'Thank you. Your submission has been saved for review.' });
}

async function handleContactMessage(request, env) {
  const d = await readJson(request);
  if (String(d.website || '').trim()) return json({ message: 'Thank you. Your message has been received.' });
  if (!(await tableExists(env.DB, 'contact_messages'))) return json({ error: 'Contact messages need the pending database migration before this preview form can accept messages.' }, 503);

  const allowed = ['general', 'correction', 'newsletter_problem', 'advertising', 'partnership', 'privacy', 'other'];
  if (!String(d.name || '').trim() || !String(d.message || '').trim()) return json({ error: 'Please complete your name and message.' }, 400);
  if (!isEmail(d.email)) return json({ error: 'Please provide a valid email address.' }, 400);
  if (!allowed.includes(String(d.category || ''))) return json({ error: 'Please choose what your message is about.' }, 400);
  if (String(d.privacy_confirmed || '') !== 'yes') return json({ error: 'Please confirm that SK8 Scoop may use these details to deal with your message.' }, 400);

  const c = (value, length = 5000) => String(value || '').trim().slice(0, length);
  const result = await env.DB.prepare(`INSERT INTO contact_messages (name,email,category,message,status,notification_status,created_at) VALUES (?,?,?,?,'pending','pending',datetime('now'))`)
    .bind(c(d.name, 120), c(d.email, 200).toLowerCase(), c(d.category, 60), c(d.message, 5000)).run();

  const rowId = result && result.meta ? result.meta.last_row_id : null;
  const notification = await notifyInbox(env, {
    subject: `[SK8 Scoop contact] ${labelContactCategory(d.category)} - ${c(d.name, 80)}`,
    text: [
      'New message from the SK8 Scoop contact page',
      '',
      `From: ${c(d.name, 120)}`,
      `Email: ${c(d.email, 200)}`,
      `Category: ${labelContactCategory(d.category)}`,
      '',
      c(d.message, 5000)
    ].join('\n')
  });
  await updateNotificationStatus(env.DB, 'contact_messages', rowId, notification);

  return json({ message: 'Thank you. Your message has been received by SK8 Scoop.' });
}

async function notifyInbox(env, { subject, text }) {
  if (!env.CONTACT_EMAIL || typeof env.CONTACT_EMAIL.send !== 'function') {
    return 'not_configured';
  }

  try {
    await env.CONTACT_EMAIL.send({
      to: CONTACT_INBOX,
      from: WEBSITE_SENDER,
      subject: safeHeader(subject),
      text: String(text || '').slice(0, 12000)
    });
    return 'sent';
  } catch (error) {
    console.error('SK8 Scoop contact notification failed', error);
    return 'failed';
  }
}

async function updateNotificationStatus(db, tableName, rowId, notificationStatus) {
  if (!rowId || !['reader_submissions', 'contact_messages'].includes(tableName)) return;
  const notifiedAtSql = notificationStatus === 'sent' ? "datetime('now')" : 'NULL';
  await db.prepare(`UPDATE ${tableName} SET notification_status = ?, notified_at = ${notifiedAtSql} WHERE id = ?`)
    .bind(notificationStatus, rowId)
    .run();
}

function labelSubmissionType(value) {
  return ({
    competition_answer: 'Competition answer',
    puzzle_answer: 'Puzzle answer',
    comment: 'Newsletter comment',
    local_tip: 'Local tip',
    story_idea: 'Story idea',
    photo: 'Photo or image link',
    other: 'Other'
  })[String(value || '')] || 'Reader submission';
}

function labelContactCategory(value) {
  return ({
    general: 'General question',
    correction: 'Correction',
    newsletter_problem: 'Newsletter problem',
    advertising: 'Advertising',
    partnership: 'Partnership',
    privacy: 'Privacy or data',
    other: 'Other'
  })[String(value || '')] || 'Contact message';
}

function safeHeader(value) {
  return String(value || '').replace(/[\r\n]+/g, ' ').trim().slice(0, 180);
}

async function readJson(request) {
  try {
    return await request.json();
  } catch {
    throw new Error('Invalid JSON body');
  }
}

function isEmail(value) {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(value || ''));
}

function isUrl(value) {
  return /^https?:\/\//i.test(String(value || ''));
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
