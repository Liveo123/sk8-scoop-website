# Global Header Search v1 — QA

Status: PREVIEW ONLY

Checked: 17 September 2026

Branch: `preview/newsletter-archive-articles-v1`

## Cycle 1 — structure and reader value

### Criticism

A permanent search field could make the already busy SK8 Scoop navigation harder to scan, particularly on laptop and mobile widths. Adding another full navigation link would also make search feel like another section rather than a utility.

### Fix

- Reuse the existing `/search/` system rather than adding a second search engine.
- Large desktop (`>=1280px`): visible compact search field + full navigation + `Join free`.
- Laptop/tablet (`821–1279px`): visible compact search field + Menu. The full navigation moves behind Menu.
- Mobile (`<=820px`): search icon + Menu, with a full-width search panel opening immediately under the header.
- Keep `Join free` visually stronger whenever the full navigation is visible.
- At large desktop width only, hide the duplicate plain `Join` link because the `Join free` action remains visible.
- Do not add autocomplete, live suggestions or extra search controls before real demand supports them.

### Result

The header gains a useful site-wide search entry point without turning into a second Explore menu or wasting laptop-width space.

## Cycle 2 — accuracy, accessibility and experience

### Criticism

Header search could conflict with the mobile menu, lose the typed query, create inaccessible icon-only controls, or accidentally send raw query text through optional analytics.

### Fix

- Native GET forms submit to `/search/` and keep the existing search system as the destination.
- Search inputs have explicit accessible labels and submit buttons have `aria-label` text.
- Compact controls are approximately 44px targets.
- Opening mobile search closes the mobile navigation menu.
- Escape closes the compact search panel and restores focus.
- `/` opens/focuses search only when the reader is not already typing into or using an interactive control.
- The current query is repopulated in the header when already on `/search/`.
- Empty/one-character header searches do not navigate.
- `header_search_open` and `header_search_submit` send only interaction metadata such as query length, not raw query text.
- Header searches carry `source=header` into the results page so first-party Search Insights can record `header` / `preview_header` separately.

### Result

The implementation adds a new entry point without changing ranking, filters, result freshness or the existing privacy-minimised query-storage rules.

## Cycle 3 — deployment risk and final polish

### Criticism

A global feature loaded on every page creates a wider regression surface than a single article. It could break private admin pages, fail to load from the Cloudflare branch, overflow narrow headers or silently diverge between the Worker runtime and the duplicate Functions API handler.

### Fix

- Admin routes are excluded from the injected global-search assets.
- `assets/global-search.js` and `assets/global-search.css` are loaded through the shared public configuration layer rather than copied into individual pages.
- Both `worker-protected.js` and `functions/api/search-event.js` accept the `header` search source.
- The existing automated NUE contract checks the global-search assets, route target, analytics event names, responsive rules and lack of `query_text` in the header analytics code.
- Cloudflare preview smoke checks explicitly fetch both new global-search assets.
- Production smoke checks are prepared but will only run after an explicitly approved merge to `main`.

## Human screenshot review

Three preview screenshots were reviewed on 17 September 2026.

### Finding 1 — large desktop

The visible desktop search field fits the header and is easy to understand, but the plain `Join` link was still visible next to `Join free`. The cause was a selector that matched `/join/` but not the homepage's relative `join/` URL.

**Fix:** the desktop rule now hides either form of the plain Join URL while keeping `Join free` visible.

### Finding 2 — intermediate width with full navigation

The first intermediate-width version showed a search icon and full navigation together, causing the right side of the navigation to run off the viewport.

**Fix:** below `1280px`, the full navigation collapses behind Menu instead of squeezing beside search.

### Finding 3 — intermediate width after collapse

The next screenshot showed the collapsed navigation fitting, but the header looked unnecessarily empty and the legacy hamburger decoration visually collided with the `Menu` label.

**Fix:**

- At `821–1279px`, restore a visible compact search field because there is ample horizontal space when navigation is behind Menu.
- Keep only the search icon below `821px`.
- Remove the legacy decorative menu icon in the global-search responsive state and render the Menu button as a clean, centred text control with fixed minimum height/width.
- Keep the Logo, Search and Menu controls on one stable row with explicit gaps.

### Preview-only observation

Earlier screenshots also showed a Cloudflare challenge/Turnstile connection warning inside the newsletter signup area. That is separate from global search and should be treated as preview-environment behaviour unless it reproduces on the production domain.

## Remaining human check

After the latest preview deploys, recheck:

1. large desktop: visible field, full navigation, no wrapping, only `Join free` remains as the join action;
2. laptop/tablet (`821–1279px`): Logo + visible Search field + clean Menu button, no clipped links;
3. mobile (`<=820px`): Logo + Search icon + clean Menu button, panel easy to use and menu/search do not overlap;
4. very narrow mobile: no horizontal overflow;
5. `/` shortcut and Escape behaviour;
6. a distinctive preview header search appears as `preview_header` in Search Insights.

## Release decision

Do not merge on automated QA alone. Updated human visual approval and one Search Insights round-trip remain the final release gate.