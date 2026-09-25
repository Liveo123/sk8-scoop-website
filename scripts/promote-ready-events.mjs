import fs from 'node:fs';

const queuePath = process.env.EVENT_QUEUE_PATH || 'data/event-review-queue.json';
const eventsPath = process.env.EVENT_DATA_PATH || 'data/events.json';
const apply = process.argv.includes('--apply');

const queue = JSON.parse(fs.readFileSync(queuePath, 'utf8'));
const events = JSON.parse(fs.readFileSync(eventsPath, 'utf8'));

if (!queue || !Array.isArray(queue.items)) throw new Error('event review queue must contain an items array');
if (!Array.isArray(events)) throw new Error('event data must be an array');

const existing = new Set(events.map(event => event.id));
const ready = queue.items.filter(item => item.status === 'ready');
const seenReady = new Set();
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

for (const item of ready) {
  for (const field of ['id','title','date','area','venue','cost','category','description','source_url','verification','checked']) {
    if (!item[field]) throw new Error(item.id + ': missing ' + field);
  }
  if (existing.has(item.id)) throw new Error(item.id + ': already exists in data/events.json');
  if (seenReady.has(item.id)) throw new Error(item.id + ': duplicate ready item in event-review queue');
  seenReady.add(item.id);
  if (!datePattern.test(item.date)) throw new Error(item.id + ': invalid date; expected YYYY-MM-DD');
  if (!datePattern.test(item.checked)) throw new Error(item.id + ': invalid checked date; expected YYYY-MM-DD');
  if (!/^https:\/\//i.test(item.source_url)) throw new Error(item.id + ': source_url must use https');
}

console.log('ready for promotion: ' + ready.length);
for (const item of ready) console.log('- ' + item.date + ' · ' + item.area + ' · ' + item.title);

if (!apply) {
  console.log('dry run only; add --apply after human approval');
  process.exit(0);
}

if (ready.length === 0) {
  console.log('nothing to promote; files left unchanged');
  process.exit(0);
}

const promoted = ready.map(item => {
  const event = {...item, status:'verified'};
  delete event.discovered;
  delete event.reason;
  delete event.missing;
  return event;
});

const nextEvents = [...events, ...promoted].sort((a,b) =>
  String(a.date).localeCompare(String(b.date)) || String(a.title).localeCompare(String(b.title))
);

queue.items = queue.items.filter(item => item.status !== 'ready');
queue.updated = new Date().toISOString().slice(0,10);

fs.writeFileSync(eventsPath, JSON.stringify(nextEvents, null, 2) + '\n');
fs.writeFileSync(queuePath, JSON.stringify(queue, null, 2) + '\n');
console.log('promoted ' + promoted.length + ' event(s)');
