import { registerSk8BtmMember, recordSk8BtmReferral } from './sk8-btm-referral-service.js';
// South Manchester SK8 Scoop: isolated, single-opt-in MailerLite signup.
// Served on the existing Cloudflare Worker with an existing, private API key.
// IMPORTANT: never add SK8 Scoop readers to an SK8 Scoop group.
const SK8_GROUP = '190964754190174086';
const PRODUCTION_HOSTS = new Set(['www.sk8scoop.com', 'sk8scoop.com']);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAILERLITE = 'https://connect.mailerlite.com/api';
const REFERRAL_CODE_PATTERN = /^BTM-[A-HJ-NP-Z2-9]{12}$/;
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

export async function handleSk8BtmSignup(request, env) {
  if (request.method !== 'POST') return reply({ error: 'Method not allowed.' }, 405);
  const url = new URL(request.url);
  // Preview builds MUST never create real MailerLite contacts.
  if (!PRODUCTION_HOSTS.has(url.hostname)) {
    return reply({ error: 'Preview mode: real signups are disabled.' }, 503);
  }
  // Keep real subscriptions blocked until the owner approves the launch.
  if (env.SK8_BTM_SIGNUP_ENABLED !== 'true' || env.SK8_BTM_REFERRAL_ENABLED !== 'true') {
    return reply({ error: 'The Birthday Time Machine referral pilot is not live yet.' }, 503);
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
    return reply({ error: 'Please consent to receive the free SK8 Scoop newsletter.' }, 400);
  }
  if (body.getAll('referral_code').length > 1) {
    return reply({ error: 'Only one referral code may be submitted.' }, 400);
  }
  // SK8 Scoop remains single opt-in. Referral eligibility has a SEPARATE optional inbox-confirmation step.
  const referralEnabled = env.SK8_BTM_REFERRAL_ENABLED === 'true';
  const claimedCode = referralEnabled ? String(body.get('referral_code') || '').trim().toUpperCase() : '';
  if (claimedCode && !REFERRAL_CODE_PATTERN.test(claimedCode)) {
    return reply({ error: 'Check the referral code, or leave it blank.' }, 400);
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

    // The MailerLite account is shared by SK8 and SK8 Scoop. Read first to
    // avoid reactivating globally unsubscribed, bounced or junk contacts.
    const existingResponse = await mailerLiteRequest(env, '/subscribers/' + encodeURIComponent(email));
    if (existingResponse.status !== 200 && existingResponse.status !== 404) {
      console.error('sk8_btm_subscriber_lookup_error', existingResponse.status);
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
      if ((existing.groups || []).some(group => String(group.id) === SK8_GROUP)) {
        return reply({ success: true, already_subscribed: true });
      }
    }

    // Claimed codes are separate from each reader's own code (held privately in D1).
    // Preserve unrelated subscriber fields and account-level attribution.
    const fields = {};
    if (referralEnabled && claimedCode) fields.birthday_time_machine_referral_code = claimedCode;
    if (!existing) {
      fields.acquisition_channel = 'Referral';
      fields.signup_source = 'Birthday Time Machine';
      fields.signup_campaign = 'issue_22_btm';
      fields.signup_landing_page = 'Birthday Time Machine referral';
    }
    const payload = { email, groups: [SK8_GROUP], ...(Object.keys(fields).length ? {fields} : {}), resubscribe: false };
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
      console.error('sk8_btm_signup_upsert_error', added.status);
      return reply({ error: 'Subscription could not be saved. Please try again.' }, 502);
    }
    const created = await added.json();
    if (!created || !created.data || String(created.data.status) !== 'active') {
      return reply({ error: 'Subscription could not be verified. Please contact us.' }, 502);
    }
    // A successful upsert is not enough: only claim success after MailerLite
    // confirms that this active subscriber is actually in the SK8 Scoop group.
    const verifiedResponse = await mailerLiteRequest(
      env, '/subscribers/' + encodeURIComponent(String(created.data.id))
    );
    if (!verifiedResponse.ok) {
      console.error('sk8_btm_signup_membership_verification_error', verifiedResponse.status);
      return reply({ error: 'We could not confirm your SK8 Scoop signup. Please try again later or email contact@sk8scoop.com.' }, 502);
    }
    const verifiedPayload = await verifiedResponse.json();
    const verifiedSubscriber = verifiedPayload && verifiedPayload.data;
    const inSk8Group = (verifiedSubscriber?.groups || [])
      .some(group => String(group.id) === SK8_GROUP);
    if (!verifiedSubscriber || verifiedSubscriber.status !== 'active' || !inSk8Group) {
      console.error('sk8_btm_signup_membership_not_verified');
      return reply({ error: 'We could not confirm your SK8 Scoop signup. Please email contact@sk8scoop.com before trying again.' }, 502);
    }
    // An optional claimed code is NOT a reward. Register the new member's
    // code in D1; only an independently confirmed mailbox can earn credit.
    // Any referral failure must not undo an otherwise valid SK8 Scoop signup.
    if (referralEnabled) {
      try {
        const registered = await registerSk8BtmMember(env, { id: String(created.data.id) });
        if (claimedCode && registered.ready) {
          await recordSk8BtmReferral(env, {
            referee: { id: String(created.data.id), email },
            claimedCode, existingSk8: false
          });
        }
      } catch {
        console.error('sk8_btm_referral_recording_unavailable');
      }
    }
    const source = body.get('source') === 'issue22' ? 'issue22_btm_referral' : 'btm_referral_page';
    // Aggregate channel only. Never log email, consent data or IP.
    console.log('sk8_btm_signup_success', source);
    return reply({ success: true, already_subscribed: false });
  } catch (error) {
    console.error('sk8_btm_signup_service_error', String(error && error.message || 'upstream'));
    return reply({ error: 'Subscription service temporarily unavailable.' }, 502);
  }
}
