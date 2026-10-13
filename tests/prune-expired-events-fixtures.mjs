import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const script = path.resolve('scripts/prune-expired-events.mjs');
const day = '2026-10-13';
const event = (id, date, area='Cheadle') => ({
  id, title:id, date, area, status:'verified', venue:'Test venue',
  cost:'Free', category:'Community', description:'Fixture, not a published event',
  source_url:'https://example.org', verification:'ORGANISER_PRIMARY_SOURCE', checked:day
});
function run(events, handoffs=[], apply=false) {
  const folder=fs.mkdtempSync(path.join(os.tmpdir(),'sk8-expiry-fixture-'));
  const eventPath=path.join(folder,'events.json');
  const harvestPath=path.join(folder,'harvest.json');
  try {
    fs.writeFileSync(eventPath,JSON.stringify(events,null,2)+'\n');
    fs.writeFileSync(harvestPath,JSON.stringify({issue:16,items:handoffs},null,2)+'\n');
    const before={events:fs.readFileSync(eventPath,'utf8'),harvest:fs.readFileSync(harvestPath,'utf8')};
    const result=spawnSync(process.execPath,[script,...(apply?['--apply']:[])],{
      cwd:process.cwd(),encoding:'utf8',env:{...process.env,
        EVENT_TODAY:day,EVENT_DATA_PATH:eventPath,HARVEST_DATA_PATH:harvestPath}
    });
    const after={events:fs.readFileSync(eventPath,'utf8'),harvest:fs.readFileSync(harvestPath,'utf8')};
    return {...result,before,after,records:JSON.parse(after.events),
      handoffs:JSON.parse(after.harvest).items};
  } finally {fs.rmSync(folder,{recursive:true,force:true});}
}
const past=event('expired','2026-10-12');
const future=event('future','2026-10-18');
const audit=[{id:'issue16-event',event_id:'expired',disposition:'whats_on',
  reason:'Included in newsletter and website.'}];
const dry=run([past,future],audit);
assert.equal(dry.status,0,dry.stderr);
assert.deepEqual(dry.before,dry.after,'dry-run must not change either file');
const applied=run([past,future],audit,true);
assert.equal(applied.status,0,applied.stderr);
assert.deepEqual(applied.records.map(e=>e.id),['future']);
assert.equal(applied.handoffs[0].disposition,'whats_on_expired');
assert.match(applied.handoffs[0].reason,/Included in newsletter and website/);
const again=run(applied.records,applied.handoffs,true);
assert.equal(again.status,0,again.stderr);
assert.deepEqual(again.before,again.after,'repeated run must be idempotent');
const ongoing={...event('range','2026-10-01'),end_date:'2026-11-01',date_mode:'daily'};
assert.deepEqual(run([past,ongoing],[],true).records.map(e=>e.id),['range']);
const series={...event('series','2026-10-01'),end_date:'2026-12-07',
  date_mode:'specific_dates',occurrences:['2026-10-12','2026-10-19',{date:'2026-12-07',status:'cancelled'}]};
assert.deepEqual(run([past,series],[],true).records.map(e=>e.id),['series']);
const spent={...series,occurrences:['2026-10-12',{date:'2026-12-07',status:'cancelled'}]};
assert.deepEqual(run([spent,future],[],true).records.map(e=>e.id),['future']);
const noCore=run([past,event('outside','2026-10-30','Manchester')],[],true);
assert.notEqual(noCore.status,0);
assert.deepEqual(noCore.before,noCore.after,'no-core guard must fail before writing');
const invalid=run([{...past,date:'2026-02-31'},future],[],true);
assert.notEqual(invalid.status,0);
assert.deepEqual(invalid.before,invalid.after,'invalid source dates must fail before writing');
const invalidOcc={...series,occurrences:['2026-12-31']};
const illegal=run([invalidOcc,future],[],true);
assert.notEqual(illegal.status,0);
assert.deepEqual(illegal.before,illegal.after,'invalid recurrence must fail before writing');
console.log('Expiry safety net: dry-run, 14-event style retirement, historical handoff, idempotency, range, confirmed dates, exhausted series, no-core, invalid date and invalid occurrence passed.');
