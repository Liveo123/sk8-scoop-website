import assert from 'node:assert/strict';
import {extractJsonLdEvents,reconcile,selectSources,flattenJsonLd} from '../scripts/discover-whats-on.mjs';

const source='https://example.org/whats-on';
const html='<html><script type="application/ld+json">'+JSON.stringify({'@graph':[
 {'@type':'Event',name:'Local Friday yoga session',startDate:'2026-11-27T19:00:00+00:00',location:{'@type':'Place',name:'Cheadle Hall'},url:'https://example.org/yoga'},
 {'@type':'MusicEvent',name:'Winter craft evening',startDate:'2026-12-01T18:30:00+00:00'},
 {'@type':'Event',name:'Past outing',startDate:'2026-11-01'},
 {'@type':'Person',name:'Not an event'}
]})+'</script></html>';
const found=extractJsonLdEvents(html,source);
assert.equal(found.length,3);
assert.equal(found[0].date,'2026-11-27');
assert.equal(found[1].url,source);
assert.equal(flattenJsonLd({'@graph':[{'@type':'Event'}, {'@type':'Event'}]}).length,3);
const sources=[{id:'primary',name:'Cheadle events',tier:'A',area:'Cheadle',mode:'fetch',url:source}];
const raw=found.concat(found[0]).map(x=>({...x,source_id:'primary'}));
let leads=reconcile(raw,sources,[],[],'2026-11-20',42);
assert.equal(leads.length,2,'past and duplicate events must be removed');
assert.ok(leads.every(x=>x.status==='needs_check'&&x.missing.length===3));
assert.equal(leads[0].date,'2026-11-27');
leads=reconcile(raw,sources,[{title:'Local Friday yoga session',date:'2026-11-27'}],[],'2026-11-20',42);
assert.equal(leads.length,1,'already-published event is suppressed');
leads=reconcile(raw,sources,[],[{title:'Winter craft evening',date:'2026-12-01'}],'2026-11-20',42);
assert.equal(leads.length,1,'existing review queue entry is suppressed');
const selected=selectSources({sources:[...sources,{id:'manual',tier:'D',mode:'search',url:source},{id:'broken',tier:'A',mode:'fetch',url:'http://unsafe.invalid'}]});
assert.deepEqual(selected.map(x=>x.id),['primary']);
assert.equal(extractJsonLdEvents('<script type="application/ld+json">{bad json}</script>',source).length,0);
console.log('SK8 twice-weekly discovery fixture tests passed: JSON-LD, filters, date window, dedup, unpublished holds, source selection.');
