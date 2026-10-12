// Issue 17 source-first longread release checks. Run with Node 22.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import path from 'node:path';
const articles = [
 ['local-history/premier-cafe-cheadle/index.html', /Historic England/, /Parisian designer/],
 ['outdoors/carr-wood-cheadle-hulme-bramhall/index.html', /Slow Ways/, /full walk is open|full opening status not confirmed/]
];
for (const [rel, source, caution] of articles) {
 const html=fs.readFileSync(rel,'utf8');
 assert.match(html,/<!doctype html>/i,`${rel}: missing doctype`);
 assert.match(html,/<html lang="en-GB">/,`${rel}: lang`);
 assert.match(html,/<meta name="viewport"/,`${rel}: missing viewport`);
 assert.equal((html.match(/<h1\b/g)||[]).length,1,`${rel}: exactly one H1`);
 assert.equal((html.match(/<main\b/g)||[]).length,1,`${rel}: one main`);
 assert.equal((html.match(/<\/main>/g)||[]).length,1,`${rel}: main closed`);
 assert.match(html,/<a class="skip-link" href="#main-content">/,`${rel}: skip-link`);
 assert.match(html,/<link rel="canonical"/,`${rel}: canonical`);
 assert.match(html,/assets\/issue17-longreads\.css/,`${rel}: stylesheet`);
 assert.match(html,source,`${rel}: primary source`);
 assert.match(html,caution,`${rel}: evidence caution`);
 assert.doesNotMatch(html,/<svg\b/i,`${rel}: publication SVG prohibited`);
 assert.doesNotMatch(html,/<img[^>]+src="https?:/i,`${rel}: no unlicensed hotlinked image`);
 assert.doesNotMatch(html,/FACTORY LINK PLAN|NOT READER COPY/i,`${rel}: internal note leaked`);
 assert.ok(html.replace(/<[^>]*>/g,' ').trim().split(/\s+/).length>800,`${rel}: feature too short`);
 for (const href of html.matchAll(/\bhref="([^"]+)"/g)) {
   const link=href[1]; if(!link.startsWith('/')||link.startsWith('//')) continue;
   const dest=link.split(/[?#]/)[0];if(!dest)continue;
   const local = path.join('.',dest.endsWith('/')?dest+'index.html':dest);
   assert.ok(fs.existsSync(local),`${rel}: internal link target missing: ${dest}`);
 }
 console.log('PASS',rel);
}
const css=fs.readFileSync('assets/issue17-longreads.css','utf8');
assert.match(css,/max-width:820px/);assert.match(css,/max-width:560px/);
assert.match(css,/#fff/);assert.doesNotMatch(css,/url\(['"]?https?:/i);
for(const [rel,link] of [['local-history/index.html','/local-history/premier-cafe-cheadle/'],['outdoors/index.html','/outdoors/carr-wood-cheadle-hulme-bramhall/']]){
 assert.ok(fs.readFileSync(rel,'utf8').includes(link),`${rel}: missing story link`);
}
console.log('PASS Issue 17 source-first longreads release preflight');
