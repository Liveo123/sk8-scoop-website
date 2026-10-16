# 52 Adventures premium gallery: owner-approved direction, NOT approved launch

**Status:** PREVIEW ONLY. Owner approved treating the five-photo gallery as a **separate premium product** while retaining the existing **£28 standard Guide advert**. Owner did **not** approve a new premium price, publishing, live payments, deployment or outbound send. Do not conflate this prototype with inventory offered for sale.

## Product / editorial contract
- Standard Guide card **£28** for 30 days remains unchanged and must remain independently available as approved.
- **Suggested launch experiment: £39 per 30-day premium gallery**, proposed, not authorised. This is an £11 premium over the standard Guide ad, intended as a low-risk pricing hypothesis for a young product with light measured full-guide reach. If actual build/management time exceeds 30 minutes, revisit price. No claims of a published price until approved and synchronized.
- Premium product: one separate, up-front **ADVERTISEMENT** block in the 52 Adventures home view, one paid slot maximum, 2–5 approved operator photographs (target five), useful practical details, one booking/enquiry CTA, tracking, and advertiser approval. This is **in addition** to, not a rewrite of, the original editorial listing. Do not sell improved editorial ranking, placement within the editorial eight picks, or other organic advantage.
- One paid placement only for this MVP, duration 30 days inclusive; monthly reach and measurable link clicks reported without minimum guarantees or identifying reader data. Operator supplies correct information, usage rights and approval; SK8 checks, edits and publishes; no automatic renewal.
- Labels and border distinguish paid material; write *ADVERTISEMENT* at top. <https://www.asa.org.uk/advice-online/recognising-ads-advertisement-features.html>.
- Use visually labelled thumbnails, arrows and accessible image descriptions. <https://baymard.com/research-articles/always-use-thumbnails-additional-images>.
- Ad content must not make the fictional preview seem like a real promoted venue; do not use generated illustrations as documentary evidence.

## Implementation on this branch
- Built on `52-adventures-availability-v2`, the unmerged guide refresh (PR #172). This PR must target that branch rather than `main` to avoid bundling unfinished unrelated work.
- `52-adventures/guide/index.html`: a new **hidden**, standalone section after quick routes and before editorial picks. Existing 52 entries, finder data and editorial recommendations unchanged.
- `assets/52-adventures-premium-gallery.css`: independent responsive styles, high-contrast ad header, keyboard focus, no forced oversized white panels.
- `assets/52-adventures-premium-config.js`: all required activation flags default `false`; no current advertiser.
- `assets/52-adventures-premium-gallery.js`: checks owner approval, artwork and rights approval, valid dates, essential business fields, verified HTTPS link and 2–5 images with alt and rights basis. Uses DOM text assignments; does not interpolate untrusted content to `innerHTML`. No ad is rendered unless every gate passes; editorial remains fully usable.
- Tracks `guide_advertiser_render`, `guide_advertiser_gallery` and `guide_advertiser_click` via the existing consent-aware `window.sk8Track`. Count renders as render attempts, not guaranteed viewability. Impression counts would need additional IntersectionObserver once a real test begins. Clicks do not equal sales.
- Original guide tracking remains separate from paid performance: don't count ordinary editorial entry opens or internal guide navigation as sponsor results.

## Blockers before any real booking
1. Owner explicitly approves an exact premium price, 30-day period, single-slot inventory, creative scope and location.
2. Production deployment/visual design of the underlying PR #172 passes Paul's review and release gate. Rebase after PR #172 merges and rerun QA.
3. Verify operational checkout/product identifiers, VAT/tax status, booking form, invoice and confirmation against approved price; don't modify payments until authorisation.
4. Reconfirm advertiser's exact operator, contact legality, complete inbox/CRM history, objections and actual current campaign fit. Don't send held prospect drafts.
5. Collect written advertiser creative approval; establish image reuse rights (including generated imagery disclosure where applicable) and a booking URL; fill a campaign record and expiry date.
6. Verify real deployment and browser interactions on phones/desktop including assistive and reduced-motion modes. Check images, links, copy, labels and events after deployment.
7. Obtain owner approval for the exact campaign and publication, then confirm slots and schedule. Never trigger from configuration edits alone.

## Measurement / pricing review
Guide Performance worksheet: 8–14 October full-guide active users **10**, guide_view events **36**, listing_open events **8** (not necessarily unique people). These data are early and do not establish readership of any specific sponsored slot. Small sample and current inventory uncertainty mean pricing is a **test hypothesis**, not market-validated.

Proposed review after three compliant paid placements or 60 days, whichever is later: total paid GBP, editorial impact complaints, guide traffic, sponsored clicks/CTR if actual viewable impressions are measured, business-confirmed leads/bookings where voluntarily provided, renewal, production minutes. Do not attribute page visits or organic editorial clicks to paid ads.
