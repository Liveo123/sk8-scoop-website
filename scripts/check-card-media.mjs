import fs from 'node:fs';

const read = path => fs.readFileSync(path, 'utf8');
const home = read('index.html');
const nue = read('assets/nue.css');
const whatsOn = read('assets/whats-on.js');
const guidesCss = read('assets/guides-v3.css');

const fail = message => {
  console.error('CARD MEDIA QA FAILED:', message);
  process.exitCode = 1;
};

const dicmTags = [...home.matchAll(/<div class="([^"]*\bdicm-visual\b[^"]*)"/g)].map(match => match[1]);
for (const classes of dicmTags) {
  if (!/\bmedia-(landscape|poster)\b/.test(classes)) {
    fail(`Homepage DICM is missing an explicit media-fit class: ${classes}`);
  }
}

if (home.includes('home-resource-visual is-contain')) {
  fail('Homepage resource cards must not use the old large contain-only media treatment.');
}
if (home.includes('is-guide-logo')) {
  fail('Homepage Explore cards must not float a small guide logo inside a large blank media box.');
}
if (!nue.includes('.dicm-visual.media-poster')) {
  fail('Portrait-poster treatment is missing from the NUE media system.');
}
if (/\.reader-explore-photo\{[^}]*background-size:contain/.test(nue)) {
  fail('Explore thumbnails should use purpose-built fill imagery, not generic contain letterboxing.');
}
if (!whatsOn.includes("free: '/assets/images/cheap-free-guide-illustration.svg'")) {
  fail('What’s On free filter should use the landscape guide illustration rather than a floating logo.');
}
if (guidesCss.includes('min-height:225px!important')) {
  fail('Available guide cards have regressed to the oversized empty media panel.');
}

if (!process.exitCode) console.log('Card media contract OK');
