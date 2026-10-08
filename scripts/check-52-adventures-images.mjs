import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const records=JSON.parse(readFileSync('docs/reviews/52-adventures-image-rights-2026-10-07.json','utf8'));
const html=readFileSync('52-adventures/guide/index.html','utf8');
const images=JSON.parse(html.match(/<script id="image-data" type="application\/json">([\s\S]*?)<\/script>/)[1]);
const seen=new Set();
for(const record of records){
  assert(!seen.has(record.num),`Duplicate photo record ${record.num}`);seen.add(record.num);
  assert.equal(images['a'+record.num],'/'+record.asset,`Photo ${record.num} route differs from rights record`);
  const bytes=readFileSync(record.asset);
  assert(bytes.length>16,`Photo ${record.num} is empty or truncated`);
  assert.equal(bytes.toString('ascii',0,4),'RIFF',`Photo ${record.num} has no RIFF header`);
  assert.equal(bytes.toString('ascii',8,12),'WEBP',`Photo ${record.num} is not WebP`);
  assert.equal(bytes.readUInt32LE(4)+8,bytes.length,`Photo ${record.num} is incomplete`);
  assert.equal(createHash('sha256').update(bytes).digest('hex'),record.sha256,`Photo ${record.num} differs from the reviewed asset`);
  assert(record.artist_plain&&record.license&&record.page&&record.alt,`Photo ${record.num} lacks rights/alt evidence`);
}
console.log(`52 Adventures image integrity passed: ${seen.size} reviewed WebP assets, routes and SHA-256 hashes.`);
