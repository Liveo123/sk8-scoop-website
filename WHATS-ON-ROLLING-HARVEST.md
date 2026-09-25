# SK8 Scoop Rolling What's On Harvest

**Status:** PREVIEW IMPLEMENTATION  
**Branch:** `preview/usability-simplification-v1`  
**Purpose:** keep What's On useful between weekly newsletter releases without turning SK8 Scoop into a generic event directory.

## Operating goal

Maintain roughly **20–35 useful future listings** at a time, looking **42 days ahead**. This is a quality target, not a quota. A smaller list is acceptable when supply is weak; filler is not.

Core geography remains Cheadle, Cheadle Hulme, Gatley and Heald Green, plus nearby SK8. Wider Stockport and nearby Cheshire/Greater Manchester items enter only when they are especially useful, distinctive or worth the trip.

## Cadence

Run the rolling harvest **twice each week**, normally Monday and Thursday.

The weekly Newsletter Factory / Website Harvest remains a major feeder. The rolling harvest fills the gap between newsletter runs and looks farther ahead so the site does not empty as events expire.

## Source registry

Use `data/event-sources.json` as the controlled discovery registry.

Tiers:
- **A:** core / primary local sources. Check first and most often.
- **B:** strong wider-Stockport or near-SK8 primary sources.
- **C:** selective worth-the-trip sources.
- **D:** discovery channels only. Verify elsewhere before publication.

Discovery is not verification. Eventbrite, TicketSource, Skiddle, Meetup, Facebook, Instagram, search results and community posts can identify candidates, but public SK8 Scoop facts should be checked against an organiser, venue, council or equivalent primary source wherever practical.

## Review queue

Use `data/event-review-queue.json` as the staging area between discovery and publication.

Statuses:
- **ready** — verified and suitable to stage for publication;
- **needs_check** — potentially useful, but one or more material facts still need verification;
- **rejected** — do not publish; retain the rejection reason briefly so the same weak candidate is not repeatedly rediscovered.

Every queue item records at least an ID, title, area, source URL, discovery date, status and reason. `needs_check` items must state exactly which facts are missing. `ready` items must carry the full publishable event fields before they can move into `data/events.json`.

The queue is an editorial control, not a public page.

## Harvest sequence

1. Load current `data/events.json`.
2. Remove or ignore events whose effective end date has passed.
3. Check Tier A sources.
4. Check Tier B sources.
5. Use Tier C only for strong worth-the-trip candidates or sparse periods.
6. Run Tier D discovery queries for gaps, overlooked hyperlocal items and unusual events.
7. Ingest future-event candidates already verified during Newsletter Factory or Guide Factory research.
8. Review first-party `/submit-event/` submissions.
9. Add discovered candidates to `data/event-review-queue.json` and mark them `needs_check`, `ready` or `rejected`.
10. Normalise candidates into the event schema.
11. Deduplicate against both the queue and current `data/events.json`.
12. Verify date, start time, end date/range, venue, area, price/free claim, booking route and source.
13. Prefer the organiser/venue URL as `source_url`; keep booking URL separately when useful.
14. Promote only `ready` items that materially improve reader choice into `data/events.json`.
15. Retain `needs_check` and recent `rejected` records in the queue with clear reasons.
16. Stage changes on preview.
17. Run review-queue QA, event-data QA, link/freshness checks and relevant mobile QA.
18. Production remains human approval-gated.

## Dedupe rules

Treat candidates as probable duplicates when any two or more match:
- same normalised title;
- same organiser/venue;
- same date or overlapping date range;
- same destination/booking URL;
- very similar description plus same area.

Prefer the strongest primary source record. Do not create one listing per repeated date when a recurring event is better represented by a useful date range or recurrence summary, unless individual dates genuinely differ.

## Selection priorities

Strongest:
1. core-SK8 one-off events;
2. free or low-cost useful events;
3. family and teen activities;
4. community events/open days;
5. theatre, music and arts with specific dates;
6. local history, talks, walks and workshops;
7. food/market events;
8. useful adult classes and social activities;
9. distinctive wider-Stockport or nearby outings.

Avoid filling the page with ordinary weekly services, commercial classes or generic listings merely because they are available.

## Required event fields

Minimum publishable fields:
- `id`
- `title`
- `date`
- `area`
- `venue`
- `cost`
- `category`
- `description`
- `source_url`
- `verification`
- `checked`
- `status: "verified"`

Use `end_date` and `date_range` for multi-day events. Use `booking_url` when distinct from the evidence source.

## Freshness

The browser already hides expired entries. The supply pipeline must therefore keep adding future entries before the current set drains.

Every harvest should report:
- total current live listings after expiry;
- number of new candidates found;
- queue counts for ready / needs_check / rejected;
- number promoted into the public event data;
- number rejected and why;
- earliest and latest event dates;
- core-SK8 vs wider count;
- gaps in category or geography.

## Guardrails

- Never invent an event, price, date, availability or booking route.
- Do not publish social-media-only claims as verified facts without stronger evidence when practical.
- Do not use a fixed listing count as an excuse for filler.
- Keep paid/editorial separation intact.
- Production publication remains approval-gated.
