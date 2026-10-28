// 52 Adventures paid-gallery contract regression checks. No external services needed.
import assert from 'node:assert/strict';
import fs from 'node:fs';

const script = fs.readFileSync('assets/52-adventures-premium-gallery.js', 'utf8');
const config = fs.readFileSync('assets/52-adventures-premium-config.js', 'utf8');
const guide = fs.readFileSync('52-adventures/guide/index.html', 'utf8');
assert.ok(config.includes('enabled: false'), 'Premium inventory must be disabled by default');
assert.ok(config.includes('ownerApproved: false'), 'No default owner approval');
assert.ok(config.includes('imageRightsCleared: false'), 'No default rights clearance');
assert.equal((guide.match(/id="sk8-52-premium-slot"/g) || []).length, 1);
assert.ok(guide.includes('id="sk8-52-premium-slot" aria-label="Paid 52 Adventures promotions" hidden'));
assert.ok(guide.includes('52-adventures-premium-config.js'));
assert.ok(guide.includes('52-adventures-premium-gallery.js'));
const dataMatch = guide.match(/<script id="adventure-data" type="application\/json">([\s\S]*?)<\/script>/);
assert.ok(dataMatch, 'Must keep adventure data intact');
assert.equal(Object.keys(JSON.parse(dataMatch[1])).length, 52, 'All 52 independent adventures stay available');
assert.ok(!script.includes('.innerHTML'), 'Do not introduce raw HTML injection');
assert.ok(script.includes("guide_advertiser_view"), 'View reporting needs a separate event');
assert.ok(script.includes("guide_advertiser_click"), 'Commercial clicks need attribution');

let instant = '2026-10-16T12:00:00Z';
class ClockDate extends Date {
  constructor(...args) { super(...(args.length ? args : [instant])); }
  static parse(value) { return Date.parse(value); }
}
class El {
  constructor(tag) { this.tag = tag; this.children = []; this.dataset = {}; this.events = {}; this.attrs = {}; this.hidden = false; this.textContent = ''; }
  append(...items) { this.children.push(...items); }
  setAttribute(key, value) { this.attrs[key] = value; this[key] = value; }
  getAttribute(key) { return this.attrs[key]; }
  removeAttribute(key) { delete this.attrs[key]; delete this[key]; }
  addEventListener(type, fn) { this.events[type] = fn; }
}
const base = {
  enabled: true, ownerApproved: true, advertiserArtworkApproved: true, imageRightsCleared: true,
  placementId: 'qa-only', businessName: 'Fictional Operator', headline: 'A QA Adventure',
  description: 'Illustrative test; not bookable.', actionLabel: 'Test booking',
  actionUrl: 'https://example.com/book', startDate: '2026-10-01', endDate: '2026-10-30',
  photos: [
    { src: 'https://example.com/a.jpg', alt: 'A woodland', caption: 'Woods test image', credit: 'QA photograph', rightsBasis: 'PERMISSION' },
    { src: 'https://example.com/b.jpg', alt: 'A stream', caption: 'Stream test image', credit: 'QA photograph', rightsBasis: 'LICENCE' }
  ]
};
function render(patch = {}, allowObserver = true) {
  const slot = new El('section'); slot.hidden = true;
  const events = [], timeouts = [], intervals = [], observers = [], listeners = {};
  const document = {
    visibilityState: 'visible',
    getElementById: () => slot,
    createElement: tag => new El(tag),
    addEventListener: (type, fn) => { (listeners[type] ||= []).push(fn); }
  };
  const window = {
    SK8_52_PREMIUM: { ...base, ...patch },
    sk8Track: (name, fields) => events.push({ name, fields }),
    setInterval: fn => intervals.push(fn)
  };
  const Observer = class {
    constructor(fn) { this.callback = fn; this.disconnects = 0; observers.push(this); }
    observe(target) { this.target = target; }
    disconnect() { this.disconnects += 1; }
    emit(ratio) { this.callback([{ target: this.target, isIntersecting: ratio > 0, intersectionRatio: ratio }]); }
  };
  if (allowObserver) window.IntersectionObserver = Observer;
  // Real URL and Intl are available; no network calls or timers run.
  new Function('window', 'document', 'location', 'URL', 'Date', 'Intl', 'IntersectionObserver', 'setTimeout', 'clearTimeout', script)(
    window, document, { href: 'https://www.sk8scoop.com/52-adventures/guide/' }, URL, ClockDate, Intl, Observer,
    fn => { timeouts.push(fn); return fn; },
    token => { const idx = timeouts.indexOf(token); if (idx >= 0) timeouts.splice(idx, 1); }
  );
  return { slot, events, timeouts, intervals, observers, listeners, document };
}
let assertions = 0;
function check(name, condition) { assert.ok(condition, name); assertions += 1; }
check('Disabled without inventory approval', render({ enabled: false }).slot.hidden);
check('Disabled without owner approval', render({ ownerApproved: false }).slot.hidden);
check('Disabled without artwork approval', render({ advertiserArtworkApproved: false }).slot.hidden);
check('Disabled without rights clearance', render({ imageRightsCleared: false }).slot.hidden);
check('Reject invalid image rights', render({ photos: [base.photos[0], { ...base.photos[1], rightsBasis: 'test-only' }] }).slot.hidden);
check('Reject missing image description', render({ photos: [base.photos[0], { ...base.photos[1], alt: '' }] }).slot.hidden);
check('Reject one-photo galleries', render({ photos: [base.photos[0]] }).slot.hidden);
check('Reject absent image credit', render({ photos: [base.photos[0], {...base.photos[1], credit: ''}] }).slot.hidden);
check('Reject absent caption', render({ photos: [base.photos[0], {...base.photos[1], caption: ''}] }).slot.hidden);
check('Reject six-photo galleries', render({ photos: [...base.photos, ...base.photos, ...base.photos] }).slot.hidden);
check('Reject executable booking links', render({ actionUrl: 'javascript:alert(1)' }).slot.hidden);
check('Reject insecure booking links', render({ actionUrl: 'http://example.com/book' }).slot.hidden);
check('Reject invalid civil dates', render({ startDate: '2026-02-30', endDate: '2026-03-31' }).slot.hidden);
check('Reject 31-day booking', render({ endDate: '2026-10-31' }).slot.hidden);
check('Reject 29-day booking', render({ endDate: '2026-10-29' }).slot.hidden);
check('Reject expired booking', render({ startDate: '2026-09-01', endDate: '2026-09-30' }).slot.hidden);
const ready = render();
check('Valid advert appears', !ready.slot.hidden);
const card = ready.slot.children[0];
check('Identified as advertisement', card.children[0].children[0].textContent === 'ADVERTISEMENT');
const stage = card.children[1].children[0].children[0];
const thumbs = card.children[1].children[0].children[1];
stage.children[2].events.click();
check('Next arrow changes photo', stage.children[0].alt === 'A stream');
check('Selected thumbnail updates', thumbs.children[1].attrs['aria-pressed'] === 'true');
check('Photo caption changes with selection', card.children[1].children[0].children[2].textContent === 'Stream test image');
const link = card.children[1].children[1].children.find(el => el.tag === 'a');
link.events.click();
check('One commercial click event per click', ready.events.filter(e => e.name === 'guide_advertiser_click').length === 1);
check('No guessed view on render', ready.events.filter(e => e.name === 'guide_advertiser_view').length === 0);
ready.observers[0].emit(0.7);
check('No view until dwell', ready.events.filter(e => e.name === 'guide_advertiser_view').length === 0);
ready.timeouts.shift()();
check('View after dwell', ready.events.filter(e => e.name === 'guide_advertiser_view').length === 1);
ready.observers[0].emit(0.8);
check('View deduplicated', ready.events.filter(e => e.name === 'guide_advertiser_view').length === 1);
const switchedTab = render();
switchedTab.observers[0].emit(0.7);
switchedTab.document.visibilityState = 'hidden';
for (const fn of switchedTab.listeners.visibilitychange || []) fn();
check('Hidden tab cancels pending view', switchedTab.timeouts.length === 0);
switchedTab.document.visibilityState = 'visible';
for (const fn of switchedTab.listeners.visibilitychange || []) fn();
check('Visible tab queues fresh full dwell', switchedTab.timeouts.length === 1);
switchedTab.timeouts.shift()();
check('Count view after tab returns', switchedTab.events.filter(e => e.name === 'guide_advertiser_view').length === 1);
const scrolledAway = render();
scrolledAway.observers[0].emit(0.7);
scrolledAway.observers[0].emit(0.1);
check('Scrolling away cancels pending impression', scrolledAway.timeouts.length === 0);
instant = '2026-10-31T12:00:00Z';
ready.intervals[0]();
check('Long-running tab auto expires', ready.slot.hidden);
check('Expired tab disables booking link', !link.href);
let expiredClickPrevented = false;
link.events.click({ preventDefault() { expiredClickPrevented = true; } });
check('Expired tab click is blocked', expiredClickPrevented);
instant = '2026-10-16T23:50:00Z'; // Local UK date is already 17 October (BST).
check('Uses UK date, not UTC date', !render({ startDate: '2026-10-17', endDate: '2026-11-15' }).slot.hidden);
instant = '2026-10-16T12:00:00Z';
console.log('PASS 52 Adventures premium gallery: ' + assertions + ' behavioural assertions, 52 editorial entries retained, disabled configuration verified.');
