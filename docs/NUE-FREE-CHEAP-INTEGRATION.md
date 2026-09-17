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
- Kids & Family and Outdoors can continue surfacing selected guide examples, with prominent routes back to the full guide.
- What’s On remains the route for dated events.

## Guide → NUE

- The guide landing page uses the same recognised-subscriber state as NUE.
- Recognised readers bypass acquisition forms and get direct full-guide access plus a What’s On route.
- New guide signups remain attributed as Free & Cheap Guide acquisition and continue through the existing guide delivery journey.
- “Choose by mood” becomes functional navigation into relevant guide sections.
- “What’s on now” routes to the maintained NUE What’s On experience instead of encouraging duplicated dated listings.

## Future data architecture

Do not rebuild the approved guide merely to normalise data. When the next substantive guide refresh is approved, introduce a structured Free & Cheap source dataset containing at minimum:

- stable item ID
- title
- area
- category
- cost band and exact current price text
- audience tags
- indoor/outdoor/weather tags
- duration/visit type
- access/SEND evidence fields
- extras/caveats
- official source URL
- checked date
- publication state
- related NUE category routes

Use that dataset to generate or populate reusable NUE excerpts and filters. The goal is one maintained factual record feeding several reader experiences, not several copied mini-databases.

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
