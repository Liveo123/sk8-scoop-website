import assert from 'node:assert/strict';
import fs from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';

const base=new URL(String(process.env.PREVIEW_URL||''));
assert.match(base.hostname,/^[a-z0-9-]+\.previews\.sk8scoop\.com$/i,
  'This read-only route audit only scans the correct preview host');
const sitemap=fs.readFileSync('sitemap.xml','utf8');
const locations=[...sitemap.matchAll(/<loc>(https:\/\/www\.sk8scoop\.com[^<]*)<\/loc>/g)].map(x=>x[1]);
assert.equal(locations.length,66,'Sitemap route census changed; review actual routes before scanning');
const routes=[...new Set(locations.map(value=>new URL(value).pathname))];
assert.equal(routes.length,66,'Sitemap contains duplicate canonical routes');
const results=[];
let position=0;
const fetchRoute=async route=>{
  const start=Date.now();
  let status=0,finalPath='',h1=false,title=false,canonical=false,contentType='',error='';
  try {
    const response=await fetch(new URL(route,base),{
      method:'GET',redirect:'follow',signal:AbortSignal.timeout(15000),
      headers:{'User-Agent':'SK8-preview-sitewide-QA/1.0','Accept':'text/html'}
    });
    status=response.status;
    finalPath=new URL(response.url).pathname;
    contentType=response.headers.get('content-type')||'';
    const html=await response.text();
    title=/<title\b[^>]*>[^<]+<\/title>/i.test(html);
    h1=/<h1\b/i.test(html);
    canonical=/<link\b[^>]*rel=["']canonical["']/i.test(html) ||
      /<link\b[^>]*href=["'][^"']+["'][^>]*rel=["']canonical["']/i.test(html);
  } catch(e){error=String(e).slice(0,260);}
  const row={route,status,finalPath,contentType,title,h1,canonical,ms:Date.now()-start,error};
  results.push(row);
  return row;
};
async function worker(){
  while(position<routes.length){
    const ix=position++;
    await fetchRoute(routes[ix]);
  }
}
await Promise.all(Array.from({length:6},worker));
const blocked=results.filter(r=>!r.status || r.status<200 || r.status>=400 || !/html/i.test(r.contentType));
const missing=results.filter(r=>r.status>=200&&r.status<400&&(!r.title||!r.h1||!r.canonical));
const slow=results.filter(r=>r.ms>3500);
await mkdir('visual-qa/sitewide',{recursive:true});
await writeFile('visual-qa/sitewide/route-census.json',JSON.stringify({
  scope:'66 canonical sitemap URLs',site:base.origin,readOnly:true,
  counts:{total:routes.length,broken:blocked.length,metadataWarnings:missing.length,slow:slow.length},
  results:results.sort((a,b)=>a.route.localeCompare(b.route))
},null,2));
console.log('SK8 PREVIEW SITE ROUTE CENSUS: '+routes.length+
  ' checked, '+blocked.length+' inaccessible, '+missing.length+' metadata warnings, '+slow.length+' >3.5s');
for(const r of [...blocked,...missing,...slow.filter(s=>!blocked.includes(s)&&!missing.includes(s))].slice(0,40)){
  console.log((blocked.includes(r)?'BROKEN ':missing.includes(r)?'METADATA ':'SLOW ')+JSON.stringify(r));
}
assert.equal(blocked.length,0,'One or more canonical site pages cannot be loaded as HTML');
console.log('PASS route census: all 66 declared site pages returned readable HTML; metadata warnings are explicitly reported for editorial review.');
