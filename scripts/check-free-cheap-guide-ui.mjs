import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const free = fs.readFileSync('free-cheap-guide/guide/index.html', 'utf8');
const halloween = fs.readFileSync('halloween-half-term-guide/guide/index.html', 'utf8');
const hits = (s, re) => [...s.matchAll(re)];

assert.equal(hits(free, /<h1\b/gi).length, 1, 'A screen-reader accessible guide H1 must exist');
assert.match(free, /<details class="guide-freshness-note"><summary>/, 'Maintenance details must start collapsed');
assert.match(free, /guide-freshness-note summary:focus-visible/, 'Maintenance summary needs a keyboard focus style');
assert.doesNotMatch(free, /<p class="guide-freshness-note">/, 'Old oversized maintenance panel must not return');
assert.match(free, /Older evergreen entries retain their individual source-check dates/, 'Detailed freshness caveat must remain');

const icons = hits(free, /class="pick-card-mark pick-card-mark--([^"]+)">/g).map(m => m[1]);
const symbols = hits(free, /class="pick-card-icon">([^<]+)<\/span>/g).map(m => m[1]);
assert.deepEqual(icons, ['park', 'active', 'shelters', 'museum'], 'Four subject-specific badges required');
assert.equal(new Set(symbols).size, 4, 'All four badges should use different symbols');
for (const icon of icons) assert.match(free, new RegExp('\\.pick-card-mark--' + icon + '\\{'), 'Missing badge colour for ' + icon);
assert.match(free, /editorial-picks-grid \.pick-card--teal p,\.editorial-picks-grid \.pick-card--ink p\{color:#fff\}/, 'Dark cards must retain white description text');
assert.match(free, /\.pick-card:focus-visible/, 'Cards need a visible keyboard focus');
assert.match(free, /@media\(max-width:430px\)\{\.pick-card-mark/, 'Badges need mobile sizing');

assert.doesNotMatch(free, /<svg\b|\.svg\b/i, 'Free & Cheap must not contain SVG');
assert.doesNotMatch(halloween, /<svg\b|\.svg\b/i, 'Halloween action icons must not regenerate SVG');

const ids = hits(free, /\bid="([^"]+)"/g).map(m => m[1]);
assert.equal(new Set(ids).size, ids.length, 'Duplicate HTML IDs');
const idset = new Set(ids);
for (const [, fragment] of hits(free, /\bhref="#([^"]+)"/g))
  assert.ok(idset.has(fragment), 'Internal link has no target: ' + fragment);

const guideAnchors=[["hat-works-stockport","HAT WORKS"],["stockport-museum-market-place","STOCKPORT MUSEUM"],["stockport-air-raid-shelters","STOCKPORT AIR RAID SHELTERS"],["staircase-house-stockport-market-place","STAIRCASE HOUSE"],["bramall-hall-bramhall","BRAMALL HALL"],["explore-stockports-underbanks","EXPLORE STOCKPORT"],["manchester-museum","MANCHESTER MUSEUM"],["science-and-industry-museum-manchester","SCIENCE AND INDUSTRY MUSEUM"],["john-rylands-library-manchester","JOHN RYLANDS LIBRARY"],["the-whitworth-manchester","THE WHITWORTH"],["bruntwood-park-cheadle","BRUNTWOOD PARK"],["gatley-skatepark","GATLEY SKATEPARK"]];
const listingBlocks=hits(free, /<article\b[^>]*>[\s\S]*?<\/article>/gi).map(m=>m[0]);
for (const [anchorId, titlePrefix] of guideAnchors) {
  const block=listingBlocks.find(a=>a.slice(0,a.indexOf('>')+1).includes('id="'+anchorId+'"'));
  assert.ok(block, 'Hash link does not point to its own article: '+anchorId);
  const heading=block.match(/<h[234][^>]*class="entry-title"[^>]*>([\s\S]*?)<\/h[234]>/i)?.[1]||'';
  assert.ok(heading.startsWith(titlePrefix),'Hash link points to wrong listing: '+anchorId);
  assert.ok(!free.includes('<a id="'+anchorId+'"></a>'),'Old misplaced hash anchor remains: '+anchorId);
}
assert.match(free, /Adult lunch choices include sandwiches from £6\.50, jacket potatoes from £8/, 'Damson Tree adult prices missing');
assert.match(free, /children’s menu, sandwiches are £3/, 'Damson Tree £3 sandwiches must be identified as children’s menu');
assert.match(free, /id="free-disability-swim-cheadle"><h4 class="entry-title">FREE DISABILITY SWIM/, 'Swim listing must have its own accessible heading');
assert.match(free, /published both 8pm and 8\.30pm/, 'Station House conflicting start times must be disclosed');
assert.doesNotMatch(free, /<strong>GROUP PRICE: £16–£28/, 'Duplicate bowling price label');

for (const [img] of hits(free, /<img\b[^>]*>/gi))
  assert.match(img, /\balt="[^"]+"/, 'Every image needs non-empty alt text');
for (const [a] of hits(free, /<a\b[^>]*target="_blank"[^>]*>/gi))
  assert.match(a, /\brel="[^"]*noopener/, 'External new-window link missing noopener');

const dates = hits(free, /<article class="guide-entry event-card" data-event-date="(\d{4}-\d{2}-\d{2})"/g).map(m => m[1]);
assert.ok(dates.length > 0, 'Dated event metadata has disappeared');
assert.deepEqual(dates, [...dates].sort(), 'Dated entries should be chronological');
assert.match(free, /id="dated-event-expiry-guard"/, 'Europe/London dated-event expiry script missing');
assert.match(free, /timeZone:'Europe\/London'/, 'Expiry dates must use UK time');
assert.match(free, /id="dated-events-empty" hidden/, 'Guide needs an end-of-window fallback');
assert.doesNotMatch(free, /WEDNESDAY 7 OCTOBER|Saturday 3 October 2026|beyond this 31-day window/, 'Known expired or contradictory date has returned');
assert.match(free, /Arc’s 31 October session is listed in the council events calendar/, 'Arc’s 31 October event must remain supported by a specific dated listing');

for (const [label, html] of [['Free & Cheap', free], ['Halloween', halloween]]) {
  const scripts = hits(html, /<script\b([^>]*)>([\s\S]*?)<\/script>/gi);
  for (const [, attrs, body] of scripts) {
    if (/\bsrc=/.test(attrs) || /\btype=["'](?!text\/javascript|application\/javascript)/.test(attrs)) continue;
    if (body.trim()) new vm.Script(body, { filename: label + ' inline script' });
  }
}

console.log('PASS: Free & Cheap presentation, accessible disclosure, 4 illustrated badges, anchors, expiry guards, links and inline JS; Halloween non-SVG controls.');
