# The Great Indoor Play Guide — V3 quality audit

**26 November 2026 · Draft for editorial approval · Not deployed**

Scope: the original V2 draft and the revised V3 guide, live finder, holiday-club panel, supporting web article, newsletter excerpt, source data and build procedure. Both scores are editorial assessments using the same weighted rubric, not independently measured user satisfaction or venue scores. Browser verification is of the complete offline review version, not a hosted Cloudflare preview. The full production changes are in draft [PR #332](https://github.com/Liveo123/sk8-scoop-website/pull/332).

## Comparative rating

| Criterion | Weight | V2 | V3 | Rationale |
|---|---:|---:|---:|---|
| Factual accuracy and price integrity | 15 | 12 | 13 | Baby tariffs, product age constraints and conflicting Wild Things data clarified. Live checkout still unverified. |
| Practical reader usefulness | 15 | 12 | 14 | Instant shortlist and no-result recovery; all 15 detailed profiles retained. |
| Interactive usability | 15 | 8 | 14 | Native selectable chips, immediate matching count and cards, separate removal of budget. |
| Clarity and information hierarchy | 10 | 7 | 9 | Controls first, results immediately following, optional editorial navigation, visible price assumptions. |
| Visual presentation | 10 | 6 | 8 | More distinctive teal finder, tidy holiday panel, prominent type and price treatments; no cleared photography. |
| Accessibility | 10 | 7 | 9 | Native keyboard radios, labelled controls, live status, checked-state symbol, 44px targets, no-JS fallback. No formal screen-reader audit. |
| Engagement and editorial voice | 10 | 7 | 9 | Sharper rainy-day introduction and clear article-to-guide action. |
| Evidence and editorial independence | 5 | 4 | 4 | Sources and confidence preserved; review evidence is incomplete, no invented scores. |
| Cross-file consistency | 5 | 4 | 5 | Article, newsletter, data, static guide and links aligned; no duplicate IDs or unresolved local fragments. |
| Maintainability | 5 | 4 | 4 | Builder updated for new structure; new venue type/product-age rules need review; hosted build not run here. |
| **Total** | **100** | **71** | **89** | **+18 points** |

## Twenty-pass criticism and improvement record

| Pass / perspective | Criticism or check | Fix or decision and verification |
|---|---|---|
| 1. Busy parent | V2 makes the reader scroll past other sections to notice filter results. | Results immediately follow the finder; live shortlist inside it. Verified result ordering. |
| 2. Interaction designer | Selection feedback was weak; changing a filter did not visibly communicate a new result set. | Native area and budget radio chips, selected tick and live count at the top and summary. Verified actual clicks and keyboard changes. |
| 3. Family with siblings | Admission assumption could be mistaken for a per-child price. | Exact ages for one or two children; example ages 2 and 5 only when no ages selected. Explicit one-adult context. Verified single and two-child quotes. |
| 4. Parent with baby | Some infant tariffs vary by months or require a paying sibling. | Verified and recorded Let Loose, Tumble Jacks and Curious Little Ones infant rules; added £6.95 solo baby + adult; Little World pre-walkers noted. Unknown month-sensitive totals stay unknown. |
| 5. Budget-conscious reader | Unknown or outdated prices must never be treated as cheap. | Retained null handling; fixed-price matching excludes unknown and stale prices. Added count of other potentially suitable venues with unconfirmed prices and remove-budget action. |
| 6. Subject expert | Exact play-type labels hid useful hybrid venues and Oxygen has different age bands for different products. | Consolidated facets: soft play, pretend play, adventure, climbing, play café. Explicit Oxygen 0–5 soft play and 4+ open play rules. Tested hybrid results. |
| 7. SEND family | Sensory sessions cannot be priced using standard tariffs. | Dedicated-session control and explicit special-session price notice. Oxygen SEN 4+ respected; standard budgets not applied to special sessions. |
| 8. Empty result | A zero-match result needed a direct recovery rather than scrolling back. | Empty state with clear-all action and independent remove-budget action. Tested reset and focus restoration. |
| 9. Local editor | Wider-area listings should not displace SK8; moving recommendations below listings could hide them. | SK8-first geographic grouping preserved; explicit shortcuts to editorial picks and price comparison added. |
| 10. Visual designer | Generic finder controls and holiday club callout lacked a strong reading hierarchy. | Deep-teal finder heading, cream/white surfaces, selected states, grouped controls, tidy holiday panel, large price/count typography. |
| 11. Mobile reader | Long text and narrow price columns caused poor scanning; first screenshots showed a price wrapping. | Shorter labels and helper copy, flexible layout, minimum price width, compact cards. Re-rendered mobile and desktop. |
| 12. Accessibility reviewer | Colour alone and mouse-only controls would exclude users. | Native radio labels, tick, keyboard focus, checkbox, labelled selects, aria-live count. Keyboard arrow test passed. |
| 13. Touch interface | Small targets and overflow were possible on older phones. | Measured chip targets >=44px and checked horizontal overflow at 320, 390, 768, 1024, 1280 CSS px. |
| 14. Low-connectivity reader | JavaScript failure should not hide listings or leave inert controls visible. | Static full profiles remain readable; live controls start hidden until initialisation. Tested no-JS fallback. |
| 15. Researcher | Conflicting tariffs cannot become a confirmed price. | Head Over Heels alternatives disclosed; Wild Things older operator snapshots disagree (including £7.50 and £9.50 child prices), so summary says Check price. Retain source and no budget match. Remove unexplained price asterisks. |
| 16. Practical visit planner | Hidden costs and booking rules need to be visible. | Retained booking, duration, facilities, addresses, grip-sock/supervision rules and per-venue source links. Visible checked dates. |
| 17. Trust reviewer | A numeric venue ranking would imply evidence not yet available. | Retained eight research-led picks and eight limited review observations, not numeric venue ratings, inspections or paid rankings. Text-first, no unlicensed photos. |
| 18. Newsletter editor | Article headline and first paragraphs needed a stronger, concise reason to click. | Sharpened price hook, consistent article and newsletter opener, prominent guide CTA, dated evidence note. |
| 19. Technical maintainer | V2 builder regenerated obsolete type options; changing count via replacement string could be fragile. | Removed obsolete type marker logic, updated template and age tariff validation, explicit callback count substitution. Dataset and generated guide checked for 15 profiles and six fixed example tariffs. Future new categories require deliberate facet review. |
| 20. Sceptical final reviewer | Check for regressions, stale prices, duplicated IDs, missing internal links, broken offline article target and unintended publication. | Repeated Chromium suite (73 assertions) after source and visual fixes; final keyboard, count, article-render and local-target checks passed. Production guide, article, hub and sitemap paths present on draft branch; no duplicate guide IDs or unresolved local fragments. Direct browser file/URL navigation is blocked in the test environment; hosted verification remains a release gate. Nothing merged or sent. |

## Ranked 10 highest-impact implemented changes

1. Immediate filter selection and live count (very high): eliminates uncertainty about whether a choice worked.
2. Visible shortlist and matching cards directly below the finder (very high): removes the biggest scrolling problem.
3. More readable, mobile-first finder and holiday panel (high): creates a clear visual hierarchy.
4. Transparent personalised family estimates and infant tariff rules (high): avoids misleading household costs.
5. Clear unknown-price exclusions and recovery actions (high): readers understand why a venue is absent and can broaden just the budget.
6. Combined play categories and product-specific age limits (high): makes filters reflect the activities parents actually seek.
7. Accessible, large native controls with keyboard and no-JS fallback (high): works for more readers and failure modes.
8. Preserved editorial picks and fast jump links (medium-high): preserves existing editorial value without obstructing the finder.
9. Stronger launch article and matching newsletter opening (medium-high): makes the transition from email to guide clearer.
10. Data/build/price freshness alignment (medium-high): keeps later updates from undoing the interface or silently misquoting prices.

## Verification and remaining gates

- Repeated offline browser checks: 73 assertions; additional final keyboard, top/bottom count, local links and article checks. Five screen widths tested. See `test-results.txt`.
- Source checks: official published pricing pages and venue details checked, with cached dates and conflicts preserved rather than assumed current. Not every booking checkout, secondary review link or on-the-day opening has been independently tested. The web retrieval of the SK8 holiday-club route returned a cache miss; the exact route exists in the repository. October listings remain expired.
- Main price references: https://www.wackywarehouse.co.uk/play-area/greater-manchester/barlow-croft ; https://www.headoverheelsplay.co.uk/prices-wilmslow ; https://www.headoverheelsplay.co.uk/book-tickets-wilmslow ; https://tumblejacks.co.uk/contact-us/ ; https://letlooseplay.co.uk/hazelgrove/play/ ; https://www.curiouslittleones.co.uk/pricing ; https://www.runofthemillplaycenter.co.uk/prices ; https://oxygenactiveplay.co.uk/activity-parks/wilmslow/ ; https://www.wildthingssoftplay.co.uk/about ; https://www.littleworldforscholars.co.uk/pricing/ ; https://www.playfactore.com/prices/ .
- The guide is still a research-led guide, not a safety assessment. No numerical venue score until stronger comparable evidence is available. No cleared documentary venue photos or embedded overview map; individual map links remain. No full screen-reader audit or iOS Safari verification.
- Offline review has complete venue notes and local article links, with a simplified masthead rather than the shared live site header. The screenshot of the isolated finder is captured without the sticky offline masthead. Production CSS/navigation and hosting must be checked on a verified hosted preview before merge. Browser direct URL navigation is blocked by test policy; reciprocal relative target existence and article rendering were checked separately. No production deployment has been approved.

## Review instructions

Extract the ZIP into one folder. Open `indoor-play-preview.html` in a browser (JavaScript enabled) and try £20, SK8, different child ages, and quieter sessions; use `Clear filters` to reset. Open `indoor-play-article.html` to review the full launch article. `newsletter-launch.md` contains exact email opening and proposed tracked link. The website link must only be used after the draft is approved, deployed and checked live. The canonical production files and maintenance script are in draft PR #332.