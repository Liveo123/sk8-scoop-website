import fs from 'node:fs';

const queuePath = 'data/event-review-queue.json';
const eventsPath = 'data/events.json';

const queue = JSON.parse(fs.readFileSync(queuePath,'utf8'));
const events = JSON.parse(fs.readFileSync(eventsPath,'utf8'));
const liveIds = new Set(events.map(e => e.id));

if (queue.version !== 1) throw new Error('event-review-queue version must be 1');
if (!queue.statuses || typeof queue.statuses !== 'object') throw new Error('queue statuses missing');
if (!Array.isArray(queue.items)) throw new Error('queue items must be an array');

const allowed = new Set(['ready','needs_check','rejected']);
const seen = new Set();

for (const [i,item] of queue.items.entries()) {
  const label = `queue.items[${i}]`;
  for (const key of ['id','title','status','area','source_url','discovered','reason']) {
    if (item[key] === undefined || item[key] === '') throw new Error(`${label} missing ${key}`);
  }
  if (seen.has(item.id)) throw new Error(`duplicate queue id: ${item.id}`);
  seen.add(item.id);
  if (!allowed.has(item.status)) throw new Error(`${item.id}: invalid status ${item.status}`);
  if (!/^https:\/\//.test(item.source_url)) throw new Error(`${item.id}: source_url must use https`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(item.discovered)) throw new Error(`${item.id}: discovered must be YYYY-MM-DD`);
  if (item.status === 'ready') {
    for (const key of ['date','venue','cost','category','description','verification','checked']) {
      if (item[key] === undefined || item[key] === '') throw new Error(`${item.id}: ready item missing ${key}`);
    }
    if (liveIds.has(item.id)) throw new Error(`${item.id}: ready item already exists in data/events.json`);
  }
  if (item.status === 'needs_check' && (!Array.isArray(item.missing) || !item.missing.length)) {
    throw new Error(`${item.id}: needs_check item must list missing facts`);
  }
}

const counts = queue.items.reduce((acc,item)=>{acc[item.status]=(acc[item.status]||0)+1;return acc;},{});
console.log(`event review queue OK: ${queue.items.length} items · ready ${counts.ready||0} · needs_check ${counts.needs_check||0} · rejected ${counts.rejected||0}`);
