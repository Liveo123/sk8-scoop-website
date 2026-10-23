# SK8 Scoop: 20-pass usability criticism and corrective release
23 October 2026 | Owner review version | Branch: `preview/usability-20-pass-20261023`

## Evidence and boundaries

Basis: current GitHub `main` and source for `/`, `/whats-on/`, `/search/`, `/guides/`, `/my-sk8/`, navigation and event/calendar scripts; current Brand, Company and Website manuals; owner-approved October homepage imagery. The public web index is **stale (Issue 6)**, not reliable for the current page; do not treat it as a current screenshot. This is a source-grounded **heuristic review**, not a study of actual visitor recordings or measured conversion lift.

## Twenty distinct criticism and correction passes

| Pass | Usability lens | Critical observation / failure to test | Decision / mitigation | State |
| --- | --- | --- | --- | --- |
| 01 | First 5 seconds | Homepage asks visitors to choose between broad search, dates, places and an email before explaining the difference. | Explain full-site search versus current-event shortcuts. | Implemented |
| 02 | Information architecture | Nine equally weighted header destinations make core reader tasks harder to spot. | Prioritise five reader routes; put publisher and support routes in More. | Implemented |
| 03 | Mobile menu | Long mobile lists force extra scanning and crowd the first view. | Group four less-used items; keep links one extra tap away. | Implemented; mobile QA required |
| 04 | Keyboard exit | The mobile menu only toggled by clicking Menu, with no Escape handling. | Escape closes secondary menu then primary; returns focus. | Implemented; keyboard QA required |
| 05 | Editorial/commercial distinction | Contact and Advertise have same visual priority as What’s On. | Retain accessible commercial pages without occupying the first row. | Implemented |
| 06 | Search intent | A homepage search points to site-wide search while surrounding shortcuts filter events. | Explicitly describe the search scope and connect label to guidance. | Implemented |
| 07 | Decision overload | Seven homepage chips, four location links and multiple rows compete for attention. | Show four popular shortcuts; move remaining choices into a labelled disclosure. | Implemented |
| 08 | Popular task speed | “Free this weekend” took a sequence of incompatible choices. | Add direct shortcut into a shareable combined What’s On state. | Implemented |
| 09 | Filter independence | Weekend / Free were mutually exclusive; cost and date could not be combined. | Separate When, What kind and Where. | Implemented |
| 10 | Family affordability | Even after splitting date, Free vs Family was still mutually exclusive. | Make Free and Family individually togglable, including together. | Implemented |
| 11 | Local relevance | An area choice must coexist with date and family/cost, not overwrite them. | Preserve existing area state while toggling the other two dimensions. | Implemented |
| 12 | Link durability | Newsletter/home links use legacy `?filter=free` and `?filter=family`. | Preserve both; use `?filter=weekend&type=free-family&area=Cheadle` for combinations. | Implemented |
| 13 | Feedback | Visitors cannot always tell which filters are active or why a short list appears. | Add visible, live-updated result description and pressed states. | Implemented |
| 14 | Recovery | No-results card offers unrelated onward links but lacks a direct all-event reset. | “Show all checked events” button in the empty state. | Implemented |
| 15 | Calendar parity | The month panel did not apply day filters, so dates could look available in the wrong view. | Apply date, free/family and area rules to month-day counts. | Implemented |
| 16 | Time semantics | Broad date ranges must not masquerade as verified individual sessions. | Preserve the SK8 calendar core and existing verified-date policy. | Existing guardrail retained |
| 17 | Touch and focus | Dense filter chips and smaller labels are vulnerable on phones. | Minimum 44–46px targets, clear pressed/focus states, responsive groups. | Implemented; device QA required |
| 18 | Reader trust | An empty listing is better than unverified filler or paid ranking. | Preserve verified events source, freshness display and editorial independence. | Existing guardrail retained |
| 19 | Saved-list expectations | My SK8 is browser-local; visitors might assume saved items sync across devices. | Preserve explicit browser-only disclosure and My SK8 route; don't promise sync. | Existing guardrail; sync deferred |
| 20 | Proof of improvement | Appearance preferences and static QA do not prove usability or conversion lift. | Compare desktop/mobile screenshots and actual tasks; measure relevant clicks and failure/empty resets after owner approval. | Browser QA and post-release measurement outstanding |

## High-value user journeys

1. **Free family ideas this weekend in Cheadle:** Choose Weekend + Free + Family-friendly + Cheadle. Results must be the intersection, not a union. Link state should be shareable.
2. **Already saw a link to `?filter=free`:** Existing link must still select free listings and show accurate counts.
3. **Nothing matches:** One action resets all conditions and returns to available checked events.
4. **On a phone:** Menu > More reveals Submit, Contact and Advertise; Escape closes without trapping navigation.
5. **Unsure where a story lives:** Full-site search must clearly search events, guides, stories and updates.

## Scope protection

- Do not change advertiser ranking, paid placements, prices, tracking consent or MailerLite forms.
- Do not add or invent local events or reinterpret date-range data.
- Keep previous approved photo/illustration assets and brand logo unchanged.
- The index currently shows Issue 17; do not silently update editorial copy without issue/source verification.
- Use the exact Cloudflare preview revision. Never infer it from a URL slug alone.
- **Do not merge or deploy to production until owner review/approval.**

## Release gates

1. Source QA + existing regression suite successful.
2. Rendered Chromium desktop/mobile: no overflow, adequate focus/tap targets, persistent filter state, correct calendar dates, newsletter signup not broken.
3. Verified preview source hashes match branch assets; owner reviews.
4. After approved release: Cloudflare success, direct live checks, and follow-up measures of What’s On filter use, no-result resets, key event detail clicks, My SK8 continuation and newsletter signup conversion (excluding housekeeping).
