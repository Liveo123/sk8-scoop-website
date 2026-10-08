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

const londonToday = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit'
}).format(new Date());
const expired = events.filter(event => String(event.end_date || event.date) < londonToday);
const active = events.filter(event => String(event.end_date || event.date) >= londonToday);
const activeCore = active.filter(event => coreAreas.has(event.area));
const latestChecked = events.map(event => event.checked).filter(value => iso.test(String(value || ''))).sort().at(-1);

if (expired.length > 0) {
  console.error(`What's On event-data QA failed: ${expired.length} expired listing(s) remain on ${londonToday}.`);
  expired.forEach(event => console.error(`- ${event.id}: ${event.end_date || event.date}`));
  process.exit(1);
}
if (active.length === 0) {
  console.error(`What's On event-data QA failed: no current listings remain on ${londonToday}.`);
  process.exit(1);
}
if (activeCore.length === 0) {
  console.error(`What's On event-data QA failed: current listings exist, but none are in core SK8 on ${londonToday}.`);
  process.exit(1);
}

console.log(`What's On event-data QA passed: ${events.length} verified listings; ${active.length} current; ${activeCore.length} current core-SK8; latest source check ${latestChecked || 'n/a'}; window ${starts[0] || 'n/a'} to ${dates.at(-1) || 'n/a'}.`);
