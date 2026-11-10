import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import websiteWorker from '../worker-business-v2.js';

// Entire suite is local and mocks Resend; it never sends emails or writes live D1.
const page = readFileSync(new URL('../business-submissions/index.html', import.meta.url), 'utf8');
const formMatch = page.match(/<form\b[^>]*data-form-kind="business-submission"[\s\S]*?<\/form>/);
assert.ok(formMatch, 'free-submission form exists');
assert.ok(page.indexOf('<form ') > page.indexOf('<h1>'), 'form follows the headline');
assert.ok(page.indexOf('<form ') < page.indexOf('What happens next?'), 'form appears before explanation');
assert.equal((formMatch[0].match(/\srequired(?=[\s>])/g) || []).length, 4, 'only four essential form controls are required');
assert.match(formMatch[0], /name="submission_type" required/);
assert.match(formMatch[0], /name="details" required/);
assert.match(formMatch[0], /name="email" type="email"[^>]*required/);
assert.match(formMatch[0], /name="privacy_confirmed" value="yes" required/);
assert.match(formMatch[0], /name="official_url" type="text"/, 'link is optional free-text, not strict type=url');
assert.match(page, /href="\.\.\/advertise\.html"/);
assert.match(page, /business-submissions\.css/);
assert.match(page, /business-submissions\.js/);
assert.doesNotMatch(formMatch[0], /name="sponsored_interest"/, 'no commercial upsell in the free form');

const SENT = [];
function makeDb() {
  const queries = [];
  const db = {
    prepare(sql) {
      const values = [];
      return {
        bind(...args) {
          values.push(...args);
          return this;
        },
        async run() {
          queries.push({sql, values});
          if (sql.startsWith('INSERT INTO business_submissions ')) return { meta: {last_row_id: 42, changes: 1} };
          return {meta: {changes: 1}};
        }
      };
    }
  };
  return {db, queries};
}
const originalFetch = globalThis.fetch;
let apiOutcome = 'ok';
globalThis.fetch = async (url, init) => {
  assert.equal(url, 'https://api.resend.com/emails', 'only Resend endpoint is called');
  const body = JSON.parse(init.body);
  assert.equal(body.from, 'SK8 Scoop <alerts@notify.sk8scoop.com>');
  assert.equal(body.reply_to, 'contact@sk8scoop.com');
  SENT.push(body);
  return apiOutcome === 'fail'
    ? new Response(JSON.stringify({name:'invalid_key',message:'Simulated mail failure'}), {status:401, headers:{'content-type':'application/json'}})
    : new Response(JSON.stringify({id:'mock-email-id-'+SENT.length}), {status:200,headers:{'content-type':'application/json'}});
};

const start = Date.now() - 3000;
const valid = {
  submission_type: 'community_information',
  details: 'The local library has a free board-game evening on Thursday.',
  email: 'owner@example.com',
  privacy_confirmed: 'yes',
  official_url: 'www.example.co.uk/event',
  sk8_started_at: start
};
function request(data, extra={}) {
  return new Request('https://www.sk8scoop.com/api/business-submission',{
    method:'POST',
    headers:{'content-type':'application/json',origin:'https://www.sk8scoop.com',...extra},
    body:JSON.stringify(data)
  });
}
async function post(payload, env) {
  const response = await websiteWorker.fetch(request(payload), env, {});
  return { status: response.status, body:await response.json() };
}
async function invalid(payload, status=400) {
  const {db, queries} = makeDb();
  const calls = SENT.length;
  const res = await post(payload, {DB:db, RESEND_API_KEY:'mock-api-key'});
  assert.equal(res.status,status, JSON.stringify(res));
  assert.equal(queries.length,0,'invalid submission does not touch database');
  assert.equal(SENT.length,calls,'invalid submission sends no email');
}
try {
  const db1 = makeDb();
  const success = await post(valid,{DB:db1.db,RESEND_API_KEY:'mock-api-key'});
  assert.equal(success.status,200,JSON.stringify(success));
  assert.equal(success.body.submissionId,42);
  assert.match(success.body.message,/confirmation email is on its way/i);
  assert.equal(db1.queries.filter(x=>x.sql.startsWith('INSERT INTO business_submissions ')).length,1);
  const insert = db1.queries.find(x=>x.sql.startsWith('INSERT INTO business_submissions '));
  assert.equal(insert.values[6], 'https://www.example.co.uk/event', 'missing https:// normalized server-side');
  assert.equal(insert.values[1], '', 'no organization required');
  assert.equal(insert.values[3], '', 'no area required');
  assert.equal(insert.values[9], '', 'no contact name required');
  assert.equal(db1.queries.filter(x=>x.sql.startsWith('UPDATE business_submission_notifications')).length,2);
  assert.equal(SENT.length,2,'only two transactional emails');
  assert.deepEqual(SENT.map(x=>x.to),[['contact@sk8scoop.com'],['owner@example.com']]);
  assert.match(SENT[1].text,/does not guarantee publication/i);
  assert.doesNotMatch(SENT[1].text,/subscribe to|subscribe now|buy an advert/i);

  await invalid({...valid,privacy_confirmed:''});
  await invalid({...valid,email:'wrongaddress'});
  await invalid({...valid,details:'x'});
  await invalid({...valid,submission_type:'invalid'});
  await invalid({...valid,official_url:'javascript://evil.test/a'});
  await invalid({...valid,official_url:'https://user:secret@example.com/'});
  await invalid({...valid,sk8_started_at:Date.now()-24*60*60*1000});
  await invalid({...valid,sk8_started_at:Date.now()});
  const otherOrigin = await websiteWorker.fetch(request(valid, {origin:'https://example.com'}),{DB:makeDb().db,RESEND_API_KEY:'fake'},{});
  assert.equal(otherOrigin.status,403, 'cross-site submission refused');

  const bots = makeDb(), count = SENT.length;
  const honeypot = await post({...valid,company_fax:'filled'},{DB:bots.db,RESEND_API_KEY:'mock-api-key'});
  assert.equal(honeypot.status,200);
  assert.equal(bots.queries.length,0,'honeypot suppresses DB writes');
  assert.equal(SENT.length,count,'honeypot suppresses emails');

  // Failure of one or both email requests must NOT erase the saved D1 entry.
  apiOutcome='fail';
  const db2=makeDb();
  const failed=await post({...valid,official_url:''},{DB:db2.db,RESEND_API_KEY:'mock-api-key'});
  assert.equal(failed.status,200);
  assert.match(failed.body.message,/saved, but the confirmation email could not be sent/);
  assert.match(failed.body.message,/internal email alert was not sent/);
  assert.equal(db2.queries.filter(x=>x.sql.startsWith('INSERT INTO business_submissions ')).length,1);
  const failures=db2.queries.filter(x=>x.sql.startsWith('UPDATE business_submission_notifications'));
  assert.equal(failures.length,2);
  assert.deepEqual(failures.map(x=>x.values[0]),['failed','failed']);
  const db3=makeDb();
  const missingKey = await post({...valid,official_url:'example.co.uk'},{DB:db3.db});
  assert.equal(missingKey.status,200);
  assert.match(missingKey.body.message,/saved/);
  assert.equal(db3.queries.filter(x=>x.sql.startsWith('UPDATE business_submission_notifications')).length,2);
  console.log('PASS business submissions: 4 required inputs, URL normalization, privacy, one DB save, two transactional notifications, failure fallback, bot and origin checks.');
} finally {
  globalThis.fetch=originalFetch;
}
