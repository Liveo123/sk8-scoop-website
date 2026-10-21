#!/usr/bin/env node
// Guide Factory release check: structured, inclusive UK dates on every published event.
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
const file=process.argv[2];
if(!file){console.error('Usage: node tools/validate-guide-expiry.mjs path/to/guide/index.html');process.exit(2);}
const html=readFileSync(resolve(file),'utf8'),errors=[],review=[];
if(!html.includes('src="/assets/guide-expiry.js"'))errors.push('Missing shared expiry JS asset');
if(!html.includes('SK8GuideExpiry.mount('))errors.push('Missing expiry mount call');
function readEvents(src){
 const start=src.indexOf('const E=');
 if(start<0)throw Error('Missing selected event list const E=');
 const begin=src.indexOf('[',start+8);if(begin<0)throw Error('Missing event array opener');
 let depth=0,quoted=false,escaped=false;
 for(let i=begin;i<src.length;i++){const ch=src[i];if(quoted){if(escaped){escaped=false;continue;}if(ch==='\\'){escaped=true;continue;}if(ch==='"')quoted=false;}else if(ch==='"')quoted=true;else if(ch==='[')depth++;else if(ch===']'){depth--;if(depth===0)return JSON.parse(src.slice(begin,i+1));}}
 throw Error('Selected E array is incomplete');
}
const valid=x=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&!Number.isNaN(Date.parse(x+'T12:00:00Z'))&&new Date(x+'T12:00:00Z').toISOString().slice(0,10)===x;
let items=[];try{items=readEvents(html);}catch(err){errors.push(String(err.message));}
const stats={dated:0,evergreen:0,'open-ended':0,unknown:0};
items.forEach((entry,index)=>{
 const desc='Item '+(index+1)+' ('+(entry.n||'unnamed')+')';
 const s=entry.schedule;if(!s||typeof s!=='object'){errors.push(desc+' missing schedule');return;}
 if(!(s.kind in stats)){errors.push(desc+' invalid schedule kind');return;}stats[s.kind]++;
 if(s.kind==='dated'){
   if(!s.dates?.length&&!s.ranges?.length)errors.push(desc+' missing scheduled date/range');
   for(const day of (s.dates||[]))if(!valid(day))errors.push(desc+' invalid date '+day);
   for(const span of (s.ranges||[]))if(!Array.isArray(span)||span.length!==2||!valid(span[0])||!valid(span[1])||span[0]>span[1])errors.push(desc+' invalid range '+JSON.stringify(span));
   for(const day of (s.excluded_dates||[]))if(!valid(day))errors.push(desc+' invalid excluded date '+day);
   if(s.selected_dates&&!s.review_note)review.push(desc+' selected days: confirm published sessions');
   if(s.review_note)review.push(desc+' '+s.review_note);
 } else if(s.kind==='evergreen') {
   if(s.ranges?.length||s.dates?.length)errors.push(desc+' evergreen must not have expiry schedule');
 } else {
   if(!s.review_note)errors.push(desc+' unknown/open-ended date requires review_note');
   else review.push(desc+' '+s.review_note);
 }
});
console.log('Guide:',file,'items:',items.length,'kinds:',JSON.stringify(stats));
review.forEach(x=>console.log('REVIEW:',x));
errors.forEach(x=>console.error('ERROR:',x));
if(errors.length||!items.length)process.exit(1);
console.log('PASS: structured guide expiry contract');
