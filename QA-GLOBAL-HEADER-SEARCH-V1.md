# Global Header Search v1 — QA

Status: PREVIEW ONLY

Checked: 17 September 2026

Branch: `preview/newsletter-archive-articles-v1`

## Cycle 1 — structure and reader value

### Criticism

A permanent search field could make the already busy SK8 Scoop navigation harder to scan, particularly on laptop and mobile widths. Adding another full navigation link would also make search feel like another section rather than a utility.

### Fix

- Reuse the existing `/search/` system rather than adding a second search engine.
- Desktop (`>=1200px`): visible compact search field + full navigation + `Join free`.
- Laptop/tablet (`821–1199px`): visible compact search field + Menu. The full navigation moves behind Menu.
- Mobile (`<=820px`): search icon + Menu, with a full-width search panel opening immediately under the header.
- Keep `Join free` visually stronger whenever the full navigation is visible.
- Hide the duplicate plain `Join` link whenever the full navigation is shown.
- Do not add autocomplete, live suggestions or extra search controls before real demand supports them.

### Result

The header gains a useful site-wide search entry point while preserving the normal desktop expectation of a complete navigation bar.

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

Five preview screenshots were reviewed on 17 September 2026.

### Finding 1 — first desktop version

The visible search field and full navigation worked visually, but the plain `Join` link also appeared beside `Join free`.

**Fix:** use a robust `href$="join/"` selector for the plain Join link while leaving the button in place.

### Finding 2 — first intermediate-width attempt

The search icon and full navigation were both present, causing the right side of the navigation to run off the viewport.

**Fix:** move the full navigation behind Menu at genuinely constrained widths.

### Finding 3 — collapsed intermediate-width attempt

The collapsed navigation fitted, but using only a small search icon wasted useful horizontal space and the legacy hamburger decoration collided with the `Menu` label.

**Fix:** use a visible compact search field on laptop/tablet widths and keep the icon-only search pattern for mobile. Remove the legacy decorative hamburger in the collapsed state.

### Finding 4 — approximately 1300px browser width

A later screenshot exposed clipping when the full navigation returned with desktop spacing that was too generous.

**Initial fix:** temporarily raised the full-navigation breakpoint to `1440px`.

### Finding 5 — desktop expectation after the temporary 1440px fix

The next desktop screenshot showed Logo + Search + Menu even though the browser was clearly being used as a desktop layout. This removed useful top-level navigation and did not match the intended desktop experience.

**Final fix:**

- Restore full navigation from `1200px` upward.
- Instead of hiding the navigation, make the desktop row fit properly: wider header container, 218px logo, 178px search field, tighter 10px nav gaps and slightly smaller desktop nav type.
- Keep `Join free` visible and remove the duplicate plain `Join` link.
- Reserve Logo + Search + Menu for `821–1199px`.
- Keep Logo + Search icon + Menu for `<=820px`.

This addresses the cause of the clipping rather than treating a normal desktop width as a tablet layout.

### Finding 5 — final desktop screenshot

The desktop layout now shows the full navigation, search field and `Join free` without clipping, which is the intended desktop behaviour. One redundant plain `Join` text link was still visible alongside the stronger `Join free` CTA.

**Fix:**

- Remove the plain Join item from the shared public-navigation rebuild in `assets/config.js`.
- Add a defensive removal in `assets/global-search.js` so article/other public headers also keep `Join free` as the single signup action.
- Keep the full desktop navigation otherwise unchanged.

### Preview-only observation

Earlier screenshots also showed a Cloudflare challenge/Turnstile connection warning inside the newsletter signup area. That is separate from global search and should be treated as preview-environment behaviour unless it reproduces on the production domain.

## Latest deployment verification

- Exact preview head checked: `571636d0ec484618642c9f71a90d842ce046e8ef`.
- Cloudflare branch deployment reports **Deployment successful** for that exact commit.
- GitHub Actions on that exact commit: **Homepage V3 QA — success; Current content freshness — success; Post-launch site QA — success**.
- This confirms the latest desktop-full-navigation breakpoint code is the version now available on the branch preview.

## Remaining human check

After the latest preview deploys, recheck:

1. desktop (`>=1200px`): logo + compact search + complete navigation + `Join free`, with no clipping or wrapping;
2. laptop/tablet (`821–1199px`): Logo + visible Search field + clean Menu button;
3. mobile (`<=820px`): Logo + Search icon + clean Menu button, with panel and menu not overlapping;
4. very narrow mobile: no horizontal overflow;
5. `/` shortcut and Escape behaviour;
6. a distinctive preview header search appears as `preview_header` in Search Insights.

## Release decision

Do not merge on automated QA alone. Updated human visual approval and one Search Insights round-trip remain the final release gate.