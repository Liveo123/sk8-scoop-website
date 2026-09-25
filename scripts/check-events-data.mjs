import fs from 'node:fs';

const events = JSON.parse(fs.readFileSync('data/events.json', 'utf8'));
if (!Array.isArray(events)) throw new Error('data/events.json must contain an array');

const required = ['id','title','date','area','venue','cost','category','description','source_url','verification','checked','status'];
const iso = /^\d{4}-\d{2}-\d{2}$/;
const ids = new Set();
const seen = new Set();
const failures = [];

const asDate = value => {
  if (!iso.test(String(value || ''))) return null;
  const d = new Date(String(value) + 'T00:00:00Z');
  return Number.isNaN(d.getTime()) ? null : d;
};

for (const [index,event] of events.entries()) {
  const label = `event[${index}]`;
  for (const key of required) {
    if (event[key] === undefined || String(event[key]).trim() === '') failures.push(`${label} missing ${key}`);
  }
  if (ids.has(event.id)) failures.push(`duplicate id: ${event.id}`);
  ids.add(event.id);

  const start = asDate(event.date);
  const end = asDate(event.end_date || event.date);
  if (!start) failures.push(`${event.id}: invalid date`);
  if (!end) failures.push(`${event.id}: invalid end_date`);
  if (start && end && end < start) failures.push(`${event.id}: end_date precedes date`);
  if (!asDate(event.checked)) failures.push(`${event.id}: invalid checked date`);

  for (const key of ['source_url','booking_url']) {
    const value = String(event[key] || '').trim();
    if (value && !/^https:\/\//.test(value)) failures.push(`${event.id}: ${key} must use https`);
  }
  if (event.status !== 'verified') failures.push(`${event.id}: status must be verified`);

  const fingerprint = `${String(event.title).toLowerCase().replace(/[^a-z0-9]+/g,' ')}|${event.date}|${String(event.area).toLowerCase()}`;
  if (seen.has(fingerprint)) failures.push(`${event.id}: probable duplicate title/date/area`);
  seen.add(fingerprint);
}

if (failures.length) {
  console.error("What's On event-data QA failed:");
  failures.forEach(item => console.error('- ' + item));
  process.exit(1);
}

const coreAreas = new Set(['Cheadle','Cheadle Hulme','Gatley','Heald Green']);
const core = events.filter(event => coreAreas.has(event.area)).length;
const dates = events.map(event => event.end_date || event.date).filter(Boolean).sort();
const starts = events.map(event => event.date).filter(Boolean).sort();
console.log(`What's On event-data QA passed: ${events.length} verified listings; ${core} core-SK8; window ${starts[0] || 'n/a'} to ${dates.at(-1) || 'n/a'}.`);
