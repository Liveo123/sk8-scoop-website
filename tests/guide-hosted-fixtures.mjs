import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {inventoryImages,inventoryLinks,inventoryCurrentLinks,halloweenEntries,chooseSpread,safeUrl,imageSignature,probeImage,probeLink,sha256} from '../scripts/guide-hosted-core.mjs';

const html='<img src="/guide/a.webp" alt="A"><img src="https://cdn.example.org/b.jpg">'+
  '<script id="image-data" type="application/json">'+JSON.stringify({brand:'/logo.webp',a1:'/guide/a.webp',a2:'https://cdn.example.org/b.jpg'})+'</script>'+
  '<a href="https://example.org/info">Official</a><a href="mailto:private@example.org">Email</a>';
assert.deepEqual(inventoryImages(html),['/guide/a.webp','https://cdn.example.org/b.jpg','/logo.webp']);
assert.deepEqual(inventoryImages('<script>var markup = "<img src=/bad.webp>";</script><img src="/good.webp">'),['/good.webp']);
assert.deepEqual(inventoryLinks(html),['https://example.org/info']);
const dynamic='<script>const E=[{"u":"https://halloween.example.org/tickets","visual":["assets/feature.webp","An illustration"]}];function visualFor(e){return e.visual}</script>';
assert.equal(halloweenEntries(dynamic).length,1);
assert.deepEqual(inventoryImages(dynamic),['assets/feature.webp']);
assert.deepEqual(inventoryLinks(dynamic),['https://halloween.example.org/tickets']);
// Date-aware live checks must not fail because a hidden October event URL went stale.
// Retain all old source URLs in inventoryLinks for editorial/rights audit.
const seasonal='<a href="https://example.org/current">Current static link</a><script>const E='+
  JSON.stringify([
    {u:'https://events.example.org/past',schedule:{kind:'dated',dates:['2026-10-20']}},
    {u:'https://events.example.org/future',schedule:{kind:'dated',dates:['2026-11-20']}},
    {u:'https://events.example.org/retired',retired:true,schedule:{kind:'dated',dates:['2026-11-20']}},
    {u:'https://events.example.org/evergreen',schedule:{kind:'evergreen'}}
  ])+';function visualFor(e){return e.visual}</script>';
assert.equal(inventoryLinks(seasonal).length,5,'Historical URLs remain auditable');
assert.deepEqual(inventoryCurrentLinks(seasonal,'2026-11-09'),[
  'https://example.org/current','https://events.example.org/future','https://events.example.org/evergreen'
],'Hidden expired/retired URLs do not count as current reader links');
assert.deepEqual(inventoryCurrentLinks(seasonal,'2026-10-01'),[
  'https://example.org/current','https://events.example.org/past',
  'https://events.example.org/future','https://events.example.org/evergreen'
],'An event remains live before its verified last date');
assert.deepEqual(chooseSpread([1,2,3,4,5],3),[1,3,5]);
assert.equal(safeUrl('javascript:alert(1)','https://www.sk8scoop.com/'),null);
assert.equal(safeUrl('http://example.org/','https://www.sk8scoop.com/'),null);
assert.equal(safeUrl('http://127.0.0.1:1234/','https://www.sk8scoop.com/').hostname,'127.0.0.1');
assert.equal(safeUrl('https://example.org/secret','https://www.sk8scoop.com/').hostname,'example.org');
const image=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/ZesAAAAASUVORK5CYII=','base64');
assert.deepEqual(imageSignature(image),{type:'PNG',width:1,height:1});
assert.equal(imageSignature(Buffer.from('<html>no</html>')),null);
assert.equal(sha256(image).length,64);
const server=createServer((request,response)=>{
  if(request.url==='/image'){response.setHeader('content-type','image/png');response.end(image);return;}
  if(request.url==='/html'){response.setHeader('content-type','text/html');response.end('<html></html>');return;}
  if(request.url==='/missing'){response.statusCode=404;response.end();return;}
  if(request.url==='/bot'){response.statusCode=403;response.end();return;}
  response.end('ok');
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base='http://127.0.0.1:'+server.address().port;
try {
  assert.equal((await probeImage('/image',base)).status,'PASS');
  assert.equal((await probeImage('/html',base)).status,'FAIL');
  assert.equal((await probeImage('/missing',base)).status,'FAIL');
  assert.equal((await probeImage('/bot',base)).status,'NOT VERIFIED');
  assert.equal((await probeLink(base+'/missing')).kind,'CONFIRMED BROKEN');
  assert.equal((await probeLink(base+'/bot')).kind,'AUTOMATION BLOCKED');
  assert.equal((await probeLink(base+'/image')).kind,'VERIFIED WORKING');
} finally {await new Promise(resolve=>server.close(resolve));}
console.log('PASS hosted-asset/link fixtures: image format, dimensions, HTTP reachability, blocked/broken states.');
