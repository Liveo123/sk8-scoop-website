# SK8 Scoop Visual OS

This file records the visual build rules for the current website preview and future page work.

## DICM BOS

All diagram, infographic, chart and map visuals must use a two-pass build.

**Pass 1 — clarity**
- communicate the useful information quickly
- make hierarchy, route, comparison, deadline or relationship obvious
- keep factual information distinct from decorative treatment

**Pass 2 — editorial interest**
- add enough detail, layering, texture, annotation, local cues and visual hierarchy to feel publishable
- avoid placeholder-simple diagrams
- avoid generic AI-looking lifestyle scenes
- prefer specific editorial maps, route sketches, archival boards, annotated plans, comparison graphics and useful visual explainers

A DICM visual is not finished merely because it is understandable. It must also be visually interesting and recognisably SK8 Scoop.

## Small-card illustration BOS

For utility cards, event-listing cards and lighter route cards, use a simpler illustrated style than full DICM while keeping a recognisable SK8 identity.

The approved visual reference is the rich illustrated Kids & Family / Food & Drink / Outdoors card family selected on 9 September 2026. Do not reduce that reference to a plain icon tile or a sparse line drawing.

Approved direction:
- cream or off-white base
- deep teal / ink as the visual anchor
- natural greens where relevant
- small orange or lime accents
- a proper illustrated scene filling most of the image band, not an abstract gradient or isolated app-style icon
- scene ingredients should be specific to the category: signposts, playgrounds, café boards and cups, trees, paths, buildings, market stalls, archive material, local noticeboards and similar editorial details
- where useful, include a dark circular pictogram badge overlapping the scene, as in the approved reference
- bold, hand-drawn editorial shapes and stronger contrast rather than washed-out pastel blobs
- enough scene detail to feel bespoke and characterful, but not enough to compete with the card copy
- avoid generic lifestyle scenes, wellness-app aesthetics and generic icon-library styling
- do not repeat exactly the same vignette across unrelated categories

### No substitute rule

An approved raster, photograph or rich editorial illustration must never be replaced by a simplified SVG or line-art approximation just because it is easier to implement. If the approved artwork cannot yet be integrated, keep the previous approved asset in place until the correct artwork can be used. Do not create a visually weaker stand-in.

This lighter style is intentionally separate from DICM: DICM explains; small-card illustration identifies and adds character.

## No crop-loss rule

For every image, photograph, illustration, map, diagram or chart added to the site:

1. Important content must stay inside a safe area of roughly 10–12% from every edge.
2. Titles, badges, callouts, map labels, faces, hands, landmarks, route markers and key data must never rely on the outer crop area.
3. The asset must be checked in the actual website container, not only as a standalone file.
4. DICM and guide artwork should use `contain` rather than `cover` unless a visual QA check proves that the crop is harmless.
5. Photographs may use `cover` only when the crop has been checked at desktop and mobile sizes and no important subject matter is lost.
6. Rounded corners and responsive resizing count as cropping and must be included in QA.
7. If a visual fails the real card or hero crop, fix the asset or the container. Do not leave the problem for a later pass.

## Repetition rule

Do not reuse the same image across multiple nearby website sections unless it is an intentional brand asset, such as the Free & Cheap Guide logo. Each destination should have its own visual identity.

## Final visual QA

Before a page is considered ready for approval, check:
- no chopped-off important content
- no clipped callouts or badges
- no accidental image repetition
- correct aspect ratio and focal point
- readable text and labels
- mobile and desktop behaviour
- alt text where the image conveys useful information
- no generic filler imagery
- no simplified SVG or line-art replacement for richer approved artwork
