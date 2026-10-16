# Guide Factory: automatic event expiry build contract

Status: reusable website implementation supporting the authoritative 05 - Guide Factory Manual (approved 16 October 2026).

## Outcome
Time-limited entries automatically disappear after their final Europe/London calendar day. Separate future sessions stay accessible. Original event text and verification history are retained in source. The calendar, filters, visible totals and date actions remain consistent.

## Mandatory steps for every new dated guide
1. Include the shared asset after cards and their existing action controls: /assets/guide-expiry.js
2. Keep the authoritative JSON-compatible const E array in the generated guide HTML. Every displayed entry must contain a structured schedule field. Do not extract expiry from prose or a seasonal illustration.
3. Render each card with class="card", data-event-index="N" (one-based index matching the E array), and existing data-tags. Include these elements as required by the template: .filter[data-filter], #result-count, #guide-current-count, .calendar-grid, #sk8-guide-expiry-note, and #no-results.
4. Bootstrap after cards render: window.sk8GuideExpiry = SK8GuideExpiry.mount({entries:E});. Register and investigate the initial.needsReview indices; never treat unknown timing as confirmed.
5. Run the validator: node tools/validate-guide-expiry.mjs PATH_TO_GUIDE_INDEX_HTML. The validator must pass before the build is called release-ready. Review warnings separately.
6. Perform the defined browser/date QA, fix defects, and obtain Paul's publication approval.

## Schedule data shapes
All dates are ISO YYYY-MM-DD. Final event dates are inclusive in the Europe/London timezone. Examples:

Single session:
  "schedule":{"kind":"dated","dates":["2026-10-17"]}

Separate dates:
  "schedule":{"kind":"dated","dates":["2026-10-17","2026-10-24","2026-10-25"]}

Continuous dates:
  "schedule":{"kind":"dated","ranges":[["2026-10-24","2026-11-01"]]}

Separate blocks (closed dates between runs):
  "schedule":{"kind":"dated","ranges":[["2026-10-22","2026-10-25"],["2026-10-27","2026-11-01"]]}

Explicit closure:
  "schedule":{"kind":"dated","ranges":[["2026-10-24","2026-11-01"]],"excluded_dates":["2026-10-26"]}

Selected dates not fully known:
  "schedule":{"kind":"dated","ranges":[["2026-10-10","2026-10-31"]],"selected_dates":true,"review_note":"Exact available dates vary; check official booking"}

Timeless activity:
  "schedule":{"kind":"evergreen"}

Unconfirmed / open-ended:
  "schedule":{"kind":"unknown","review_note":"Confirm organiser dates"}
  "schedule":{"kind":"open-ended","start":"2026-10-24","review_note":"Exhibition finishing date missing"}

A selected_dates window determines when to retire a listing, but does not prove the event operates on every date. Such entries remain cards but do not enter the upcoming-date calendar without confirmed sessions.

## Behaviour and QA
- On load, after filter changes, after UK midnight and when the tab regains focus, hide dated entries whose last valid date has passed. Do not delete source records or remove evergreen entries automatically.
- When some sessions have passed but more remain, show only future calendar choices and an obvious note in the event card.
- Regenerate the upcoming date calendar and current result count, without dead event-anchor links or empty date columns. Show an end-of-season message and link to the Free & Cheap Guide when no dated events remain.
- Keep Save to My SK8, Directions, Share, official booking and analytics working. This capability is not a cancellation/availability/price verifier.
- Test day-before/day-of/day-after, last day of ranges, nonconsecutive sessions, weekend/closed days, UK DST, 390px and 320px widths, URL filters, existing event deep links, keyboard/mobile readability, and optional saved/calendar actions.
- Run a preview against the real guide page; verify Cloudflare deployment corresponds to the latest source commit; do not silently merge or deploy production.

## Source of truth
The master structured date schedule and the verified official event source are authoritative. The visible human-readable When text must match the structured schedule; make date edits in both, then rerun the validator. The Halloween 2026 pilot now includes 45 dated entries and one evergreen entry. Two formerly incomplete entries were verified directly with the Whitworth and Waterside on 16 October 2026; Afrocats still has conflicting weekday/date labels in its organiser listing, and selected-day events require a final booking-calendar check. Do not copy its actual 2026 dates into another guide.

Reusable implementation: assets/guide-expiry.js
Release validation: tools/validate-guide-expiry.mjs
Browser QA: tests/guide-expiry-browser.mjs
