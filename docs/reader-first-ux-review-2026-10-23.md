# Reader-first SK8 Scoop UX release review, 23 October 2026

## Strategic amendment: two mandatory decision gates (23 October 2026)

**Applies to this redesign and subsequent SK8 Scoop website/UI proposals.** The earlier 30-point audit below is preserved as historical evidence; the new 30-pass protocol below is the repeatable method from now on. This draft release methodology is not itself a change to the Company Operating Manual.

**Strategic north star:** make SK8 Scoop the most useful, trusted local information destination for its SK8 patch while proving a profitable, maintainable local-publication model that JiveLoop Collective can eventually apply to other publications. The weekly newsletter remains the recurring flagship and an important owned-audience asset. Site visits alone, decorative pageviews and ad impressions do not equal a profitable media group.

**Audience → Experience → Revenue** is the non-negotiable commercial sequence. Editorial ranking is independent of payment. SK8-first coverage and current evidence are more important than filling an empty calendar. Future title launches require proven economics and separate owner approval, not simply portable code.

### GATE A: JiveLoop Collective / enduring media-business value

For each substantial feature, record its expected contribution to at least one business asset and the evidence needed to prove it:

1. **Owned relationship:** an earned subscriber, saved-return habit, repeat visit or contribution, not simply more social reach.
2. **Useful editorial/data asset:** verified source material that can power several relevant SK8 experiences without duplicate production.
3. **Repeatable sustainable economics:** plausible advertiser/customer value or a reduction in owner hours, support, content maintenance or acquisition cost; no invented forecast.
4. **Reusable production system:** portable data patterns, components, measurement and QA where justified; local voice, sourcing and commercial terms remain title-specific.
5. **Proof before expansion:** SK8 validation, measurable return and explicit go/no-go criteria before making the solution multi-title or opening another geography.

**Pass** if the feature demonstrably advances a relevant asset or is a justified accessibility, reliability, factual-accuracy or reader-value foundation. **Revise** if it creates maintenance burden or vanity metrics with no demonstrated value. **Reject** if monetisation compromises trust or if expansion is proposed without a bounded proof case. Not every page should sell advertising; a good reader experience may strengthen the commercial system indirectly.

### GATE B: NUE / Next Useful Experience

For each substantial item, complete this journey: **reader moment → immediate useful result → most useful primary destination/action → optional genuinely useful continuation → intended longer-term relationship/outcome**. Record:

- The visitor's purpose and likely entry channel (search, social, homepage, newsletter, guide or returning bookmark).
- A clear first useful result before making a conversion request where appropriate.
- **One obvious primary action**, normally with at most one contextual next step. The next destination may be an external official organiser/booking link, an SK8-owned page, or deliberately STOP / NO-LINK.
- A working direct route to the right content. Do not force repeat signup, a generic hub, empty calendar, unnecessary detours or circular links merely to retain traffic.
- A destination type (**SK8-owned / editorial external / commercial / system**), **LIVE / PLANNED / STOP** state, tracking class and a review/expiry note when needed.
- How the step supports better decisions and optionally creates return use, save actions, the newsletter relationship or appropriate labelled paid visibility.

**Pass** only if the immediate value and useful next step are coherent, or if STOP/NO-LINK is an explicit valid decision. **Revise** if the journey is disconnected, the action merely manufactures clicks, or the reader hits an avoidable gate. **Reject** if a paid placement masquerades as editorial or navigation misleads.

**Both gates are independent. Never average an Empire pass and an NUE failure into a single high score.** Accessibility, lawful processing, accurate claims, editorial independence and live destination checks are hard safety/release requirements, not weighted bonuses.

### Future 30-pass criticism-and-fix protocol

Every pass must log **problem or PASS → evidence → correction (if material) → retest result → effect on Gate A / Gate B**. Challenge the *current revised version* each time. Avoid inventing fixes to satisfy the count.

**Passes 1–10: reader's next useful experience**
1. Is the visitor's current task obvious within the first screen?
2. Can they act without first understanding our internal product structure?
3. Is the immediate answer valuable, locally relevant, fresh and accurate?
4. Does the principal link reach the most useful actual destination?
5. Is an external source a better destination than another SK8 page?
6. Is the next step contextually relevant or merely a click-generation tactic?
7. Is there at most one clear principal action and one justified continuation?
8. Are new visitors and recognised subscribers appropriately routed?
9. Do search/no-results/expired/cancelled cases offer an honest next action or STOP?
10. Can a visitor return to or save the useful result without an unnecessary account?

**Passes 11–20: JiveLoop Collective / media-system value**
11. Which owned relationship becomes stronger, and how will we verify that?
12. Does it create a recurring reason to visit, not a one-time novelty?
13. Does the shared verified research feed newsletter, site and guides coherently?
14. Does the experience reinforce SK8's local identity rather than become generic regional filler?
15. Could it improve advertiser outcomes ethically, without buying editorial ranking?
16. Does it support measurable acquisition, engagement, retention or revenue, not vanity metrics?
17. What owner time, technical cost and ongoing fact-checking burden does it create?
18. Could the useful pattern be replicated under another publication's own brand and geography?
19. Is that portability worth building *now*, or should we prove the SK8 version first?
20. What minimal test would falsify the assumed commercial or audience benefit?

**Passes 21–30: integrity, durability and real-world proof**
21. Are live destinations correctly classified, genuinely working and appropriately direct?
22. Are data dates, event-status semantics, permissions and editorial facts validated?
23. Is paid content clearly labelled, independent of editorial ranking and visibly distinct?
24. Are privacy, consent and link events proportionate and correctly classified?
25. Is the interface usable at 375/390/768/1280px and with touch?
26. Can keyboard and assistive-technology users perform the same tasks?
27. Are performance, offline/data failure and no-match states helpful rather than misleading?
28. Does the change add a new competing gateway or duplicate an existing tool?
29. Does a measurable reader journey improve over baseline in a fair experiment, rather than just move clicks?
30. Is there a documented adoption/rework/stop decision and owner-approved deployment gate?

### Required strategic artefacts before any substantial live UI release

**1. NUE Map** (one row per substantial journey). Required fields: entry/reader need; immediate answer; primary destination; optional continuation or STOP; why it helps; destination class; LIVE/PLANNED/STOP; analytics classification; verification or expiry rule. Never link a PLANNED destination as if it were live.

**2. Empire Asset Map**. Required fields: intended owned-audience or reader-habit benefit; content/data reuse; plausible advertiser or economic value (if any); owner time and recurring maintenance; whether the component is publication-portable; proof criteria; why it is a better use of scarce resources than the displaced work.

**3. Experiment record**. Three controlled experiments per normal website release by default, with one testing genuine continuation or useful reader action. Pre-register hypothesis, baseline, changed variable, success metric, privacy-safe measurement and adopt/change/stop outcome. Avoid changing everything at once and pretending to know the cause.

**4. Two independent go/no-go lines**. Record `Empire: PASS / REVISE / REJECT` and `NUE: PASS / REVISE / REJECT` before release. A release with REVISE or REJECT remains a draft; corrective facts/security/accessibility changes have their own legitimate urgency.

### Application to the ten changes in this draft PR

| Implemented change | Immediate reader benefit / NUE | Enduring SK8 / Collective asset | Gate and required proof |
| --- | --- | --- | --- |
| Discovery section near top | Start with tasks rather than menu structure | Better first useful action / entry to owned SK8 | **REVISE:** still below the newsletter signup hero; test first-screen placement |
| Homepage search | Straight to relevant site results | Reusable discovery pattern | **PASS concept, measurement pending:** verify search outcomes |
| Today / Weekend routes | Relevant events, then details | Recurring weekly visits | **PASS concept:** instrument and compare return usefulness |
| Free-event and Free & Cheap paths | Match today's free event vs durable low-cost option | Evergreen guide + verified events feeding separate intents | **PASS concept:** avoid unnecessary guide signup for entitled readers |
| Family events | Filter checked events | Repeat family discovery | **PASS concept:** check inventory and empty state |
| Holiday club finder | Help with current school-break planning | Reusable seasonal verified-data workflow | **PASS concept:** check destination and expiry |
| Outdoors | Discover practical walks and days out | Durable evergreen site content | **PASS concept:** route-specific BEFORE YOU GO facts where verified |
| Core-area shortcuts | Prioritise immediate local relevance | Geographic model that can later be configured per title | **REVISE:** geography is currently hardcoded, local-first ranking not fully tested |
| Four checked upcoming event cards | Display a real answer and a detail page | Shared events feed for site, newsletters and guides | **PASS concept:** now strengthen continuation tracking and cost/location QA |
| Empty/error fallback and saved routes | Avoid dead ends, enable future return | Reliable UX and owned return habit | **REVISE:** simplify competing CTAs and prefer a direct useful guide destination |

These are **conceptual reviews, not validated improvements**. No claim of audience growth, return visits or advertiser uplift follows until real testing.

### Initial NUE Map for this draft release

| Entry / need | Primary useful route | Optional next useful experience | Type and status | Control |
| --- | --- | --- | --- | --- |
| Homepage: find something today | `/whats-on/?filter=today` | Checked event detail when available | SK8-owned / LIVE in source | Verify event dates and card clicks; empty result stays honest |
| Homepage: free activities | `/whats-on/?filter=free` | Direct Free & Cheap content if the event selection is thin | SK8-owned / LIVE in source | No invented “free” status or forced repeat capture |
| Homepage: family time | `/whats-on/?filter=family` | Family or holiday club finder if relevant | SK8-owned / LIVE in source | Confirm useful age/location/booking details |
| Upcoming homepage event | `/whats-on/?event=<verified-id>` | Event page's own guide/save/outbound organiser next step where useful | SK8-owned / LIVE conditional on event | Keep the exact verified event ID and dynamic expiry |
| Locality quick links | `/whats-on/?area=<core-area>` | An actual listing or related local resource | SK8-owned / LIVE in source | Core SK8 first; all-area fallback when no verified local result |
| Visitor has found a useful idea | Full What’s On or saved list | `/my-sk8/` as optional return utility | SK8-owned / LIVE in source | One contextual continuation, not an equal-weight link farm |
| Feed unavailable / no eligible events | Direct evergreen Free & Cheap content | What’s On only as secondary option | SK8-owned / LIVE in source | Do not link only to another broken feed |
| Newsletter acquisition | Existing hero or join route | Latest Scoop and useful guides for recognised readers | SK8-owned / LIVE in source | Offer value before coercive signup; no fake scarcity |

**Outstanding acceptance gaps:** (a) hero/signup is still the first screen for many users; (b) reader-first routes are SK8-specific and have not yet been abstracted into a portable component; (c) return use, source-to-subscriber conversion and advertiser outcomes are hypotheses; (d) no observed user testing has established that the new finder beats the current page; (e) the number of discovery choices needs mobile usability testing.

### Release metrics relevant to BOTH ambitions

- **Immediate value:** proportion of homepage visitors who reach a relevant checked event, guide entry, route or confirmed external organiser link; no fake result counts.
- **NUE continuation:** fraction of useful journeys leading to a second meaningful, contextually justified SK8-owned action (directional SK8 Continuation Rate; privacy permitting), alongside no-click STOP cases.
- **Owned relationship:** verified newsletter signups, return use, saves, meaningful contributions. Never conflate link clicks with real subscribers.
- **Business economics:** actual advertiser enquiries and outcomes, renewals and measured revenue, plus content maintenance hours and delivery cost.
- **Replicability:** measured reuse of code/content-schema and time saved in SK8; ability to transfer the pattern is a future hypothesis until a bounded second-title pilot is approved.


## Research and design basis
- Nielsen Norman Group: homepage clarity, information scent, visible actions and scanning.
- Baymard Institute: category navigation, search, and reducing choices.
- GOV.UK Design System: task-focused content and useful filters.
- WCAG 2.2: labels, keyboard focus, contrast and touch targets.
- Time Out and Visit Manchester: date-led discovery and editorial identity.
These are pattern references, not user testing or a claim that SK8 matches those publishers' inventory.

## 30 criticism passes: risk and corresponding correction
1. Newsletter-first hero could overwhelm task seekers: put activity finder directly after hero; final goal should test moving it above signup.
2. Too many gateways: consolidate entry to core event calendar, existing guides and search.
3. Visitors need an immediate answer: display four current checked listings.
4. Content can be sparse: provide helpful guide fallback.
5. Dates can be wrong for UK viewers abroad: use Europe/London via shared calendar core.
6. Ongoing range is not proof of daily sessions: do not expand ambiguous dates.
7. Some events have occurrence lists: use next explicitly confirmed occurrence.
8. Unknown costs are not free: never derive free from vague prose.
9. Extras may cost even if admission free: label free_optional_extras separately.
10. Membership can condition admission: never show members_only_free as simply free.
11. Ads may influence perceived ranking: explicitly state no sponsored ranking.
12. Visitors may prefer proximity: put core SK8 areas ahead when dates tie.
13. Current coverage includes nearby places: retain them rather than hiding them.
14. Different needs require different routes: date, family, free, location, walks and holidays.
15. Categories might lead to empty searches: use existing functioning URL filters only.
16. Search terms are open-ended: link to existing broad site search.
17. Expired dates must disappear: filter to future within existing 12-month horizon.
18. Cancelled events could leak: exclude non-verified status.
19. Event data might be unavailable: show navigable fallback rather than empty shell.
20. Remote source data must not inject HTML: use textContent to create cards.
21. Dynamic content should be announced: use polite live status.
22. Many cards cause visual fatigue: show only four then link to complete calendar.
23. Event details can be hard to locate: link via stable event query parameter.
24. Small mobile controls: ensure 44px chips and 50px search controls.
25. Narrow screens could overflow: stack grid and search at responsive breakpoints.
26. Keyboard visitors require clear position: explicit focus-visible ring.
27. Animations can bother readers: respect reduced-motion preference.
28. Guide links could demand repeat signup: include an existing direct 52 Adventures route.
29. Seasonal numeric copy drifts: replace “40” event-page link with non-numeric wording.
30. Release could fail without QA: isolate on branch, open draft PR; require CI and actual browser checks before live approval.

## Ten implemented changes
1. Task-first finder immediately after the homepage hero.
2. Full-site search at the discovery entry point.
3. Immediate Today and Weekend shortcuts using tested calendar parameters.
4. Free-events route, distinct from evergreen Free & Cheap guide.
5. Family event shortcut.
6. School holiday club finder route.
7. Outdoors/walks route alongside other activity entry points.
8. Four one-click area filters for the four core SK8 areas.
9. Checked upcoming events cards, cost caveats and detail deep-links using shared event semantics.
10. Graceful empty/error route, saved-ideas continuation, accessibility and inconsistent half-term count correction.

## Release constraints
- No production deployment. Do not merge without owner approval.
- Existing source remains canonical on main. This preview branch is additive.
- Three planned measurements: clicks into the finder from homepage; detail clicks per homepage visit; mobile browse-to-event success rate compared with current baseline.
- Test manually at 375/390/768/1280px plus keyboard, screen reader, and empty/error states.
- UI/revenue outcomes are hypotheses pending measured tests, not claims.
