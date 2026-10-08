# October 2026 Holiday Club Finder — staging QA and guide handoff

Checked: 8 October 2026. Feature branch: `feature/october-holiday-club-finder-2026`. Draft PR #189. Production not changed.

## Sources and editorial decisions

- Stockport Council 2026–27 term dates: standard autumn half-term 26–30 October 2026 (https://www.stockport.gov.uk/school-term-dates/2026-to-2027-term-dates). Individual academy/independent calendars may differ.
- Practically Family: organiser confirms Greenbank Preparatory, Cheadle Catholic Infant and Ladybrook Primary, 26–30 October 2026, ages 3–11, £20 / £30 / £40 for 9am–1pm / 9am–3pm / 8am–6pm. Voucher/Tax-Free Childcare published, but do not claim that individual places remain available. https://practicallyfamily.co.uk/holiday-club/book and https://www.practicallyfamily.co.uk/our-clubs
- Junior Sport Stars: Lane End Primary School, 26–30 October, ages 4–12 with Reception restriction for four-year-olds; 9am–3.30pm £30/day, £125/week, £20 morning half-day. Paid early and late options. Source: https://junior-sport-stars.classforkids.io/camp/293 . Verify live places again before releasing.
- Kitty Watson Academy: provider's October Intensive page presents a three-day £120 age 7+ option, whereas its holiday-camp page presents a £90 camp with a different age description. Same provider publishes contradictory October price/programme information. Draft deliberately asks readers to confirm. Direct confirmation needed before headline prices are published. https://kw-academy.co.uk/october-intensive and https://kw-academy.co.uk/holiday-camps
- Perform to Inspire Events: 26–30 October 2026 at Gatley URC, ages 5–12 listed in ClassForKids discovery results (https://classforkids.io/en-GB/classes/heaton-moor). An exact October 2026 booking route, hours and pricing **not confirmed**. Older 2024/February 2026/summer 2026 camp prices must NOT be passed off as current October prices.
- Ladybrook is outside core SK8 and deliberately labelled nearby.

## Code/structural checks performed
- All 4 controls, result counter, no-results panel, filtered render function, and select event listeners found in current branch source.
- Cards use textContent for source data, not unsafe innerHTML.
- Mobile CSS media queries provided, actual viewport screenshot not yet obtained.
- noindex,follow retained during testing; cannot launch for SEO while noindex remains.
- Real SK8 logo referenced, no extra visual assets or SVG introduced.
- Kids & Family cross-link added **on staging branch only**.

## Still to perform BEFORE publishing
1. Obtain actual Cloudflare staging preview URL and run rendered mobile (360–390px), tablet and desktop visual checks. JS runtime/filter interaction tests, including no-match states. A static code inspection is not a browser test.
2. Verify that all provider links resolve to correct current club, not an unrelated result; direct provider confirmation for the disputed and unconfirmed entries.
3. Confirm page is accessible without login, image assets are present, no browser errors; inspect heading structure, contrast, keyboard navigation and external link behaviour.
4. Confirm guide destination and its canonical editing source; add a contextual link only after the finder is live and approved. Suggested link: **Find an October holiday club around SK8** with description **Compare dates, ages, times and costs; check places directly with providers.**
5. Before live release, decide indexing policy: keep noindex for small experimental guide-only distribution OR remove it once genuinely publication-ready and SEO desired. Record Paul's approval for production merge/deploy.
6. Plan to archive, update or redirect this dated page after 30 October 2026. Do not display expired holiday clubs as current.

## Critique cycles
1. Reader utility: prioritised date/age/area filters and direct booking actions; retain small scope.
2. Evidence: replaced generic/unrelated booking search, marked unknown hours/prices, highlighted conflicting Kitty Watson descriptions.
3. Trust/UX: no independent provider approval claim, clearly no paid placement; status noindex; added corrections path and sensible cancellation/booking caution.

**Status: WORKING DRAFT, NOT PUBLISH-READY.**