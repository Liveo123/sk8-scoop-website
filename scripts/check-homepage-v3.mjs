import fs from 'node:fs';

const read = path => fs.readFileSync(path, 'utf8');
const css = read('assets/homepage-v3.css');
const v4 = read('assets/homepage-v4.css');
const v5 = read('assets/homepage-v5.css');
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
requireText(home, 'What’s good around SK8?', 'homepage headline');
requireText(config, 'subscriberCount: "500+"', 'public subscriber proof');
requireText(config, 'number: 12', 'current issue');
requireText(home, 'assets/homepage-v4.css', 'homepage V4 stylesheet');

// 1. Homepage desktop header exposes the same full menu as the rest of the site.
requireText(home, 'href="start/">Where to start</a>', 'homepage Where to start navigation');
requireText(home, 'href="join/">Join</a>', 'homepage Join navigation');
requireText(home, 'href="submit/">Submit</a>', 'homepage Submit navigation');
requireText(home, 'href="contact/">Contact</a>', 'homepage Contact navigation');
requireText(v5, '@media(min-width:821px)', 'desktop full-nav restoration');
requireText(v5, 'a[href="/start/"]', 'desktop Where to start visibility');
requireText(v5, 'a[href="/submit/"]', 'desktop Submit visibility');
requireText(v5, 'a[href="/contact/"]', 'desktop Contact visibility');
requireText(v5, 'display:inline-flex!important', 'desktop full-nav visibility override');

// 2. Hero hierarchy and trust cluster.
requireText(js, 'Free Friday newsletter · SK8', 'hero eyebrow');
requireText(css, '.home-hero-eyebrow', 'hero eyebrow styling');
requireText(js, 'No spam. Unsubscribe any time.', 'signup reassurance');
requireText(home, 'home-hero-subroutes', 'hero utility routes');
requireText(home, 'What’s On now →', 'hero What’s On route');
requireText(home, 'Around SK8 →', 'hero Around SK8 route');
requireText(v5, '.home-signup-note{margin:5px 0 7px!important', 'tight signup reassurance spacing');
requireText(v5, '.reader-proof{margin-top:0!important', 'tight proof spacing');

// 3. Weekly picks have a proper editorial introduction.
requireText(home, 'Know · Do · Discover', 'weekly-picks editorial framing');
requireText(home, 'Three different reasons to click', 'weekly-picks explanation');
requireText(v4, '.home-worth-head', 'weekly-picks heading layout');

// 4. Story cards are visually consistent and CTA-aligned.
requireText(css, '.reader-story{display:flex;flex-direction:column', 'story card equal-height layout');
requireText(css, '.reader-story-body>.reader-link{margin-top:auto', 'story CTA alignment');
requireText(v4, '.reader-worth .reader-meta', 'story meta treatment');
requireText(v4, 'height:224px!important', 'matched story visual height');

// 5. Explore is a deliberate 4 x 2 desktop grid with mobile fallbacks and no generic icon fallback.
requireText(v4, 'grid-template-columns:repeat(4,minmax(0,1fr))!important', 'four-column desktop explore');
requireText(v4, 'grid-template-columns:repeat(2,minmax(0,1fr))!important', 'two-column mobile explore');
requireText(v4, '@media(max-width:420px)', 'narrow-phone fallback');
requireText(js, 'reader-explore-editorial-fallback', 'editorial Explore fallback');
rejectText(js, 'const iconSvg =', 'generic Explore SVG fallback helper');
rejectText(js, 'reader-explore-icon', 'generic Explore icon fallback class');

// 6. Latest issue and guides are one balanced resource shelf.
requireText(home, 'home-resource-grid', 'resource shelf');
requireText(home, 'Three useful next stops', 'resource shelf heading');
requireText(home, 'Free &amp; Cheap Guide', 'Free & Cheap resource');
requireText(home, 'Summer Guide', 'Summer Guide resource');
requireText(v4, '.home-resource-grid', 'resource grid styling');
requireText(v5, '.home-resource-visual.is-contain img', 'resource artwork breathing room');

// 7. Take-part area avoids duplicating the primary signup CTA.
requireText(home, 'Useful ways to get involved', 'take-part heading');
rejectText(home, '<h3>Join</h3><p>Get the useful local bits', 'duplicate lower-page Join card');
requireText(v4, '.reader-actions-strip{grid-template-columns:repeat(3', 'three-column take-part layout');
requireText(v5, '.reader-action{display:grid!important', 'take-part card alignment');

// 8. Performance and external-image connection setup.
requireText(js, "art.loading = 'lazy'", 'lazy dynamic story imagery');
requireText(js, "img.decoding = 'async'", 'async image decoding');
requireText(css, '@supports(content-visibility:auto)', 'deferred lower-page rendering');
requireText(home, 'rel="preconnect" href="https://res.cloudinary.com"', 'Cloudinary preconnect');
requireText(home, 'rel="preconnect" href="https://storage.mlcdn.com"', 'MailerLite storage preconnect');

// 9. Stronger conversion proof, preview safety and progressive continuation.
requireText(js, 'local readers</span>', 'reader-count proof');
requireText(js, 'issues published</span>', 'issue-count proof');
requireText(css, 'data-recognised-subscriber="true"', 'subscriber-state microcopy guard');
requireText(js, "worthMore.href = '/around-sk8/'", 'weekly-story continuation');
requireText(js, 'Explore more local stories →', 'specific continuation label');
requireText(js, 'normalisePreviewFooterSignup', 'preview footer challenge fallback');
requireText(js, "footerSignup.dataset.previewSignup = 'true'", 'preview footer state marker');
requireText(v5, 'data-preview-signup="true"', 'preview footer CTA styling');
requireText(js, '/assets/homepage-v5.css', 'V5 finishing stylesheet injection');

// 10. Accessibility and search semantics remain intact.
requireText(css, ':focus-visible', 'keyboard focus');
requireText(css, 'prefers-reduced-motion:reduce', 'reduced motion');
requireText(js, "signup.setAttribute('aria-label', 'Join the free SK8 Scoop newsletter')", 'signup form label');
requireText(js, "'@type': 'WebSite'", 'website JSON-LD');
requireText(js, "'@type': 'Organization'", 'organisation JSON-LD');

// Guard against reverting older layouts.
rejectText(css, 'body.reader-home .reader-explore-tile{min-height:232px', 'old explore height');
rejectText(js, "art.loading = 'eager'", 'old eager dynamic story loading');
rejectText(home, 'COMING LATER', 'unavailable guide card');

if (failures.length) {
  console.error('Homepage V5 preflight failed:');
  failures.forEach(item => console.error(`- ${item}`));
  process.exit(1);
}

console.log('Homepage V5 preflight passed.');
