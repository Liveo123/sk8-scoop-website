# NUE + Free & Cheap Guide integration

Status: preview implementation and generated-guide rebuild completed on `preview/homepage-nue-v1` on 17 September 2026. Do not merge or publish without Paul’s explicit approval.

## Purpose

Make the Free & Cheap Guide a first-class part of the NUE experience, while reusing the guide’s strongest decision-making patterns across NUE without creating duplicate sources of truth.

## Locked principles

1. The approved Free & Cheap Guide remains the authoritative reader-facing evergreen guide. NUE routes into it; it does not silently rewrite the guide.
2. NUE category pages may surface selected guide entries as excerpts, but the source facts remain tied to the guide/source record and must be rechecked when reused.
3. Dated events belong in the maintained What’s On flow. Guide research can feed event candidates into What’s On, but expired dated listings must not become permanent guide content.
4. Recognised SK8 Scoop subscribers should not be asked for their email again to access the guide. New visitors can enter through the guide acquisition journey.
5. Commercial opportunity never changes editorial inclusion or ordering.

## Shared reader taxonomy

Use these concepts consistently where useful:

- Cost: FREE, UNDER £5, UNDER £10, group/session price, watch the extras.
- Geography: SK8 first, OUTSIDE SK8, WORTH THE TRIP.
- Weather: RAINY DAY / indoor, outdoor / fresh air.
- Audience: FAMILY PICK, TEEN PICK, adults, SEND-INFORMED where specifically evidenced.
- Access: ACCESS INFO only when verified.
- Time: Quick visit, half-day, regular activity, dated event.
- Pairing: Pair it with / small day-out plan.
- Practical caveats: parking, equipment, booking, food, optional extras and restrictions that materially change the outing.

These are decision aids, not decorative badges. Do not create a badge for every possible attribute.

## NUE → Guide

- Homepage Explore keeps Free & Cheap as a primary destination.
- The homepage description communicates the guide’s actual value: genuine £0/low-cost ideas with hidden extras flagged.
- Recognised subscribers go directly to `/free-cheap-guide/guide/` from subscriber-aware NUE CTAs.
- Kids & Family, Outdoors and Local History can surface selected guide examples from the shared Free & Cheap dataset while preserving their own editorial purpose.
- What’s On remains the route for dated events.

## Guide → NUE

- The guide landing page uses the same recognised-subscriber state as NUE.
- Recognised readers bypass acquisition forms and get direct full-guide access plus a What’s On route.
- New guide signups use the existing MailerLite Free & Cheap Guide form and delivery journey.
- “Choose by mood” is functional navigation into relevant guide sections.
- “What’s on now” routes to the maintained NUE What’s On experience instead of encouraging duplicated dated listings.
- The editable Guide source fragments and the rebuilt generated Guide no longer carry the dated September/October event block. They point readers to `/whats-on/` instead.

## Shared data layer — proof of concept

`/data/free-cheap.json` is the first structured shared source. It is intentionally small while the model is proven.

Current verified proof records checked 17 September 2026:

- Abney Hall Park
- Bruntwood Park
- Hat Works
- Gatley Carrs
- Stockport Museum

The Kids & Family page hydrates matching evergreen cards from this data. The Outdoors page hydrates the Gatley Carrs access card from the same record. Local History uses the Hat Works and Stockport Museum records to offer current free-entry history outings without copying their facts into a new mini-database. Existing HTML remains as a fallback where the original card already exists if the JSON cannot be loaded.

Records may include a short `card_detail` for compact NUE surfaces alongside fuller `cost_text` and `caveats`; the short display field must not replace the fuller factual record.

Do not interpret this file as the complete Guide inventory yet.

## Target data architecture

When the next substantive guide refresh is approved, expand the shared dataset to contain at minimum:

- stable item ID
- title
- area and postcode where useful
- category
- cost band and exact current price text
- compact display detail where needed
- audience tags
- indoor/outdoor/weather tags
- duration/visit type
- access/SEND evidence fields
- extras/caveats
- official source URL and source type
- checked date
- verification/publication state
- guide anchor
- related NUE surfaces

The goal is one maintained factual record feeding several reader experiences, not several copied mini-databases.

## Generated-guide rebuild — completed for preview

The previous GitHub `free-cheap-guide/guide/index.html` was older than the current approved Guide build. Its last Guide-content update predated the Drive file `SK8 Scoop Free & Cheap Guide - Publish Ready 12 September 2026.html`.

For the 17 September preview rebuild:

1. Use the 12 September publish-ready Drive HTML as the approved generated base.
2. Replace the volatile dated-event section with the corrected permanent `What’s On Now` handoff represented in `parts/part-05.html` and `parts/part-06.html`.
3. Preserve the existing approved visual system, embedded assets, analytics include and evergreen Guide content.
4. Validate the rebuilt bytes before importing them into the preview branch.

Rebuilt evidence copy in Drive:

- `SK8 Scoop Free & Cheap Guide - NUE Preview Rebuilt 17 September 2026.html`
- Drive file ID: `12GeoRRa4jBRuwvCIJdI96ktqatsqgyvB`
- Size: 22,683,675 bytes
- SHA-256: `5f27c0702101dd6d50d9499a8c8877bd3169753d965010d4f3526054481cd74f`

Preview GitHub artefact:

- `free-cheap-guide/guide/index.html`
- Git blob: `9d9825db13b753cf20a47e16f373b80dc34651d2`
- Rebuild commit: `2f37143b7264de818e8a4b239f596cb19f7db171`

A temporary one-shot transfer workflow was used only to bridge the large verified file into GitHub and was then removed. It is not part of the permanent operating system.

## Guide → What’s On handoff — completed for preview

The 12 September Guide build contained a useful dated-event window. Removing that window from the permanent Guide without carrying forward still-future items would have lost reader value, so the valid future items were re-verified on 17 September and handed into `/data/events.json`.

Current verified handoff additions:

- Hatting Bites for Heritage Open Days — 19 September — Stockport Council.
- Here We Are: Stockroom × Manchester Camerata — 19 September — Manchester Camerata.
- Sharing a Shell with Manchester Camerata — 20 September — Manchester Museum.
- Friday Club Disco — 25 September — Stockport Council.
- Arc Saturday Art Club — 26 September — Arc.
- Stockroom Soundsystem: Fittings, Drivers and Amplifiers — 3 October — Stockroom.

Expired event rows were removed from the preview event dataset. Existing future NUE rows were retained. `whats-on.js` already removes past dates at render time and supports All, This Weekend, Free and Family views, so these handoff items immediately use the established NUE event experience rather than creating a Guide-specific calendar.

The stale Bramhall Wellness Day homepage card dated 12 September was also replaced in `/data/homepage.json` with the current verified 19 September Stockroom/Manchester Camerata pick. This prevents the homepage from advertising a finished event while What’s On is current.

## Rebuild QA — 17 September 2026

### Cycle 1 — structure and value

PASS after corrections.

- 54 IDs, all unique.
- 73 internal anchor links checked; zero missing targets.
- Required NUE shortcut anchors present: `contents`, `things-anytime`, `museums-heritage`, `day-out-plans`, `more-ways-to-choose`, `walks-nature`, `whats-on-now`, `how-guide-works`.
- The Guide now keeps evergreen value in the permanent asset and sends dated discovery to What’s On.

### Cycle 2 — accuracy and experience

PASS at source/route level after the event-handoff correction.

- Rebuild used the newer 12 September approved Drive artefact rather than the stale 9 September GitHub copy.
- Old volatile markers such as the 13 September–12 October event window and dated event cards are absent from the rebuilt Guide bytes.
- `/whats-on/` is present as the dated-event destination in both the replacement section and the permanent footer explanation.
- Still-future Guide events were not discarded: six were re-verified against current organiser sources and moved into NUE What’s On.
- The expired 12 September homepage event was replaced by a current 19 September pick.
- Guide landing subscriber recognition, direct recognised-reader access, new-reader MailerLite acquisition and success redirect remain separated as designed.
- The five shared evergreen proof records remain tied to their checked sources and are not treated as the complete Guide inventory.

### Cycle 3 — final risk and polish

PASS for source integrity and preview deploy readiness; manual visual sign-off remains an owner approval step rather than hidden evidence.

- The exact 22,683,675-byte rebuild was checksum-validated before GitHub commit.
- The large-file rebuild import itself changed the generated Guide artefact only; the temporary transfer workflow was then removed.
- Subsequent preview-only changes are the intentional event handoff, homepage stale-event correction and this implementation record.
- No dated event markers tested in QA remain in the generated Guide.
- Existing approved CSS/classes and embedded visual assets were preserved; the Guide change does not redesign the approved build.
- Automated screenshot rendering was not available reliably in the execution environment, so no claim of browser visual proof is made. Before production merge, open the preview on desktop and mobile and visually check the replacement `What’s On Now` section, footer, homepage current-event card and one long-scroll transition.

## Signup implementation note

The Guide landing page is deliberately excluded from the branch’s generic `signup-protection.js` path for this preview integration because that script currently expects `/api/signup-config` and `/api/newsletter-signup`, while the canonical Worker in this branch does not expose those routes. The Guide therefore uses its existing MailerLite form endpoint and its existing delivery automation, with successful Guide signups redirected to `/free-cheap-guide/success/`.

This is an isolated Guide-path decision for the preview. It does not alter protection behaviour on other signup surfaces.

## Content handoff

Guide research → evergreen candidate if year-round and stable.

Guide research → What’s On candidate if date-bound.

Newsletter research → What’s On candidate if date-bound and verified.

Strong evergreen newsletter discovery → guide candidate only after guide-specific verification and editorial approval.

Nothing is published automatically.

## Measurement

Track separately:

- Free & Cheap landing visits
- guide signup attempts/completions
- direct guide opens by recognised subscribers
- guide → What’s On clicks
- NUE category → guide clicks
- guide acquisition source/campaign

Use these to learn whether the guide is acting as acquisition, retained utility, or both. Do not infer subscriber value from raw opens alone.
