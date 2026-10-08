# SK8 Scoop Free & Cheap Guide — 20-pass Criticism/Fix and release audit

**Date:** 8 October 2026 (UK). **Authoritative source:** currently published GitHub `main` at the time of audit; follow-up tracked in PR #184, branch `free-cheap-maintenance-register-2026-10-08`. **Scope:** existing reader-facing guide, navigation, factual prices, ongoing evidence register, test coverage and safe release. No new editorial selections.

**Release state:** This audit is a staging record. The final PR head must pass exact-commit tests and production must be verified separately after owner-approved merge. Do not confuse automated syntax/route checks with full current editorial verification.

## Inventory, sources and limits

- 62 `<article>` blocks include **54 actual reader-facing activities/options** and 8 instructional/structural panels; the misleading generic heading of the Life Leisure free swim has been corrected so it now appears as a named activity.
- 54 register records: **46 entries with at least one independently checked specific factual claim; four still waiting for primary evidence; two October date conflicts; one quiz-time discrepancy; one secondary-calendar-only programme.** All 54 listings have *not* been fully verified line by line. Dated primary evidence may support only an earlier session or historic facility, as stated on its individual record.
- The source register `docs/reviews/free-cheap-source-register-2026-10-08.json` is derived from the **current published selection**, not the 212-candidate discovery queue or the September "publish ready" file.
- No new entries or photography; 10 pre-existing image URLs and credits are unchanged. An image-free change is not a new image-rights approval, and existing collage rights have not been freshly re-cleared by this pass.
- The original in-page listing hashes existed but **12 were attached to the previous activity card**, causing technically valid links to show the wrong activity. Semantic target checks have been added.
- Reviewer approval is for correcting the existing guide, not advertising changes, MailerLite/DNS changes, or inventing new offers.

## Twenty distinct criticism/fix cycles

Each cycle reviewed the revised draft available at that stage. PASS means its scoped check found no additional material problem; PARTIAL identifies remaining risk or verification.

| Cycle | Criticism / evidence | Action / outcome |
|---|---|---|
| 01 — Source authority | Historic Guide Factory Control and September HTML conflicted with October production; old status said PR #159 not merged. | Confirmed PR #159 and #180 merged, current direct guide source and updated Guide Factory Control. **PASS source routing; PARTIAL editorial currency.** |
| 02 — Selection completeness | Earlier handoffs listed 212 leads rather than actual published choices, tempting unwanted additions. | Counted 54 published choices separately from 8 instructions. No unapproved candidates added. **PASS.** |
| 03 — Local priorities | Free/cheap guides can drift into Manchester-heavy tourist ideas at expense of SK8. | Preserved existing Cheadle, Cheadle Hulme, Gatley and Heald Green core; wider-area choices retain their outside-SK8 distinctions. No padding. **PASS with ongoing editorial review.** |
| 04 — Adult vs children's prices | A proposed fix changed Damson Tree sandwiches to "from £3" without saying the £3 item is a **child's sandwich**. Venue menu places adult lunch sandwiches from £6.50. | Corrected copy to distinguish £6.50 adult sandwiches and £3 children's sandwiches, with £8 jacket and £9 omelette. Strengthened exact price/category regression. **FIXED.** |
| 05 — Group cost honesty | The Light bowling cards repeated "GROUP PRICE" and risked implying a £6.50 individual ticket. | Removed duplicate label; retained authentic 40-minute lane rates (£16 early bird, £26 off-peak, £28 peak) and explicit four-person division as calculation, not ticket. **FIXED.** |
| 06 — Hidden costs | Free admission can mask paid parking, tours and special activities. | Council sources confirm Bruntwood paid parking, free BMX with protective kit; Hat Works general entry vs paid tours; other charged extras remain disclosed. **PASS for spot-check; not universal price sign-off.** |
| 07 — Misplaced fragments | Twelve named hash targets were placed in the preceding activity card, so ID-existence tests gave a false green. | Moved each ID to its actual `<article>`, preserved existing 157 `href` destinations, added article scroll margin. **FIXED.** |
| 08 — Link semantics | A test checking only `href="#id"` exists misses *what* the ID represents. | Added 12 mapping checks from fragment to matching article heading, plus Play Zone and Swim targeted browser checks. **FIXED test gap.** |
| 09 — Responsive narrow phones | Reader-supplied screenshot showed recommendation arrow/badge compression; 320px layout had been repaired in earlier release. | Preserved those fixes and added headless Chromium navigation/overflow/card-clipping checks at 320, 390, 768, 1280px in guide-specific PR preview workflow. **Pending exact-head browser result.** |
| 10 — Keyboard and semantic access | Automated presence of H1 does not alone prove focus order; small decorative badges can be hard to understand. | Preserved one semantic H1, focus-visible rules, controls and accessibility notices; strengthened actual heading checks for named cards. **PASS static, browser review scoped to navigation.** |
| 11 — Accessible swim identification | A real free disability swim was misleadingly headed "ACCESSIBLE & INCLUSIVE"; the activity was merely a paragraph. | Changed heading to `FREE DISABILITY SWIM — LIFE LEISURE CHEADLE`, added stable activity anchor and maintained Life Leisure's age 11+/25m-unaided condition. **FIXED.** |
| 12 — Category/navigation hierarchy | Section anchors and full-listing anchors had been treated as interchangeable; an incorrect link could land before the target heading. | Kept separate category anchors, attached 12 full-listing anchors to cards and added `scroll-margin-top` to the cards themselves. **PASS static; browser test pending.** |
| 13 — Source/evidence quality | A blanket "verified" count would disguise older citations, organiser-submitted listings and regional directory records. | Logged per-entry **specific checked claim**, URL, check date, review date, and exceptions; 46 checked in some respect does *not* mean 46 fully fresh. **PARTIAL: four primary-source checks remain plus four exceptions.** |
| 14 — Event-date contradictions | Amoeba: Stockroom says Wed 21 Oct while Council lists Tue 20 Oct; Arc: Council-submitted listing 31 Oct while One Stockport shows 24 Oct. | Kept both explicit unresolved; do not declare one correct or promote a certain date without organiser confirmation. Existing event cards ask readers to check. **OPEN: organiser confirmation.** |
| 15 — Repeating activity time drift | The Station House's current 2026 posts give both 8pm and older 8.30pm for Monday pub quizzes. | Removed false exact certainty: guide now advises confirming the latest Monday start time. Record carries separate time discrepancy status. **FIXED wording; time unresolved.** |
| 16 — Dated/event ageing | Seven one-off October entries appear inside a permanently positioned guide; browser-only expiry is not full editorial maintenance. | Preserved Europe/London local-date expiry guard; recorded review date per event and queued replacement/removal after expiry rather than silently deleting an approved section. **PARTIAL: ongoing editorial maintenance required.** |
| 17 — Financial/booking/access detail | Prices and session conditions may change faster than museum names; especially SEN/SEND sessions, café menus and booking conditions. | Checked official provider evidence where available, preserved "when listed"/"check before travelling"; four listings await primary recheck (No School Social, Seashell gym, Dementia Disco, sensory garden). **PARTIAL.** |
| 18 — Image provenance and visual rules | Generative/editorial collages and SVG replacements can be silently regressed when redesigning. | No image asset/src/credit changes, existing accessible alt descriptions preserved, no inline `<svg>` or .svg references; current no-SVG CI guard retained. **PASS code invariants; existing image rights unchanged, not newly cleared.** |
| 19 — Subscriber journey/privacy | A previous guide regression redirected returning readers to signup; full guide is intended direct-by-link with `noindex`. | Preserved approved direct guide route and existing Cloudflare smoke tests for HTTP 200, no redirect and `noindex`. **PASS previous production; recheck after this merge.** |
| 20 — Deploy/measure/rollback | CI green on an old head can be mistaken for final approval, and the shared guide QA step was previously lost to a later release. | Retain both 52 Adventures image-integrity and Free & Cheap editorial UI gates; add targeted Chromium preview checks; require exact final SHA and production smoke check. This is a safety/factual correction, so no contrived A/B test. **Pending final CI and deployment verification.** |

## Source links underlying the important corrections

- Damson Tree café categories and prices: https://www.thedamsontree.co.uk/menu
- The Light bowling lane prices: https://stockport.thelight.co.uk/pricing
- Station House quiz Monday venue posts (time variation): https://www.almond-pubs.co.uk/cask-ale-week-2026/ and https://www.almond-pubs.co.uk/january-at-the-station-house/
- Open+ library access/eligibility: https://www.stockport.gov.uk/opening-times-libraries/open-plus-libraries
- Life Leisure Cheadle free swim and accessibility: https://lifeleisure.net/centre/cheadle/
- Bruntwood park extras: https://www.stockport.gov.uk/bruntwood-park
- Arc October discrepancies: https://www.stockport.gov.uk/events/arc-saturday-art-club-oct?date=2026-10-31 ; https://www.onestockport.co.uk/townofcultureevents/category/makes/2026-10/
- Amoeba discrepancies: https://www.stockrm.org/events/amoeba-photography-network?date=2026-10-21 ; https://www.stockport.gov.uk/events?Category=Arts+and+crafts&Page=1&pageSize=60&view=Standard

## Outstanding actions (not part of this already-approved corrective release)

- Organiser confirmation of Arc (24 v 31 October) and Amoeba (20 v 21 October); keep source-discrepancy status until then.
- Obtain current first-party proof for No School Social, Seashell gym schedule, Dementia Disco and Community Sensory Garden; don't replace their current cautious wording with unsupported certainty.
- Confirm Heald Green library crochet directly with a librarian; secondary One Stockport calendar is not sufficient for "primary verified".
- Confirm precise Station House start time if promoting in a newsletter.
- Complete per-entry full-price/eligibility/accessibility verification as part of normal Guide Factory maintenance. Partial claim evidence is not blanket verification.
- Evaluate removal/replacement of dated 2026 cards when past; no editorial selection changes were authorised in this patch.

## Release record to complete

- [ ] Exact-head Website Health and post-launch QA
- [ ] Chromium 320/390/768/1280 responsive and anchor test; inspect screenshot artifact
- [ ] Current main head comparison and no unrelated changes lost
- [ ] Owner-authorised merge (approved in conversation 8 Oct, after 20-pass critique)
- [ ] Live direct full-guide URL returns 200 and noindex rather than signup
- [ ] Production QA, including browser header, tested
- [ ] Update Guide Factory Control with actual merged commit and outstanding source caveats
