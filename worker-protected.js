import existingWorker from './worker.js';
import { GUIDE_SPONSOR } from './functions/_shared/guide-sponsor-config.js';

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

    if (url.pathname === '/api/advertiser-enquiry' && request.method === 'POST') {
      return handleAdvertiserEnquiry(request, env);
    }

    if (url.pathname === '/api/advertiser-enquiries' && request.method === 'GET') {
      return handleAdvertiserEnquiries(request, env);
    }

    if (url.pathname === '/free-cheap-guide/guide/' || url.pathname === '/free-cheap-guide/guide') {
      return handleGuideRequest(request, env);
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

async function handleAdvertiserEnquiry(request, env) {
  if (!env.DB) return json({ error: 'The website database is not connected yet.' }, 503);
  let d;
  try {
    d = await request.json();
  } catch {
    return json({ error: 'The enquiry could not be read.' }, 400);
  }

  if (String(d.company_fax || '').trim()) {
    return json({ message: 'Thank you. Your campaign enquiry has been saved.' });
  }

  const required = ['business_name', 'contact_name', 'email', 'package', 'preferred_date', 'website', 'terms_accepted'];
  if (required.some(key => !String(d[key] || '').trim())) return json({ error: 'Please complete all required fields.' }, 400);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(d.email || ''))) return json({ error: 'Please provide a valid email address.' }, 400);
  if (!/^https?:\/\//i.test(String(d.website || ''))) return json({ error: 'Please provide a valid website, booking page or social profile URL.' }, 400);
  if (String(d.terms_accepted || '') !== 'yes') return json({ error: 'Please confirm the advertising terms.' }, 400);

  const allowed = ['pre_nue_recommendation', 'temp_test', 'temp_grow'];
  if (!allowed.includes(String(d.package))) return json({ error: 'Please choose a valid campaign option.' }, 400);

  const clean = (value, length = 1000) => String(value || '').trim().slice(0, length);
  const goal = clean(d.goal, 160);
  const note = clean(d.advert_copy, 800);
  const advertCopy = [goal ? `Goal: ${goal}` : '', note].filter(Boolean).join('\n\n');

  try {
    await env.DB.prepare(`INSERT INTO advertiser_enquiries (business_name,contact_name,email,phone,business_type,area,website,package,preferred_date,advert_copy,image_link,invoice_details,status,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?, 'pending',datetime('now'))`)
      .bind(clean(d.business_name, 180), clean(d.contact_name, 120), clean(d.email, 200), clean(d.phone, 80), clean(d.business_type, 120), clean(d.area, 100), clean(d.website, 500), clean(d.package, 80), clean(d.preferred_date, 80), clean(advertCopy, 1000), clean(d.image_link, 500), clean(d.invoice_details, 500)).run();
  } catch (error) {
    console.error('Advertiser enquiry insert failed', error);
    return json({ error: 'Could not save the enquiry.' }, 500);
  }

  return json({ message: 'Thank you. Your campaign enquiry has been saved. SK8 Scoop will recommend the simplest route that fits.' });
}

async function handleAdvertiserEnquiries(request, env) {
  const auth = request.headers.get('authorization') || '';
  if (!env.ADMIN_TOKEN || auth !== `Bearer ${env.ADMIN_TOKEN}`) return json({ error: 'Unauthorised' }, 401);
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

async function handleGuideRequest(request, env) {
  const assetResponse = await env.ASSETS.fetch(request);
  if (!isActiveSponsor(GUIDE_SPONSOR)) return assetResponse;
  const markup = sponsorMarkup(GUIDE_SPONSOR);
  if (!markup) return assetResponse;
  const type = assetResponse.headers.get('content-type') || '';
  if (!type.includes('text/html')) return assetResponse;

  const transformed = new HTMLRewriter()
    .on('body', {
      element(element) {
        element.prepend(markup, { html: true });
      }
    })
    .transform(assetResponse);

  const headers = new Headers(transformed.headers);
  headers.set('cache-control', 'no-store');
  return new Response(transformed.body, { status: transformed.status, statusText: transformed.statusText, headers });
}

function isActiveSponsor(sponsor) {
  if (!sponsor || sponsor.enabled !== true) return false;
  const start = Date.parse(sponsor.start_at || '');
  const end = Date.parse(sponsor.end_at || '');
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return false;
  const now = Date.now();
  return now >= start && now < end;
}

function sponsorMarkup(sponsor) {
  const href = trackedUrl(sponsor);
  if (!href || !sponsor.business_name || !sponsor.headline || !sponsor.copy || !sponsor.cta_text) return '';
  const safeImage = /^\/assets\/[A-Za-z0-9_./-]+$/.test(String(sponsor.image_url || '')) ? String(sponsor.image_url) : '';
  const image = safeImage
    ? `<div style="flex:0 0 116px"><img src="${escapeHtml(safeImage)}" alt="" loading="lazy" decoding="async" style="display:block;width:116px;height:92px;object-fit:cover;border-radius:13px"></div>`
    : '';

  return `<aside data-sk8-sponsored-slot="${escapeHtml(sponsor.slot_id)}" data-campaign-id="${escapeHtml(sponsor.campaign_id)}" aria-label="Sponsored message from ${escapeHtml(sponsor.business_name)}" style="max-width:1080px;margin:18px auto 24px;padding:0 18px;font-family:Inter,Arial,sans-serif;color:#263238"><div style="display:flex;gap:16px;align-items:center;background:#fffdf8;border:2px solid #0f6470;border-radius:18px;padding:16px 17px;box-shadow:0 8px 24px rgba(38,50,56,.08)">${image}<div style="min-width:0;flex:1"><div style="font-size:.68rem;letter-spacing:.14em;text-transform:uppercase;font-weight:950;color:#0f6470;margin-bottom:5px">SPONSORED · ${escapeHtml(sponsor.business_name)}</div><div style="font-family:Georgia,'Times New Roman',serif;font-size:clamp(1.18rem,2.4vw,1.55rem);font-weight:700;line-height:1.12;margin-bottom:6px">${escapeHtml(sponsor.headline)}</div><p style="margin:0 0 10px;line-height:1.45;font-size:.92rem">${escapeHtml(sponsor.copy)}</p><a href="${escapeHtml(href)}" rel="sponsored noopener" target="_blank" style="display:inline-block;background:#0f6470;color:#fff;text-decoration:none;font-weight:900;border-radius:9px;padding:10px 13px">${escapeHtml(sponsor.cta_text)}</a><div style="margin-top:8px;font-size:.68rem;line-height:1.35;color:#66736f">Paid placement. SK8 Scoop editorial remains independent.</div></div></div></aside>`;
}

function trackedUrl(sponsor) {
  try {
    const url = new URL(String(sponsor.cta_url || ''));
    if (!/^https?:$/.test(url.protocol)) return '';
    url.searchParams.set('utm_source', 'sk8_scoop');
    url.searchParams.set('utm_medium', 'guide_sponsor');
    if (sponsor.campaign_id) url.searchParams.set('utm_campaign', sponsor.campaign_id);
    url.searchParams.set('utm_content', sponsor.slot_id || 'free-cheap-guide-primary');
    return url.toString();
  } catch {
    return '';
  }
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
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
