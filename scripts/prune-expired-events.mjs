// Deterministic expiry-only maintenance. Discovery and new event publication are separate.
import fs from 'node:fs';

const path = process.env.EVENT_DATA_PATH || 'data/events.json';
const today = process.env.EVENT_TODAY || new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit'
}).format(new Date());
const iso = /^\d{4}-\d{2}-\d{2}$/;
if (!iso.test(today) || new Date(today+'T00:00:00Z').toISOString().slice(0,10)!==today) {
  throw new Error('Invalid London date');
}
const input = JSON.parse(fs.readFileSync(path,'utf8'));
if (!Array.isArray(input)) throw new Error('Event data must be an array');
function valid(date) {
  return typeof date==='string' && iso.test(date) &&
    !Number.isNaN(Date.parse(date+'T00:00:00Z')) &&
    new Date(date+'T00:00:00Z').toISOString().slice(0,10)===date;
}
for (const e of input) {
  if (!valid(e.date)|| (e.end_date!==undefined&&!valid(e.end_date))) {
    throw new Error('Refusing cleanup: invalid date for '+String(e.id));
  }
}
const kept=input.filter(e=>(e.end_date||e.date)>=today);
const removed=input.filter(e=>(e.end_date||e.date)<today);
if (!kept.length) throw new Error('Refusing to leave an empty event calendar');
const core=new Set(['Cheadle','Cheadle Hulme','Gatley','Heald Green']);
if (!kept.some(e=>core.has(e.area))) throw new Error('Refusing to leave calendar without core SK8 events');
console.log(JSON.stringify({date:today,removed:removed.map(e=>e.id),kept:kept.length,core:kept.filter(e=>core.has(e.area)).length}));
if (process.argv.includes('--apply') && removed.length) {
  const harvestPath = process.env.HARVEST_DATA_PATH || 'data/website-harvest.json';
  const harvest = JSON.parse(fs.readFileSync(harvestPath, 'utf8'));
  if (!Array.isArray(harvest.items)) throw new Error('Website Harvest items missing');
  const retired = new Set(removed.map(e => e.id));
  for (const item of harvest.items) {
    if (item.disposition === 'whats_on' && retired.has(item.event_id)) {
      item.disposition = 'whats_on_expired';
      item.reason = 'Previously published event finished before '+today+
        '; retired from the live rolling event feed. Original newsletter handoff retained for audit.';
    }
  }
  fs.writeFileSync(path,JSON.stringify(kept,null,2)+'\n');
  fs.writeFileSync(harvestPath,JSON.stringify(harvest,null,2)+'\n');
}
