# SK8 Scoop Rolling What's On Harvest

**Status:** VERIFIED EXISTING TWICE-WEEKLY HARVEST AUTOMATION; source and data code changes on review PR are not yet live  
**Checked:** 20 November 2026  
**Purpose:** keep What's On useful between weekly newsletter releases without turning SK8 Scoop into a generic event directory.

## Operating goal

Aim for **40–60 verified, relevant future listings** (including individually dated recurring activities), looking **42 days ahead**, as specified in the newer `data/event-sources.json` policy. This is a discovery/quality target, not a publishing quota; fewer listings are acceptable where evidence or value is weak. A smaller list is acceptable when supply is weak; filler is not.

Core geography remains Cheadle, Cheadle Hulme, Gatley and Heald Green, plus nearby SK8. Wider Stockport and nearby Cheshire/Greater Manchester items enter only when they are especially useful, distinctive or worth the trip.

## Cadence

**Existing enabled task:** `SK8 What’s On Harvest` (automation ID `6ab64979cc0c8191ba9771af1c12935b`) runs **Tuesday and Friday at 09:00 Europe/London**. Confirmed in the saved automation on 20 November 2026; last scheduled run 20 November, next 24 November. That latest run completed its research but **held production publication** because a required event-leaf static QA failed. A task-run timestamp is not proof of a published update. Do not create a second GitHub scheduled discovery job. GitHub's separate daily expiry workflow removes ended listings only.

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

### Promotion helper

Use `node scripts/promote-ready-events.mjs` first in dry-run mode. It reports the exact `ready` items eligible to move into `data/events.json` and makes no changes.

After verification and editorial review on a preview/staging branch only, `node scripts/promote-ready-events.mjs --apply` may promote those `ready` items, remove them from the review queue and keep `needs_check` / `rejected` items in place. **Owner-approved exception:** the existing 9 November 2026 Tuesday/Friday automation may merge and publish *event-data-only* (`data/events.json`, `data/event-review-queue.json`) after all its prescribed release and production-parity gates pass. It may not publish source-registry, code, site design, documentation or other changes without separate approval.

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
18. Follow the existing Harvest task's event-data-only publication authorisation and verification gates; all non-event-data releases remain explicitly approval-gated.

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

Regular classes can be included when a reader gains something actionable (for example an accessible, distinctive, affordable local yoga, Pilates, craft or social session). Check each advertised occurrence, cost and joining conditions, especially around holidays. Avoid filling the page with undated ordinary weekly services, repetitive commercial classes or generic listings merely because they are available.

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

## Approval and execution status

The **existing enabled ChatGPT Harvest automation** is the scheduled research-and-event-data-release owner. Its updated instructions (20 November 2026) require each run to cover all four core areas, rotate the controlled wider source registry and actively search yoga, Pilates, Tai Chi, walking, crafts, book groups, quizzes, parent/child and adult social activities. Every run must report checked/deferred/unavailable areas and categories. Event-data-only changes retain the prior approval; code and source-registry changes stay behind separate approval. The latest 20 November run was recorded as completed, but publication failed its static QA gate. Do not declare website freshness from schedule alone. No redundant GitHub discovery schedule should be installed. Never assume a recurring timetable automatically confirms bank-holiday or Christmas sessions.

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
