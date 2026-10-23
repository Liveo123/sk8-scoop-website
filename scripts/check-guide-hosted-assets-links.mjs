import fs from 'node:fs';
import {mkdir,writeFile} from 'node:fs/promises';
import {inventoryImages,inventoryLinks,chooseSpread,sha256,probeImage,probeLink,safeUrl} from './guide-hosted-core.mjs';

const BASE=(process.env.GUIDE_QA_BASE_URL||'http://127.0.0.1:8769').replace(/\/$/,'');
const IMAGE_LIMIT=Math.max(0,Math.min(30,Number(process.env.GUIDE_QA_IMAGE_LIMIT||'6')));
const LINK_LIMIT=Math.max(0,Math.min(20,Number(process.env.GUIDE_QA_LINK_LIMIT||'4')));
const STRICT_LOCAL=process.env.GUIDE_QA_PARITY_STRICT==='1';
const STRICT_REMOTE=process.env.GUIDE_QA_REMOTE_STRICT==='1';
const output=[];
const guides=[
  ['Halloween','halloween-half-term-guide'],
  ['Free & Cheap','free-cheap-guide'],
  ['52 Adventures','52-adventures']
];
const concurrency=async(values,limit,task)=>{
  let next=0;
  const results=Array(values.length);
  await Promise.all(Array.from({length:Math.min(limit,values.length)},async()=>{
    while(next<values.length){
      const i=next++;
      results[i]=await task(values[i],i);
    }
  }));
  return results;
};
for(const [name,slug] of guides){
  const path=slug+'/guide/index.html';
  const local=fs.readFileSync(path);
  const localHtml=local.toString('utf8');
  const url=BASE+'/'+slug+'/guide/';
  const record={name,url,sourceSha256:sha256(local),sourceBytes:local.length,parity:'NOT VERIFIED',images:[],links:[]};
  try {
    const response=await fetch(url,{signal:AbortSignal.timeout(16000),redirect:'follow'});
    record.http=response.status;
    record.finalUrl=response.url;
    record.guideReachable=response.ok && response.url.endsWith('/'+slug+'/guide/');
    if(response.ok) {
      const body=Buffer.from(await response.arrayBuffer());
      record.hostedSha256=sha256(body);record.hostedBytes=body.length;
      record.parity=record.sourceSha256===record.hostedSha256?'PASS':'MISMATCH';
    }
  } catch(e){record.guideReachable=false;record.parity='NOT VERIFIED';record.reason=String(e.message||e);}
  const imageURLs=inventoryImages(localHtml);
  const imageSamples=chooseSpread(imageURLs,IMAGE_LIMIT);
  const resolved=imageSamples.map(src=>({src,url:safeUrl(src,url)}));
  record.imageTotal=imageURLs.length;
  record.images=await concurrency(resolved,4,async({src})=>probeImage(src,url));
  const allLinks=inventoryLinks(localHtml);
  const distinctHosts=[];
  const hostCount=new Map();
  for (const link of allLinks) {
    const u=safeUrl(link,link);
    if(!u || u.hostname==='www.sk8scoop.com')continue;
    const used=hostCount.get(u.hostname)||0;
    if(used>=2)continue;
    hostCount.set(u.hostname,used+1);distinctHosts.push(link);
  }
  record.externalLinkTotal=allLinks.length;
  record.links=await concurrency(chooseSpread(distinctHosts,LINK_LIMIT),3,link=>probeLink(link));
  record.imageSummary=record.images.reduce((a,x)=>(a[x.status]=(a[x.status]||0)+1,a),{});
  record.linkSummary=record.links.reduce((a,x)=>(a[x.kind]=(a[x.kind]||0)+1,a),{});
  console.log(name+' guide: HTTP '+(record.http||'unknown')+
    '; source/host parity='+record.parity+
    '; images sampled '+record.images.length+'/'+record.imageTotal+
    ' '+JSON.stringify(record.imageSummary)+
    '; external links sampled '+record.links.length+'/'+record.externalLinkTotal+
    ' '+JSON.stringify(record.linkSummary));
  for (const image of record.images.filter(x=>x.status!=='PASS')) console.log('IMAGE '+name+' '+image.status+' '+image.url+' '+image.reason);
  for (const link of record.links.filter(x=>x.kind!=='VERIFIED WORKING')) console.log('LINK '+name+' '+link.kind+' '+link.url+' '+(link.reason||link.note||''));
  if(STRICT_LOCAL && (!record.guideReachable || record.parity!=='PASS' ||
    record.images.some(img=>img.status==='FAIL' && img.url.startsWith(BASE))))process.exitCode=1;
  if(STRICT_REMOTE && (!record.guideReachable || record.images.some(img=>img.status==='FAIL')))process.exitCode=1;
  output.push(record);
}
await mkdir('visual-qa/guide-reliability',{recursive:true});
await writeFile('visual-qa/guide-reliability/hosted-audit.json',
  JSON.stringify({checkedAt:new Date().toISOString(),base:BASE,gitSha:process.env.GITHUB_SHA||null,
    exactBuildIdentity:'NOT VERIFIED WITHOUT MATCHED CLOUDFLARE DEPLOYMENT RECORD',
    checks:output},null,2)+'\n');
console.log('Audit saved: visual-qa/guide-reliability/hosted-audit.json');
