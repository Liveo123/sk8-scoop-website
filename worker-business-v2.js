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

    if (
      url.pathname === '/api/advertiser-enquiries-selftest' &&
      request.method === 'GET' &&
      url.hostname === 'sk8-business-growth-engine-v2-sk8-scoop.quiet-term-e047.workers.dev'
    ) {
      const internalRequest = new Request(new URL('/api/advertiser-enquiries', url), {
        headers: { authorization: `Bearer ${String(env.ADMIN_TOKEN || '')}` }
      });
      const check = await handleAdvertiserEnquiries(internalRequest, env);
      if (!check.ok) return json({ ok: false, status: check.status }, 500);
      const data = await check.json();
      return json({ ok: true, returned: Number(data.returned || 0) });
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

async function handleAdvertiserEnquiries(request, env) {
  const auth = request.headers.get('authorization') || '';
  if (!env.ADMIN_TOKEN) return json({ error: 'The admin token has not been configured.' }, 503);
  if (auth !== `Bearer ${env.ADMIN_TOKEN}`) return json({ error: 'Unauthorised.' }, 401);
  if (!env.DB) return json({ error: 'The website database is not connected yet.' }, 503);

  try {
    const rows = (await env.DB.prepare(`SELECT id,business_name,contact_name,email,phone,business_type,area,website,package,preferred_date,advert_copy,status,created_at FROM advertiser_enquiries ORDER BY created_at DESC LIMIT 100`).all()).results || [];
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
