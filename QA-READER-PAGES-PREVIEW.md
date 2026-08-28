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
- Cloudflare Email Service is optional in code until the account/domain binding is deliberately configured;
- the inactive What's On route is not promoted in the new primary navigation.

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
- retained the verified Issue 10 story copy already used in the preview instead of the mock-up's invented examples;
- used only imagery already present in the current repository for this preview pass, introducing no new external image dependency;
- made all six not-yet-live Explore destinations non-clickable and visibly labelled `Coming later`;
- kept the real repository SK8 Scoop logo and existing Summer Guide artwork;
- retained white button text on teal and used orange only as selective emphasis;
- added responsive breakpoints for the image hero, story cards, six Explore tiles, guide shelf, action strip and multi-column footer.

Caveat:
- the existing repository images used on the story cards are temporary visual stand-ins for layout review, not evidence that they depict those specific Issue 10 stories. Before production approval, story-specific imagery must either have an appropriate rights/accuracy basis or be replaced by neutral labelled illustration.

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
- the branch remains the sole location for the visual experiment pending actual desktop/mobile preview review.

## Safe preview rebuild - 28 August 2026

Cloudflare build settings were manually confirmed with production branch `main`, non-production branch builds enabled, deploy command `npx wrangler deploy`, and version command corrected to `npx wrangler versions upload`. Preview-branch commits therefore trigger version uploads rather than production promotion.

Open blockers before production approval:
1. Review the newly rebuilt branch preview against the approved mock-up on desktop and mobile.
2. Replace or explicitly approve the temporary story-card imagery with story-appropriate rights-cleared imagery/neutral illustration.
3. Apply the two new D1 tables through the controlled migration process.
4. Onboard/verify Cloudflare Email Service for the intended sender and destination, then add the `CONTACT_EMAIL` binding.
5. Run live preview submissions for both new forms and confirm D1 + inbox delivery.
6. Verify the Issue 10 `/latest` website content and homepage story details are still current immediately before publishing.
7. Decide whether to roll the new navigation across the older permanent pages in the same release or a separate follow-up, to avoid mixed navigation after launch.

No production merge or deployment is authorised by this QA record.
