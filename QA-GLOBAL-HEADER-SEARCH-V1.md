# Global Header Search v1 — QA

Status: PREVIEW ONLY

Checked: 17 September 2026

Branch: `preview/newsletter-archive-articles-v1`

## Cycle 1 — structure and reader value

### Criticism

A permanent search field could make the already busy SK8 Scoop navigation harder to scan, particularly on laptop and mobile widths. Adding another full navigation link would also make search feel like another section rather than a utility.

### Fix

- Reuse the existing `/search/` system rather than adding a second search engine.
- Wide desktop (`>=1440px`): visible compact search field + full navigation + `Join free`.
- Laptop/tablet (`821–1439px`): visible compact search field + Menu. The full navigation moves behind Menu.
- Mobile (`<=820px`): search icon + Menu, with a full-width search panel opening immediately under the header.
- Keep `Join free` visually stronger whenever the full navigation is visible.
- At wide desktop only, hide the duplicate plain `Join` link because the `Join free` action remains visible.
- Do not add autocomplete, live suggestions or extra search controls before real demand supports them.

### Result

The header gains a useful site-wide search entry point without turning into a second Explore menu or forcing a dense navigation row onto laptop/browser widths.

## Cycle 2 — accuracy, accessibility and experience

### Criticism

Header search could conflict with the mobile menu, lose the typed query, create inaccessible icon-only controls, or accidentally send raw query text through optional analytics.

### Fix

- Native GET forms submit to `/search/` and keep the existing search system as the destination.
- Search inputs have explicit accessible labels and submit buttons have `aria-label` text.
- Compact controls are approximately 44px targets.
- Opening mobile search closes the mobile navigation menu.
- Escape closes the compact search panel and restores focus.
- `/` focuses the visible inline search at `>=821px`; below that it opens the mobile panel. It is suppressed when the reader is already typing or using an interactive control.
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

Four preview screenshots were reviewed on 17 September 2026.

### Finding 1 — wide desktop

The visible search field and full navigation can work together when there is genuinely enough horizontal space. The duplicate plain `Join` link must not appear beside `Join free`.

**Fix:** the wide-desktop rule uses a robust `href$="join/"` selector for the plain Join link while leaving the button in place.

### Finding 2 — first intermediate-width attempt

The search icon and full navigation were both present, causing the right side of the navigation to run off the viewport.

**Fix:** move the full navigation behind Menu at intermediate widths.

### Finding 3 — collapsed intermediate-width attempt

The collapsed navigation fitted, but using only a small search icon wasted useful horizontal space and the legacy hamburger decoration collided with the `Menu` label.

**Fix:** at `821–1439px`, use a visible compact search field plus a clean text Menu button. Keep the icon-only search pattern for mobile only.

### Finding 4 — approximately 1300px browser width

A later screenshot exposed a breakpoint regression: the viewport was just above the old `1280px` threshold, so the full navigation returned too early. `Join free` was clipped on the right and the header again became cramped.

**Fix:**

- Raise the full-navigation threshold from `1280px` to `1440px`.
- Keep the `821–1439px` state as Logo + visible Search field + Menu.
- Reduce the desktop logo flex width to 230px where appropriate.
- Keep a wider 1408px header container only once the full-navigation state is active.
- Align the `/` keyboard shortcut with the actual inline-search visibility threshold (`821px`), preventing it from focusing an invisible panel/input state.

### Preview-only observation

Earlier screenshots also showed a Cloudflare challenge/Turnstile connection warning inside the newsletter signup area. That is separate from global search and should be treated as preview-environment behaviour unless it reproduces on the production domain.

## Remaining human check

After the latest preview deploys, recheck:

1. wide desktop (`>=1440px`): visible field, full navigation, no clipping/wrapping, only `Join free` remains as the join action;
2. laptop/tablet (`821–1439px`): Logo + visible Search field + clean Menu button, no clipped links;
3. mobile (`<=820px`): Logo + Search icon + clean Menu button, panel easy to use and menu/search do not overlap;
4. very narrow mobile: no horizontal overflow;
5. `/` shortcut and Escape behaviour;
6. a distinctive preview header search appears as `preview_header` in Search Insights.

## Release decision

Do not merge on automated QA alone. Updated human visual approval and one Search Insights round-trip remain the final release gate.