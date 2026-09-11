import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = p => fs.readFileSync(path.join(root,p),'utf8');
const write = (p,v) => fs.writeFileSync(path.join(root,p),v);
const mustReplace = (text, from, to, label) => {
  if (!text.includes(from)) throw new Error(`Expected text not found: ${label}`);
  return text.replace(from,to);
};

// 1. Promote the core NUE stylesheet from preview naming to production naming.
const legacyCssPath = 'assets/nue-preview.css';
const productionCssPath = 'assets/nue.css';
if (fs.existsSync(path.join(root, legacyCssPath))) {
  let css = read(legacyCssPath)
    .replace('/* Preview-only NUE polish: homepage Explore SK8 + What\'s On + category pages. */','/* Production NUE design system: homepage, What\'s On and category pages. */')
    .replace('/* Global visual QA rule for preview: important artwork is shown whole, never silently cropped. */','/* Global visual QA rule: important artwork is shown whole, never silently cropped. */')
    .replace('/* Keep preview calls to action readable, including the older homepage overrides. */','/* Keep calls to action readable, including older homepage overrides. */');
  write(productionCssPath, css);
}

const walk = dir => fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry => {
  const rel = path.relative(root,path.join(dir,entry.name));
  if (rel.startsWith('.git')) return [];
  if (entry.isDirectory()) return walk(path.join(dir,entry.name));
  return [rel];
});
for (const file of walk(root)) {
  if (!/\.(html|js|css)$/.test(file)) continue;
  if (file === legacyCssPath) continue;
  const before = read(file);
  const after = before.replaceAll('nue-preview.css','nue.css').replaceAll("sk8SecondaryDesign = 'preview'","sk8SecondaryDesign = 'production'");
  if (after !== before) write(file,after);
}
if (fs.existsSync(path.join(root,legacyCssPath))) fs.unlinkSync(path.join(root,legacyCssPath));

// 2. Remove launch-era noindex from public reader destinations that are now explicitly live.
const indexablePages = [
  'whats-on/index.html','food-drink/index.html','kids-family/index.html','outdoors/index.html',
  'local-history/index.html','planning/index.html','updates/index.html','around-sk8/index.html'
];
for (const file of indexablePages) {
  if (!fs.existsSync(path.join(root,file))) continue;
  const before = read(file);
  const after = before
    .replace(/\s*<meta name="robots" content="noindex,follow">/g,'')
    .replace(/\s*<meta name="robots" content="noindex,nofollow">/g,'');
  write(file,after);
}

// 3. Make the homepage first-screen promise more concrete while retaining the distinctive headline.
{
  const file='index.html';
  let html=read(file);
  html=mustReplace(
    html,
    'Free local updates for Cheadle, Cheadle Hulme, Gatley, Heald Green and beyond.',
    'Things to do, useful local updates and money-saving ideas for Cheadle, Cheadle Hulme, Gatley and Heald Green. Free every Friday.',
    'homepage utility promise'
  );
  html=html.replace('<section class="reader-hero reader-hero-photo">','<section class="reader-hero reader-hero-photo" data-experiment="homepage-utility-promise-v1">');
  write(file,html);
}

// 4. Extend the sitemap to the launched reader destinations and refresh the current issue date.
{
  const file='sitemap.xml';
  let xml=read(file).replace('<url><loc>https://www.sk8scoop.com/latest</loc><lastmod>2026-09-04</lastmod></url>','<url><loc>https://www.sk8scoop.com/latest</loc><lastmod>2026-09-11</lastmod></url>');
  const anchor='<url><loc>https://www.sk8scoop.com/guides/</loc></url>';
  const additions=[
    'https://www.sk8scoop.com/whats-on/','https://www.sk8scoop.com/food-drink/','https://www.sk8scoop.com/kids-family/',
    'https://www.sk8scoop.com/outdoors/','https://www.sk8scoop.com/local-history/','https://www.sk8scoop.com/planning/',
    'https://www.sk8scoop.com/updates/','https://www.sk8scoop.com/around-sk8/'
  ].filter(url=>!xml.includes(`<loc>${url}</loc>`)).map(url=>`<url><loc>${url}</loc><lastmod>2026-09-11</lastmod></url>`).join('\n');
  if (additions) xml=mustReplace(xml,anchor,`${anchor}\n${additions}`,'sitemap category anchor');
  write(file,xml);
}

// 5. Add the post-launch NUE tracking and continuation layers to pages that load config.js.
{
  const file='assets/config.js';
  let js=read(file);
  if (!js.includes('data-sk8-nue-layer')) {
    js += `\n\n(() => {\n  ['nue-analytics.js','nue-links.js'].forEach(file => {\n    if (document.querySelector(\`script[data-sk8-nue-layer="\${file}"]\`)) return;\n    const script = document.createElement('script');\n    script.src = \`/assets/\${file}\`;\n    script.defer = true;\n    script.dataset.sk8NueLayer = file;\n    document.head.appendChild(script);\n  });\n})();\n`;
  }
  write(file,js);
}

// 6. Give the advertiser API names that match the current customer-facing TEST/GROW products while keeping old values compatible.
for (const file of ['worker.js','functions/api/advertiser-enquiry.js']) {
  let js=read(file);
  const old="['local_spotlight', 'monthly_partner', 'category_partner', 'bespoke']";
  const oldCompact="['local_spotlight','monthly_partner','category_partner','bespoke']";
  const next="['temp_test', 'temp_grow', 'local_spotlight', 'monthly_partner', 'category_partner', 'bespoke']";
  const nextCompact="['temp_test','temp_grow','local_spotlight','monthly_partner','category_partner','bespoke']";
  if (js.includes(old)) js=js.replace(old,next);
  else if (js.includes(oldCompact)) js=js.replace(oldCompact,nextCompact);
  else if (!js.includes('temp_test')) throw new Error(`Advertiser package allow-list not found in ${file}`);
  write(file,js);
}

console.log('Post-launch NUE migration applied successfully.');
