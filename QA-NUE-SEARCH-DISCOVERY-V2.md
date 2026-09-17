# NUE Search & Discovery v2 — preview QA

Branch: `preview/nue-search-discovery-v2`

Status: PREVIEW ONLY. Do not merge or deploy to production without Paul’s approval.

Checked: 17 September 2026

## Criticism cycle 1 — product value and scope

### Criticism

The earlier NUE recommendation included Explore SK8, category routes, filters and internal continuations. Rebuilding those now would duplicate work because NUE v1.1 already has:

- eight Explore routes on the homepage;
- an Around SK8 discovery hub;
- current What’s On filters for time, free/family and core local areas;
- Next Useful Experience panels across reader category pages.

A second redesign would add maintenance rather than reader value.

### Fix / decision

V2 is narrowed to one missing job: cross-category discovery.

The new search layer sits on top of the current site and does not replace Explore, Around SK8 or What’s On.

No hosted search service, user account, recommendation engine, map system or AI chatbot has been added.

## Criticism cycle 2 — accuracy, freshness and trust

### Criticism

A local search feature can become actively misleading if old events or expired calls-to-action keep appearing. Searching every historical newsletter would also surface dated prices, events and practical advice as though they were current.

### Fixes / decisions

- Current What’s On records are loaded from `data/events.json` and past event dates are automatically excluded using Europe/London local date.
- Current homepage stories are loaded from `data/homepage.json` rather than duplicated manually.
- A small `data/discovery.json` registry is used only for stable hubs, guides and selected SK8-owned pages.
- Dated discovery records can carry an `expires` field and disappear from current search after that date.
- Old newsletter issues are not individually indexed in V2.
- Zero-result searches show honest alternative routes rather than low-quality filler.
- Commercial pages and paid placements are not included in editorial search ranking.

### Important limitation

A dated explainer can remain publicly accessible after it drops from the current search index. This is intentional. For example, a consultation article can still provide historical context after its response deadline even though it should no longer appear as a current action in search.

## Criticism cycle 3 — usability, privacy and operational risk

### Criticism

Search can easily become another complicated system to maintain, and collecting raw reader queries in analytics would create an unnecessary data stream.

### Fixes / decisions

- Search runs client-side using existing static JSON sources.
- No new third-party dependency or new database is required.
- The homepage search is additive and sits immediately above the existing Explore tiles.
- The full search page has only two filter dimensions: type and area.
- Raw search text is not sent through `window.sk8Track()` to GA4 or Meta. Analytics uses query length, result count/rank context and selected filters.
- The standard GET search form does place `q` in the page URL/browser history. This is ordinary web-search behaviour and should not be described as private or anonymous search.
- The search page is `noindex,follow` so query-result pages do not become low-value Google index pages.
- Production `main` is untouched.

## Representative behaviour review

The search model is explicitly designed to handle these cases:

| Query | Expected useful results |
| --- | --- |
| `Gatley walk` | Gatley Carrs guide; Outdoors; relevant current Gatley/outdoor content |
| `free kids` | Kids & Family; Free & Cheap; current free/family events |
| `Heald Green planning` | current Heald Green planning explainer/hub while current; related planning content |
| `roadworks` | Useful Updates / roads and travel material |
| `food` | Food & Drink; current food events |
| `history` | Local History and current history stories |

Exact ordering should be verified in a browser preview before production because the final rank is produced client-side from the current JSON payloads.

## Code/diff review

Compared with `main`, the branch is additive and isolated:

- `NUE-SEARCH-DISCOVERY-V2-SPEC.md` — added
- `QA-NUE-SEARCH-DISCOVERY-V2.md` — added
- `data/discovery.json` — added
- `search/index.html` — added
- `assets/search.js` — added
- `assets/search.css` — added
- `assets/homepage-search.css` — added
- `index.html` — intentionally modified only to load the homepage search CSS, add the search form above Explore, and add Search to the footer Explore links.

No production data, MailerLite action, consent code, signup integration, D1 schema, advertiser page or existing reader route is replaced.

## QA constraint in this session

The execution container cannot resolve github.com, so a fresh branch clone/local browser server could not be run from this session. GitHub source/diff review was completed through the connected repository tools instead.

This means browser-rendered desktop/mobile QA remains a release blocker, not something that should be silently marked passed.

## Preview release blockers before merge

1. Confirm the Cloudflare branch preview renders `/search/` and the homepage search block correctly on desktop and mobile.
2. Run representative queries above and confirm ordering is sensible.
3. Confirm `/data/discovery.json`, `/data/homepage.json` and `/data/events.json` all return 200 from the preview origin.
4. Confirm past events do not appear.
5. Confirm consultation expiry behaviour on/after its specified date.
6. Confirm keyboard focus, search/filter buttons and mobile tap targets are usable.
7. Confirm no raw `q` value is present in emitted GA4/Meta custom-event parameters.
8. Obtain Paul’s explicit approval before merging to `main`.

## Recommendation after preview

If the browser QA passes, release the MVP unchanged and observe real usage before adding more filters, archive search, maps, profiles or AI. The useful question is whether readers actually search and continue, not whether the site can support a larger technical search stack.
