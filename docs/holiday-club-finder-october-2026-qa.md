# October 2026 Holiday Club Finder — verification and release record
Checked: 8 October 2026. Branch: `feature/october-holiday-club-finder-2026`. Draft PR #189. Production unchanged.

## Scope
Expanded from six trial entries to **18 separately listed venue/programme locations**: **9 in core SK8** (Cheadle Hulme 6, Gatley 2, Heald Green 1), **9 nearby** (Bramhall 2, Cheadle Heath 1, Heaton Mersey 2, Heaton Moor 1, Handforth 1, Wythenshawe 2). These represent **12 organising brands** because some run several venues. All shown dates fall in 26–30 October 2026 (some only part-week). Programmes are listed, not guaranteed vacancies.

## Primary sources for the 18 proposed entries
1-2. Practically Family / Greenbank and Cheadle Catholic: https://practicallyfamily.co.uk/holiday-club/book ; https://www.practicallyfamily.co.uk/our-clubs ; published 26–30 October; 3–11; £20/£30/£40 sessions; payment options.
3. Junior Sport Stars / Lane End: https://junior-sport-stars.classforkids.io/camp/293 ; 26–30 October; £30/day £20 half £125 week; ages 4–12, Reception restriction.
4. LSC / Thorn Grove: https://wearelsc.co.uk/holiday-clubs/thorn-grove-primary-school/ ; published 26–30 October; ages 4–11; 8am–6pm; price not confirmed.
5. Elm Cottage / Hursthead: https://bookings.elm-cottage.com/hursthead/ ; 26–30 October daily booking entries; ages Reception–Year 6, 07:45–18:00, £21/£25/£35. Search-engine and site snapshots can be stale; recheck actual booking route in production QA.
6. ACE Coaching / Cheadle Hulme High: https://www.acecoachinguk.co.uk/class-types/holiday-courses/ ; directly verified current provider page confirms October 26–29 and £11.50 half-day/£23 full day; https://www.acecoachinguk.co.uk/home/ has matching dated 14 September 2026 update.
7. TD Sports Academy / Gatley Primary: https://td-sports-academy-limited.classforkids.io/camps ; distinct October holiday camp 26–30, ages 4–11. Price and hours unconfirmed.
8. Perform to Inspire / Gatley URC: https://classforkids.io/en-GB/classes/heaton-moor ; October 26–30, ages 5–12. **Direct October booking URL, hours and price unconfirmed**; do not reuse summer prices.
9. Kitty Watson Academy / Heald Green: https://kw-academy.co.uk/october-intensive ; 26–28 October age 7+ intensive at £120. Site also offers a separately described holiday camp with different price/age details. Do not treat distinct KWA programmes as one.
10. Practically Family / Ladybrook, Bramhall: same source as items 1–2.
11. Fun Fest / Queensgate, Bramhall: https://fun-fest.co.uk/cheview/ ; 26–30 October current 2026/27 listing; £24 half, £40 day, £180 week. Payment-method transfer warning.
12. Fun Fest / Cheadle Heath Primary: https://fun-fest.co.uk/cheadleheath/ ; 26–30 October; £24 half, £40 day, £180 week.
13. Elm Cottage / Didsbury Road Primary, Heaton Mersey: https://bookings.elm-cottage.com/didsbury-road/ ; 26–30 October; ages school Reception–Year 6, £21/£35, 07:45–18:00.
14. Junior Sport Stars / Sunaco House, Heaton Mersey: https://junior-sport-stars.classforkids.io/camp/291 ; 26–30 October, ages 5–14, £32/day £150 week; early/late add-ons.
15. Junior Sport Stars / Tithe Barn, Heaton Moor: https://junior-sport-stars.classforkids.io/camp/294 ; 27–29 October, ages 4–12, £20 half / £30 day / £90 programme.
16. 8BY8Football / Handforth Grange: https://8by8football.classforkids.io/camp/145 ; 27–29 October, ages 4–11, £18 half / £30 day / £90 programme; early/late add-ons.

17. Edstart South Manchester / St Peter’s Catholic Primary, Newall Green, Wythenshawe: https://edstart-south-mcr.classforkids.io/camp/80 ; 26–30 October, ages 5–14, £20/day £90 week, 9am–3pm with paid early and late options; organiser claims Ofsted registration and Tax-Free Childcare. Describe only as provider claims until independent checks are complete.\n18. Progressive Sports Manchester / Baguley Hall Primary: https://progressive-sports-manchester.classforkids.io/camp/432 ; 26–29 October, ages 5–12, £20/day £70 four days, 9.30am–3pm; activities and direct booking page confirmed.\n\n## Reserves NOT listed because current suitability remains unconfirmed
- Fun Fest Bolshaw, Heald Green SK8 3LW: venue and Ofsted record exist, but October 2026 dates or operation at this venue not independently established. https://reports.ofsted.gov.uk/search?order=desc&q=SK8+5ET&rows=10&sort=relevancy&start=60&status%5B0%5D=1
- ZoZo's Day Nursery, Gatley: provider advertises October holiday club but eligibility, dates/ages/fees require confirmation. https://zozosdaynursery.co.uk/
- Elm Cottage Hursthead search has occasionally served cached May content; inspect live page on final check.
- Sport First / St Winifred's (19–23 October), Fun Fest Altrincham (19–30 October), other Stockport/Manchester providers: earlier/greater catchment. Do not add as 26–30 listings without an intentional scope change.

## Checks performed on expanded branch
- Programme data: 18 unique named venue/programme entries; no duplicate venue; all age ranges valid; all days within 26–30 Oct.
- Core SK8 9 and nearby 9; location options cover all 9 areas.
- New `Gymnastics` type option added for appropriate entries.
- GitHub inline JS parsing passed and there were no structural data issues in source test.\n- A separate standalone HTML preview mirroring the 18 venue datasets was tested using headless Chromium at 1280px, 390px and 360px: 18 cards, zero JS errors, zero horizontal overflow. Gatley area returned 2, Gymnastics 2, Friday 13, age 3 returned 5, and no-match state appeared correctly. **This is a real standalone browser test, but NOT yet a Cloudflare production/branch deployment QA test.**
- Cards use textContent and external links; no fabricated safety endorsements or paid placements.
- Existing noindex retained: correct while unpublished, not appropriate if intentional search indexation.
- Correct genuine SK8 Scoop logo still referenced, no SVG or third-party decorative images.

## Release blockers / open QA
1. Confirm Cloudflare hosted branch preview loads; conduct tablet + deployment browser QA, keyboard navigation, and inspect outbound destinations. Desktop and 360/390px behaviour already tested in the standalone HTML preview only.
2. Direct confirmation of TD hours/price, Perform to Inspire October booking route and Kitty programme differences. Where not obtainable, withhold any specific unverified fields or drop candidate.
3. Recheck all source links and that October sessions are still bookable. Never present historic availability as current.
4. Publish/merge/Cloudflare deployment only on Paul's approval and after active preview, accessibility and external-link tests.
5. Add link from Halloween guide only after the finder is genuinely live.
6. End-of-season review/remove/redirect after 30 October 2026.

## Three-cycle critical QA
1. Reader value: original six were insufficient; expanded to 16, split core SK8 vs sensible nearby, reclassified provider locations, added area/type filters.
2. Source quality: dated 2026 primary booking sources prioritized; unclear price/hours clearly marked; excluded Bolshaw and ZoZo until supported.
3. Trust and risk: no endorsement promise, no paid priority, no booking guarantee, correction route, seasonal expiry and preview-only status.

Status: **EXPANDED 18-LOCATION DRAFT, standalone browser QA PASSED, still not publish-ready**.