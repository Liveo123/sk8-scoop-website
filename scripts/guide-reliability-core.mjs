import assert from 'node:assert/strict';

export const STATES = Object.freeze({
  PASS: 'PASS',
  FAIL: 'FAIL',
  NA: 'NOT APPLICABLE',
  UNKNOWN: 'NOT VERIFIED'
});

export const LINK_STATES = Object.freeze({
  WORKING: 'VERIFIED WORKING',
  BROKEN: 'CONFIRMED BROKEN',
  BLOCKED: 'AUTOMATION BLOCKED',
  UNKNOWN: 'UNVERIFIED'
});

// A bot-blocked request is not proof that a reader's link is broken.
export function classifyLinkProbe(status, error = '') {
  const code = Number(status);
  const detail = String(error).toLowerCase();
  if (code === 401 || code === 403 || code === 429 ||
      /captcha|robots|bot.block|access.denied/.test(detail)) return LINK_STATES.BLOCKED;
  if (code >= 200 && code < 300) return LINK_STATES.WORKING;
  if (code === 404 || code === 410) return LINK_STATES.BROKEN;
  // Redirects require destination verification. Timeouts and 5xx are uncertain.
  return LINK_STATES.UNKNOWN;
}

export function gbpAmounts(text) {
  return [...String(text ?? '').matchAll(/£\s*(\d+(?:\.\d{1,2})?)/g)]
    .map(m => Number(m[1])).sort((a, b) => a - b);
}

export function validateClaim(claim) {
  const errors = [];
  if (!claim || typeof claim !== 'object') return ['claim must be an object'];
  const required = ['claim_id', 'entry_id', 'claim_type', 'value', 'verification_status'];
  for (const field of required) if (claim[field] === undefined ||
      claim[field] === null || claim[field] === '') errors.push('missing ' + field);
  const allowed = new Set(['VERIFIED', 'QUALIFIED', 'CONFLICT', 'UNVERIFIED']);
  if (!allowed.has(claim.verification_status)) errors.push('invalid verification_status');
  if (claim.verification_status === 'VERIFIED') {
    if (!/^https?:\/\/\S+$/i.test(claim.source_url || '')) errors.push('verified claim needs a source_url');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(claim.checked_at || '')) errors.push('verified claim needs checked_at YYYY-MM-DD');
  } else if (!String(claim.caveat || '').trim()) {
    errors.push('unverified or qualified claim needs a specific caveat');
  }
  if (claim.claim_type === 'price') {
    if (!String(claim.product_name || '').trim()) errors.push('price needs product_name');
    if (!String(claim.unit || '').trim()) errors.push('price needs unit or cost basis');
    if (claim.currency !== 'GBP') errors.push('price currency must be GBP');
    if (!Number.isFinite(claim.amount) || claim.amount < 0) errors.push('price amount must be nonnegative');
  }
  if (claim.claim_type === 'date' && claim.verification_status === 'VERIFIED' &&
      !/^\d{4}-\d{2}-\d{2}$/.test(claim.value || '')) errors.push('verified date needs ISO local date');
  return errors;
}

export function eligibleForAction(claim, action) {
  if (validateClaim(claim).length || claim.verification_status !== 'VERIFIED') return false;
  if (action === 'calendar') return claim.claim_type === 'date';
  if (action === 'free') return claim.claim_type === 'price' && claim.amount === 0;
  if (action === 'under-10') return claim.claim_type === 'price' && claim.amount <= 10;
  return false;
}

export function extractTagAttribute(tag, name) {
  if (!/^[a-z][a-z0-9-]*$/i.test(name)) throw new Error('Invalid attribute name');
  const m = String(tag).match(new RegExp('\\b' + name + '=("|\\x27)([\\s\\S]*?)\\1', 'i'));
  return m ? m[2] : null;
}

export function audit52Finder(html) {
  const errors = [];
  const match = html.match(/<script id="adventure-data" type="application\/json">([\s\S]*?)<\/script>/);
  if (!match) return { errors: ['52 Adventures approved adventure-data JSON missing'], entries: 0, cards: 0 };
  let data;
  try { data = JSON.parse(match[1]); } catch { return { errors: ['adventure-data JSON invalid'], entries: 0, cards: 0 }; }
  const entries = Object.values(data);
  const cards = [...html.matchAll(/<article\b[^>]*class=["'][^"']*\bfinder-card\b[^"']*["'][^>]*>/gi)]
    .map(m => m[0]);
  if (entries.length !== 52) errors.push('Expected 52 approved adventures, found ' + entries.length);
  if (cards.length !== entries.length * 2) errors.push('Expected two static Finder cards per adventure');
  const tally = new Map();
  for (const card of cards) {
    const n = extractTagAttribute(card, 'data-num');
    const d = data[n];
    tally.set(n, (tally.get(n) || 0) + 1);
    if (!d) { errors.push('Finder card has unknown adventure ' + n); continue; }
    for (const [attr, expected] of [
      ['data-kind', d.kind], ['data-region', d.region], ['data-time', d.meta?.Allow]
    ]) if (String(extractTagAttribute(card, attr) ?? '').toLowerCase().trim() !==
             String(expected ?? '').toLowerCase().trim()) errors.push('Adventure ' + n + ' ' + attr + ' mismatches master');
    const rendered = gbpAmounts(extractTagAttribute(card, 'data-cost'));
    const master = gbpAmounts(d.meta?.Cost);
    if (JSON.stringify(rendered) !== JSON.stringify(master)) errors.push('Adventure ' + n + ' GBP amounts mismatch master');
  }
  for (const d of entries) if (tally.get(String(d.num)) !== 2) {
    errors.push('Adventure ' + d.num + ' appears ' + (tally.get(String(d.num)) || 0) + ' times in Finder');
  }
  return { errors: [...new Set(errors)], entries: entries.length, cards: cards.length };
}

export function resolveGuideLink(href, successPath) {
  if (!href) return null;
  try {
    const url = new URL(href, 'https://www.sk8scoop.com' + successPath);
    return url.hostname === 'www.sk8scoop.com' ? url.pathname : null;
  } catch { return null; }
}

export function validateSuccessJourney(html, successPath, expectedGuidePath) {
  const links = [...html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>/gi)]
    .map(m => resolveGuideLink(m[1], successPath));
  return links.includes(expectedGuidePath);
}

export function collectHtmlAnchors(html) {
  const ids = [...html.matchAll(/\bid=["']([^"']+)["']/gi)].map(m => m[1]);
  const fragments = [...html.matchAll(/\bhref=["']#([^"']+)["']/gi)].map(m => m[1]);
  return { ids, fragments, duplicates: ids.filter((x, i) => ids.indexOf(x) !== i) };
}
