import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sk8-event-promote-'));
const queuePath = path.join(dir, 'queue.json');
const eventsPath = path.join(dir, 'events.json');

const queue = {
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

const events = [{
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

fs.writeFileSync(queuePath, JSON.stringify(queue,null,2));
fs.writeFileSync(eventsPath, JSON.stringify(events,null,2));

execFileSync(process.execPath, ['scripts/promote-ready-events.mjs','--apply'], {
  cwd: process.cwd(),
  env: {...process.env, EVENT_QUEUE_PATH:queuePath, EVENT_DATA_PATH:eventsPath},
  stdio:'pipe'
});

const nextQueue = JSON.parse(fs.readFileSync(queuePath,'utf8'));
const nextEvents = JSON.parse(fs.readFileSync(eventsPath,'utf8'));

if (nextEvents.length !== 2) throw new Error('expected exactly one promoted event');
const promoted = nextEvents.find(event => event.id === 'ready-event');
if (!promoted) throw new Error('ready event was not promoted');
if (promoted.status !== 'verified') throw new Error('promoted status must be verified');
if ('reason' in promoted || 'discovered' in promoted || 'missing' in promoted) throw new Error('queue-only metadata leaked into public event data');
if (nextQueue.items.length !== 1 || nextQueue.items[0].id !== 'needs-check-event') throw new Error('non-ready queue item was not retained');

console.log('event promotion fixture test OK');
