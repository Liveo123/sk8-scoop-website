# Free & Cheap Guide: source reconciliation, link repair and editorial QA

**Checked:** 8 October 2026 (UK date). **Status:** draft staging, **not yet published**. Working branch: `free-cheap-maintenance-register-2026-10-08`. Established source baseline `main` at `25eb807534a7da40eebb24a5b065d1a8d13fb33a`; update this record if the main head moves before publication.

## Why this was necessary

PR #159 and QA restoration PR #180 were merged and passed production QA, but the canonical Free & Cheap Guide Factory Control still said DEGRADED because no current entry-by-entry master and freshness register had been established. CI health and correct routing do not prove the editorial facts are fresh. The 12 valid in-page anchor links had also been inserted at the end of the previous listing rather than the intended listing, a semantic issue overlooked by the existing broken-link test.

## Master recovery (partial, measurable)

- Inventory derived directly from the **current published guide HTML**, not the September draft: `54` reader-facing listings within 62 HTML article blocks, including `7` dated October cards.
- `29` entries have **specific independent primary-source claim checks**, not blanket approval of every sentence or price.
- `2` event entries are marked DATE CONFLICT, not verified; `23` remain in the primary-source recheck queue.
- File `docs/reviews/free-cheap-source-register-2026-10-08.json`: current heading, section, literal page price/details, first-party link, any direct listing anchor, review/expiry class, checked claims and sources, dated check, next review due, and unresolved editorial notes.
- Historical candidate ledger and 212-item discovery queue are evidence only; nothing has been automatically promoted into the published 54 selections.
- No new images or edits to existing rights/credits. No changed external URLs or deletion of listings.

## Reader-facing corrections proposed

1. **12 internal hashes:** move from end of the preceding card onto the correct `<article>` (Hat Works, Stockport Museum, Air Raid Shelters, Staircase House, Bramall Hall, Underbanks, Manchester Museum, Science and Industry Museum, John Rylands Library, the Whitworth, Bruntwood Park, Gatley Skatepark).
2. **Hash scroll usability:** article-target `scroll-margin-top` keeps each correct heading visible.
3. **Damson Tree café:** correct “sandwiches from £6.50” to basic sandwiches **£3**, leaving jacket potatoes from £8 and two-filling omelette £9, in the draft. Primary venue menu: https://www.thedamsontree.co.uk/menu
4. **The Light Stockport:** remove repeated “GROUP PRICE” heading; unchanged 40-minute lane prices of £16 early-bird, £26 off-peak, £28 peak. Primary: https://stockport.thelight.co.uk/pricing
5. **Regression checks:** enforce 12 hash-to-correct-article and heading relationships, and the two copy corrections, in `scripts/check-free-cheap-guide-ui.mjs`.

### Known event-date conflicts

- **Amoeba Photography Network:** organiser listing 21 October, Stockport Council listing 20 October. Keep existing caveat and obtain written organiser confirmation before promoting. Sources: https://www.stockrm.org/events/amoeba-photography-network?date=2026-10-21 and https://www.stockport.gov.uk/events
- **Arc Saturday Art Club:** organiser-submitted Stockport Council and Healthy Stockport listings say **31 October** (11am–3pm, suggested £3); One Stockport's dated Arc-hosted series says **24 October**. The guide currently says 31 October and advises checking changes. Keep a conflict flag and seek direct Arc confirmation before promoting it as certain. Sources: https://www.stockport.gov.uk/events/arc-saturday-art-club-oct?date=2026-10-31 ; https://www.healthystockport.co.uk/events/details/arc-saturday-art-club-oct ; https://www.onestockport.co.uk/townofcultureevent/arc-saturday-art-clubs/2026-10-24/
- Other date checks include **16 October Heald Green Northern Soul**, verified from an organiser-posted £5, 19.30 event listing: https://www.soul-source.co.uk/events/event/93545-heald-green-northern-soul-motown/.

### Existing correct factual caveats preserved

- Bramall Hall states Solar closed during roof restoration; current Council prices and closure match: https://www.stockport.gov.uk/planning-your-visit-to-bramall-hall/prices-bramall-hall
- Hat Works general admission free, factory-floor tours separately charged, as listed by Stockport Council: https://www.stockport.gov.uk/planning-your-visit-to-hat-works
- Gatley Recreation Ground tennis free under Council's policy: https://www.stockport.gov.uk/tennis
- Cheadle Makers Market future dates of 7 November and 5 December from organiser venue page: https://www.themakersmarket.co.uk/venue/cheadle/

## Reader trust and maintenance

**High-decay:** date-specific events check 2 days before and expire after UK event date; discounts and menu prices monthly/before promotion; repeating programmes fortnightly; enduring free outdoor places and museum general access quarterly unless an incident triggers earlier review. These are proposed review targets, not claims that automated checking currently exists. Dated events in an evergreen guide warrant an editorial decision after October, but their removal is *not* included in this patch.

**Website Harvest handoff candidates, not yet published:** Gatley free tennis, Hat Works free entry vs separately paid tours, Cheadle Makers Market 7 Nov/5 Dec, and 16 Oct Heald Green soul night. Check whether each is already on the public website to avoid duplication; only factual website actions with their own release gate. Do not create 54 cloned website pages.

## Ten distinct critique/fix lenses

| # | Lens | Resolution or open risk |
|---|---|---|
| 1 | Link accuracy | 12 anchors moved to corresponding articles |
| 2 | Reader navigation | Offset on real target cards, without adding misleading preceding-card anchors |
| 3 | Cost honesty | Damson Tree £3 minimum corrected from venue menu |
| 4 | Price communication | Bowling group-price heading de-duplicated; no per-person ticket fiction |
| 5 | Source authority | Specific original-organiser, council and venue evidence logged in source register |
| 6 | Event-date integrity | Two discrepancies flagged as conflicts; owner contact still needed |
| 7 | Freshness governance | 54 entries classified, with dates; 23 require targeted source rechecks |
| 8 | Scope and local utility | All existing choices preserved, no unapproved additions or low-value padding |
| 9 | Images / DICM / mobile | All ten images, existing credits and no-SVG rule unchanged; visual browser spot check still required for hash scrolling |
| 10 | Tests / regressions | Add semantic article-anchor assertions on top of existing static/expiry checks; CI still required at exact staging head |

## Release gate and measurement

Do not merge/publish a subsequent guide update merely because CI passes. Validate the exact PR head, check representative hash links on phone and desktop, confirm no guide-gate redirect/noindex regression, and obtain **fresh owner approval for this follow-up release**. Do not mislabel register as fully verified until remaining high-decay claims are resolved.

Measurement after approval: watch `guide_listing_open` / reader continuation to named items, fragment click and save behaviour where instrumented; do not infer improvements from small/no control samples. This is a correction patch, so do not introduce artificial A/B tests that would obscure the urgent reader fixes.
