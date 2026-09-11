import fs from 'node:fs';

const read = path => fs.readFileSync(path, 'utf8');
const css = read('assets/homepage-v3.css');
const js = read('assets/homepage-nue.js');
const home = read('index.html');
const config = read('assets/config.js');

const failures = [];
const requireText = (source, text, label) => {
  if (!source.includes(text)) failures.push(`${label}: missing ${JSON.stringify(text)}`);
};
const rejectText = (source, text, label) => {
  if (source.includes(text)) failures.push(`${label}: should not contain ${JSON.stringify(text)}`);
};

// Baseline: homepage and current issue remain intact.
requireText(home, 'data-page="home"', 'homepage identity');
requireText(home, 'What’s good<br>around SK8?', 'homepage headline');
requireText(config, 'subscriberCount: "500+"', 'public subscriber proof');
requireText(config, 'number: 12', 'current issue');

// 1. Header hierarchy.
requireText(css, 'a[href="/start/"]', 'desktop header simplification');
requireText(css, 'a[href="/contact/"]', 'desktop header simplification');
requireText(css, '@media(max-width:820px)', 'mobile full-nav restoration');

// 2. Hero hierarchy and trust cluster.
requireText(js, 'Free Friday newsletter · SK8', 'hero eyebrow');
requireText(css, '.home-hero-eyebrow', 'hero eyebrow styling');
requireText(js, 'No spam. Unsubscribe any time.', 'signup reassurance');

// 3. Story-card consistency.
requireText(css, '.reader-story{display:flex;flex-direction:column', 'story card equal-height layout');
requireText(css, '.reader-story-body>.reader-link{margin-top:auto', 'story CTA alignment');

// 4. Explore mobile density.
requireText(css, 'grid-template-columns:repeat(2,minmax(0,1fr))', 'two-column mobile explore');
requireText(css, '@media(max-width:360px){body.reader-home [data-explore-grid]{grid-template-columns:1fr}}', 'narrow-phone fallback');

// 5. Latest issue / guides hierarchy.
requireText(css, '.reader-latest-cover{min-height:172px;transform:none', 'latest issue cover stability');
requireText(js, "guidesHeading.textContent = 'Useful guides'", 'guide shelf relabel');
requireText(js, 'comingLaterGuide.remove()', 'remove unavailable guide');

// 6. Compact lower-page utility area.
requireText(css, '.reader-action{min-height:0', 'compact take-part cards');
requireText(css, '.reader-full-footer{padding-top:24px}', 'lighter footer');

// 7. Performance.
requireText(js, "art.loading = 'lazy'", 'lazy dynamic story imagery');
requireText(js, "img.decoding = 'async'", 'async image decoding');
requireText(css, '@supports(content-visibility:auto)', 'deferred lower-page rendering');

// 8. Stronger conversion proof.
requireText(js, 'local readers</span>', 'reader-count proof');
requireText(js, 'issues published</span>', 'issue-count proof');
requireText(css, 'data-recognised-subscriber="true"', 'subscriber-state microcopy guard');

// 9. Information architecture.
requireText(js, "worthMore.href = '/around-sk8/'", 'weekly-story continuation');
requireText(js, 'Explore more local stories →', 'specific continuation label');

// 10. Accessibility and search semantics.
requireText(css, ':focus-visible', 'keyboard focus');
requireText(css, 'prefers-reduced-motion:reduce', 'reduced motion');
requireText(js, "signup.setAttribute('aria-label', 'Join the free SK8 Scoop newsletter')", 'signup form label');
requireText(js, "'@type': 'WebSite'", 'website JSON-LD');
requireText(js, "'@type': 'Organization'", 'organisation JSON-LD');

// Guard against accidentally reverting the main design choices in this pass.
rejectText(css, 'body.reader-home .reader-explore-tile{min-height:232px', 'old explore height');
rejectText(js, "art.loading = 'eager'", 'old eager dynamic story loading');

if (failures.length) {
  console.error('Homepage V3 preflight failed:');
  failures.forEach(item => console.error(`- ${item}`));
  process.exit(1);
}

console.log('Homepage V3 preflight passed.');
