# Reader-first SK8 Scoop UX release review, 23 October 2026

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
