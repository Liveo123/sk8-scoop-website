// Run from repository root: node --test tests/post-rebuild-growth-smoke.mjs
// Source-level guardrails. Browser layout still requires the preview header QA.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const join = read('join/index.html');
const whatson = read('whats-on/index.html');
const home = read('index.html');
const sitemap = read('sitemap.xml');
const globalSearch = read('assets/global-search.css');
const styles = read('assets/styles.css');
const headerQA = read('scripts/check-header-layout.mjs');

test('join page has current fallback links, issue number and share metadata', () => {
  assert.match(join, /data-current-issue-url href="\/latest"/);
  assert.doesNotMatch(join, /preview\.mailerlite\.io\/preview/);
  assert.doesNotMatch(join, /data-current-issue-number>12/);
  assert.match(join, /data-current-issue-number>17/);
  assert.match(join, /data-stat="subscriberCount">750\+/);
  assert.match(join, /<link rel="canonical" href="https:\/\/www\.sk8scoop\.com\/join\/">/);
  for (const prop of ['og:title', 'og:description', 'og:url', 'og:image']) {
    assert.ok(join.includes('property="' + prop + '"'), 'Join page missing ' + prop);
  }
  assert.match(join, /<meta name="twitter:card" content="summary_large_image">/);
});

test('public landing pages have share metadata with useful destinations', () => {
  for (const [name, html] of [['home', home], ['What’s On', whatson]]) {
    assert.ok(html.includes('property="og:image"'), name + ' lacks preview image');
    assert.match(html, /<meta name="twitter:card" content="summary_large_image">/);
  }
});

test('sitemap retains released event pilot and intentional noindex exclusions', () => {
  const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
  assert.equal(urls.length, new Set(urls).size);
  for (const route of ['/','/join/','/whats-on/',
    '/whats-on/events/cheadle-library-christmas-craft-night-2026/',
    '/whats-on/events/lum-head-gatley-nursery-reception-open-day-2026/']) {
    assert.ok(urls.includes('https://www.sk8scoop.com' + route), 'missing URL ' + route);
  }
  assert.match(sitemap, /<loc>https:\/\/www\.sk8scoop\.com\/join\/<\/loc><lastmod>2026-10-23<\/lastmod>/);
  for (const path of ['/search/','/my-sk8/','/kids-family/holiday-club-finder/']) {
    assert.ok(!urls.includes('https://www.sk8scoop.com' + path), 'unexpected indexed ' + path);
  }
});

test('header mobile and desktop breakpoints agree at 1279/1280', () => {
  assert.match(styles, /@media\(max-width:1279px\)/);
  assert.match(globalSearch, /@media\(max-width:1279px\)/);
  assert.match(globalSearch, /@media\(min-width:1280px\)/);
  assert.match(globalSearch, /@media\(min-width:821px\) and \(max-width:1279px\)/);
  assert.ok(read('assets/global-search.js').includes('max-width: 1279px'));
  assert.ok(read('assets/config.js').includes('20261023-headerwidth1'));
  assert.ok(read('assets/site.js').includes('20261023-headerwidth1'));
  assert.ok(read('scripts/check-post-launch-v2.mjs').includes('max-width:1279px'));

  assert.ok(headerQA.includes('const widths = [1199, 1200, 1279, 1280, 1366, 1440];'));
  assert.ok(headerQA.includes('width < 1280') && headerQA.includes('width >= 1280'));
});
