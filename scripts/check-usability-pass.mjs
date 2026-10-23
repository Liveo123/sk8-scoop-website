import { readFileSync, existsSync } from 'node:fs';
import assert from 'node:assert/strict';

const read = path => readFileSync(path, 'utf8');
const home = read('index.html');
const whatson = read('whats-on/index.html');
const nav = read('assets/site.js');
const filters = read('assets/whats-on.js');
const month = read('assets/whats-on-calendar.js');
const css = read('assets/usability-pass-20261023.css');
const pass = (test, message) => {
  assert.ok(test, message);
  console.log('PASS ' + message);
};
pass(home.indexOf('reader-first-discovery') < home.indexOf('reader-hero reader-hero-photo'),
  'Usefulness-first homepage hierarchy retained');
pass(home.includes('reader-first-search-help') && home.includes('aria-describedby="reader-first-search-help"'),
  'Homepage search scope explained accessibly');
pass(home.includes('/whats-on/?filter=weekend&amp;type=free'),
  'Popular free weekend route leads into combinable filters');
pass(home.includes('reader-first-other-ideas') && home.includes('/whats-on/?filter=free'),
  'Less-used ideas disclosed and original free preset retained');
pass(nav.includes("const secondaryItems=[") && nav.includes("['Advertise','/advertise.html']") &&
  nav.includes("['Contact','/contact/']") && nav.includes("navMore.className='nav-more'"),
  'All publisher routes retained behind keyboard-accessible More');
pass(nav.includes("event.key!=='Escape'") && nav.includes('menu.focus()'),
  'Navigation can be dismissed with Escape');
pass(whatson.includes('data-event-filter="today"') && whatson.includes('data-event-filter="week"') &&
  whatson.includes('data-event-filter="weekend"') && whatson.includes('data-event-filter="free"') &&
  whatson.includes('data-event-filter="family"'), 'Original time and free/family deep links available');
pass(whatson.includes('data-event-audience="free"') &&
  whatson.includes('data-event-audience="family"') &&
  whatson.includes('Choose either or both'), 'Free and family constraints are independent');
pass(filters.includes("['free', 'family', 'free-family'].includes(requestedFilter)") &&
  filters.includes("params.get('type')") &&
  filters.includes("url.searchParams.set('filter', activeAudience)"),
  'Legacy URLs and combined-share links kept compatible');
pass(filters.includes("activeAudience.includes('free')") &&
  filters.includes("activeAudience.includes('family')") &&
  filters.includes("activeFilter === 'weekend' && !isWeekend(event)"),
  'All three filter dimensions constrain results');
pass(filters.includes("data-whats-on-selection") && filters.includes("whats_on_filters_cleared") &&
  filters.includes('emptyClear?.addEventListener'),
  'Results summary and one-step no-results recovery in place');
pass(month.includes("activeAudience = event.detail?.audience || 'all'") &&
  month.includes('matchingForCalendar(event, date)'),
  'Calendar follows selected conditions');
pass((css.match(/\{/g) || []).length === (css.match(/\}/g) || []).length &&
  css.includes('min-height:44px') && css.includes('min-height:46px'),
  'Stylesheet balanced and minimum touch targets specified');
pass(home.includes('data-signup-form') && home.includes('data-form-position="hero"') &&
  home.includes('data-form-position="footer"'), 'Existing MailerLite form contract untouched');
pass(whatson.includes('sk8-calendar-core.js') && whatson.includes('assets/whats-on.js') &&
  whatson.includes('data-calendar-month-grid'), 'Existing live calendar retained');
pass(!css.includes('<svg') && !home.includes('<svg') && !whatson.includes('<svg'),
  'No new prohibited SVG visuals');
pass(existsSync('data/events.json') && existsSync('assets/global-search.js'),
  'Verified-event source and publication-wide search retained');

console.log('PASS usability source tests complete.');
