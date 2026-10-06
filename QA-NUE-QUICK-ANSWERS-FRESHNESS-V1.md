# NUE Quick Answers + Website Health v1 — preview QA

Status: PREVIEW ONLY — production `main` remains unchanged and requires Paul’s explicit approval.

Branch: `preview/nue-quick-answers-freshness-v1`

Checked: 6 October 2026

## Scope

This preview deliberately avoids adding another hub. It improves the current NUE architecture by:

- adding six compact homepage Quick Answers;
- supporting direct What’s On filter URLs;
- tracking Quick Answer use through the existing NUE analytics layer;
- adding a dependency-free Website Health checker;
- running the health checker automatically on preview/main changes;
- running browser-rendered desktop/mobile QA against the exact Cloudflare branch preview.

## Criticism / Fix cycle 1 — structure and reader value

### Criticism

The homepage already contains a hero, three current stories, locality routes, search and eight Explore tiles. Another large visual section would create navigation about navigation.

“Free” and “Family” were also too vague as labels.

### Fix

- Quick Answers sit as a compact strip inside the existing **What do you need?** section.
- No new top-level destination, icon system or decorative image set was added.
- Labels are **Today**, **This weekend**, **Free now**, **Family ideas**, **What’s changed**, **Your area**.
- Search remains directly below as the route for more specific intent.
- Existing Explore tiles remain for browsing by topic.

### Browser result

PASS.

The Cloudflare desktop render keeps the Quick Answers visually subordinate to the main homepage stories and makes the six choices obvious without becoming another card wall.

A 390px-wide mobile render confirms the Quick Answers collapse to a compact two-column layout. The locality strip and search remain clearly separated below it. The page is long because the current three story cards precede Explore, but the new component itself is compact rather than adding a large new visual block.

## Criticism / Fix cycle 2 — accuracy, freshness and experience

### Criticism

Direct links into What’s On are only valuable if the selected filter survives page load and current listings do not include expired, cancelled or sold-out material.

The first QA pass also showed that fragment-jump URLs were unnecessarily fragile in headless/mobile rendering. They made the route feel faster in theory but added scroll-position complexity.

The first health run exposed real maintenance debt:

- 7 expired event records;
- a probable duplicate **The Unfriend** pair;
- 2 expired discovery records;
- an expired M60 weekend closure block;
- website public issue metadata still pointing at Issue 14.

### Fix

- What’s On reads a safe allow-list of URL `filter` values on initial load.
- `filter` and `area` can be combined.
- On-page filter/area changes update the URL with `history.replaceState`.
- Unknown filter values safely fall back to the normal view.
- What’s On excludes `example`, `cancelled` and `sold_out` statuses from current output.
- Quick Answers now use stable non-fragment filtered URLs rather than forcing a jump.
- The 7 expired event records were removed from the current dataset.
- The 2 expired discovery records were removed.
- The expired M60 weekend block was removed from Useful Updates.
- The historical duplicated **The Unfriend** records disappeared as part of the expired-event cleanup.
- `assets/config.js` was refreshed to the actually sent **Issue 15 · Friday 2 October 2026**, using the MailerLite winner preview and verified Issue 15 content.

### Browser result

PASS.

The 390px What’s On Weekend render opens normally at the page top with **Weekend** visibly selected. The page reports 6 current checked listings and retains the core SK8 area controls.

## Criticism / Fix cycle 3 — automation, false positives and production risk

### Criticism

A health checker is only useful if it catches real exceptions without becoming a noisy robot. Approximate duplicate logic must not delete editorial records, and generic shared hub destinations must not be treated as duplicate content merely because two search records link to the same section.

Visual QA also had to be real rather than inferred from source code.

### Fix

- Health checking remains dependency-free and warning-first.
- Probable duplicates are surfaced for human review; nothing is automatically deleted by fuzzy matching.
- Discovery duplicate warnings were narrowed so a shared destination is only suspicious when title similarity also indicates a likely duplicate.
- The checker now scans HTML for expired `data-expire-after` content as well as JSON datasets.
- Structural errors fail the check; editorial warnings do not automatically block every build.
- A separate browser QA workflow waits for the exact Cloudflare preview, renders Chrome at desktop and phone widths, checks the active Weekend state in rendered DOM, and keeps screenshot artifacts.
- The visual workflow was added to preview-branch pushes so the current branch head, not an older PR state, is tested.

### Final Website Health result

PASS:

- 0 errors;
- 0 warnings;
- 7 passes;
- no expired event records;
- no current/future event beyond the 21-day checked-date warning threshold;
- no probable duplicate event pair;
- homepage data current to 2 October;
- 40 discovery records parsed;
- no expired `data-expire-after` markers;
- current issue source date recognised as 2 October 2026.

## Current browser-rendered QA

PASS on the current preview implementation for:

- homepage desktop;
- homepage at 390px mobile width;
- compact Quick Answers layout;
- existing locality block below Quick Answers;
- existing search below locality;
- What’s On Weekend URL state;
- mobile What’s On controls;
- current-listing count/freshness display;
- responsive card layout;
- no new third-party frontend dependency.

The consent panel is intentionally visible in the automated screenshots because the runner is a fresh browser with no consent choice stored. It overlays the lower viewport as designed; it is not generated by this release.

## Changed files

- `NUE-QUICK-ANSWERS-FRESHNESS-V1-SPEC.md`
- `QA-NUE-QUICK-ANSWERS-FRESHNESS-V1.md`
- `index.html`
- `assets/homepage-search.css`
- `assets/whats-on.js`
- `assets/nue-analytics.js`
- `scripts/website-health.js`
- `.github/workflows/website-health.yml`
- `.github/workflows/nue-preview-visual-qa.yml`
- `data/events.json`
- `data/discovery.json`
- `updates/index.html`
- `assets/config.js`

## Remaining production gate

The preview implementation and source/browser QA are complete enough for owner review.

Do not merge PR #139 or deploy these changes to production until Paul explicitly approves production.

## Recommendation

Approve this as a deliberately small NUE release if the owner preview looks right. It makes common reader tasks faster, fixes concrete freshness debt and adds a reusable exception-checking safety net without introducing another content silo or service.
