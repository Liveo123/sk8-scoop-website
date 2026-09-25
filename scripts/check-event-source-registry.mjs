import fs from 'node:fs';

const path = 'data/event-sources.json';
const raw = fs.readFileSync(path, 'utf8');
const data = JSON.parse(raw);

if (!Array.isArray(data.sources) || !data.sources.length) {
  throw new Error('event source registry has no sources');
}

const ids = new Set();
const tiers = new Set(['A','B','C','D']);
const modes = new Set(['fetch','search','manual-social','internal']);

for (const [index, source] of data.sources.entries()) {
  const label = `source[${index}]`;
  for (const key of ['id','name','tier','area','role','cadence_days','mode']) {
    if (source[key] === undefined || source[key] === '') {
      throw new Error(`${label} missing ${key}`);
    }
  }
  if (ids.has(source.id)) throw new Error(`duplicate source id: ${source.id}`);
  ids.add(source.id);

  if (!tiers.has(source.tier)) throw new Error(`${source.id}: invalid tier ${source.tier}`);
  if (!modes.has(source.mode)) throw new Error(`${source.id}: invalid mode ${source.mode}`);
  if (!Number.isInteger(source.cadence_days) || source.cadence_days < 1) {
    throw new Error(`${source.id}: cadence_days must be a positive integer`);
  }
  if (source.url && !/^https:\/\//.test(source.url)) {
    throw new Error(`${source.id}: URL must use https`);
  }
  if (source.mode === 'search' && !source.url && !Array.isArray(source.search_queries)) {
    throw new Error(`${source.id}: search source needs a URL or search_queries`);
  }
}

const core = data.sources.filter(s => s.tier === 'A').length;
const primary = data.sources.filter(s => /primary|verification/.test(s.role)).length;
console.log(`event source registry OK: ${data.sources.length} sources, ${core} Tier A, ${primary} primary/verification-capable`);
