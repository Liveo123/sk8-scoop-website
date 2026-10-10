import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import core from '../assets/sk8-calendar-core.js';

const today = core.localToday();
const first = core.dayAfter(today);
const second = core.dayAfter(first);
const third = core.dayAfter(second);
const base = {
  id: 'fixture-gatley-class', title: 'Fixture Gatley class',
  date: first, end_date: third, date_mode: 'specific_dates',
  occurrences: [first, { date: third, status: 'confirmed', time: '13:00', end_time: '14:00' }],
  area: 'Gatley', venue: 'Test venue',
  cost: 'Free', cost_type: 'free', category: 'Community',
  description: 'Test record for confirmed session validation.',
  source_url: 'https://example.org/test', verification: 'ORGANISER_PRIMARY_SOURCE',
  checked: today, status: 'verified'
};
function check(record) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sk8-date-schema-'));
  const file = path.join(dir, 'events.json');
  try {
    fs.writeFileSync(file, JSON.stringify([record]));
    const run = spawnSync(process.execPath, ['scripts/check-events-data.mjs'], {
      cwd: process.cwd(), encoding: 'utf8', env: {...process.env, EVENT_DATA_PATH: file}
    });
    return {status: run.status, output: run.stdout + run.stderr};
  } finally {
    fs.rmSync(dir, {recursive:true, force:true});
  }
}
function rejects(name, change, expected) {
  const record = structuredClone(base);
  change(record);
  const result = check(record);
  assert.notEqual(result.status, 0, name + ' should fail');
  assert.match(result.output, expected, name + ': ' + result.output);
}
const good = check(base);
assert.equal(good.status, 0, 'valid confirmed dates should pass: ' + good.output);
rejects('impossible occurrence date', x => {x.occurrences[1].date = '2026-02-31';}, /invalid occurrence date/);
rejects('duplicate occurrence date', x => {x.occurrences.push(first);}, /duplicate occurrence date/);
rejects('date beyond end of series', x => {x.occurrences.push(core.dayAfter(third));}, /outside declared range/);
rejects('unconfirmed-only series', x => {x.occurrences = [{date:first,status:'unverified'}];}, /no confirmed occurrences/);
rejects('missing confirmed occurrences', x => {x.occurrences=[];}, /specific_dates require/);
rejects('unapproved date mode', x => {x.date_mode='recurring_guess';}, /invalid date_mode/);
rejects('unsupported cost classification', x => {x.cost_type='free_for_everyone_guess';}, /invalid cost_type/);
rejects('invalid session time', x => {x.occurrences[1].time='25:90';}, /invalid time/);
rejects('unsupported status', x => {x.occurrences[1].status='maybe';}, /unsupported occurrence status/);
rejects('daily activity without end date', x => {x.date_mode='daily';delete x.end_date;delete x.occurrences;}, /daily activities require end_date/);
rejects('unexpected list in single event', x => {x.date_mode='single';}, /occurrences require specific_dates mode/);
console.log('11 invalid recurrence fixtures rejected; valid confirmed session series accepted.');
