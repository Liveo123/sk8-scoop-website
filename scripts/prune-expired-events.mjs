// Expiry-only safety net. Never invent new events, or advance their checked dates.
// Dry-run by default. A full editorial harvest is a separate, verification-gated process.
import fs from 'node:fs';

const eventsPath = process.env.EVENT_DATA_PATH || 'data/events.json';
const harvestPath = process.env.HARVEST_DATA_PATH || 'data/website-harvest.json';
const apply = process.argv.includes('--apply');
const today = process.env.EVENT_TODAY || new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit'
}).format(new Date());
const iso = /^\d{4}-\d{2}-\d{2}$/;
function validDate(d) {
  if (typeof d !== 'string' || !iso.test(d)) return false;
  const parsed = new Date(d + 'T00:00:00Z');
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === d;
}
if (!validDate(today)) throw new Error('Invalid London date: ' + today);
const events = JSON.parse(fs.readFileSync(eventsPath, 'utf8'));
const harvest = JSON.parse(fs.readFileSync(harvestPath, 'utf8'));
if (!Array.isArray(events) || !Array.isArray(harvest.items)) {
  throw new Error('Invalid event data or Website Harvest schema');
}
function expiryDate(e) {
  if (!e || !validDate(e.date) || (e.end_date && !validDate(e.end_date)) ||
      (e.end_date && e.end_date < e.date)) {
    throw new Error('Invalid dates, no changes: ' + String(e?.id));
  }
  if (e.date_mode !== 'specific_dates') return e.end_date || e.date;
  if (!Array.isArray(e.occurrences) || !e.occurrences.length) {
    throw new Error('Missing confirmed occurrences: ' + e.id);
  }
  const confirmed = [];
  for (const raw of e.occurrences) {
    const occurrence = typeof raw === 'string' ? {date: raw} : raw;
    if (!occurrence || !validDate(occurrence.date) ||
        occurrence.date < e.date || occurrence.date > (e.end_date || e.date)) {
      throw new Error('Invalid occurrence dates, no changes: ' + e.id);
    }
    if (occurrence.status !== 'cancelled' && occurrence.status !== 'unverified') {
      confirmed.push(occurrence.date);
    }
  }
  // No future session may be inferred from the overall date range.
  return confirmed.sort().at(-1) || e.date;
}
const retained = [];
const expired = [];
for (const e of events) {
  (expiryDate(e) < today ? expired : retained).push(e);
}
const core = new Set(['Cheadle', 'Cheadle Hulme', 'Gatley', 'Heald Green']);
if (!retained.length || !retained.some(e => core.has(e.area))) {
  throw new Error("Refusing to empty live What\u2019s On or remove every core-SK8 listing");
}
const expiredIds = new Set(expired.map(e => e.id));
let changedHandoffs = 0;
for (const item of harvest.items) {
  if (expiredIds.has(item.event_id) &&
      (item.disposition === 'whats_on' || item.disposition === 'whats_on_sold_out')) {
    item.disposition = 'whats_on_expired';
    item.reason = String(item.reason || 'Previously published event').trim() +
      ' [Expired and removed from live event data on ' + today + '; preserved as Issue ' +
      String(harvest.issue ?? '?') + ' historical editorial handoff.]';
    changedHandoffs++;
  }
}
console.log(JSON.stringify({
  london_date:today, total:events.length, expired:expired.length,
  current:retained.length, current_core:retained.filter(e=>core.has(e.area)).length,
  historical_handoffs_updated:changedHandoffs, expired_ids:[...expiredIds]
}));
if (apply && expired.length) {
  fs.writeFileSync(eventsPath, JSON.stringify(retained, null, 2) + '\n');
  if (changedHandoffs) fs.writeFileSync(harvestPath, JSON.stringify(harvest, null, 2) + '\n');
  console.log('Applied expiry-only cleanup; no source checked dates changed.');
} else {
  console.log(apply ? 'No expired records: no changes.' : 'Dry-run: no files changed.');
}
