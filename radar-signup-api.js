// South Manchester Radar: separate, single-opt-in signup using the existing
// Cloudflare Worker secrets and verified MailerLite account.
// This route NEVER adds somebody to the SK8 Scoop subscriber group.
const RADAR_GROUP = '202394374779176114';
const PRODUCTION_HOSTS = new Set(['www.sk8scoop.com', 'sk8scoop.com']);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const reply = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
    'referrer-policy': 'no-referrer'
  }
});

export async function handleRadarSignup(request, env) {
  const url = new URL(request.url);
  // Fail closed on staging and unexpected hosts: preview QA must not create real contacts.
  if (!PRODUCTION_HOSTS.has(url.hostname)) return reply({ error: 'Test environment: signups are disabled.' }, 503);
  const origin = request.headers.get('origin');
  const site = request.headers.get('sec-fetch-site');
  if ((origin && origin !== url.origin) || (site && !['same-origin', 'none'].includes(site))) {
    return reply({ error: 'Invalid request origin.' }, 403);
  }
  if (!(request.headers.get('content-type') || '').toLowerCase().startsWith('application/x-www-form-urlencoded')) {
    return reply({ error: 'Unsupported form submission.' }, 415);
  }
  const length = Number(request.headers.get('content-length') || 0);
  if (length > 8192) return reply({ error: 'Submission too large.' }, 413);

  let body;
  try {
    const raw = await request.text();
    if (raw.length > 8192) return reply({ error: 'Submission too large.' }, 413);
    body = new URLSearchParams(raw);
  } catch {
    return reply({ error: 'The form could not be read.' }, 400);
  }
  if (body.get('website')) return reply({ success: true }); // Honeypot: do not create a contact.
  const email = String(body.get('email') || '').trim().toLowerCase();
  if (email.length > 254 || !EMAIL_RE.test(email)) return reply({ error: 'Enter a valid email address.' }, 400);
  if (body.get('consent') !== 'yes') return reply({ error: 'Please agree to receive the Radar newsletter.' }, 400);
  const age = Date.now() - Number(body.get('started_at') || 0);
  if (!Number.isFinite(age) || age < 1200 || age > 6 * 60 * 60 * 1000) {
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
    const verifyResponse = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: challenge
    });
    if (!verifyResponse.ok) throw new Error('Turnstile unavailable');
    const verified = await verifyResponse.json();
    if (!verified.success || verified.action !== 'newsletter_signup' ||
        (verified.hostname && verified.hostname !== url.hostname)) {
      return reply({ error: 'Human check failed. Please try again.' }, 403);
    }

    // No SK8 group or SK8 attribution fields: preserve existing subscribers' data.
    const payload = { email, groups: [RADAR_GROUP], status: 'active' };
    if (ip) payload.ip_address = ip;
    const added = await fetch('https://connect.mailerlite.com/api/subscribers', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        authorization: 'Bearer ' + String(env.MAILERLITE_API_TOKEN),
        'content-type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    if (!added.ok) {
      console.error('Radar signup MailerLite rejected request', added.status);
      return reply({ error: 'Subscription could not be saved. Please try again or email us.' }, 502);
    }
    const source = body.get('source') === 'sk8_invite' ? 'sk8_invite' : 'radar_main';
    console.log('radar_signup_success', source); // Aggregate source only, never log email or IP.
    return reply({ success: true });
  } catch (error) {
    console.error('Radar signup upstream unavailable', String(error && error.message || 'upstream_error'));
    return reply({ error: 'Subscription service temporarily unavailable. Please try again.' }, 502);
  }
}
