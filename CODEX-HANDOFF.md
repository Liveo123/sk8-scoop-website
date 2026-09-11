# SK8 Scoop Codex Handoff

## Purpose
Continue the SK8 Scoop website preview safely in Codex without losing the decisions and lessons from the ChatGPT build thread.

## Repository and branch
- Repository: `Liveo123/sk8-scoop-website`
- Work only from: `preview/homepage-nue-v1`
- Draft PR: #18
- Preview only. Do not merge to `main` and do not deploy to production without explicit approval from Paul.

## Current build direction
Build the website page by page. Keep the current SK8 Scoop visual language unless a specific change is requested. Do not restart a wholesale redesign and do not bring the older broad NUE branch back into active use.

Core flow:
Facebook / Google / WhatsApp / recommendation -> SK8Scoop.com -> useful experience -> next useful experience -> email relationship -> return to site.

Website = centre of experience. Email list = centre of relationship.

## Homepage
Keep the hero first.

The three weekly story cards use KNOW / DO / DISCOVER framing.

Explore SK8 contains eight destinations and should remain four equal-width cards per row on desktop:
1. What's On
2. Free & Cheap
3. Food & Drink
4. Kids & Family
5. Outdoors
6. Local History
7. Planning & Development
8. Useful Updates

The Free & Cheap card must use the proper SK8 Scoop Free & Cheap Guide logo and should not crop it.

Current issue content is driven from `assets/config.js`.

Recognised-subscriber behaviour exists on the homepage using local browser storage. Preserve it unless there is a specific reason to change it.

## What’s On
The page is a functional preview, not just a holding page.

It should:
- show current checked listings only
- filter out expired events automatically
- support weekend, free and family filtering
- use source links where available
- never invent event listings
- remain `noindex` until approved

Avoid calling listings “verified” unless the evidence genuinely supports that stronger claim. “Checked” is the current preferred wording.

## Category pages already in preview
- `/food-drink/`
- `/kids-family/`
- `/outdoors/`
- `/local-history/`
- `/planning/`
- `/updates/`
- `/around-sk8/`

These are preview pages and remain subject to visual/content QA.

## Free & Cheap Guide constraint
Do not rewrite or redesign the approved Free & Cheap Guide itself. Treat it as an established experience. Website work may route into it, but the guide remains authoritative.

## Visual rules
Read `VISUAL-OS.md` before changing imagery.

Critical rule from recent feedback: do not replace good, rich artwork with cheap-looking SVG line drawings or simplified vector approximations.

If approved richer artwork already exists, preserve it rather than creating a weaker substitute.

### Approved smaller-card direction
The desired style is the richer illustrated card family shown in the reference screenshots supplied by Paul:
- hand-drawn editorial scene
- cream/off-white base
- deep teal/ink
- natural greens
- orange accents
- layered local details
- stronger visual depth than generic icon cards
- dark circular pictogram badge may overlap the lower part of the illustration

The target is not a flat app icon, pastel wellness card or sparse line drawing.

### DICM rule
For diagrams, infographics, charts and maps, use a two-pass process:
1. clarity and information hierarchy
2. editorial richness, layering, annotation, texture, local cues and visual interest

A DICM image is not finished merely because it communicates the idea.

### No crop-loss rule
For every image added or created:
- keep important content away from edges
- check the actual desktop and mobile container
- do not chop off labels, badges, faces, landmarks, route markers or key text
- use `contain` for DICM/guide artwork unless a crop has been explicitly checked and approved
- rounded corners count as cropping

### Repetition rule
Do not reuse the same image repeatedly across nearby sections unless it is an intentional brand asset such as the Free & Cheap Guide logo.

## Recent regression to avoid
Recent simplified SVG card illustrations were rejected because they made the site look worse and less distinctive. The branch has been rolled back to richer existing WEBP artwork for Explore SK8 and What’s On quick cards, and the cheap SVG event-card illustrations should not be reintroduced.

If no strong, relevant image is available for a What’s On listing, a clean text-led card is preferable to a weak synthetic illustration.

## Existing useful files
- `VISUAL-OS.md`
- `data/homepage.json`
- `data/events.json`
- `assets/homepage-nue.js`
- `assets/nue-preview.css`
- `assets/whats-on.js`
- `assets/whats-on-card-polish.css`
- `assets/config.js`

## Current preview URL
`https://preview-homepage-nue-v1-sk8-scoop.quiet-term-e047.workers.dev/`

Cloudflare branch previews can lag behind the newest commit briefly. Check the current branch/PR status before assuming the preview reflects the latest code.

## Working method
Before making a change:
1. inspect the current rendered page and relevant source files
2. identify the smallest coherent improvement
3. make the change on `preview/homepage-nue-v1`
4. check desktop and mobile behaviour
5. check crop safety and image repetition
6. keep the result in preview only

Do not create chains of no-op commits. Keep changes coherent.

## Next task
Start with a criticism/QA pass of the current homepage and What’s On page, focusing on visual regressions, image quality, cropping, repetition and whether the richer approved artwork is actually being used. Then continue page by page.

Do not generate an endless new batch of images. Build and improve the actual pages, using existing approved artwork wherever possible.
