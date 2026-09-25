import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

const makeDir = () => fs.mkdtempSync(path.join(os.tmpdir(), 'sk8-event-promote-'));
const run = (queue, events, extraArgs = ['--apply']) => {
  const dir = makeDir();
  const queuePath = path.join(dir, 'queue.json');
  const eventsPath = path.join(dir, 'events.json');
  fs.writeFileSync(queuePath, JSON.stringify(queue,null,2));
  fs.writeFileSync(eventsPath, JSON.stringify(events,null,2));
  const output = execFileSync(process.execPath, ['scripts/promote-ready-events.mjs', ...extraArgs], {
    cwd: process.cwd(),
    env: {...process.env, EVENT_QUEUE_PATH:queuePath, EVENT_DATA_PATH:eventsPath},
    encoding:'utf8'
  });
  return {
    output,
    queue: JSON.parse(fs.readFileSync(queuePath,'utf8')),
    events: JSON.parse(fs.readFileSync(eventsPath,'utf8')),
    queueRaw: fs.readFileSync(queuePath,'utf8'),
    eventsRaw: fs.readFileSync(eventsPath,'utf8')
  };
};

const baseQueue = {
  version: 1,
  updated: '2026-09-25',
  statuses: {ready:'',needs_check:'',rejected:''},
  items: [
    {
      id:'ready-event',
      title:'Ready event',
      status:'ready',
      area:'Cheadle',
      source_url:'https://example.com/ready',
      discovered:'2026-09-25',
      reason:'Verified primary source',
      date:'2026-10-10',
      venue:'Test Hall',
      cost:'Free',
      category:'Community',
      description:'A verified test event.',
      verification:'ORGANISER_PRIMARY_SOURCE',
      checked:'2026-09-25'
    },
    {
      id:'needs-check-event',
      title:'Needs check event',
      status:'needs_check',
      area:'Gatley',
      source_url:'https://example.com/check',
      discovered:'2026-09-25',
      reason:'Price not confirmed',
      missing:['cost']
    }
  ]
};

const baseEvents = [{
  id:'existing-event',
  title:'Existing event',
  date:'2026-10-01',
  area:'Heald Green',
  venue:'Existing Venue',
  cost:'Free',
  category:'Community',
  description:'Existing record.',
  source_url:'https://example.com/existing',
  verification:'ORGANISER_PRIMARY_SOURCE',
  checked:'2026-09-25',
  status:'verified'
}];

// Cycle 1: only ready items are promoted; review-only metadata does not leak.
const promotedRun = run(structuredClone(baseQueue), structuredClone(baseEvents));
if (promotedRun.events.length !== 2) throw new Error('expected exactly one promoted event');
const promoted = promotedRun.events.find(event => event.id === 'ready-event');
if (!promoted) throw new Error('ready event was not promoted');
if (promoted.status !== 'verified') throw new Error('promoted status must be verified');
if ('reason' in promoted || 'discovered' in promoted || 'missing' in promoted) throw new Error('queue-only metadata leaked into public event data');
if (promotedRun.queue.items.length !== 1 || promotedRun.queue.items[0].id !== 'needs-check-event') throw new Error('non-ready queue item was not retained');

// Cycle 2: an empty-ready queue must be a no-op even with --apply.
const noReadyQueue = structuredClone(baseQueue);
noReadyQueue.items = noReadyQueue.items.filter(item => item.status !== 'ready');
const noReadyDir = makeDir();
const noReadyQueuePath = path.join(noReadyDir,'queue.json');
const noReadyEventsPath = path.join(noReadyDir,'events.json');
const beforeQueue = JSON.stringify(noReadyQueue,null,2);
const beforeEvents = JSON.stringify(baseEvents,null,2);
fs.writeFileSync(noReadyQueuePath,beforeQueue);
fs.writeFileSync(noReadyEventsPath,beforeEvents);
execFileSync(process.execPath,['scripts/promote-ready-events.mjs','--apply'],{
  cwd:process.cwd(),
  env:{...process.env,EVENT_QUEUE_PATH:noReadyQueuePath,EVENT_DATA_PATH:noReadyEventsPath},
  stdio:'pipe'
});
if (fs.readFileSync(noReadyQueuePath,'utf8') !== beforeQueue) throw new Error('no-ready apply changed the queue');
if (fs.readFileSync(noReadyEventsPath,'utf8') !== beforeEvents) throw new Error('no-ready apply changed event data');

// Cycle 3: duplicate ready IDs must fail before writing.
const dupQueue = structuredClone(baseQueue);
dupQueue.items.unshift({...dupQueue.items[0]});
let duplicateFailed = false;
try {
  run(dupQueue, structuredClone(baseEvents));
} catch (error) {
  duplicateFailed = /duplicate ready item/.test(String(error.stderr || error.message || error));
}
if (!duplicateFailed) throw new Error('duplicate ready IDs did not fail safely');

console.log('event promotion fixture tests OK');
