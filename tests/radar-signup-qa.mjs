// Offline-only funnel QA. All upstream requests are mocked; no subscriber writes.
import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
// Direct file import now resolves the gated referral service module.
const { handleRadarSignup } = await import(new URL('../radar-signup-api.js', import.meta.url));

const RADAR = '202394374779176114';
const SK8 = '190964754190174086';
const ENV = { MAILERLITE_API_TOKEN: 'fake', TURNSTILE_SECRET_KEY: 'fake', RADAR_SIGNUP_ENABLED: 'true', RADAR_REFERRAL_ENABLED: 'false' };
const turnstileOK = { success: true, action: 'newsletter_signup', hostname: 'www.sk8scoop.com' };

async function simulate({ host = 'www.sk8scoop.com', origin, fetchSite = 'same-origin', data = {},
                         existing = 'missing', groups = [SK8], turnstile = turnstileOK,
                         env = ENV, lookupError, saveStatus = 200, type = 'application/x-www-form-urlencoded',
                         length } = {}) {
  const body = new URLSearchParams({ email: 'reader@example.com', consent: 'yes',
    started_at: String(Date.now() - 3500), 'cf-turnstile-response': 'token', source: 'sk8_invite', ...data });
  const requests = [];
  const request = new Request('https://' + host + '/api/radar-signup', {
    method: 'POST', body: body.toString(),
    headers: {
      origin: origin === undefined ? 'https://' + host : origin,
      'sec-fetch-site': fetchSite,
      'content-type': type,
      'CF-Connecting-IP': '192.0.2.20',
      ...(length ? { 'content-length': String(length) } : {})
    }
  });
  const realFetch = globalThis.fetch, log = console.log, error = console.error;
  const recordedLogs = [];
  console.log = (...args) => recordedLogs.push(args.join(' '));
  console.error = (...args) => recordedLogs.push(args.join(' '));
  globalThis.fetch = async (url, opts = {}) => {
    const u = String(url);
    const payload = u.endsWith('/subscribers') ? JSON.parse(opts.body) : null;
    requests.push({ url: u, method: opts.method || 'GET', payload });
    if (u.includes('siteverify')) return new Response(JSON.stringify(turnstile), { status: 200 });
    if (u.includes('/subscribers/')) {
      const previousWrite = requests.find(req => req.url.endsWith('/subscribers') && req.method === 'POST');
      if (previousWrite) {
        const savedGroups = [...new Set([...(existing === 'active' ? groups : []), ...(previousWrite.payload.groups || [])])];
        return new Response(JSON.stringify({ data: {
          id: '12345678901234567', status: 'active', groups: savedGroups.map(id => ({ id }))
        } }));
      }
      if (lookupError) return new Response('', { status: lookupError });
      if (existing === 'missing') return new Response('', { status: 404 });
      return new Response(JSON.stringify({ data: { status: existing, groups: groups.map(id => ({ id })) } }));
    }
    if (u.endsWith('/subscribers') && opts.method === 'POST') {
      return new Response(JSON.stringify({ data: {
        id: '12345678901234567', status: saveStatus === 200 ? 'active' : 'junk'
      } }), { status: saveStatus });
    }
    throw Error('Unexpected network call ' + u);
  };
  let reply;
  try { reply = await handleRadarSignup(request, env); }
  finally { globalThis.fetch = realFetch; console.log = log; console.error = error; }
  return { status: reply.status, result: await reply.json(), requests, recordedLogs,
           write: requests.find(req => req.url.endsWith('/subscribers') && req.method === 'POST') };
}

await test('blocked in staging', async () => {
  const r = await simulate({ host: 'draft.previews.sk8scoop.com' });
  assert.equal(r.status, 503); assert.equal(r.requests.length, 0);
});
await test('disabled until launch approval flag', async () => {
  const r = await simulate({ env: { ...ENV, RADAR_SIGNUP_ENABLED: 'false' } });
  assert.equal(r.status, 503); assert.equal(r.requests.length, 0);
});
await test('rejects cross-origin and cross-site submission', async () => {
  for (const r of [await simulate({ origin: 'https://other.example' }), await simulate({ fetchSite: 'cross-site' })]) {
    assert.equal(r.status, 403); assert.equal(r.requests.length, 0);
  }
});
await test('rejects invalid content, oversized requests and invalid email', async () => {
  assert.equal((await simulate({ type: 'text/plain' })).status, 415);
  assert.equal((await simulate({ length: 9000 })).status, 413);
  assert.equal((await simulate({ data: { email: 'bad' } })).status, 400);
});
await test('explicit consent is required', async () => {
  const r = await simulate({ data: { consent: 'no' } });
  assert.equal(r.status, 400); assert.equal(r.requests.length, 0);
});
await test('anti-bot timing, Turnstile token and hostname/action enforced', async () => {
  assert.equal((await simulate({ data: { started_at: String(Date.now()) } })).status, 400);
  assert.equal((await simulate({ data: { 'cf-turnstile-response': '' } })).status, 400);
  assert.equal((await simulate({ turnstile: { success: true, action: 'login', hostname: 'www.sk8scoop.com' } })).status, 403);
  assert.equal((await simulate({ turnstile: { success: true, action: 'newsletter_signup', hostname: 'other.example' } })).status, 403);
});
await test('fails closed on missing secrets or MailerLite errors', async () => {
  assert.equal((await simulate({ env: {} })).status, 503);
  assert.equal((await simulate({ lookupError: 503 })).status, 502);
  assert.equal((await simulate({ saveStatus: 422 })).status, 502);
});
await test('global unsubscribed/bounced/junk accounts are not reactivated', async () => {
  for (const status of ['unsubscribed', 'bounced', 'junk']) {
    const r = await simulate({ existing: status });
    assert.equal(r.status, 409); assert.equal(r.write, undefined);
  }
});
await test('existing Radar members are not duplicated', async () => {
  const r = await simulate({ existing: 'active', groups: [SK8, RADAR] });
  assert.equal(r.status, 200); assert.equal(r.result.already_subscribed, true);
  assert.equal(r.write, undefined);
});
await test('existing SK8 reader gets only Radar group, preserving account fields', async () => {
  const r = await simulate({ existing: 'active' });
  assert.equal(r.status, 200);
  assert.deepEqual(r.write.payload.groups, [RADAR]);
  assert.equal(r.write.payload.resubscribe, false);
  assert.equal('status' in r.write.payload, false);
  assert.equal('ip_address' in r.write.payload, false);
  assert.equal('opted_in_at' in r.write.payload, false);
});
await test('new reader joins Radar only with recorded consent timestamp', async () => {
  const r = await simulate();
  assert.equal(r.status, 200);
  assert.deepEqual(r.write.payload.groups, [RADAR]);
  assert.equal(r.write.payload.status, 'active');
  assert.equal(r.write.payload.resubscribe, false);
  assert.ok(r.write.payload.opted_in_at);
  assert.equal(r.write.payload.optin_ip, '192.0.2.20');
  assert.ok(r.recordedLogs.every(x => !x.includes('reader@example.com')));
});
await test('honeypot never writes contacts', async () => {
  const r = await simulate({ data: { website: 'spam' } });
  assert.equal(r.status, 200); assert.equal(r.requests.length, 0);
});
await test('routes and both-way optional invitations are present', () => {
  const text = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
  assert.match(text('worker-business-v2.js'), /handleRadarSignup\(request, env\)/);
  const form = text('radar/index.html');
  assert.match(form, /name="consent" value="yes" required/);
  assert.match(form, /name="cf-turnstile-response"/);
  assert.match(text('radar/signup.js'), /action: 'newsletter_signup'/);
  assert.match(text('radar/signup.js'), /radar-referral-status/);
  assert.match(text('radar/index.html'), /name="referral_code"/);
  assert.match(text('wrangler.toml'), /RADAR_REFERRAL_ENABLED = "false"/);
  assert.match(text('radar/success/index.html'), /\/join\/\?utm_source=radar/);
  for (const path of ['signup-success/index.html', 'qr-success/index.html',
                      'free-cheap-guide/success/index.html', '52-adventures/success/index.html',
                      'halloween-half-term-guide/success/index.html']) {
    assert.match(text(path), /\/radar\/\?via=sk8/);
  }
});
console.log('Radar QA passed. No real emails sent, contacts created or API keys used.');
