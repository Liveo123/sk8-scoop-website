# NUE + Free & Cheap Guide integration

Status: preview implementation on `preview/homepage-nue-v1`. Do not merge or publish without Paul’s explicit approval.

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
- The homepage description should communicate the guide’s actual value: genuine £0/low-cost ideas with hidden extras flagged.
- Recognised subscribers go directly to `/free-cheap-guide/guide/` from subscriber-aware NUE CTAs.
- Kids & Family, Outdoors and Local History can surface selected guide examples from the shared Free & Cheap dataset while preserving their own editorial purpose.
- What’s On remains the route for dated events.

## Guide → NUE

- The guide landing page uses the same recognised-subscriber state as NUE.
- Recognised readers bypass acquisition forms and get direct full-guide access plus a What’s On route.
- New guide signups use the existing MailerLite Free & Cheap Guide form and delivery journey.
- “Choose by mood” is functional navigation into relevant guide sections.
- “What’s on now” routes to the maintained NUE What’s On experience instead of encouraging duplicated dated listings.
- The editable Guide source fragments no longer carry the dated September event block. They point readers to `/whats-on/` instead.

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

## Generated-guide rebuild gate

`free-cheap-guide/guide/index.html` is a very large generated reader artefact. The maintainable dated-content correction has been made in:

- `free-cheap-guide/guide/parts/part-05.html`
- `free-cheap-guide/guide/parts/part-06.html`

Before production approval, regenerate/rebuild the full guide artefact from the corrected source fragments using the established guide build process, then verify that the rendered full guide no longer contains the old September “What’s On Now” event list.

Do not directly hand-edit the 22MB generated guide merely to make this integration pass appear complete.

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
