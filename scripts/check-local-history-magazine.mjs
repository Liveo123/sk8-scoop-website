import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = process.cwd();
const html = fs.readFileSync(path.join(root, 'local-history/index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'assets/local-history-magazine.css'), 'utf8');
const read = p => fs.readFileSync(path.join(root,p),'utf8');
const getSection = id => {
  const at = html.indexOf('id="' + id + '"');
  assert.ok(at>=0, 'Missing '+id);
  return html.slice(at,at+25000);
};
assert.ok(html.includes('Local history with the detective work left in.'), 'Original strong opening must remain');
assert.ok(html.includes('Pat Phoenix, Reda’s and Heald Green’s boxing kangaroo'), 'Issue 18 top feature preserved');
assert.ok(html.includes('The extraordinary café upstairs on Cheadle High Street'), 'Premier Café feature preserved');
assert.ok(html.includes('The Heald Green spy and future Dambuster'), 'Heald Green feature preserved');
assert.ok(html.includes('local-history-magazine.css?v=20261024a'), 'New CSS linked after prior styles');
const ids=['history-archive-stories','heyhead-feature','history-then-now','history-visual-gallery','history-visit','air-raid-shelters','52-adventures-heritage','free-cheap-old-town','st-marys-cheadle'];
for(const id of ids)assert.equal((html.match(new RegExp('id="'+id+'"','g'))||[]).length,1,'Unique anchor: '+id);
for(const expected of ['267','1871','1866','1950','1964','22 heritage stops','11th-century cross','Two fatal air raids','Mercury','Historic England'])assert.ok(html.includes(expected),'Missing evidence detail '+expected);
const gallery = getSection('history-visual-gallery').split('</section>')[0];
assert.equal((gallery.match(/class="history-gallery-card/g)||[]).length,6,'Six image-led stories');
assert.equal((gallery.match(/<img /g)||[]).length,6,'Gallery image for each story');
assert.ok(html.includes('not a photograph or accurate reconstruction'), 'Then/now art must be clearly illustrative');
assert.ok(html.includes('not an archival view or reconstruction'), 'Heyhead art must not pose as historical evidence');
assert.ok(html.includes('CC BY-SA 4.0')&&html.includes('CC BY-SA 2.0'),'Required photographic credits');
const newImgSrcs=[...html.matchAll(/<img[^>]+src="([^"]+)"[^>]*>/g)].map(m=>m[1]).filter(src=>src.startsWith('/'));
for(const src of newImgSrcs){const abs=path.join(root,src.slice(1));assert.ok(fs.existsSync(abs),'Missing local image asset '+src);}
for(const url of ['/local-history/gatley-shouter/','/local-history/cheadle-station-cheshire-line-tavern/','/local-history/heald-green-mercury-frog/','/local-history/bramall-hall/','/local-history/stockport-underbanks/','/local-history/heyhead-village-disappeared/','/local-history/cheadle-war-memorial-air-raid-victims/','/local-history/heald-green-north-history-walk/','/local-history/heald-green-lost-place-names/','/local-history/217-finney-lane-the-brew/','/local-history/stockport-air-raid-shelters/','/local-history/stockport-museum/']){
  assert.ok(html.includes('href="'+url+'"'),'Missing story link '+url);
  assert.ok(fs.existsSync(path.join(root,url.slice(1),'index.html')),'Missing linked route '+url);
}
assert.ok(css.includes('@media(max-width:420px)')&&css.includes('@media(max-width:680px)'), 'Phone breakpoints');
assert.ok(css.includes('prefers-reduced-motion'), 'Reduced motion');
assert.ok(css.includes('focus-visible'), 'Keyboard focus');
assert.ok(css.includes('object-fit:cover'), 'Image crop treatment');
assert.ok(css.includes('history-gallery-card--hero'), 'Magazine lead visual treatment');
assert.ok(!html.includes('St. Mary\'s fake'), 'No fabricated St Mary archive');
console.log('PASS Local History magazine: strong original lead intact, unique sections, 6 visual stories, 3 credited local photos, image assets, story links, accessibility and mobile CSS.');
