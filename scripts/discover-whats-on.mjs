// Twice-weekly SK8 event discovery. All findings are LEADS, never publication approvals.
// Node 22, no third-party packages or secrets needed for public primary sources.
import fs from 'node:fs';
import crypto from 'node:crypto';
import {pathToFileURL} from 'node:url';

const DEFAULT_DAYS=42;
const maxHtml=1_500_000;
const sha=s=>crypto.createHash('sha256').update(String(s)).digest('hex').slice(0,14);
const dateOnly=s=>String(s||'').match(/^\d{4}-\d{2}-\d{2}/)?.[0]||'';
const clean=s=>String(s||'').replace(/[\r\n\t]+/g,' ').replace(/\s+/g,' ').trim().slice(0,180);
const safeLink=s=>{try {const u=new URL(String(s));return u.protocol==='https:'?u.href:null;}catch{return null;}};
const esc=s=>clean(s).replace(/[<>&|[\]]/g,' ');
function londonDay(date=new Date()){
 const p=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date);
 const v=Object.fromEntries(p.map(x=>[x.type,x.value]));
 return v.year+'-'+v.month+'-'+v.day;
}
function futureDay(day,windowDays){
 const d=new Date(day+'T12:00:00Z');
 d.setUTCDate(d.getUTCDate()+windowDays);
 return d.toISOString().slice(0,10);
}
export function flattenJsonLd(value){
 if(Array.isArray(value))return value.flatMap(flattenJsonLd);
 if(!value||typeof value!=='object')return [];
 return [value,...flattenJsonLd(value['@graph']||[])];
}
export function extractJsonLdEvents(html,source){
 const found=[];
 const rx=/<script\b(?=[^>]*type\s*=\s*["']application\/ld\+json["'])[^>]*>([\s\S]*?)<\/script\s*>/gi;
 for(const match of String(html).matchAll(rx)){
  try{
   const parsed=JSON.parse(match[1].trim().replace(/^<!--|-->$/g,'').trim());
   for(const node of flattenJsonLd(parsed)){
    const types=[].concat(node['@type']||[]);
    if(!types.some(t=>/event$/i.test(String(t))))continue;
    const day=dateOnly(node.startDate),name=clean(node.name);
    if(!day||!name)continue;
    const loc=typeof node.location==='object'?node.location?.name:node.location;
    found.push({name,date:day,start:String(node.startDate||''),location:clean(loc),url:safeLink(node.url)||source});
   }
  }catch{ /* Invalid third-party JSON-LD is a nonfatal discovery limitation. */ }
 }
 return found;
}
function fingerprint(event){return clean(event.name).toLowerCase().replace(/[^a-z0-9]+/g,'-')+'|'+event.date;}
export function reconcile(raw,sources,events,queue,today=londonDay(),days=DEFAULT_DAYS){
 const until=futureDay(today,days),existing=new Set();
 for(const item of [...events,...queue]){
  existing.add((clean(item.title).toLowerCase().replace(/[^a-z0-9]+/g,'-'))+'|'+dateOnly(item.date));
 }
 const by=new Set(),leads=[];
 for(const item of raw){
  if(item.date<today||item.date>until)continue;
  const key=fingerprint(item);
  if(by.has(key)||existing.has(key))continue;
  by.add(key);
  const source=sources.find(s=>s.id===item.source_id);
  if(!source)continue;
  leads.push({id:'discover-'+sha(key+'|'+item.source_id),title:item.name,date:item.date,area:source.area,source_id:item.source_id,source_url:item.url||source.url,
   status:'needs_check',missing:['Confirm exact dated session and times','Confirm price, venue and booking conditions','Confirm availability and suitability for SK8 readers'],
   reason:'Machine-discovered Event structured data: editorial and organiser verification required',discovered:today});
 }
 leads.sort((a,b)=>a.date.localeCompare(b.date)||a.title.localeCompare(b.title));
 return leads;
}
export function selectSources(registry){
 // D-tier social/search sources require human research, not mechanical URL scraping.
 return registry.sources.filter(s=>['A','B','C'].includes(s.tier)&&s.mode==='fetch'&&safeLink(s.url));
}
export async function scan(registry,events,queue,opts={}){
 const today=opts.today||londonDay(),days=registry.policy?.target_forward_window_days||DEFAULT_DAYS;
 const sources=selectSources(registry),results=[],raw=[];
 let cursor=0;
 async function worker(){
  while(cursor<sources.length){
   const source=sources[cursor++];
   const check={id:source.id,name:source.name,tier:source.tier,area:source.area,url:source.url,role:source.role,status:'',structured_events:0};
   try{
    const response=await fetch(source.url,{signal:AbortSignal.timeout(12000),headers:{'User-Agent':'SK8Scoop-EventDiscovery/1.0 (editorial source check; contact@sk8scoop.com)','Accept':'text/html,application/xhtml+xml'}});
    if(!response.ok)throw Error('HTTP '+response.status);
    const contentType=response.headers.get('content-type')||'';
    if(!/html|xml|text/i.test(contentType))throw Error('Unexpected content-type');
    const html=(await response.text()).slice(0,maxHtml);
    const found=extractJsonLdEvents(html,source.url);
    check.status='checked';check.structured_events=found.length;check.page_fingerprint=sha(html);
    for(const item of found)raw.push({...item,source_id:source.id});
   }catch(err){check.status='unavailable';check.error=clean(err.message);}
   results.push(check);
  }
 }
 await Promise.all(Array.from({length:Math.min(4,sources.length)},worker));
 results.sort((a,b)=>a.id.localeCompare(b.id));
 const leads=reconcile(raw,sources,events,queue,today,days);
 const regular=results.filter(s=>/regular|class|community|wellbeing|yoga|pilates|groups/i.test(s.role+' '+s.name));
 return {generated_utc:new Date().toISOString(),today_uk:today,window_end:futureDay(today,days),scan_policy:'Sources A/B/C with fetch mode; tier D manual discovery only',disclaimer:'Leads and recurring source checks are NOT verified calendar entries. No automatic event publication.',summary:{sources_checked:results.filter(r=>r.status==='checked').length,sources_unavailable:results.filter(r=>r.status!=='checked').length,structured_events_seen:raw.length,new_dated_leads:leads.length,regular_sources_visited:regular.length,manual_discovery_sources:registry.sources.filter(s=>s.tier==='D').length},leads,regular_source_reviews:regular,source_results:results};
}
function markdown(report){
 const m=report.summary;
 const lines=['# SK8 Scoop | Tuesday/Friday What’s On discovery','', 'UK research date: '+report.today_uk+' | Window ends: '+report.window_end,'',
 '**DISCOVERY ONLY. Nothing is verified for publication or automatically deployed.**','',
 'Sources checked: '+m.sources_checked+' | Unavailable: '+m.sources_unavailable+' | Event data candidates: '+m.new_dated_leads+
 ' | Recurring source pages checked: '+m.regular_sources_visited+' | Manual discovery sources: '+m.manual_discovery_sources,'',
 '## New dated leads'];
 if(!report.leads.length)lines.push('No new date-bearing structured leads found. This is not evidence that there are no local events.');
 for(const lead of report.leads.slice(0,50))lines.push('- '+esc(lead.date)+' | '+esc(lead.title)+' | '+esc(lead.area)+' | '+lead.source_url);
 lines.push('','## Regular activities and classes (source-page review)','Confirm weekly sessions individually, especially Christmas, half-terms and bank holidays.');
 for(const s of report.regular_source_reviews)lines.push('- '+esc(s.name)+' ['+esc(s.status)+'] '+s.url);
 lines.push('','## Unavailable sources');
 for(const s of report.source_results.filter(s=>s.status!=='checked'))lines.push('- '+esc(s.name)+': '+esc(s.error||s.status));
 lines.push('','## Manual research required','Tier D and social sources, event submission inbox, unstructured timetables and true booking inventory require an editor or authorised research agent. Record their verification before promotion.');
 return lines.join('\n')+'\n';
}
async function publishIssue(markdownBody){
 const token=process.env.GITHUB_TOKEN,repo=process.env.GITHUB_REPOSITORY;
 if(!token||!repo)return false;
 const title='SK8 Scoop | rolling What\u2019s On discovery';
 const base='https://api.github.com/repos/'+repo+'/issues';
 const headers={'Authorization':'Bearer '+token,'Accept':'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','Content-Type':'application/json'};
 const list=await fetch(base+'?state=open&per_page=100',{headers,signal:AbortSignal.timeout(12000)});
 if(!list.ok)throw Error('Issue lookup HTTP '+list.status);
 const issues=await list.json(),match=issues.find(x=>x.title===title&&!x.pull_request);
 const url=match?base+'/'+match.number:base,method=match?'PATCH':'POST';
 const res=await fetch(url,{method,headers,body:JSON.stringify({title,body:markdownBody.slice(0,60000)}),signal:AbortSignal.timeout(12000)});
 if(!res.ok)throw Error('Issue update HTTP '+res.status);
 return true;
}
async function main(){
 const registry=JSON.parse(fs.readFileSync('data/event-sources.json','utf8'));
 const events=JSON.parse(fs.readFileSync('data/events.json','utf8'));
 const queue=JSON.parse(fs.readFileSync('data/event-review-queue.json','utf8')).items;
 const report=await scan(registry,events,queue);
 fs.mkdirSync('out',{recursive:true});
 fs.writeFileSync('out/whats-on-discovery.json',JSON.stringify(report,null,2)+'\n');
 const body=markdown(report);
 fs.writeFileSync('out/whats-on-discovery.md',body);
 if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,body.slice(0,100000));
 if(process.argv.includes('--update-issue'))await publishIssue(body);
 console.log(JSON.stringify(report.summary));
 if(report.summary.sources_checked===0)throw Error('No primary source could be checked; source scan failed');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)main().catch(e=>{console.error(e);process.exitCode=1;});
