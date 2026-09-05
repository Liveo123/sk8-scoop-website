import existingWorker from './worker.js';

const MAILERLITE_GROUPS = {
  main: ['190964754190174086'],
  qr: ['190964754190174086', '193441557512193685'],
  guide: ['190964754190174086', '197763144685192678']
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

  const requestedKind = String(form.get('sk8_form_kind') || 'main');
  const kind = requestedKind === 'qr' ? 'qr' : requestedKind === 'guide' ? 'guide' : 'main';

  const fields = {};
  for (const [key, value] of form.entries()) {
    if (typeof value !== 'string') continue;
    const match = /^fields\[([^\]]+)\]$/.exec(key);
    if (!match || match[1] === 'email') continue;
    fields[match[1]] = value;
  }

  const payload = {
    email,
    fields,
    groups: MAILERLITE_GROUPS[kind],
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

  return json({ success: true, kind });
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
