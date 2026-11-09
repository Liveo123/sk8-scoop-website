import fs from 'node:fs';
import assert from 'node:assert/strict';

// Exercise the actual browser-facing expiry helpers without loading unrelated UI or network code.
const home = fs.readFileSync('assets/homepage-nue.js', 'utf8');
const search = fs.readFileSync('assets/search.js', 'utf8');
const html = fs.readFileSync('index.html', 'utf8');
const data = JSON.parse(fs.readFileSync('data/homepage.json', 'utf8'));
// Keep event-expiry behaviour covered by a synthetic past feature, while ensuring
// the live homepage never promotes an expired event merely to satisfy a fixture.
const expiryFixture = JSON.parse(JSON.stringify(data));
expiryFixture.stories[1] = {...expiryFixture.stories[1],
  title:'Synthetic time-bound event',expires:'2026-11-05'};
assert.ok(data.stories.every(x=>!x.expires||x.expires>='2026-11-09'),
  'Published homepage data must contain no expired stories');

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
  cards[1].dataset.expireAfter = expiryFixture.stories[1].expires;
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
  if (shouldLoad) helpers.renderStories(expiryFixture);
  return { cards, wrap, heading, intro, kicker, staticHidden, localDay: helpers.ukToday() };
}

// Synthetic old-event fixture: before the date, all three are visible.
const before = runAt('2026-10-24T22:30:00Z', true);
assert.equal(before.localDay,'2026-10-24');
assert.equal(before.staticHidden,0);
assert.equal(before.cards.filter(card=>!card.hidden).length,3);

// After its cut-off, the synthetic expiry is removed from both static and
// data-driven views; a surviving current card must not inherit the old marker.
const after = runAt('2026-11-06T00:30:00Z',true);
assert.equal(after.localDay,'2026-11-06');
assert.equal(after.staticHidden,1);
assert.equal(after.cards.filter(card=>!card.hidden).length,2);
assert.equal(after.cards[1].dataset.expireAfter,undefined);
assert.match(after.heading.textContent,/^2 things worth/);
const fallback = runAt('2026-11-06T09:30:00Z',false);
assert.equal(fallback.cards[1].hidden,true);
assert.equal(fallback.cards[1].style.display,'none');

// The real published homepage now uses a useful, non-expiring weekend route.
assert.ok(data.stories.some(x=>x.mode==='DO'&&x.href==='/whats-on/?filter=weekend'));
assert.ok(!data.stories.some(x=>x.title.includes('Woodford Bonfire')));
assert.match(html,/href="\/whats-on\/\?filter=weekend"/);
assert.doesNotMatch(html,/data-home-story data-expire-after="2026-11-05"/);

// Search honours the same expiry date in deliberately synthetic source data.
const transformSnippet = section(search, '  const transformHomepage = data => {',
  '  const transformEvents = data => {');
const transformHomepage = new Function('inferArea',transformSnippet +
  '\nreturn transformHomepage;')(()=>'All areas');
const transformed = transformHomepage(expiryFixture);
const timeBound = transformed.find(record=>record.title.includes('Synthetic time-bound event'));
assert.ok(timeBound);
assert.equal(timeBound.expires,'2026-11-05');
const filterSnippet = section(search,'  const isCurrent = record => ',
  '\n\n  const areaMatches = event =>'.replace('event =>','record =>'));
const isCurrent = new Function('localToday',filterSnippet+'\nreturn isCurrent;');
assert.equal(isCurrent(()=>'2026-11-05')(timeBound),true);
assert.equal(isCurrent(()=>'2026-11-06')(timeBound),false);
console.log('PASS homepage search + static and dynamic event expiry (Europe/London).');
