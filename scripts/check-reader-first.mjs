import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import calendar from '../assets/sk8-calendar-core.js';

const read = name => fs.readFileSync(name, 'utf8');
const html = read('index.html');
const css = read('assets/reader-first.css');
const js = read('assets/reader-first-home.js');
const events = JSON.parse(read('data/events.json'));
const assertIncludes = (text, value, label) =>
  assert.ok(text.includes(value), label + ': missing ' + value);

const finder = html.indexOf('<section class="section reader-first-discovery"');
const subscriber = html.indexOf('<section class="reader-hero reader-hero-photo"');
const editorial = html.indexOf('<section class="section reader-worth"');
assert.ok(finder > 0 && subscriber > finder && editorial > subscriber,
  'Homepage must open with useful activity finder, followed by newsletter then editorial');
assert.equal((html.match(/<h1\b/g) || []).length, 1, 'Exactly one page H1');
assertIncludes(html, '<h1 id="reader-first-heading">Find something to do around SK8</h1>',
  'Reader need names the first heading');
assertIncludes(html, 'body class="reader-home reader-first-mode"', 'Scoped reader-first design');
assert.ok(!html.includes('home-quick-answers'), 'Remove duplicate secondary quick-answer system');
assert.ok(!html.includes('home-explore-search-shell'), 'Remove duplicate lower site search');
assertIncludes(html, 'assets/reader-first.css', 'Reader-first stylesheet');
assertIncludes(html, 'assets/reader-first-home.js', 'Checked event finder script');
assert.ok(html.indexOf('assets/sk8-calendar-core.js') < html.indexOf('assets/reader-first-home.js'),
  'Load shared date and status rules before homepage finder');
assertIncludes(html, 'id="reader-first-search-input"', 'Labelled finder search');
assertIncludes(html, 'action="/search/"', 'Reuse existing publication-wide search');
for (const slug of ['today','weekend','free','family']) {
  assertIncludes(html, '/whats-on/?filter='+slug, "Supported What\'s On filter "+slug);
}
for (const area of ['Cheadle','Cheadle%20Hulme','Gatley','Heald%20Green']) {
  assertIncludes(html, '/whats-on/?area='+area, 'Core-local area route '+area);
}
for (const route of ['/whats-on/','/search/','/outdoors/','/my-sk8/',
  '/kids-family/holiday-club-finder/','/free-cheap-guide/guide/']) {
  assert.ok(fs.existsSync(path.join('.',route,'index.html')),
    'Linked route must be in source tree: '+route);
}
assertIncludes(js, 'core.localToday()', 'Use shared UK local date');
assertIncludes(js, "core.mode(event)", 'Use verified date occurrence semantics');
assertIncludes(js, "core.withinHorizon(item.session, today)", 'Apply date horizon');
assertIncludes(js, "event.status === 'verified'", 'Never show unverified listings');
assertIncludes(js, "'/whats-on/?event='", 'Direct specific-event detail link');
assertIncludes(js, "guide.href = '/free-cheap-guide/guide/'",
  'Unambiguous working evergreen guide fallback');
assertIncludes(js, "link.dataset.trackEvent = 'homepage_finder_event_detail_click'",
  'Measured first useful event action');
assertIncludes(js, "window.sk8Track('homepage_finder_search_submit'",
  'Measured search action without search term');
assert.ok(!js.includes('search_term:'), 'Never send raw search text to analytics');
assert.ok(Array.isArray(events) && events.length > 0, 'Expected a structured events feed');
assert.ok(events.every(x=>typeof x.id === 'string' && x.id),
  'Every source event must have a stable detail-link ID');
assert.ok(calendar.validDate(calendar.localToday()), 'Valid shared UK-date calculation');
const today=calendar.localToday();
const later=calendar.dayAfter(today), third=calendar.dayAfter(later);
const unconfirmedRange={date:today,end_date:third,date_mode:'range_unspecified'};
assert.equal(calendar.withinRange(unconfirmedRange,later,third),false,
  'Unspecified range cannot be treated as confirmed sessions on intermediate dates');
assert.equal(calendar.onDate(unconfirmedRange,later),false,
  'Unspecified date ranges are not automatically daily events');
const series={date:today,end_date:third,date_mode:'specific_dates',occurrences:[today,third]};
assert.equal(calendar.onDate(series,later),false,
  'Only declared occurrences are valid for non-daily series');
assert.equal(calendar.onDate(series,third),true, 'Declared occurrences remain discoverable');
assertIncludes(css, '@media(max-width:720px)', 'Single-column phone card layout');
assertIncludes(css, ':focus-visible', 'Keyboard focus styling');
assertIncludes(css, 'prefers-reduced-motion', 'Reduced-motion support');
assertIncludes(css, 'reader-first-mode', 'Homepage hero inversion is styled');
console.log('PASS reader-first structural/NUE checks: first-screen order, unique H1, routes, source facts, safe links, 4 filters, 4 areas, UK dates and responsive CSS.');
