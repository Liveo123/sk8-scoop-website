import siteWorker from './worker-protected.js';

const CONTACT_INBOX = 'contact@sk8scoop.com';
const RESEND_SENDER = 'alerts@notify.sk8scoop.com';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === '/api/advertiser-enquiry' && request.method === 'POST') {
      return handleAdvertiserEnquiryWithNotification(request, env, ctx);
    }

    if (url.pathname === '/api/advertiser-enquiries' && request.method === 'GET') {
      return handleAdvertiserEnquiries(request, env);
    }

    if (url.pathname === '/api/stripe-webhook' && request.method === 'POST') {
      return handleStripeWebhook(request, env);
    }

    return siteWorker.fetch(request, env, ctx);
  }
};

async function handleAdvertiserEnquiryWithNotification(request, env, ctx) {
  const notificationCopy = request.clone();
  const response = await siteWorker.fetch(request, env, ctx);
  if (!response.ok) return response;

  let data = null;
  try {
    data = await notificationCopy.json();
  } catch (error) {
    console.error('Advertiser enquiry notification parse failed', error);
    return response;
  }

  const c = (value, length = 1000) => String(value || '').trim().slice(0, length);
  const packageLabel = {
    temp_test: 'TEST £40',
    temp_grow: 'GROW £90',
    local_spotlight: 'Legacy Local Spotlight',
    monthly_partner: 'Legacy Monthly Partner',
    category_partner: 'Legacy Category Partner',
    bespoke: 'Legacy Bespoke'
  }[String(data.package || '')] || c(data.package, 80) || 'Not supplied';

  const notification = await notifyAdvertiserInbox(env, {
    subject: `[SK8 Scoop advertiser enquiry] ${c(data.business_name, 100)} - ${packageLabel}`,
    text: [
      'New SK8 Scoop advertiser enquiry',
      '',
      `Business: ${c(data.business_name, 180)}`,
      `Contact: ${c(data.contact_name, 120)}`,
      `Email: ${c(data.email, 200).toLowerCase()}`,
      `Phone: ${c(data.phone, 80) || 'Not provided'}`,
      `Area: ${c(data.area, 100) || 'Not provided'}`,
      `Business type: ${c(data.business_type, 120) || 'Not provided'}`,
      `Requested route: ${packageLabel}`,
      `Preferred timing: ${c(data.preferred_date, 80)}`,
      `Website / booking / social route: ${c(data.website, 500)}`,
      '',
      c(data.advert_copy, 1000) ? `Goal / useful message:\n${c(data.advert_copy, 1000)}` : 'No additional campaign note.'
    ].join('\n')
  });

  if (notification.status !== 'sent') {
    console.log(`Advertiser enquiry notification status: ${notification.status}${notification.code ? ` (${notification.code})` : ''}`);
  }

  return response;
}

const ADVERTISER_PAYMENTS_SQL = `CREATE TABLE IF NOT EXISTS advertiser_payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  advertiser_enquiry_id INTEGER NOT NULL,
  campaign_reference TEXT,
  package TEXT NOT NULL,
  amount_pence INTEGER NOT NULL,
  currency TEXT NOT NULL,
  stripe_checkout_session_id TEXT NOT NULL UNIQUE,
  stripe_payment_intent_id TEXT,
  stripe_payment_link_id TEXT,
  stripe_event_id TEXT NOT NULL,
  status TEXT NOT NULL,
  customer_email TEXT,
  business_name TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  paid_at TEXT
)`;

async function ensureAdvertiserPaymentsTable(db) {
  if (!db) throw new Error('Advertiser payment database unavailable');
  await db.prepare(ADVERTISER_PAYMENTS_SQL).run();
  await db.prepare('CREATE INDEX IF NOT EXISTS idx_advertiser_payments_enquiry ON advertiser_payments(advertiser_enquiry_id)').run();
  await db.prepare('CREATE INDEX IF NOT EXISTS idx_advertiser_payments_status ON advertiser_payments(status)').run();
}

async function handleStripeWebhook(request, env) {
  const webhookSecret = String(env.STRIPE_WEBHOOK_SECRET || '').trim();
  if (!webhookSecret) return json({ error: 'Stripe webhook is not configured.' }, 503);
  if (!env.DB) return json({ error: 'The website database is not connected yet.' }, 503);

  const rawBody = await request.text();
  const signature = request.headers.get('stripe-signature') || '';
  const verified = await verifyStripeSignature(rawBody, signature, webhookSecret);
  if (!verified) return json({ error: 'Invalid Stripe signature.' }, 400);

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return json({ error: 'Unreadable Stripe event.' }, 400);
  }

  const allowedEvents = new Set([
    'checkout.session.completed',
    'checkout.session.async_payment_succeeded',
    'checkout.session.async_payment_failed',
    'checkout.session.expired'
  ]);
  if (!allowedEvents.has(String(event.type || ''))) return json({ received: true, ignored: true });

  const session = event && event.data && event.data.object ? event.data.object : null;
  if (!session || session.object !== 'checkout.session') return json({ received: true, ignored: true });

  const metadata = session.metadata || {};
  const enquiryId = Number.parseInt(metadata.advertiser_enquiry_id, 10);
  const packageKey = String(metadata.sk8_product || '');
  const campaignReference = String(metadata.campaign_reference || session.client_reference_id || '').trim().slice(0, 100);
  if (!Number.isInteger(enquiryId) || enquiryId <= 0 || !['temp_test', 'temp_grow'].includes(packageKey)) {
    console.log('Stripe advertiser payment ignored: missing approved enquiry metadata');
    return json({ received: true, ignored: true });
  }

  const enquiry = await env.DB.prepare('SELECT id,business_name,email,status FROM advertiser_enquiries WHERE id = ? LIMIT 1').bind(enquiryId).first();
  if (!enquiry) {
    console.log(`Stripe advertiser payment ignored: enquiry ${enquiryId} not found`);
    return json({ received: true, ignored: true });
  }

  await ensureAdvertiserPaymentsTable(env.DB);

  const isPaid = (
    event.type === 'checkout.session.async_payment_succeeded' ||
    (event.type === 'checkout.session.completed' && session.payment_status === 'paid')
  );
  const paymentStatus = isPaid ? 'paid' : event.type === 'checkout.session.async_payment_failed' ? 'failed' : event.type === 'checkout.session.expired' ? 'expired' : String(session.payment_status || 'pending');
  const amount = Number.isFinite(Number(session.amount_total)) ? Math.max(0, Math.trunc(Number(session.amount_total))) : 0;
  const currency = String(session.currency || 'gbp').toLowerCase().slice(0, 10);
  const customerEmail = String((session.customer_details && session.customer_details.email) || session.customer_email || enquiry.email || '').trim().toLowerCase().slice(0, 200);
  const businessName = String((session.collected_information && session.collected_information.business_name) || enquiry.business_name || '').trim().slice(0, 180);
  const sessionId = String(session.id || '').slice(0, 120);
  const paymentIntent = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent && session.payment_intent.id ? String(session.payment_intent.id) : '';
  const paymentLink = typeof session.payment_link === 'string' ? session.payment_link : session.payment_link && session.payment_link.id ? String(session.payment_link.id) : '';
  const eventId = String(event.id || '').slice(0, 120);

  if (!sessionId || !eventId) return json({ received: true, ignored: true });

  await env.DB.prepare(`INSERT INTO advertiser_payments (
      advertiser_enquiry_id,campaign_reference,package,amount_pence,currency,
      stripe_checkout_session_id,stripe_payment_intent_id,stripe_payment_link_id,stripe_event_id,
      status,customer_email,business_name,created_at,updated_at,paid_at
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,datetime('now'),datetime('now'),?)
    ON CONFLICT(stripe_checkout_session_id) DO UPDATE SET
      stripe_payment_intent_id=excluded.stripe_payment_intent_id,
      stripe_payment_link_id=excluded.stripe_payment_link_id,
      stripe_event_id=excluded.stripe_event_id,
      status=excluded.status,
      customer_email=excluded.customer_email,
      business_name=excluded.business_name,
      updated_at=datetime('now'),
      paid_at=CASE WHEN excluded.status='paid' THEN COALESCE(advertiser_payments.paid_at,datetime('now')) ELSE advertiser_payments.paid_at END`)
    .bind(
      enquiryId,
      campaignReference,
      packageKey,
      amount,
      currency,
      sessionId,
      paymentIntent || null,
      paymentLink || null,
      eventId,
      paymentStatus,
      customerEmail || null,
      businessName || null,
      isPaid ? new Date().toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, '') : null
    ).run();

  if (isPaid) {
    await env.DB.prepare(`UPDATE advertiser_enquiries SET status='paid' WHERE id=? AND status IN ('pending','approved','payment_sent')`).bind(enquiryId).run();
  }

  return json({ received: true });
}

async function verifyStripeSignature(rawBody, signatureHeader, secret) {
  const parts = String(signatureHeader || '').split(',').map(part => part.trim());
  const timestampPart = parts.find(part => part.startsWith('t='));
  const signatures = parts.filter(part => part.startsWith('v1=')).map(part => part.slice(3));
  if (!timestampPart || signatures.length === 0) return false;
  const timestamp = Number(timestampPart.slice(2));
  if (!Number.isFinite(timestamp) || Math.abs(Math.floor(Date.now() / 1000) - timestamp) > 300) return false;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const digest = await crypto.subtle.sign('HMAC', key, encoder.encode(`${timestamp}.${rawBody}`));
  const expected = [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
  return signatures.some(candidate => constantTimeEqual(candidate, expected));
}

function constantTimeEqual(a, b) {
  const left = String(a || '');
  const right = String(b || '');
  if (left.length !== right.length) return false;
  let diff = 0;
  for (let i = 0; i < left.length; i += 1) diff |= left.charCodeAt(i) ^ right.charCodeAt(i);
  return diff === 0;
}

async function handleAdvertiserEnquiries(request, env) {
  const auth = request.headers.get('authorization') || '';
  if (!env.ADMIN_TOKEN) return json({ error: 'The admin token has not been configured.' }, 503);
  if (auth !== `Bearer ${env.ADMIN_TOKEN}`) return json({ error: 'Unauthorised.' }, 401);
  if (!env.DB) return json({ error: 'The website database is not connected yet.' }, 503);

  try {
    await ensureAdvertiserPaymentsTable(env.DB);
    const rows = (await env.DB.prepare(`SELECT
      a.id,a.business_name,a.contact_name,a.email,a.phone,a.business_type,a.area,a.website,a.package,
      a.preferred_date,a.advert_copy,a.status,a.created_at,
      p.campaign_reference,p.package AS paid_package,p.amount_pence,p.currency,p.status AS payment_status,p.paid_at
    FROM advertiser_enquiries a
    LEFT JOIN advertiser_payments p
      ON p.id = (
        SELECT p2.id FROM advertiser_payments p2
        WHERE p2.advertiser_enquiry_id = a.id
        ORDER BY CASE WHEN p2.status='paid' THEN 0 ELSE 1 END, p2.updated_at DESC
        LIMIT 1
      )
    ORDER BY a.created_at DESC LIMIT 100`).all()).results || [];
    const counts = rows.reduce((acc, row) => {
      const key = String(row.status || 'unknown');
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    return json({ rows, counts, returned: rows.length });
  } catch (error) {
    console.error('Advertiser enquiry read failed', error);
    return json({ error: 'Could not load advertiser enquiries.' }, 500);
  }
}

async function notifyAdvertiserInbox(env, { subject, text }) {
  const apiKey = String(env.RESEND_API_KEY || '').trim();
  if (!apiKey) {
    console.error('Advertiser enquiry notification failed: RESEND_API_KEY is not configured');
    return { status: 'not_configured', code: 'RESEND_API_KEY_MISSING', message: 'RESEND_API_KEY is not configured' };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${apiKey}`,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        from: `SK8 Scoop <${RESEND_SENDER}>`,
        to: [CONTACT_INBOX],
        subject: safeHeader(subject),
        text: String(text || '').slice(0, 12000),
        reply_to: CONTACT_INBOX
      })
    });

    let result = null;
    try {
      result = await response.json();
    } catch {
      result = null;
    }

    if (!response.ok) {
      const code = result && result.name ? String(result.name) : `HTTP_${response.status}`;
      const message = result && result.message ? String(result.message) : `Resend returned HTTP ${response.status}`;
      console.error(`Advertiser enquiry notification failed: ${code}: ${message}`);
      return { status: 'failed', code, message: safeDiagnostic(message) };
    }

    const messageId = result && result.id ? String(result.id) : null;
    console.log(`Advertiser enquiry notification sent via Resend${messageId ? `: ${messageId}` : ''}`);
    return { status: 'sent', messageId };
  } catch (error) {
    const code = error && error.name ? String(error.name) : 'RESEND_REQUEST_FAILED';
    const message = error && error.message ? String(error.message) : String(error || 'Unknown error');
    console.error(`Advertiser enquiry notification failed: ${code}: ${message}`);
    return { status: 'failed', code, message: safeDiagnostic(message) };
  }
}

function safeHeader(value) {
  return String(value || '').replace(/[\r\n]+/g, ' ').trim().slice(0, 180);
}

function safeDiagnostic(value) {
  return String(value || '').replace(/[\r\n]+/g, ' ').replace(/[<>]/g, '').trim().slice(0, 240);
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
