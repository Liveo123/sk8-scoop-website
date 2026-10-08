# SK8 Calendar | Staging Release Review | 8 October 2026

**State:** DRAFT ONLY. GitHub PR #191. Do not merge/deploy without explicit owner approval.

## User-approved scope
- Everyone locally: families, adults, teenagers, older residents.
- Full editorial effort for core Cheadle, Cheadle Hulme, Gatley and Heald Green; nearby only when worth the trip.
- One-offs plus useful confirmed recurring clubs/classes.
- Rolling 12-month browse with only confirmed calendar dates; seasonal themes separate from event listings.
- Free moderated submissions, clearly labelled paid placements, no payment-based editorial priority.

## Implementation
- Existing /whats-on/ remains canonical.
- Agenda/mobile default plus optional keyboard-accessible month grid, date picker and location/cost/family filters.
- Existing My SK8 save/restore, reminders, directions and calendar downloads retained; dates from individually confirmed occurrences.
- Free logic requires no compulsory admission. Unknown fee is not free.
- Unspecified multi-day date ranges are **not** treated as daily sessions.
- Explicit excluded organiser/source removed from staged data and source registry; shared pre-publication guard blocks non-rejected review candidates, promotion and data/source publication.
- Separate editorial note identifies seasonal watch themes as **unconfirmed** and never supplies invented dates.
- Gatley pilot series: organiser-managed event page and council listings corroborate six **listed** Monday dates (12/19 Oct, 2/9/23 Nov, 7 Dec). No inferred 26 October session or blanket infinite weekly recurrence. Date list requires future maintenance and recheck.

## Evidence (research, not authorisation to publish)
- Council listing 12 and 19 October: https://www.stockport.gov.uk/events?category=Food+and+drink&page=1&pageSize=60
- Council organiser-submitted listing 2 November: https://prod-windows-webplatform-origin.smbcdigital.net/events/deckchair-care-welcome-cafe-oct-to-dec?date=2026-11-02
- Council listing of later autumn dates: https://www.stockport.gov.uk/events?Page=4&category=food+and+drink&fromsearch=true&latitude=0&longitude=0&pageSize=60&price=free&price=paid
- Organiser-managed listing: https://www.eventbrite.com/e/welcome-cafe-deckchair-care-tickets-2002511771615
- Sourced 8 October 2026. Future availability can change; source must be rechecked before sending/publication.

## Three mandatory release experiments
**Experiment 1 — Does date browsing improve useful action?**
Hypothesis: Agenda + optional month view improves the share of consenting visitors who select a dated event and click a primary organiser/booking route.
Change: New agenda/date/month controls. Baseline: capture pre-release What's On unique consenting event-detail clicks per page viewer, if measurable. Metric: consenting unique users with event_detail_click / consenting What's On viewers, over four weeks. Limitation: not a randomized experiment; weather and event supply affect comparability. Adopt if better sustained results without accessibility or freshness regression.

**Experiment 2 — Does date-specific My SK8 provide value?**
Hypothesis: Saving an individual confirmed occurrence creates more useful follow-on actions than an undated event reminder.
Change: Dated occurrences and clear calendar downloads. Baseline: pre-release My SK8 save rate among users who saw event actions, measured in the same analytics-consent cohort. Metric: saves per action viewers, and subsequent directions/calendar clicks. Tentative reference: prior MVP strong signal >=8% save rate, but samples below 100 viewers and 20 returning savers are inconclusive.

**Experiment 3 — Does improved Gatley coverage attract local action?**
Hypothesis: A verified Gatley community series produces meaningful interest through the previously empty Gatley filter.
Change: One source-backed recurring Gatley event series, with explicit exceptions. Baseline: Gatley filter previously returned zero records. Metric: Gatley filter selections followed by event details/saves, not raw Gatley page impressions. Re-evaluate coverage weekly; no claim of comprehensive Gatley inventory after a single record.

None of the three tests may override editorial, accessibility, source or privacy safeguards. Existing consent rules continue to apply.

## QA: three criticism-and-fix cycles
1. Structure: preserved current website navigation and existing My SK8 reader actions; no accounts, ads, separate datastore or compulsory newsletter gate.
2. Accuracy: conservative Free filtering; real occurrence dates only; verified Gatley entry, explicit unknowns and excluded-source blocking. Residual issue: future inventory beyond autumn 2026 is thin, deliberately not filled with unconfirmed events.
3. Experience/release risk: mobile month tiles compact; selecting a date scrolls to dated results; accessible roles/labels and arrow-key tests; seasonal themes visually distinct. Browser QA screenshots and GitHub Actions must pass for the **latest commit** before approval.

## Release hold and manual steps
- Check all current PR workflows successful, no stale pending/failures.
- Review desktop and 390px mobile screenshots and actual date selection/Save/ICS behaviour.
- Recompare staging against latest main and repeat tests on any merged main changes.
- Try an official exact-commit Cloudflare preview if available; never invent a preview URL.
- **Owner approval required** for main-branch merge and production deployment.
- After any approved release: check actual production What's On, direct event deep links, /my-sk8/, /submit-event/, event-data freshness, and restore prior Cloudflare deployment on material regression.

## Known limitations
- Browser-local My SK8 data do not sync across devices.
- Term dates, prices, availability and cancelled sessions require ongoing verification.
- One Gatley series improves geographic coverage but is not comprehensive.
- Sparse future months are factual, not a defect to fix by inventing dates.
- No independently verified Cloudflare staging/production URL is attached to this review.
