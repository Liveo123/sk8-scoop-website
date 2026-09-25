import fs from 'node:fs';

const queuePath = process.env.EVENT_QUEUE_PATH || 'data/event-review-queue.json';
const eventsPath = process.env.EVENT_DATA_PATH || 'data/events.json';
const apply = process.argv.includes('--apply');

const queue = JSON.parse(fs.readFileSync(queuePath, 'utf8'));
const events = JSON.parse(fs.readFileSync(eventsPath, 'utf8'));
const existing = new Set(events.map(event => event.id));
const ready = queue.items.filter(item => item.status === 'ready');

for (const item of ready) {
  if (existing.has(item.id)) throw new Error(item.id + ': already exists in data/events.json');
  for (const field of ['id','title','date','area','venue','cost','category','description','source_url','verification','checked']) {
    if (!item[field]) throw new Error(item.id + ': missing ' + field);
  }
}

console.log('ready for promotion: ' + ready.length);
for (const item of ready) console.log('- ' + item.date + ' · ' + item.area + ' · ' + item.title);

if (!apply) {
  console.log('dry run only; add --apply after human approval');
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
