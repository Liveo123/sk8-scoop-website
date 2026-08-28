# Reader pages preview QA

Branch: `preview/homepage-reader-pages-v1`
Status: PREVIEW ONLY - do not merge or deploy to production until the listed blockers are cleared.

## Cycle 1 - structure and reader value

Checked:
- homepage remains newsletter-first rather than becoming a second weekly publication;
- dedicated Join, Where to Start, Submit and Contact routes have distinct jobs;
- Submit separates lightweight reader responses from the existing detailed event/business forms;
- homepage maintenance is limited to a small current-story area rather than a large live portal.

Fixes made:
- kept the new structure compact;
- reused MailerLite for subscription rather than creating a second subscriber system.

## Cycle 2 - accuracy and reader experience

Checked:
- current `data-api-form` browser code serialises the new forms to JSON and handles success/error responses;
- reader and contact inputs have server-side allowed-value checks, email validation, length limits and consent checks;
- optional reader links must begin with http:// or https://;
- both public forms include a simple honeypot field;
- new D1 records are saved before any email notification attempt;
- privacy notice now describes reader/contact submissions.

Fixes made:
- added `reader_submissions` and `contact_messages` to canonical `schema.sql`;
- added isolated Worker handlers for `/api/reader-submission` and `/api/contact-message`;
- added notification status tracking so email failure does not erase a saved message;
- added canonical URLs and navigation/accessibility attributes to the new form pages.

## Cycle 3 - risk and polish

Checked:
- `main` is untouched;
- existing API routes still depend only on the established D1 tables;
- the two new handlers check their own new tables, so a missed migration cannot take down existing forms;
- no API key, password or email-service secret is committed;
- Cloudflare Email Service is optional in code until the account/domain binding is deliberately configured.

## Visual implementation pass - 28 August 2026

The approved visual mock-up was translated into the preview branch without copying its invented event content.

### Visual Cycle 1 - structure and value

Criticism:
- the first coded preview was too stripped back compared with the approved mock-up;
- the hero lacked the image-led impact of the mock-up;
- Explore, Latest Scoop, guide cards, action strip and footer were materially simpler than the agreed design.

Fixes made:
- changed the hero to an image-led composition with overlaid headline, signup and three proof points;
- rebuilt the weekly highlights as three equal visual cards;
- expanded Explore to six mock-up-style tiles while marking unfinished sections `Coming later` rather than presenting them as live;
- rebuilt the middle shelf as Latest Scoop plus three guide cards;
- changed the four reader actions into a single horizontal action strip;
- expanded the footer into the fuller multi-column layout shown in the approved direction.

### Visual Cycle 2 - accuracy and experience

Criticism:
- the mock-up used illustrative/generated imagery and example content that must not silently become factual production material;
- inactive routes could mislead readers if presented as working destinations;
- mobile density could become excessive once six Explore tiles and three guides were added.

Fixes made:
- retained the Issue 10 story copy already approved for this preview instead of restoring the mock-up's older/example editorial content;
- made all six not-yet-live Explore destinations non-clickable and visibly labelled `Coming later`;
- kept the real repository SK8 Scoop logo;
- retained white button text and used teal/orange in the approved hierarchy;
- added responsive breakpoints for the image hero, story cards, six Explore tiles, guide shelf, action strip and multi-column footer.

### Visual Cycle 3 - final risk and polish

Criticism:
- the visual match needed to be materially closer without creating new maintenance burden or bypassing the production approval gate;
- adding six Explore categories risked making the site look more complete than it is;
- the redesign must remain reversible and isolated from live production.

Result/fixes:
- only the three weekly highlight cards remain the significant recurring homepage editorial maintenance area;
- unfinished Explore sections are present as visual roadmap tiles, not active links;
- newsletter signup still uses the existing MailerLite integration;
- no D1 migration, email binding, merge to `main`, traffic promotion or production deployment was authorised;
- the branch remains the sole location for the visual experiment pending desktop/mobile preview approval.

## Mock-up fidelity pass 2 - 28 August 2026

### Cycle 1 - structure and value

Criticism:
- the rendered preview still differed visibly from the approved mock-up in hero crop, card imagery, guide imagery, vertical rhythm and footer treatment;
- the missing `What's On` label made the header silhouette materially different from the approved reference.

Fixes made:
- extracted the exact visual crops from the approved mock-up for the hero, three weekly cards and three guide cards and added them as preview-only SVG assets;
- tightened header, hero, card, Explore, shelf and action-strip dimensions to follow the mock-up more closely;
- added a non-clickable `What's On` navigation label so the header matches the visual reference without falsely activating the unfinished route.

### Cycle 2 - accuracy and experience

Criticism:
- matching the mock-up imagery exactly creates a risk that generated/reference artwork could be mistaken for real photographs of the Issue 10 stories;
- the previous cream footer inherited white link text from the older dark-footer CSS and had poor legibility;
- the mock-up's older editorial examples must not overwrite current Issue 10 copy merely for visual fidelity.

Fixes made:
- retained current Issue 10 headlines, dates, locations and descriptions while changing only the visual artwork;
- added a screen-reader preview note and descriptive `Preview illustration` alt text to the guide artwork;
- recorded the hero/story mock-up crops as preview/generated artwork rather than verified documentary photographs;
- explicitly overrode footer text and links to dark readable colours on the cream background;
- changed the hero and footer signup buttons to orange to match the approved mock-up while keeping the four action-strip buttons teal.

### Cycle 3 - final risk and polish

Criticism:
- exact mock-up crops improve design review but are not automatically suitable for production use under SK8 image-rights and accuracy rules;
- the design must still collapse cleanly on mobile and remain reversible.

Result/fixes:
- a dedicated `assets/mockup-fidelity.css` override isolates this alignment pass and can be removed cleanly;
- desktop spacing is closer to the reference and mobile overrides remain in place;
- mock-up-derived hero/story/guide assets are explicitly preview-only until replaced with rights-cleared real local images or deliberately approved/labelled illustration;
- no merge to `main` or production traffic change has been made.

## Site-wide public-page design pass - 28 August 2026

The approved homepage is now treated as the master visual system for reader-facing pages. The aim is consistency without cloning every page into the same layout.

### Cycle 1 - structure and value

Criticism:
- the site had several generations of templates, so moving away from the homepage made the brand feel less coherent;
- reader tasks such as joining, choosing where to start, submitting information and contacting SK8 Scoop were visually flatter than the homepage;
- dense forms and archive/policy pages looked more like functional system pages than parts of a local publication.

Fixes made:
- rebuilt Join, Where to Start, Submit and Contact around a clearer task-first hierarchy;
- expanded Where to Start into six direct reader jobs rather than organisational categories;
- added a shared secondary-page design layer covering About, Archive, Latest Issue, Summer Guide, Advertise, detailed submission forms, Preferences, policies and the Site Map;
- gave each page family a distinct role: editorial storytelling for About, publication hierarchy for Archive/Latest, brighter controlled expression for Summer Guide, calm outcome-led presentation for Advertise, and staged readability for forms;
- kept admin and payment interfaces outside this cosmetic redesign so public-value work does not displace operational reliability.

### Cycle 2 - accuracy and experience

Criticism:
- old navigation differed between page generations;
- some utility/policy pages did not expose a `data-page` identity for styling;
- the inactive What's On page contained a stale hard-coded issue reference;
- the repository still contains dated Issue 8 website configuration and older commercial figures that must not be silently presented as current just because the design is newer.

Fixes made:
- added a preview-only public-page loader that applies the shared visual system only to known public routes;
- unified public navigation to Home, Guides, Where to start, Join, Submit, Contact and the Join free CTA;
- derived missing page identities for Privacy, Terms, Editorial Policy and Site Map without changing their substantive policy wording;
- rewrote the inactive What's On holding page to remove the stale issue number while keeping it `noindex` and clearly not live;
- preserved existing form endpoints, validation fields, consent controls and tracking hooks;
- did not manufacture a new Issue 10 MailerLite URL or overwrite advertiser pricing without an authoritative current source.

### Cycle 3 - final risk and polish

Criticism:
- a site-wide CSS change could accidentally affect admin/payment interfaces;
- the redesign needs to remain reversible while the user compares pages in Cloudflare preview;
- the visual refresh could obscure unresolved content-freshness problems.

Result/fixes:
- shared CSS is injected only for an explicit allow-list of public routes; admin and payment routes are excluded;
- public navigation replacement is also limited to that allow-list;
- the design is split into `secondary-pages.css` and `secondary-extras.css`, making rollback straightforward;
- the Issue 8/Issue 10 configuration mismatch, dated public statistics and advertiser-pricing freshness remain explicit blockers rather than being hidden by design polish;
- production remains untouched.

## Guide image + £20 advertiser refinement - 28 August 2026

### Cycle 1 - structure and value

Criticism:
- the 50 Secrets card showed an empty image area in the rendered preview;
- the first-advert summary looked like a small dashboard dropped into an otherwise editorial page;
- its small type weakened the £20 test rather than making the offer easier to understand.

Fixes made:
- changed the 50 Secrets artwork from a CSS background into a real `<img>` element with descriptive alt text and a dark fallback background;
- kept the artwork cropped by the card itself so it fills the available landscape area cleanly;
- replaced the compact advertiser metric panel with a calmer offer card integrated into the hero;
- reduced hero headline wrapping and increased the size of the price, feature headings and supporting copy.

### Cycle 2 - accuracy and experience

Criticism:
- the £20 test must reflect the current user-approved pilot rather than the older £35/£79/£129 package structure;
- performance reporting must demonstrate value without manufacturing campaign data;
- paid visibility must remain clearly separate from editorial judgement.

Fixes made:
- retained the user-approved current £20 first-advert test as the only upfront pilot offer on this preview;
- kept one labelled advert, one main reader action, tracked response where practical and a post-campaign report;
- rebuilt the partial report example with bracketed placeholders clearly labelled as format only;
- retained explicit wording that advertising does not buy favourable editorial coverage or guarantee sales.

### Cycle 3 - final risk and polish

Checked/fixed:
- main navigation includes Advertise alongside the requested reader pages;
- the advertiser hero and report example have desktop and mobile-specific layout rules;
- the Secrets image container has a visible fallback instead of failing to a blank white panel;
- the sharper family image remains on the Cheap & Free card;
- `main` remains untouched and the work stays on the preview branch.

## Safe preview rebuild - 28 August 2026

Cloudflare build settings were manually confirmed with production branch `main`, non-production branch builds enabled, deploy command `npx wrangler deploy`, and version command corrected to `npx wrangler versions upload`. Preview-branch commits therefore trigger version uploads rather than production promotion.

Open blockers before production approval:
1. Review the refreshed homepage and secondary public pages on desktop and mobile.
2. Replace or explicitly approve the mock-up-derived hero/story/guide artwork with story-appropriate rights-cleared imagery or clearly labelled illustration.
3. Resolve the website freshness mismatch: the homepage preview uses Issue 10 while `assets/config.js` and `/latest` still contain Issue 8 website data until a verified Issue 10 public destination is available.
4. Re-verify public subscriber/performance statistics before publication.
5. Apply the two new D1 tables through the controlled migration process.
6. Onboard/verify Cloudflare Email Service for the intended sender and destination, then add the `CONTACT_EMAIL` binding.
7. Run live preview submissions for both new forms and confirm D1 + inbox delivery.
8. Replace the preview-time dynamic stylesheet/navigation loader with static page references if the design is approved for production, to avoid a flash of the older styling on slower connections.

No production merge or deployment is authorised by this QA record.
