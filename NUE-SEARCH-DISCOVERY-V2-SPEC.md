# SK8 Scoop NUE Search & Discovery v2

Status: PREVIEW SPECIFICATION — not approved for production

Branch: `preview/nue-search-discovery-v2`

Date: 17 September 2026

## Outcome

Make the existing NUE v1.1 site useful when a reader knows what they need but does not know which SK8 Scoop section contains it, while turning submitted searches into privacy-minimised editorial evidence about what readers actually want.

The job is not another redesign. NUE v1.1 already supplies the main Explore SK8 routes and What’s On filters. V2 adds a simple cross-site discovery layer on top of them.

Desired reader flow:

`search / social / homepage → useful result → next useful SK8 experience → newsletter / return use`

Desired publisher learning loop:

`reader search → anonymous demand signal → repeated demand / zero-result gaps → editorial judgement → stronger coverage`

## MVP

1. Add a public `/search/` page.
2. Add a prominent `Find something around SK8` search entry on the homepage near Explore SK8.
3. Search across three existing structured sources:
   - `data/discovery.json` — stable sections, guides and evergreen/current article pages;
   - `data/homepage.json` — current homepage stories;
   - `data/events.json` — current verified event listings.
4. Hide past events automatically using Europe/London local date.
5. Exclude expired practical entries when an explicit expiry date is present.
6. Provide light filters for type and place without building a recommendation engine.
7. Rank results using transparent client-side scoring: title first, then tags/category/area, then summary.
8. Add useful zero-result routes rather than filler.
9. Track aggregate search interaction through the existing consent-gated analytics system without sending raw query text to Google or Meta.
10. Store submitted search phrases in a first-party D1 table for editorial insight, without attaching email, IP address or device identifiers to the search log.
11. Add a private `/admin/search-insights/` view protected by the existing Cloudflare `ADMIN_TOKEN`.

## Why static/client-side first

The current site is static-first. A search service, external index, user profile system or new recommendation database is unnecessary at this size and would add maintenance, privacy and failure points.

The MVP should remain deployable through the existing GitHub → Cloudflare workflow.

## Search scope

### Included

- Explore SK8 section pages.
- What’s On current listings.
- Current homepage stories.
- Selected evergreen/current SK8-owned article pages.
- Guides and useful hub pages.

### Excluded by default

- Old newsletter archives as individual search results. They contain time-sensitive information and should not outrank current material.
- Expired events.
- Expired consultations/practical notices where an expiry is known.
- Advertiser/admin/payment/private routes.
- User submissions that have not been editorially checked.

A later Archive search can be added separately if readers show demand.

## Initial filters

### Type

- All
- Events
- Guides
- Stories
- Useful updates

### Place

- All areas
- Cheadle
- Cheadle Hulme
- Gatley
- Heald Green
- Nearby

Do not add more filters until the content supply justifies them.

## Search behaviour

- Case-insensitive.
- Normalise punctuation and common apostrophe variants.
- Require at least two useful characters before showing query-matched results.
- Support simple synonyms, for example:
  - kids / children / family
  - cheap / free / budget
  - walk / outdoors / park
  - road / traffic / travel
  - planning / development / consultation
  - food / cafe / café / pub / restaurant
- Score title matches highest.
- Give a modest boost to exact local-area matches.
- Do not infer unsupported recommendations or claim that a result is “best”.

## Freshness model

Every curated record may provide:

- `checked` — last editorial check date;
- `expires` — date after which the record should disappear from current search;
- `freshness` — `evergreen`, `current`, or `dated`.

Events use their event date and existing verification metadata. Current homepage stories inherit `data/homepage.json.updated`.

Search results should display freshness/area/type information where useful, not make unsupported “confirmed” claims.

## First-party search insight storage

Submitted searches are recorded to the existing Cloudflare D1 database so SK8 Scoop can learn what readers are actively looking for.

Stored fields:

- sanitised search phrase;
- normalised search phrase for grouping duplicates;
- result count;
- selected type filter;
- selected area filter;
- whether the search arrived from the homepage, search page or a direct search URL;
- timestamp.

Not stored in the search log:

- subscriber email address;
- IP address;
- device identifier;
- user account/profile identifier;
- browser user-agent string.

Privacy safeguards:

- obvious email addresses are replaced with `[email]` before storage;
- obvious telephone-number patterns are replaced with `[phone]`;
- obvious URLs are replaced with `[link]`;
- stored query text is capped at 160 characters;
- raw search-event rows are retained for no more than 365 days;
- a repeated identical submit within roughly 15 seconds in the same browser session is suppressed to reduce accidental double counting;
- the public search page and Privacy Notice explain the first-party search insight purpose.

The search log is editorial evidence. It must not be sold, shared with advertisers for targeting, or used to give paid content a ranking advantage.

## Private Search Insights view

Route: `/admin/search-insights/`

Access: existing Cloudflare `ADMIN_TOKEN`, using the same pattern as the QR publisher dashboard.

Time windows:

- 7 days
- 30 days
- 90 days
- 12 months

Outputs:

1. Total searches.
2. Distinct normalised searches.
3. Zero-result searches.
4. Average number of results returned.
5. Top repeated searches.
6. Top zero-result / unmet searches.
7. Latest 50 search events.

Interpretation rule: repeated search demand is a clue, not an automatic editorial ranking. Local relevance, usefulness, verification, timeliness and editorial judgement remain the selection criteria.

## Analytics

Use the existing `window.sk8Track()` consent-gated path for aggregate behavioural measurement.

Events:

- `search_view`
- `search_submit`
- `search_result_click`
- `search_zero_results`
- `search_filter_change`

Do not send raw search-query text to Meta or GA4. Track only query length, result count/rank where appropriate, type filter and area filter.

First-party D1 search storage is separate from Google/Meta analytics and exists specifically for SK8 Scoop editorial product improvement.

## Homepage entry

Place a compact search box at the top of the current Explore SK8 section, ahead of the category tiles.

Suggested label: `Find something around SK8`

Placeholder: `Try “Gatley walk”, “free kids” or “roadworks”`

Submit to `/search/?q=...` using a normal GET form so search remains usable without JavaScript for navigation.

The existing Explore tiles remain. Search complements them rather than replacing them.

## Search result card

Each result should show:

1. Type / category label.
2. Clear title.
3. Area when known.
4. Short useful summary.
5. Date / checked context when materially useful.
6. One destination action.

Events should continue to send readers to the primary organiser/current-details URL where that is the useful next action. SK8-owned pages should link internally.

## Zero-result behaviour

Never pad search with weak matches. Offer three honest next routes:

- What’s On
- Free & Cheap
- Submit a local tip/event

Zero-result searches are especially valuable in the private Search Insights view because they reveal unmet reader intent.

## Accessibility

- Native `<form>`, `<label>`, `<input type="search">`, buttons and links.
- Keyboard usable.
- Live result count via `aria-live`.
- No colour-only filter state.
- Minimum existing SK8 mobile tap target standards.
- Respect reduced motion.

## Release experiments

The Website Update rule requires three deliberate experiments by default. These can run as controlled before/after tests rather than adding an A/B framework.

### Experiment 1 — Search entry point

Hypothesis: a search box immediately above Explore tiles increases useful continuation clicks compared with category tiles alone.

Primary metric: search result clicks per search-page visit.

Guardrails: bounce/zero-result rate, accessibility, mobile layout.

### Experiment 2 — Search examples

Hypothesis: three concrete example prompts reduce empty or overly broad searches.

Variable: placeholder/example chips shown vs removed in a later observation window.

Primary metric: proportion of searches yielding at least one result and a result click.

### Experiment 3 — Result continuation

Hypothesis: a restrained `Try next` panel after results increases SK8-owned continuation without distracting from the searched result.

Primary metric: continuation click rate.

Guardrail: result click rate must not fall materially.

## Not in V2

- AI chatbot / Ask SK8.
- Personalised recommendations.
- User profiles.
- Saved searches.
- Search history tied to individuals.
- Elasticsearch/Algolia/Meilisearch or other hosted search.
- Full archive search.
- Map search.
- Automatic web crawling.
- Paid placement ranking inside search results.

Paid content must never receive an editorial search-ranking boost. If commercial results are introduced later they must be visibly labelled and governed separately.

## Definition of done for preview

- `/search/` works on desktop and mobile.
- Existing Explore pages and What’s On remain unchanged except for intentional links/search entry.
- Current events can be found and past events cannot.
- Search works for representative queries including `Gatley`, `walk`, `free kids`, `Heald Green`, `planning`, `food`, `history` and `roadworks` where matching indexed content exists.
- Empty query and zero-result states are useful.
- Raw query text is not sent to Google Analytics or Meta Pixel.
- Submitted queries are stored first-party with the privacy minimisation described above.
- `/admin/search-insights/` returns useful top-search, unmet-search and recent-search views after authentication.
- No new third-party library/service is introduced.
- Static links and JSON loads work from a Cloudflare preview.
- Automated/basic QA and mobile visual QA pass.
- Production remains explicitly approval-gated.
