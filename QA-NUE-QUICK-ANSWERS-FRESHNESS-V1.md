# NUE Quick Answers + Website Health v1 — preview QA

Status: PREVIEW ONLY — do not merge/deploy without Paul’s production approval.

Branch: `preview/nue-quick-answers-freshness-v1`

Checked: 6 October 2026

## Scope

This preview intentionally avoids another new hub. It modifies the existing NUE architecture by:

- adding six compact homepage Quick Answers;
- supporting direct What’s On filter URLs;
- tracking Quick Answer use through the existing NUE analytics layer;
- adding a dependency-free Website Health checker;
- adding a GitHub Actions workflow for that checker.

Production `main` is unchanged.

## Criticism / Fix cycle 1 — structure and reader value

### Criticism

The current homepage already contains a hero, three current stories, locality routes, search and eight Explore tiles. Adding another large visual section would make the page busier and create navigation about navigation.

There was also a risk that “Free” and “Family” would be too vague unless the destination made their immediate-current nature clear.

### Fix

- Quick Answers are implemented as a compact route strip inside the existing “What do you need?” section, not as a new top-level page or giant card grid.
- No image/icon system was added.
- The common dated routes now land directly on `#current-listings`.
- Labels were tightened to **Free now** and **Family ideas**.
- Search and existing Explore tiles remain available for less common or broader intent.

### Result

PASS for preview structure, subject to real phone rendering.

## Criticism / Fix cycle 2 — accuracy, freshness and experience

### Criticism

Direct links into What’s On are only useful if the requested filter survives page load and if current listings do not include records already marked cancelled or sold out.

The event dataset also contains historical records that are hidden client-side but still create maintenance debt. A known example is the duplicated Heald Green Theatre production record for **The Unfriend**.

### Fix

- `assets/whats-on.js` now reads a safe allow-list of URL `filter` values on initial load.
- `filter` and `area` can be combined.
- On-page filter changes update the URL with `history.replaceState`.
- Unknown filter values fall back to the normal all-events view.
- What’s On now excludes `example`, `cancelled` and `sold_out` statuses from current output.
- The Website Health checker flags expired records, stale checks and probable duplicates rather than deleting editorial records automatically.

### Data review

A source-level health simulation against the branch data found:

- 30 event records;
- 7 expired event records retained in the dataset;
- 1 probable duplicate pair: **The Unfriend** / **The Unfriend at Heald Green Theatre**;
- homepage data updated 2 October 2026;
- discovery index updated 5 October 2026;
- current public config still points to Issue 14 dated 25 September 2026.

The expired records are already hidden by current-event filtering. They remain a cleanup warning rather than an automatic-deletion action.

### Result

PASS for source logic. The Issue 14 freshness warning is legitimate and should remain visible until the normal website update process advances the public issue state.

## Criticism / Fix cycle 3 — final risk, accessibility and maintainability

### Criticism

The new layer would be poor value if it required another service, created privacy risk, relied on decorative iconography, or silently modified content based on approximate duplicate detection.

There is also a risk of claiming visual/mobile QA without actually rendering the Cloudflare preview.

### Fix

- No new service, database or package dependency.
- No SVG/icon asset requirement.
- Quick Answers use normal semantic links with visible text and existing focus styles.
- Tracking uses the existing consent-aware `window.sk8Track` route and records the selected intent, not personal data.
- Probable duplicate detection is warning-only.
- Health script exits non-zero only for structural errors; editorial warnings remain visible without blocking every build.
- Production merge/deployment remains approval-gated.
- Browser-rendered desktop/mobile QA is explicitly still required.

### Result

PASS for source-level risk and maintainability.

## Changed files

- `NUE-QUICK-ANSWERS-FRESHNESS-V1-SPEC.md`
- `index.html`
- `assets/homepage-search.css`
- `assets/whats-on.js`
- `assets/nue-analytics.js`
- `scripts/website-health.js`
- `.github/workflows/website-health.yml`

## Remaining preview blockers

1. Cloudflare must produce a branch preview for the current head commit.
2. Open the exact preview homepage and verify Quick Answers at desktop and phone widths.
3. Open:
   - `/whats-on/?filter=today#current-listings`
   - `/whats-on/?filter=weekend#current-listings`
   - `/whats-on/?filter=free#current-listings`
   - `/whats-on/?filter=family#current-listings`
   - one combined `filter + area` URL.
4. Confirm browser back/forward behaviour remains sensible after filter changes.
5. Confirm no cancelled/sold-out record appears in the current result view.
6. Confirm the Website Health workflow runs successfully in GitHub Actions.
7. Confirm the health output flags the known expired/duplicate dataset pattern without producing a structural error.
8. Do not merge to `main` or deploy production until Paul approves the reviewed preview.

## Recommendation

Keep the release deliberately small. If mobile rendering makes the homepage feel busier rather than faster, reduce the visual weight of the existing Explore area before adding any further NUE feature.
