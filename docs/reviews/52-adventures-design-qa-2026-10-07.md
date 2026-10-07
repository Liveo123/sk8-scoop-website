# 52 Adventures: approved card and action refresh — 7 October 2026

Working branch: `52-adventures-availability-v1`; draft PR #160. Based on verified head `93e7b7ed8a59b739b2c41485df2ab6de83584da4`. Preview only; no production publication or merge authorised.

## Scope approved by Paul

Paul approved sourcing free rights-cleared photos where possible, consistent top-photo Finder cards, clearer practical information and prominent Open buttons, moving practical sections and actions into the wider dialog column, shared My SK8 Save / Directions / verified-date Calendar / Share behaviour, and consistency across Finder, dialogs, chapter listings and Saved. This supersedes the earlier design freeze for these components only.

All 52 editorial selections, titles, descriptions, factual metadata, official source links and approved availability overrides were compared with the pre-refresh file and preserved. The original 12 image and rights records were preserved.

## Changes and targeted critique/fix

- Finder cards: top media, larger titles and practical details, clear 48px Open action, wrapping utility buttons and readable photo-credit disclosure. All 104 Finder instances retain their existing filter data and availability badges.
- Dialogs: story, Before you go, sources, freshness notice, weather Plan B, shared actions, completion and Try next in the wider column; essential facts and availability in the narrower column. Phone stacks essentials before the story. Keyboard focus is restored after changing adventure or marking completion.
- Chapter and Saved listings: matching imagery/fallback and shared action controls; existing chapter structure and editorial order preserved.
- My SK8: the same shared `sk8_saved_items_v1` page-record schema and changed event as the other guides. Existing local 52 shortlists migrate once; later shared removals remain removed on reload. Saves from other guides survive changes. Cross-tab storage changes refresh the guide. Blocked browser storage uses an honest session-only label and notice.
- Directions: named venues/operators rather than vague regional labels. Targeted review corrected Manchester Canoe Club in Marple and Venture Out in Heaton Mersey.
- Calendar: only already verified Anson closing-weekend sessions (24/25 October) and Dunham mill-tour dates (15/22 October), each separately selectable. Past dates disappear. Calendar text states that a reminder is not a booking. No invented dates for evergreen or unpublished sessions.
- Share: native sharing with clipboard/manual-copy fallback; cancellation does not claim success.
- Analytics: existing guide measurement recognises the new Save controls and Finder/dialog listing context. Share, listing Open and destination clicks retain the established events.

## Photos and rights

32 additional venue/scene photos are stored as separate web-sized WebP assets. Total: 44 photo-backed adventures. Each new photo was checked visually against its source record, creator and individual licence; alt text and linked credit/licence are included. ShareAlike treatment is stated. Context photos identify that they show the setting rather than a current activity/session. White Nancy's historical 2017 decoration is explicit.

The existing Image-Rights-Register was checked first and retained. `52-adventures-image-rights-2026-10-07.json` supplies ready-to-import GREEN records with source file pages, original URLs, creator, licence, treatment, alt text and SHA-256. The master register has not been edited; importing these 32 records remains a pre-publication administration task.

| Adventure | Designed fallback reason |
| --- | --- |
| 16 Marple kayaking | Canal photos would misrepresent moving-water instruction; no suitable cleared operator photo selected. |
| 17 Mersey paddling | Suitable licensed river candidate could not be retrieved; unrelated village/canal results rejected. |
| 24 Tegg's Nose | Licensed candidate retrieval was blocked. |
| 27 Goyt Valley | Licensed candidate retrieval was blocked. |
| 43 iFLY | Aircraft search results were unrelated; no suitable cleared venue image found. |
| 44 Velodrome | Licensed candidate retrieval was blocked. |
| 45 Graystone | No suitable individually verified free-licence image found. |
| 51 Monsal Trail | Licensed candidate retrieval was blocked. |

## QA evidence

- 228 DOM-simulation checks: all 104 Finder cards have media/fallback and actions; all 52 chapters have actions; every adventure dialog retains story, facts, availability and shared actions; shared saves/removals and retention of other guides; removal survives reload; calendar choice and exact single-date reminders; no calendar on undated activities.
- 3 blocked-storage checks: session save works, correct session-only action label and visible limitation notice.
- Additional 144 Finder URL/copy/static-metadata checks passed, including clipboard success, denial and absence.
- Existing 594 date-aware availability/Finder checks passed, including 7, 25 and 26 October transitions and combinations. Surprise Me and unfinished-picker exclusion policy unchanged.
- Exact comparison: all 52 editorial records, original image records and availability overrides preserved.
- Post-launch NUE preflight and public-sample/subscriber-gate checks passed. Website Health: 0 errors; 1 existing unrelated warning for three expired events hidden by client filtering.
- The live asset audit caught empty deployed files for adventures 15 and 34. Both were regenerated from the same reviewed originals, decoded and matched the existing rights-record SHA-256 hashes. A required CI image-integrity check now rejects empty/truncated WebP files, wrong routes and changed content hashes for all 32 reviewed assets.
- JavaScript parses; Git whitespace checks pass. Every new raster asset is decoded locally and its source record includes a content hash.
- Earlier destination-link, high-decay-fact, closure and duplicate-metadata audit findings remain applicable because those fields were preserved. The Shutlingsloe unsafe-bridge/path-closure warning remains in the maintained entry.

**Rendering limitation:** these are DOM/static checks, not proof of real layout or native keyboard/dialog behaviour at desktop/tablet/phone widths. Paul declined the chat-browser workflow due usage cost. A one-run local command-line rendering alternative was attempted, but its Chromium package download repeatedly returned an invalid empty archive. No browser rendering results or screenshots are claimed. Responsive visual/native-dialog verification remains open.

## Release measurement follow-up

The existing approved release experiments are retained. The new components support measurable follow-up without claiming results from staging:

| Question | Metric | Limitation / next action |
| --- | --- | --- |
| Do photo-first cards and prominent Open actions improve discovery? | `guide_listing_open` per guide view and listing | Staging has no valid reader sample; assess after an approved release, with other simultaneous changes acknowledged. |
| Do shared actions help readers keep or act on an idea? | `guide_save`, named destination `guide_listing_click`, `guide_share` | These measure intent/action clicks, not bookings or attendance. |
| Does practical information beneath the story make onward use easier? | Further listing opens / completion toggles after opening a dialog | No controlled comparison or confidence claim yet; retain/change after actual reader evidence. |

## Exact next gate

Paul's review of the revised preview, including representative desktop, tablet and phone layouts, photo/fallback treatment and dialog/action usability. The rendered responsive/native-dialog gate remains unresolved until actual visual checks are recorded or Paul explicitly decides how to handle that limitation. Import the 32 image-rights rows before publication. Do not merge or publish without separate final approval.
