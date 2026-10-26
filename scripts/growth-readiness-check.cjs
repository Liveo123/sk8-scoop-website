/* Read-only pre-release guard for the SK8 website.
   Usage from repository root: node scripts/growth-readiness-check.cjs
   This check reads files only. It never deploys, publishes, sends or changes data. */
'use strict';
const fs = require('node:fs');
const assert = require('node:assert/strict');
const xml = fs.readFileSync('sitemap.xml', 'utf8');
const home = fs.readFileSync('index.html', 'utf8');
const whats = fs.readFileSync('whats-on/index.html', 'utf8');
const finder = fs.readFileSync('kids-family/holiday-club-finder/index.html', 'utf8');
const config = fs.readFileSync('assets/config.js', 'utf8');
let failures = 0;
function check(name, fn) {
  try { fn(); console.log('PASS ' + name); }
  catch (err) { failures++; console.error('FAIL ' + name + ': ' + err.message); }
}
check('sitemap has one current homepage URL', () => {
  assert.equal((xml.match(/<loc>https:\/\/www\.sk8scoop\.com\/<\/loc>/g) || []).length, 1);
});
check('latest issue 18 has a canonical sitemap URL', () => {
  assert.match(xml, /<loc>https:\/\/www\.sk8scoop\.com\/issues\/issue-18\/<\/loc>/);
});
check('homepage has real activity and signup journeys', () => {
  assert.match(home, /href="\/whats-on\/"/);
  assert.match(home, /data-signup-form/);
  assert.match(home, /href="\/kids-family\/holiday-club-finder\/"/);
});
check('seasonal homepage spotlight expires after October half term', () => {
  assert.match(home, /class="holiday-club-home-section"[^>]*data-expire-after="2026-10-30"/);
});
check('What's On seasonal promotion expires after half term', () => {
  assert.match(whats, /class="whats-on-holiday-quicklink"[^>]*data-expire-after="2026-10-30"/);
});
check('holiday club finder explains expiry and does not invite stale search indexing', () => {
  assert.match(finder, /name="robots" content="noindex,follow"/);
  assert.match(finder, /October 2026 is over/);
  assert.match(finder, /26–30 October 2026/);
});
check('source has up-to-date current issue reference', () => {
  assert.match(config, /number:\s*18/);
  assert.match(home, /ISSUE 18/);
});
check('there is only one public website canonical in sitemap', () => {
  assert.equal((xml.match(/<loc>https:\/\/www\.sk8scoop\.com\/issues\/issue-18\/<\/loc>/g)||[]).length,1);
});
console.log(failures ? failures + ' check(s) failed' : 'All read-only growth readiness guards passed');
process.exitCode = failures ? 1 : 0;
