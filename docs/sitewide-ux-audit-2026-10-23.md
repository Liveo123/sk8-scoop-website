# SK8 Scoop: Whole-site reader-first UX and publishing system review
Date: 23 October 2026
State: DRAFT / PREVIEW / production release not authorised

## Scope, authority and evidence

This extends the approved homepage methodology to the connected SK8 Scoop site. It is a **site-wide UX programme**, not a claim that every historical or external microsite has been edited. Canonical production source: `Liveo123/sk8-scoop-website`, `main` after the approved PR #240 merge, commit `0897e2c`. The new changes are confined to a separate preview branch.

Site surfaces reviewed in source: homepage; global navigation and search; What’s On agenda/calendar; search; Guides and Free & Cheap; Kids & Family/holiday-club finder; Around SK8 and the four core area hubs; My SK8; latest/archive; public submission/contact; advertiser and policy routes; sitemap. The sitemap contains **66 declared URLs**, including the main guides and local article pages. Some tools and independently hosted guides have their own design systems and are not silently modified by shared CSS.

Authority: latest explicit owner direction; current 01 Company Operating Manual, 02 Brand Manual, 03 Website & Digital Estate Manual; actual GitHub source; current owned event/guide source; tested preview. Search-engine cached versions are not evidence of today's live build.

UX research references:
- NN/g: *Information Scent: How Users Decide Where to Go Next* (meaningful links and correct first-screen context).
- W3C WCAG 2.2: consistent navigation, visible keyboard focus and usable targets.
- GOV.UK / DfE / DWP filter guidance: results-first filtering, visible active states, unambiguous reset and mobile testing before adding filter complexity.
The aim is not to imitate a giant tourism portal or expand a thin dataset with filler.

## Two mandatory, independent product gates

**NUE (Next Useful Experience):** Every meaningful route must solve the visitor's immediate task first. It should open the specific checked destination or verified organiser route, not an unnecessary gateway; include only a genuinely relevant continuation or a deliberate STOP; provide an honest result when content is missing or expired.

**JiveLoop Collective / media group:** Each feature must create a defensible reader relationship, reusable verified content/data, lower maintenance cost or sustainable commercial value without changing editorial ranking for advertisers. Shared code is *potential* infrastructure for another title, not proof of geographic demand or revenue.

**Hard release gates:** source accuracy, accessibility, privacy, brand and image rights, clear advertising labelling, navigation continuity, exact branch preview, usable phone/keyboard workflows, forms and guardrails. Do not average an NUE failure against a strong business score.

## Twenty-pass criticism-and-fix review

Each pass names the issue and the decision. PASS means existing source already reasonably handles it; FIX is on the site-wide preview branch; MEASURE means evidence is pending.

| # | Critical check | Finding and correction | Gate |
|---|---|---|---|
| 01 | Clear overall mission | Home finder now answers “something to do” before signup; PASS. | NUE |
| 02 | Navigation has one owner | Both `config.js` and `site.js` rewrote the header; FIX: `site.js` is sole nav authority. | Reliability |
| 03 | Can readers discover editorial/locality content? | Around SK8 existed but was absent from final main nav; FIX: explicit Explore SK8 route and active state for locality/content hubs. | NUE |
| 04 | Are headings/purposes labelled consistently? | Distinct What's On/Explore/Guides/Search/Join tasks remain; no replacement generic “Discover more” cascade. | NUE |
| 05 | Are event records equally trustworthy in all entry points? | Search showed non-example records even if unverified; FIX: checked/verified status and shared UK date semantics. | Trust |
| 06 | Does a search event open its own verified facts? | Search went straight to mixed outside booking links; FIX: one stable checked SK8 detail first. | NUE |
| 07 | Do recurring/ongoing event dates mislead? | FIX: specific confirmed occurrences and daily rules from shared calendar; ambiguous ranges aren't asserted as sessions today. | Trust |
| 08 | Can a search visitor clear restrictive filters? | No direct reset; FIX: visible one-tap Clear filters when applied. | Accessibility/NUE |
| 09 | Can calendar visitors escape a narrow date/area view? | Clear date existed but not reset-all; FIX: a single clear-all event filters control. | NUE |
| 10 | Are empty results truthful and useful? | Existing routes preserved; search no-match wording shortened and a clear-filter recovery added. | Trust |
| 11 | Does Guides show useful content before a long membership explanation? | Newsletter unlock paragraph dominated top; FIX: compact optional explanation above the guide chooser. | NUE/owned audience |
| 12 | Are dated guide claims internally consistent? | Free & Cheap shelf claimed 30 Sep despite 17 Oct actual guide revision; FIX: align to 17 Oct. | Accuracy |
| 13 | Are seasonal counts consistent and correctly timed? | Halloween card claimed 40 while other guide pages differ; FIX: remove uncertain count from shelf, preserve official guide contents. | Accuracy |
| 14 | Are future products competing with current choices? | Two in-development guide cards took the same weight as ready guides; FIX: collapse into a clearly labelled future shelf. | NUE/production time |
| 15 | Do existing guide subscribers face repeated acquisition pressure? | Keep functioning API-based subscriber access; the new explanation is optional, not a new gate. Test recognised and new contexts. | NUE/owned relationship |
| 16 | Is search visibly and accessibly discoverable throughout the site? | Header search uses labels but contained prohibited inline SVG; FIX: semantic/CSS lens, no JS-executed vector icon. | Brand/accessibility |
| 17 | Are keyboard focus and small controls predictable? | Mobile layouts have mixed inherited button/focus styles; FIX: scoped shared 44px controls and clear focus for updated surfaces. | Accessibility |
| 18 | Are local hubs already using checked and relevant routes? | Four core place hubs link their area-specific What’s On feed; PASS. Avoid another redundant hub layer. | NUE |
| 19 | Does the index accurately reflect changed landing pages? | Sitemap lastmod dates behind recent releases; FIX: update actual homepage, guides and What's On modifications without indexing intentionally noindex personal/seasonal tools. | Findability |
| 20 | Do these changes prove a valuable media group? | NOT YET. Measure useful event detail, successful guide access, reader return/signup and maintenance time before claiming uplift or transferring patterns to a new publication. | Empire |

## Ten concrete site-wide change packages implemented

1. **Single navigation authority:** remove old menu rewrite from public config; retain central header in `site.js`.
2. **Real editorial discovery in header:** add Explore SK8 to the shared nav and highlight the correct parent on locality/article pages.
3. **Search uses verified current event inventory:** same status, UK-day and occurrence semantics as What's On.
4. **Search results connect to complete events:** internal `/whats-on/?event=…` rather than blind offsite jumps.
5. **Recovery from narrow search filters:** clear active type/area with one accessible action.
6. **Recovery from narrow event filters:** reset area, date and event-type controls together.
7. **Useful guides before marketing copy:** fold subscriber-shelf explanation into an optional accessible disclosure.
8. **Accurate, prioritised guide shelf:** corrected last-updated label, removed uncertain Halloween item count, collapsed in-development cards below the usable products.
9. **Shared accessible style and source-first icon:** reusable sitewide stylesheet, focus indication, 44px controls, CSS header magnifier in place of inline SVG.
10. **Source and release verification:** update actual sitemap lastmod dates, add sitewide source/browser QA and exact-preview CI, preserving site ownership and approval gates.

All changed routes and shared code must pass checks; these are preparations on a preview branch, not live claims.

### Screenshot-led refinements after the first full browser review

The first tested preview passed 49 dedicated sitewide browser assertions, but screenshots exposed avoidable first-screen friction:

- **Guides:** its large mobile headline pushed usable guide choices below the first screen. Changed to “Find a useful local guide.” and lowered the responsive font size.
- **Guide finder:** a prominent shortcut led to an unreleased “50 Secrets” card inside a collapsed section. Replaced it with a functioning Kids & Family route. Unreleased products remain clearly marked in the optional future shelf.
- **Optional consent:** the mobile notice covered too much of the reader's first task across search, guides and events. Use a more compact notice with equally available Allow and Reject choices and a distinct granular-controls path. This does not change the consent logic or enable tracking without permission.
- **What’s On:** three full-width buttons initially appeared equally important. Retained “See current listings” as the only primary action and converted My SK8 and Submit an event into distinct, accessible secondary links, keeping actual button text white.
- **Navigation:** the first ordering inserted Explore SK8 between What’s On and My SK8, violating the existing saved-ideas continuity contract. Reordered to preserve What’s On → My SK8 adjacency, with Explore SK8 still directly discoverable.
- **Integrity:** source and browser regression assertions cover all the refinements. Do not describe any static label/link change as measured behaviour improvement before a visitor test.

**Release remains draft** until the latest exact SHA checks, guide functions and preview screenshots are all green. Do not merge this second PR as part of the already-approved homepage release.

## Site-wide NUE journeys

| Reader arrival | First useful experience | Correct next action | Return/asset opportunity |
|---|---|---|---|
| Search engines, social, direct home | Find events, guides, local updates | Specific verified result or honest no-match | Repeat utility; link to free weekly email only when relevant |
| What’s On date/area filters | Accurate future checked events | Exact event details, source/booking or STOP | Event reuse in site/newsletter/guides |
| Search for a dated activity | Verified event, correct occurrence | Internal detail with organiser link | Useful intent, not blind external click |
| Family parent planning half-term | Live clubs/family ideas | Checked organiser information or HAF eligibility source | Reusable school-break workflow |
| Guide browser, already subscribed | Available guide directly | Save/plan related item or STOP | Less re-entry friction, repeat readership |
| New guide browser | Available options and transparent access instructions | Subscriber shelf when necessary; no fake scarcity | Email relationship earned by utility |
| Locality/issue story | Authoritative local detail | Related current local hub, relevant checked event or STOP | Original editorial asset |
| Community contributor | Correct submission/contact route | Confirmation and no forced second task | Verified local content pipeline |
| Suitable local advertiser | Clearly labelled paid options and booking information | Permitted sales enquiry | Sustainable separate commercial value |

## First three controlled post-release experiments

1. **Relevant search success:** count proportion of search sessions that lead to a *current verified* event detail or useful guide; compare with baseline (not raw search clicks alone). Track aggregate types, never raw private queries.
2. **Guide usefulness and voluntary joining:** compare meaningful guide-open rate and verified subscriptions when available guides precede the membership explanation; monitor any rise in confusion/support messages.
3. **Explore vs route confusion:** measure whether the shared Explore SK8 nav leads to actual area/article engagement or simply displaces previously useful navigation; retain the change only if discoverability improves without crowding phones.

Required after-production proof: privacy-safe measurement, comparison window, owner time cost, failed searches and honest adoption/change/stop decision. No fabricated conversions or projected empire value.

## Preview QA checklist and remaining boundaries

- Public production build from homepage PR #240 is *merged* at `0897e2c`. Independent Cloudflare live version/traffic checks are required before calling it verified live; stale search-index snapshots are not proof.
- New site-wide design stays on `preview/sitewide-nue-ux-2026-10-23` for owner review; **no second production merge is authorised yet**.
- Check one instance per page template: Home, What's On, Search, Guides, Free & Cheap landing + direct full guide, Holiday Club Finder, locality hub, editorial article, My SK8, Join, Submit, Advertise, legal policies.
- Check 390px/768px/1366px (and 1200px header breakpoint) with keyboard; no horizontal overflow; navigation and filter-reset state, guide disclosure, membership recognition and accurate event deep-links.
- Audit links, homepage/current issue, expiry, consent, policy labels, accessibility, no inline SVG, no content invented, no advertiser/sponsor editorial promotion.
- Keep rollback and post-merge production smoke steps separate from preview QA. Do not publish work-in-progress guides or remove source evidence.

