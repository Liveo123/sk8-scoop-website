# Generic SVG / utility icon audit — 11 September 2026

Preview branch only: `preview/homepage-nue-v1`.

## Decision
Generic thin-outline SVG icons and app-style icon tiles are no longer part of the preferred SK8 Scoop visual language. Use richer page-specific artwork, text-led editorial markers, or no decorative visual instead.

## Fixed in this pass
- What’s On lower information panels: old visible SVG icon tiles are visually replaced by typographic editorial markers (`01 CURATE`, `02 SEND IT IN`).
- What’s On final CTA: old dynamically inserted utility icon is suppressed.
- What’s On empty state: old line-icon treatment is suppressed and replaced with a text-led notice-board treatment.
- Food & Drink top card bands: redesigned as menu/ticket/editorial information panels without generic icons.

## Remaining generic icon-style uses to remove in later page passes
- Homepage lower action strip contains inline SVG utility icons for Where to start and Contact.
- Category note panels on Kids & Family, Outdoors, Local History, Planning & Development and Useful Updates contain small inline SVG utility icons.
- `assets/homepage-nue.js` still contains a dormant generic SVG fallback for Explore cards, although the current eight Explore cards all use image assets.
- `assets/whats-on.js` still contains the old generic SVG helper in code for empty/panel states. Current CSS suppresses those visible icons; remove the helper cleanly when the What’s On page is next refactored.

## Not automatically classed as generic-icon failures
Some SVG files are full editorial illustrations or DICM graphics rather than utility icons. These should be judged visually. Do not replace a rich approved illustration merely to eliminate an `.svg` file extension if the replacement would be weaker.

Examples currently treated separately:
- homepage DICM map / route / history graphics
- 50 Secrets editorial artwork
- existing guide mockups

## Next removal order
1. Homepage lower action strip generic icons.
2. Category-note inline icons as each category page is QA’d.
3. Remove dormant JS icon helpers once no visible page relies on them.
4. Review full-illustration SVG assets individually for visual quality rather than file type alone.

No production merge or deployment approval is implied by this audit.
