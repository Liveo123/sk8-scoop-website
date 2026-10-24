import fs from 'node:fs';
import assert from 'node:assert/strict';

// Exercise the actual browser-facing expiry helpers without loading unrelated UI or network code.
const home = fs.readFileSync('assets/homepage-nue.js', 'utf8');
const search = fs.readFileSync('assets/search.js', 'utf8');
const html = fs.readFileSync('index.html', 'utf8');
const data = JSON.parse(fs.readFileSync('data/homepage.json', 'utf8'));

const section = (source, start, end) => {
  const from = source.indexOf(start);
  const until = source.indexOf(end, from + start.length);
  assert.ok(from >= 0 && until > from, 'Could not isolate source section ' + start);
  return source.slice(from, until);
};
const createHomepageHandlers = new Function('document', 'Date', 'Intl',
  section(home, '  const ukToday = () => {', '  const renderExplore = data => {') +
  '\nreturn { hideExpiredStaticStories, renderStories, ukToday };');

function runAt(iso, shouldLoad) {
  const cards = Array.from({ length: 3 }, () => ({
    dataset: {}, style: { display: '' }, hidden: false, querySelector: () => null
  }));
  cards[1].dataset.expireAfter = data.stories[1].expires;
  const heading = { textContent: '3 things worth your attention now' };
  const intro = { textContent: 'A free October outing' };
  const kicker = { textContent: 'Know · Do · Discover' };
  const wrap = {
    style: { display: '' }, hidden: false,
    querySelector: selector => ({
      '.section-head h2': heading,
      '.home-section-intro': intro,
      '.home-section-kicker': kicker
    })[selector] || null
  };
  const document = {
    querySelectorAll: selector => selector === '[data-home-story]' ? cards : [],
    querySelector: selector => selector === '.reader-worth' ? wrap : null
  };
  class Clock extends Date {
    constructor(...args) { super(...(args.length ? args : [iso])); }
    static now() { return new Date(iso).valueOf(); }
  }
  const helpers = createHomepageHandlers(document, Clock, Intl);
  helpers.hideExpiredStaticStories();
  const staticHidden = cards.filter(card => card.hidden).length;
  if (shouldLoad) helpers.renderStories(data);
  return { cards, wrap, heading, intro, kicker, staticHidden, localDay: helpers.ukToday() };
}

// 24 October in the UK: the current Woodford booking prompt has not expired.
const before = runAt('2026-10-24T22:30:00Z', true);
assert.equal(before.localDay, '2026-10-24');
assert.equal(before.staticHidden, 0);
assert.equal(before.cards.filter(card => !card.hidden).length, 3);

// At UK midnight on 6 November, the 5 November bonfire prompt disappears.
const after = runAt('2026-11-06T00:30:00Z', true);
assert.equal(after.localDay, '2026-11-06');
assert.equal(after.staticHidden, 1);
assert.equal(after.cards.filter(card => !card.hidden).length, 2);
assert.equal(after.cards[1].dataset.expireAfter, undefined,
  'The surviving evergreen card must not inherit an expired event marker');
assert.match(after.heading.textContent, /^2 things worth/);

// If the homepage JSON request fails, the static fallback still hides the dated card.
const fallback = runAt('2026-11-06T09:30:00Z', false);
assert.equal(fallback.cards[1].hidden, true);
assert.equal(fallback.cards[1].style.display, 'none');
assert.equal(fallback.cards.filter(card => !card.hidden).length, 2);

// Search honours the same structured expiry date as the homepage.
const transformSnippet = section(search, '  const transformHomepage = data => {',
  '  const transformEvents = data => {');
const transformHomepage = new Function('inferArea', transformSnippet +
  '\nreturn transformHomepage;')(() => 'All areas');
const transformed = transformHomepage(data);
const bonfire = transformed.find(record => record.title.includes('Woodford Bonfire'));
assert.ok(bonfire, 'Current bonfire homepage search record missing');
assert.equal(bonfire.expires, '2026-11-05');
const filterSnippet = section(search, '  const isCurrent = record => ',
  '\n\n  const areaMatches = event =>'.replace('event =>', 'record =>'));
const isCurrent = new Function('localToday', filterSnippet + '\nreturn isCurrent;');
assert.equal(isCurrent(() => '2026-11-05')(bonfire), true);
assert.equal(isCurrent(() => '2026-11-06')(bonfire), false);
assert.match(html, /data-home-story data-expire-after="2026-11-05"/);

console.log('PASS homepage search + static and dynamic event expiry (Europe/London).');
