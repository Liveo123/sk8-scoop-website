// Run: node --test tests/website-growth-seo-smoke.mjs
// Checks only publicly indexable routes; no browser, credentials or network required.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const join = read('join/index.html');
const whatson = read('whats-on/index.html');
const home = read('index.html');
const sitemap = read('sitemap.xml');

test('join page has a durable no-JavaScript destination, without a stale preview link', () => {
  assert.match(join, /data-current-issue-url href="\/latest"/);
  assert.doesNotMatch(join, /preview\.mailerlite\.io\/preview/);
  assert.match(join, /<link rel="canonical" href="https:\/\/www\.sk8scoop\.com\/join\/">/);
});

test('entry points provide useful social-sharing metadata', () => {
  for (const [name, html] of [['homepage', home], ['What’s On', whatson], ['join', join]]) {
    for (const prop of ['og:title', 'og:description', 'og:url', 'og:image']) {
      assert.ok(html.includes('property="' + prop + '"'), name + ' missing ' + prop);
    }
    assert.match(html, /<meta name="twitter:card" content="summary_large_image">/);
  }
});

test('sitemap has unique canonical routes and reflects significant published changes', () => {
  const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  assert.equal(urls.length, new Set(urls).size, 'duplicate sitemap URL');
  for (const route of ['/', '/join/', '/whats-on/']) {
    const loc = '<loc>https://www.sk8scoop.com' + route + '</loc>';
    assert.ok(sitemap.includes(loc), 'missing route: ' + route);
    assert.ok(sitemap.includes(loc + '<lastmod>2026-10-23</lastmod>'), 'outdated lastmod: ' + route);
  }
  for (const intentionallyNoindexed of ['/search/', '/my-sk8/', '/kids-family/holiday-club-finder/']) {
    assert.ok(!urls.includes('https://www.sk8scoop.com' + intentionallyNoindexed));
  }
});
