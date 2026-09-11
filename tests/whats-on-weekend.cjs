const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync('assets/whats-on.js', 'utf8');
const dates = source.slice(source.indexOf('  const localToday ='), source.indexOf('  const matches ='));
function includes(now, eventDate) {
  class Clock extends Date {
    constructor(...args) { super(...(args.length ? args : [now])); }
  }
  return vm.runInNewContext(`${dates}\nisWeekend({date: eventDate})`, {
    Date: Clock, Intl, eventDate
  });
}

for (const [now, eventDate, expected] of [
  ['2026-09-11T10:00:00Z', '2026-09-12', true],
  ['2026-09-11T10:00:00Z', '2026-09-13', true],
  ['2026-09-11T10:00:00Z', '2026-09-11', false],
  ['2026-09-12T18:00:00Z', '2026-09-12', true],
  ['2026-09-13T10:00:00Z', '2026-09-13', true],
  ['2026-09-13T10:00:00Z', '2026-09-12', false],
  ['2026-09-14T10:00:00Z', '2026-09-19', true],
  ['2026-09-14T10:00:00Z', '2026-09-13', false],
  ['2026-09-12T23:30:00Z', '2026-09-12', false],
  ['2026-10-25T01:30:00Z', '2026-10-25', true]
]) assert.equal(includes(now, eventDate), expected, `${now}: ${eventDate}`);
console.log('10 weekend boundary checks passed, including UK midnight and DST.');
