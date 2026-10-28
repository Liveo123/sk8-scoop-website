// South Manchester Radar: isolated, single-opt-in MailerLite signup.
// Served on the existing Cloudflare Worker with an existing, private API key.
// IMPORTANT: never add Radar readers to an SK8 Scoop group.
const RADAR_GROUP = '202394374779176114';
const PRODUCTION_HOSTS = new Set(['www.sk8scoop.com', 'sk8scoop.com']);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAILERLITE = 'https://connect.mailerlite.com/api';

function reply(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
      'referrer-policy': 'no-referrer'
    }
  });
}

async function mailerLiteRequest(env, path, options = {}) {
  return fetch(MAILERLITE + path, {
    ...options,
    headers: {
      accept: 'application/json',
      authorization: 'Bearer ' + String(env.MAILERLITE_API_TOKEN),
      ...(options.body ? { 'content-type': 'application/json' } : {})
    }
  });
}

export async function handleRadarSignup(request, env) {
  if (request.method !== 'POST') return reply({ error: 'Method not allowed.' }, 405);
  const url = new URL(request.url);
  // Preview builds MUST never create real MailerLite contacts.
  if (!PRODUCTION_HOSTS.has(url.hostname)) {
    return reply({ error: 'Preview mode: real signups are disabled.' }, 503);
  }
  const origin = request.headers.get('origin');
  const fetchSite = request.headers.get('sec-fetch-site');
  if ((origin && origin !== url.origin) || (fetchSite && !['same-origin', 'none'].includes(fetchSite))) {
    return reply({ error: 'Invalid request origin.' }, 403);
  }
  if (!(request.headers.get('content-type') || '').toLowerCase().startsWith('application/x-www-form-urlencoded')) {
    return reply({ error: 'Unsupported form submission.' }, 415);
  }
  if (Number(request.headers.get('content-length') || 0) > 8192) {
    return reply({ error: 'Submission too large.' }, 413);
  }

  let body;
  try {
    const raw = await request.text();
    if (raw.length > 8192) return reply({ error: 'Submission too large.' }, 413);
    body = new URLSearchParams(raw);
  } catch {
    return reply({ error: 'The form could not be read.' }, 400);
  }
  // Honeypot: deliberately do not record bot submissions.
  if (body.get('website')) return reply({ success: true });
  if (body.getAll('email').length !== 1 || body.getAll('consent').length !== 1) {
    return reply({ error: 'Invalid form submission.' }, 400);
  }

  const email = String(body.get('email') || '').trim().toLowerCase();
  if (email.length > 254 || !EMAIL_RE.test(email)) return reply({ error: 'Enter a valid email address.' }, 400);
  if (body.get('consent') !== 'yes') {
    return reply({ error: 'Please consent to receive South Manchester Radar.' }, 400);
  }
  const ageMs = Date.now() - Number(body.get('started_at') || 0);
  if (!Number.isFinite(ageMs) || ageMs < 1200 || ageMs > 6 * 60 * 60 * 1000) {
    return reply({ error: 'Refresh the page and try again.' }, 400);
  }
  const token = String(body.get('cf-turnstile-response') || '');
  if (!token || token.length > 3000) return reply({ error: 'Complete the human check.' }, 400);
  if (!env.TURNSTILE_SECRET_KEY || !env.MAILERLITE_API_TOKEN) {
    return reply({ error: 'Subscription service temporarily unavailable.' }, 503);
  }

  try {
    const challenge = new URLSearchParams({
      secret: String(env.TURNSTILE_SECRET_KEY),
      response: token
    });
    const ip = request.headers.get('CF-Connecting-IP');
    if (ip) challenge.set('remoteip', ip);
    const turnstileResponse = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: challenge
    });
    if (!turnstileResponse.ok) throw new Error('Turnstile unavailable');
    const verified = await turnstileResponse.json();
    if (verified.success !== true || verified.action !== 'newsletter_signup' ||
        verified.hostname !== url.hostname) {
      return reply({ error: 'Human check failed. Please try again.' }, 403);
    }

    // The MailerLite account is shared by SK8 and Radar. Read first to
    // avoid reactivating globally unsubscribed, bounced or junk contacts.
    const existingResponse = await mailerLiteRequest(env, '/subscribers/' + encodeURIComponent(email));
    if (existingResponse.status !== 200 && existingResponse.status !== 404) {
      console.error('radar_subscriber_lookup_error', existingResponse.status);
      return reply({ error: 'Subscription service temporarily unavailable.' }, 502);
    }
    let existing = null;
    if (existingResponse.status === 200) {
      const lookup = await existingResponse.json();
      existing = lookup && lookup.data;
      if (!existing || !existing.status) return reply({ error: 'Subscription could not be checked.' }, 502);
      if (existing.status !== 'active') {
        // Safe fallback: only MailerLite's supported reactivation workflow
        // should resubscribe previously unsubscribed contacts.
        return reply({
          error: 'This address needs a manual subscription check. Please email contact@sk8scoop.com.'
        }, 409);
      }
      if ((existing.groups || []).some(group => String(group.id) === RADAR_GROUP)) {
        return reply({ success: true, already_subscribed: true });
      }
    }

    const payload = { email, groups: [RADAR_GROUP], resubscribe: false };
    if (!existing) {
      payload.status = 'active';
      payload.opted_in_at = new Date().toISOString().replace('T', ' ').slice(0, 19);
      if (ip) payload.optin_ip = ip;
    }
    // Preserve any existing SK8 subscriber's original account-level IP metadata.
    if (ip && !existing) payload.ip_address = ip;
    const added = await mailerLiteRequest(env, '/subscribers', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    if (!added.ok) {
      console.error('radar_signup_upsert_error', added.status);
      return reply({ error: 'Subscription could not be saved. Please try again.' }, 502);
    }
    const created = await added.json();
    if (!created || !created.data || String(created.data.status) !== 'active') {
      return reply({ error: 'Subscription could not be verified. Please contact us.' }, 502);
    }
    const source = body.get('source') === 'sk8_invite' ? 'sk8_invite' : 'radar_main';
    // Aggregate channel only. Never log email, consent data or IP.
    console.log('radar_signup_success', source);
    return reply({ success: true, already_subscribed: false });
  } catch (error) {
    console.error('radar_signup_service_error', String(error && error.message || 'upstream'));
    return reply({ error: 'Subscription service temporarily unavailable.' }, 502);
  }
}
