import assert from 'node:assert/strict';
import { purgeExpiredEditorialRecords } from '../worker-business-v2.js';

function fakeDatabase(existing) {
  const queries = [];
  const db = {
    prepare(sql) {
      return {
        bind(...values) {
          assert.match(sql, /^SELECT name FROM sqlite_master/);
          assert.deepEqual(values.slice(0, 1), ['table']);
          return { first: async () => existing.has(values[1]) ? { name: values[1] } : null };
        },
        async run() {
          queries.push(sql);
          return { meta: { changes: 1 } };
        }
      };
    }
  };
  return { db, queries };
}
const all = fakeDatabase(new Set(['search_events', 'secret_trail_feedback', 'subscriber_preferences']));
await purgeExpiredEditorialRecords(all.db);
assert.equal(all.queries.length, 2, 'expected only two editorial retention deletes');
assert.match(all.queries[0], /^DELETE FROM search_events WHERE created_at < datetime\('now', '-365 days'\)$/);
assert.match(all.queries[1], /^DELETE FROM secret_trail_feedback WHERE created_at < datetime\('now', '-365 days'\)$/);
assert.ok(all.queries.every(q => !q.includes('subscriber_preferences')), 'never erase subscriber records');
const none = fakeDatabase(new Set());
await purgeExpiredEditorialRecords(none.db);
assert.equal(none.queries.length, 0, 'missing logging tables must be skipped');
console.log('PASS: editorial retention deletes exactly two permitted datasets; absent tables skipped');
