# Newsletter archive article batch v1 — preview QA

Branch: `preview/newsletter-archive-articles-v1`

Status: PREVIEW ONLY. Do not merge or deploy to production without Paul’s approval.

Checked: 17 September 2026

## Criticism cycle 1 — are we creating useful pages or archive clutter?

### Risk

It would be easy to index old newsletters wholesale and make the new search feature worse. Newsletter issues contain expired events, old prices, temporary offers and one-week notices alongside genuinely durable reporting.

### Fix

The archive is treated as a source pool, not a search corpus.

Only six items were selected for this batch because they have a clear permanent or current reader job:

1. Gatley Shouter.
2. Cheadle station / Cheshire Line Tavern.
3. Heald Green Mercury Frog.
4. Heald Green East.
5. Secondary-school applications for September 2027.
6. Cheadle Eco Park.

Expired events, stale offers, weak snippets and ordinary wider-Stockport filler remain excluded.

## Criticism cycle 2 — did old newsletter facts become stale?

### Risk

Copying a newsletter item directly to the website could preserve a status that was correct when the email went out but wrong now.

### Fixes

- Gatley Shouter: documentary and folklore claims were separated. The 1886 glossary evidence is distinct from Fletcher Moss’s ghost narrative and unresolved claims.
- Cheadle station: opening, renaming and closure dates were rechecked against the Architects of Greater Manchester record.
- Mercury Frog: the MERcury exchange history was rechecked against Heald Green Heritage; later frog reporting was checked separately.
- Heald Green East: the July newsletter said the application was undecided. Current checks on 17 September still showed DC/095134 as pending. The new article does **not** claim it has been approved.
- Secondary-school applications: dates were rechecked against Stockport Council on 17 September. The search record expires after 31 October 2026.
- Cheadle Eco Park: current project information was rechecked against Stockport Council’s July 2026 update. Jobs, BREEAM status and sustainability outcomes retain their target/expectation wording where appropriate.

## Criticism cycle 3 — does the content fit NUE rather than just adding pages?

### Risk

Six isolated articles would add URLs but not a useful reader system.

### Fixes

- All six are indexed in `data/discovery.json` with useful synonyms and natural search terms.
- Local-history pages link onwards to the relevant history/outdoors experiences.
- Planning explainers link back to Planning & Development and Useful Updates.
- The school guide links back to Kids & Family and What’s On.
- The three category hubs now surface the relevant new pages for readers who browse instead of search.
- No paid/commercial ranking is introduced.

## Search behaviour to verify in preview

Representative searches should produce strong matching pages near the top:

| Query | Intended useful result |
| --- | --- |
| `Gatley ghost` | The Gatley Shouter |
| `Gatley Shouter` | The Gatley Shouter |
| `Cheadle station` | Cheadle station / Cheshire Line Tavern |
| `Cheshire Line Tavern` | Cheadle station / Cheshire Line Tavern |
| `Mercury frog` | Heald Green Mercury Frog |
| `Heald Green housing` | Heald Green East |
| `675 homes` | Heald Green East |
| `secondary school applications` | September 2027 application guide |
| `Year 7` | September 2027 application guide |
| `Bird Hall Lane` | Cheadle Eco Park |
| `Cheadle Eco Park` | Cheadle Eco Park |

The school guide carries all four core SK8 areas in its search metadata so place-filtered searches can still find it.

## Rights and media QA

The initial six pages are text-first.

This is deliberate. Newsletter images were not assumed to be reusable on a permanent public web page merely because they appeared in an email. No external image was copied into this batch without a separate rights check.

Existing site-owned logos and styling assets are reused through the normal site template.

## Link and structure QA

New routes:

- `/local-history/gatley-shouter/`
- `/local-history/cheadle-station-cheshire-line-tavern/`
- `/local-history/heald-green-mercury-frog/`
- `/planning/heald-green-east/`
- `/planning/cheadle-eco-park/`
- `/kids-family/secondary-school-applications-2027/`

Each page uses the existing reader header/footer pattern and relative site assets.

The school guide originally linked to an unsupported `?family=1` What’s On parameter. That was removed before preview QA; it now links to the normal supported `/whats-on/` route.

## Search freshness QA

- History pages: `evergreen`.
- Heald Green East: `current`, checked 17 September 2026; requires a status update when the application changes.
- Cheadle Eco Park: `current`, checked 17 September 2026; requires a project update when the build status materially changes.
- School applications: `dated`, checked 17 September 2026, search expiry 31 October 2026.

The pages themselves may remain accessible after a search expiry for context, but expired practical material should not continue to present itself as a current search answer.

## Remaining browser QA before production

1. Open all six routes in the Cloudflare branch preview.
2. Check desktop and mobile layout, especially long planning titles and fact sidebars.
3. Run the representative searches above and check real client-side result ordering.
4. Confirm `data/discovery.json` loads successfully and the six records appear.
5. Confirm the school application record is discoverable under each core-area filter.
6. Check internal links from Local History, Planning & Development and Kids & Family.
7. Check external source links open the intended authoritative/current source.
8. Confirm no newsletter-only image or unverified asset has accidentally been introduced.
9. Obtain Paul’s explicit approval before merging to `main`.

## Recommendation after preview

If the six pages read well in the browser and the search results are useful, merge this small batch first. Then use real search-demand data to decide which archive candidate deserves the next conversion rather than mass-publishing old newsletter content.
