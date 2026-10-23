# What’s On search discoverability: October 2026 SEO review

**Scope:** the compact What’s On page in site-wide [PR #242](https://github.com/Liveo123/sk8-scoop-website/pull/242), not an unapproved production release or a claim about live Google rankings. Reviewed 23 October 2026. **Release remains owner-controlled.**

## Decision

The smaller illustration-free page is **not an SEO regression by itself**. The main indexable calendar URL keeps a descriptive title naming all four SK8 areas, a relevant unique meta description, a single visible H1, a correct self-referencing canonical, a sitemap entry, crawl-permitting robots.txt rules and appropriate `CollectionPage` JSON-LD. Do not add keyword stuffing, recreate the decorative hero, change the URL or mark the whole event list up as one `Event` to make a score go up.

A sharing illustration may remain in `og:image` even though the hero no longer displays it; this is link-preview metadata, not on-page evidence of an actual event or a ranking shortcut. Added `og:site_name`, a truthful `og:image:alt` and a large-image social card in this preview.

## Actual SEO gap: event-level discovery

**Before this pilot**, What’s On exposed only client-side `/whats-on/?event=<id>` continuations sharing the collection canonical. The deeper review also found that `assets/whats-on.js` injected an `ItemList` of individual `Event` objects with guessed address text, unverified `InStock` offers and naive date strings. **That extra markup has now been removed on the preview branch**. The calendar retains an honest source-level `CollectionPage` and normal checked listings. Two eligible, source-checked single-event pages are being prepared as actual static HTML, with distinct canonicals and accurate structured location/date data. Rendering a page correctly does not prove Google will index it or show a rich result.

Google's event documentation says: (1) the UK/English region is supported; (2) each eligible event must have a unique URL containing that event's markup; (3) the page must focus on that single event; (4) accurate name, start date and physical place/address must be visible and supported; (5) school-minor spectator and members-only/invitation events are excluded from its event experience. **Do not create Event JSON-LD on the category/calendar page.**

Official references:
- https://developers.google.com/search/docs/appearance/structured-data/event
- https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics
- https://developers.google.com/search/docs/appearance/title-link
- https://developers.google.com/search/docs/appearance/snippet
- https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls

## Priorities, impact and guardrails

| Order | Improvement | Implementation and proof | Approval/state |
| --- | --- | --- | --- |
| P0 | Confirm real indexing and queries | Search Console URL Inspection of the canonical `/whats-on/`, Google-selected canonical, rendered HTML with dates/links, sitemap processing, page-level queries and device split. Investigate pages Google excluded rather than guessing from snippets. | **NOT VERIFIED**: GSC Wizard connector refuses reads because its trial/subscription is inactive. No traffic, rankings, impressions or actual Google index status were retrieved. |
| P0 | Keep existing correct metadata and index controls | Validate title, H1, description, canonical, CollectionPage, sitemap, robots and meaningful local area coverage after hero redesign. Mark the conceptual image as a social illustration. | **DONE IN PR PREVIEW**. |
| P1 | Small pilot of genuine dedicated event pages | Two actual `/whats-on/events/<slug>/` static pages are generated from `data/events.json` with a deterministic `scripts/build-event-leaf-pages.mjs`, unique self-canonicals, visible venue/time/price facts, and accurately checked `Event` JSON-LD. No organiser photos without permission. | **IMPLEMENTED IN UNMERGED PREVIEW**. Exact-SHA CI, Google Rich Results and production approval remain. |
| P1 | Correct event URL life cycle | Verified pilot cards, site search and homepage finder link to their new pages; other events retain working `/whats-on/?event=` continuation. Each page has a reader-facing expired notice, dated spotlight guards and a browser-rendered `noindex`/removed Event schema after its session. CI blocks a stale generated page or expired source. | **PREVIEW PILOT COMPLETE WITH LIMITATION**: browser-rendered expiry is not server-side HTTP expiry handling; refresh/removal from sitemap must still occur through the existing editorial harvest and approved release process. |
| P2 | Contextual local-area internal links and evergreen pages | Link useful verified event pages into relevant Cheadle/Cheadle Hulme/Gatley/Heald Green hubs, guides and newsletter items. Publish genuine durable local content, not dozens of thin auto-generated location/date keyword pages. | **PROPOSED**, after pilot success. |

## Local-data constraints

Following this preview's one new source-checked addition, there are **26 `verified` event records** in the source, of which **two have dedicated pilot leaf pages**. Not every record is suitable for Google's event experience. Mixed cost types, date ranges without confirmed daily sessions, missing structured address components, membership restrictions and limited future availability are deliberate gates, not defects to be "filled in" by AI. Event entry names, scheduled times, exact venue and booking route must be source-checked. An address embedded in a free-text venue string is **not** a validated postal address object.

**Pilot selections, checked 23 October 2026:**

- [Christmas Craft Night at Cheadle Library, Thursday 12 November 2026, 17:30–19:00](https://www.stockport.gov.uk/events/christmas-craft-night?date=2026-11-12). This free council-listed workshop is specifically for ages 16+, requires booking and is at Cheadle Library, 23 Ashfield Road, SK8 1BB. Unique preview leaf: `/whats-on/events/cheadle-library-christmas-craft-night-2026/`. Added to the checked event feed.
- [Lum Head nursery and reception open day, Thursday 19 November 2026, 14:00–15:00](https://www.stockport.gov.uk/events/nursery-and-reception-open-day-nov?date=2026-11-19). The council listing is submitted by Lum Head Primary School, gives Troutbeck Road, Gatley SK8 4RR and says admission is free. The school asks parents to book a place/tour first. Unique preview leaf: `/whats-on/events/lum-head-gatley-nursery-reception-open-day-2026/`. Existing event source refreshed.

Both use `TEXT-ONLY` visual rights. No invented ticket availability, bogus photo or unsourced venue coordinates.

### P1 acceptance criteria and release status

1. Single checked event, genuinely relevant to SK8, with unambiguous unique slug and independent factual source.
2. Its static HTML responds HTTP 200, contains readable title, intro, real start date/time, place and cost conditions, with an actual organiser booking/check URL and clear source-check date.
3. Unique self-canonical on its *own* page; crawlable links from What’s On and dedicated URLs in sitemap. Both now included in the 68-URL pilot preview sitemap.
4. Eligibility-checked `Event` JSON-LD matches **visible** details, explicitly handles real UK local offsets/dates, correct physical venue address, publicly accessible eligibility and verified price/offer claims. Do not mark up non-events, incomplete recurring sessions, members-only previews or already expired items.
5. Validate HTML/JSON-LD in source and the exact browser preview first. **Google Rich Results Test and Google URL Inspection remain unverified** (Search Console access blocked by inactive GSC Wizard subscription and pages not live). Run after separately approved launch. No guaranteed rich result.
6. Keep existing `/whats-on/?event=<id>` continuation working until canonical leaf route migration is tested; avoid link breakage or duplicate-indexing traps.
7. Preserve editorial ranking independence. Avoid generating unnecessary pages merely to inflate index counts.
8. Measure actual impressions, verified organic entrances, click-through to organiser and owner maintenance time; decide **adopt, revise or stop**.

## NUE and JiveLoop Collective justification

**NUE:** Readers arriving from a search about a specific gig, festival or family activity should land on that exact verified event's facts and useful booking/directions/save options, not search through a broad calendar to find it.

**JiveLoop Collective:** A reusable source-checked event record and automated page generator could improve sustained discovery, earned newsletter relationships and transferable local-media infrastructure, but only when real organic traffic and maintenance savings justify it. Shared technology does not constitute evidence of a media-group profit uplift.

**Scope boundary:** no changes to live production, advertising or subscriber data; no invented search metrics. Both pilot event pages and their source additions remain in unmerged PR #242 until owner approval. Keep the current What’s On design and title/description unchanged until Search Console data says otherwise.

**Expiry rule:** the generator must be rerun for any checked date, venue, booking, price or cancellation change. CI blocks a generated page that no longer matches the event feed and blocks release if a pilot is already past its event date. The browser guards visitors with an expired notice and attempts a rendered `noindex`, but the *sitemap and server HTML must be retired or updated* through the next approved website refresh. Do not assume JavaScript alone guarantees immediate Google deindexing.

