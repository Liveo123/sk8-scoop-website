# QA — 52 Adventures Landing v2

Branch: `preview/52-adventures-landing-v2`

## Cycle 1 — structure and value
- Rebuilt the hero around one clear conversion job instead of the broken signup/preview stack.
- Kept 52 Adventures as the product title, added a benefit-led hook and clearer practical proposition.
- Added three real, rights-cleared guide photographs from the published guide rather than generic imagery.
- Reframed Finder, Saved, Passport and Surprise Me as reader benefits.
- Added a direct route for existing SK8 Scoop subscribers.
- Reworked the chapter area into a more editorial layout.
- Reduced repeated inline image payloads by defining the three approved images once and reusing them through CSS.

Result: PASS after fixes.

## Cycle 2 — accuracy and experience
- Signup action remains the existing MailerLite form endpoint.
- Successful signup still routes to `/52-adventures/success/`.
- Existing subscribers can go directly to `/52-adventures/guide/`.
- Added standard SK8 attribution fields through the existing site attribution helper without allowing site.js to take over the guide-specific success route.
- Added explicit form-position tracking for hero and final CTA.
- All three photographs retain descriptive accessible labels.
- No SVG reader-facing assets were introduced.
- Primary button treatment uses SK8 teal with white text.
- Mobile breakpoints are present for hero, image shelf, feature band, chapters and final CTA.
- Guides-page card now uses the Marple Aqueduct photograph with a dark readability gradient and mobile crop rules.

Result: PASS after attribution-position correction.

## Cycle 3 — final risk and polish
Static preflight:
- duplicate IDs: 0
- signup forms: 2
- unique email inputs: 2
- direct subscriber guide links: 2
- guide route file present
- success route file present
- SVG references introduced: 0
- embedded guide photographs on landing: 3
- external runtime dependencies introduced: none beyond the existing MailerLite signup endpoint and existing SK8 site assets
- no ChatGPT tracking parameters or temporary URLs in page source
- Guides card uses a rights-cleared, story-relevant photograph rather than a generic image

Remaining release gate:
- production merge/deploy remains owner-approved only.
- browser rendering on the Cloudflare preview should be checked if a preview URL is exposed by the deployment integration; source/static QA alone is not evidence of final live rendering.

Result: READY FOR OWNER REVIEW, not yet authorised for production merge.
