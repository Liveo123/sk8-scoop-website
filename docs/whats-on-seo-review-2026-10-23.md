# What’s On search discoverability: October 2026 SEO review

**Scope:** the compact What’s On page in site-wide [PR #242](https://github.com/Liveo123/sk8-scoop-website/pull/242), not an unapproved production release or a claim about live Google rankings. Reviewed 23 October 2026. **Release remains owner-controlled.**

## Decision

The smaller illustration-free page is **not an SEO regression by itself**. The main indexable calendar URL keeps a descriptive title naming all four SK8 areas, a relevant unique meta description, a single visible H1, a correct self-referencing canonical, a sitemap entry, crawl-permitting robots.txt rules and appropriate `CollectionPage` JSON-LD. Do not add keyword stuffing, recreate the decorative hero, change the URL or mark the whole event list up as one `Event` to make a score go up.

A sharing illustration may remain in `og:image` even though the hero no longer displays it; this is link-preview metadata, not on-page evidence of an actual event or a ranking shortcut. Added `og:site_name`, a truthful `og:image:alt` and a large-image social card in this preview.

## Actual SEO gap: event-level discovery

The calendar currently loads `data/events.json` client-side into the single `/whats-on/` page. Its `?event=<verified-id>` links are useful reader continuations but **share the collection page's canonical and primary content**; they are not unique, crawlable, single-event leaf pages. The page has `CollectionPage` structured data and no fabricated `Event` rich result markup. Google can render JavaScript, and third-party crawls have surfaced event content, but that is not equivalent to proving indexing or event-rich-result eligibility for each record.

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
| P1 | Small pilot of genuine dedicated event pages | For a handful of publicly accessible, future, independently verified events with specific dates and sufficient venue/address data, generate `/whats-on/events/<slug>/` as actual static HTML from the *existing* checked event source. Unique canonical, matching visible event facts, one eligible `Event` JSON-LD object and real organiser link. No duplicate manually edited event inventory. | **PROPOSED, NOT IMPLEMENTED**. Requires source/eligibility, technical and production review. |
| P1 | Correct event URL life cycle | Listing cards and search link to stable leaf page. Date/price/cancel/booking changes update canonical page and Event status promptly. Treat individual performances as distinct only where organiser evidence supports it; no false daily recurrence. Keep a useful expired/previous-event reader message rather than allowing stale attendance advice. | **PROPOSED**. |
| P2 | Contextual local-area internal links and evergreen pages | Link useful verified event pages into relevant Cheadle/Cheadle Hulme/Gatley/Heald Green hubs, guides and newsletter items. Publish genuine durable local content, not dozens of thin auto-generated location/date keyword pages. | **PROPOSED**, after pilot success. |

## Local-data constraints

At review there are 25 `verified` event records in the source, but not every record is suitable for Google event rich results. Mixed cost types, date ranges without confirmed daily sessions, missing structured address components, membership restrictions and limited future availability are deliberate gates, not defects to be "filled in" by AI. Event entry names, scheduled times, exact venue and booking route must be source-checked. An address embedded in a free-text venue string is **not** a validated postal address object.

For a pilot, **consider** one or two sufficiently distant, public future events and verify the organiser's venue, actual sessions, eligibility, tickets and image reuse rights. Do not treat this list as a recommendation to publish particular events without checking.

### Proposed P1 acceptance criteria

1. Single checked event, genuinely relevant to SK8, with unambiguous unique slug and independent factual source.
2. Its static HTML responds HTTP 200, contains readable title, intro, real start date/time, place and cost conditions, with an actual organiser booking/check URL and clear source-check date.
3. Unique indexable canonical on its *own* page; link from What’s On and appropriate area hubs; sitemap only when worth indexing.
4. Eligibility-checked `Event` JSON-LD matches **visible** details, explicitly handles real UK local offsets/dates, correct physical venue address, publicly accessible eligibility and verified price/offer claims. Do not mark up non-events, incomplete recurring sessions, members-only previews or already expired items.
5. Pass Google Rich Results Test and URL Inspection after a separately approved launch. No guaranteed feature appearance.
6. Keep existing `/whats-on/?event=<id>` continuation working until canonical leaf route migration is tested; avoid link breakage or duplicate-indexing traps.
7. Preserve editorial ranking independence. Avoid generating unnecessary pages merely to inflate index counts.
8. Measure actual impressions, verified organic entrances, click-through to organiser and owner maintenance time; decide **adopt, revise or stop**.

## NUE and JiveLoop Collective justification

**NUE:** Readers arriving from a search about a specific gig, festival or family activity should land on that exact verified event's facts and useful booking/directions/save options, not search through a broad calendar to find it.

**JiveLoop Collective:** A reusable source-checked event record and automated page generator could improve sustained discovery, earned newsletter relationships and transferable local-media infrastructure, but only when real organic traffic and maintenance savings justify it. Shared technology does not constitute evidence of a media-group profit uplift.

**Scope boundary:** no changes to live production, advertising or subscriber data; no invented search metrics. Keep the current What’s On design and title/description unchanged until Search Console data says otherwise.

