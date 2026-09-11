# Homepage and What’s On QA — 11 September 2026

Preview only. No merge, push or deployment performed.

## Starting state

- Read CODEX-HANDOFF.md and VISUAL-OS.md before inspection.
- Branch: preview/homepage-nue-v1; HEAD 1cc99ede3c169bc1f313a908079ea0866e3a9bcd matched PR #18 head.
- PR #18 is open and draft; GitHub reported mergeable=false. No merge attempted or conflict resolution undertaken.
- Existing working-tree deletion of poll/issue-11/index.html left untouched.
- Inspected hosted homepage and /whats-on/ with the in-app browser, then tested edits using a loopback-only Python static server on port 8765.

## Changes

- Move KNOW / DO / DISCOVER badges into their own row above artwork. Previously they obscured baked-in image labels. Keep artwork contained and remove image corner clipping.
- Restore white text on SK8 teal for homepage and What’s On buttons, including header and homepage signup overrides.
- Fix weekend date comparison: both boundaries and event dates now use UTC midnight representations of UK calendar dates. The noon boundary excluded Saturday and made Sunday-only results fail on Sundays.
- Preserve artwork, eight Explore destinations, guide content, subscriber recognition and signup/consent logic.

## Evidence

- Desktop viewport 1280×900: four equal Explore columns (269.5px); no horizontal overflow; all three badges geometrically separate from their images.
- Mobile viewport 390×844 (375px content width): homepage and What’s On have no horizontal overflow. Homepage uses one Explore column; all three story badges remain separate from contained artwork.
- Existing richer WEBP category and quick-filter artwork is in use. Free & Cheap logo remains contained. No new images or replacement SVG artwork introduced.
- What’s On event cards are text-led where no event image is supplied.
- Local filters on 11 September: All 10, Weekend 4 (all dated 12 September), Free 6, Family 4.
- What’s On retains noindex,follow.
- node tests/whats-on-weekend.cjs: 10 passing cases covering Friday, Saturday, Sunday, Monday, UK midnight and the autumn clock change.
- node --check assets/whats-on.js and git diff --check passed.

## Remaining review work

- Hosted homepage Turnstile displayed “Unable to connect to website” in this browser. Cause not established; signup was not submitted. Local static preview does not validate Worker endpoints or production signup.
- Several event source links point to paginated council searches. Recheck direct event evidence and freshness before production approval; this pass did not re-research listing facts.
- Existing artwork is richer collage/photo-style material, not uniformly the illustrated badge family described in the visual reference. Preserve it pending an explicit asset choice; do not invent replacements.
- Small baked-in DICM annotations remain difficult to read at card size; nearby HTML provides the main practical details. Consider an accessible enlarged-image view in a later pass.
- Continue category QA page by page, starting with Food & Drink. The approved Free & Cheap Guide remains untouched.
- These fixes are local and uncommitted. Hosted preview and PR do not yet include them.
