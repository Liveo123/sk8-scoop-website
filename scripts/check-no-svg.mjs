import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SKIP_DIRS = new Set(['.git','node_modules','.wrangler','.cache']);
const TEXT_EXTS = new Set(['.html','.css','.js','.mjs','.json','.xml','.md','.yml','.yaml']);
const svgFiles = [];
const svgRefs = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    const rel = path.relative(ROOT, full).replaceAll('\\','/');
    if (entry.isDirectory()) {
      walk(full);
      continue;
    }
    if (rel.toLowerCase().endsWith('.svg')) svgFiles.push(rel);
    if (rel === 'scripts/check-no-svg.mjs') continue;
    const ext = path.extname(entry.name).toLowerCase();
    if (!TEXT_EXTS.has(ext)) continue;
    const text = fs.readFileSync(full, 'utf8');
    const lines = text.split(/\r?\n/);
    lines.forEach((line, index) => {
      if (/\.svg(?:[?#"'')\s]|$)/i.test(line)) {
        svgRefs.push(`${rel}:${index + 1}: ${line.trim().slice(0,220)}`);
      }
    });
  }
}

walk(ROOT);

if (svgFiles.length || svgRefs.length) {
  console.error('Reader-facing SVG ban failed.');
  if (svgFiles.length) {
    console.error('\nSVG files still present:');
    svgFiles.forEach(x => console.error(' - ' + x));
  }
  if (svgRefs.length) {
    console.error('\nSVG references still present:');
    svgRefs.forEach(x => console.error(' - ' + x));
  }
  console.error('\nSK8 Scoop rule: no SVG visual assets in website, newsletter or guide production. Use approved raster assets (WebP/PNG/JPG) or HTML/CSS for functional UI.');
  process.exit(1);
}
console.log('OK: no SVG files or SVG references found.');
