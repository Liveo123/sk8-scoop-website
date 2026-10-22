import { createHash } from 'node:crypto';
import { classifyLinkProbe } from './guide-reliability-core.mjs';

export const sha256 = value => createHash('sha256').update(value).digest('hex');
const plain = value => String(value ?? '').replaceAll('&amp;', '&').trim();

export function inventoryImages(html) {
  const list = [...html.matchAll(/<img\b[^>]*\bsrc=(["'])(.*?)\1/gi)].map(m => plain(m[2]));
  const data = html.match(/<script\b[^>]*id=["']image-data["'][^>]*>([\s\S]*?)<\/script>/i);
  if (data) {
    const images = JSON.parse(data[1]);
    for (const [key, url] of Object.entries(images)) if (key === 'brand' || /^a\d+$/.test(key)) list.push(plain(url));
  }
  return [...new Set(list.filter(x => x && !x.startsWith('data:') && !x.startsWith('blob:')))];
}
export function inventoryLinks(html) {
  return [...new Set([...html.matchAll(/<a\b[^>]*\bhref=(["'])(.*?)\1/gi)]
    .map(m => plain(m[2])).filter(x => /^https:\/\//i.test(x)))];
}

export function chooseSpread(items, limit) {
  const a = [...new Set(items)];
  if (a.length <= limit) return a;
  if (limit <= 0) return [];
  if (limit === 1) return [a[0]];
  return [...new Set(Array.from({length:limit},(_,i)=>a[Math.floor(i*(a.length-1)/(limit-1))]))];
}

export function safeUrl(raw, base) {
  let url;
  try { url = new URL(raw, base); } catch { return null; }
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) return null;
  if (url.hostname !== '127.0.0.1' && url.protocol !== 'https:') return null;
  if (url.hostname === 'localhost' || /^\d{1,3}(?:\.\d{1,3}){3}$/.test(url.hostname) &&
    url.hostname !== '127.0.0.1' || /^\[?::1\]?$/.test(url.hostname)) return null;
  return url;
}

function jpegSize(b) {
  let offset=2;
  while (offset+9<b.length) {
    if (b[offset]!==0xff) return null;
    let marker=b[offset+1];offset+=2;
    if (marker===0xd9 || marker===0xda) return null;
    if ([0x01,0xd0,0xd1,0xd2,0xd3,0xd4,0xd5,0xd6,0xd7].includes(marker)) continue;
    if (offset+2>b.length) return null;
    const length=b.readUInt16BE(offset);
    if (length<2 || offset+length>b.length) return null;
    if ([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker) && length>=7)
      return {width:b.readUInt16BE(offset+5),height:b.readUInt16BE(offset+3)};
    offset+=length;
  }
  return null;
}

export function imageSignature(bytes) {
  const b=Buffer.from(bytes);
  if(b.length<30)return null;
  if(b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))
    return {type:'PNG',width:b.readUInt32BE(16),height:b.readUInt32BE(20)};
  if(b.toString('ascii',0,4)==='RIFF' && b.toString('ascii',8,12)==='WEBP') {
    const chunk=b.toString('ascii',12,16);let width=0,height=0;
    if(chunk==='VP8X' && b.length>=30) {
      width=1+b[24]+(b[25]<<8)+(b[26]<<16);
      height=1+b[27]+(b[28]<<8)+(b[29]<<16);
    } else if (chunk==='VP8 ' && b.length>=30 && b[23]===0x9d && b[24]===1 && b[25]===0x2a) {
      width=b.readUInt16LE(26)&0x3fff;height=b.readUInt16LE(28)&0x3fff;
    } else if(chunk==='VP8L' && b.length>=25 && b[20]===0x2f) {
      width=1+b[21]+((b[22]&0x3f)<<8);
      height=1+(b[22]>>6)+(b[23]<<2)+((b[24]&0x0f)<<10);
    }
    return {type:'WebP',width,height};
  }
  if(b.toString('ascii',0,3)==='GIF') return {type:'GIF',width:b.readUInt16LE(6),height:b.readUInt16LE(8)};
  if(b[0]===0xff && b[1]===0xd8) return {type:'JPEG',...jpegSize(b)};
  if(b.toString('ascii',4,12).includes('ftypavif')) return {type:'AVIF',width:null,height:null};
  return null;
}

const MAX_IMAGE_BYTES=10*1024*1024;
async function boundedBuffer(response) {
  const length=Number(response.headers.get('content-length')||0);
  if (length>MAX_IMAGE_BYTES) throw new Error('OVER_SIZE');
  const parts=[];let size=0;
  for await(const chunk of response.body) {
    size+=chunk.length;
    if(size>MAX_IMAGE_BYTES) {await response.body.cancel().catch(()=>{});throw new Error('OVER_SIZE');}
    parts.push(chunk);
  }
  return Buffer.concat(parts);
}

export async function probeImage(raw, pageUrl, {timeout=12000}={}) {
  const u=safeUrl(raw,pageUrl);
  if (!u) return {url:raw,status:'NOT VERIFIED',reason:'unsupported or unsafe URL'};
  try {
    const resp=await fetch(u,{signal:AbortSignal.timeout(timeout),headers:{'accept':'image/webp,image/png,image/jpeg,image/gif;q=0.9,*/*;q=0.1'},redirect:'follow'});
    const status=resp.status, mime=resp.headers.get('content-type')||'';
    if(!resp.ok) {await resp.body?.cancel();return {url:String(u),http:status,status:[404,410].includes(status)?'FAIL':'NOT VERIFIED',reason:classifyLinkProbe(status)};}
    if(!/^image\//i.test(mime)){await resp.body?.cancel();return {url:String(u),http:status,status:'FAIL',reason:'HTTP success but response is not an image ('+mime+')'};}
    const bytes=await boundedBuffer(resp);
    const decoded=imageSignature(bytes);
    if(!decoded) return {url:String(u),http:status,status:'NOT VERIFIED',reason:'image MIME but unknown signature',bytes:bytes.length};
    if(decoded.width!==null && (!decoded.width || !decoded.height))
      return {url:String(u),http:status,status:'FAIL',reason:'invalid image dimensions',format:decoded.type};
    return {url:String(u),http:status,status:decoded.width?'PASS':'NOT VERIFIED',format:decoded.type,width:decoded.width,height:decoded.height,bytes:bytes.length,sha256:sha256(bytes),reason:decoded.width?'':'header verified; dimensions unverified'};
  } catch(e) {return {url:String(u),status:'NOT VERIFIED',reason:String(e?.message||e).slice(0,150)};}
}

export async function probeLink(raw, {timeout=8500}={}) {
  const u=safeUrl(raw,raw);
  if(!u) return {url:raw,kind:'UNVERIFIED',reason:'unsafe or unsupported URL'};
  try {
    let response=await fetch(u,{method:'HEAD',redirect:'follow',signal:AbortSignal.timeout(timeout)});
    if(response.status===405 || response.status===501) {
      await response.body?.cancel();
      response=await fetch(u,{method:'GET',headers:{range:'bytes=0-0'},redirect:'follow',signal:AbortSignal.timeout(timeout)});
    }
    const code=response.status,finalUrl=response.url; await response.body?.cancel();
    return {url:String(u),finalUrl,http:code,kind:classifyLinkProbe(code),
      note:response.redirected?'Redirect followed; destination relevance not verified':'HTTP reachability only; content/booking relevance not verified'};
  }catch(e){return {url:String(u),kind:'UNVERIFIED',reason:String(e?.message||e).slice(0,150)};}
}
