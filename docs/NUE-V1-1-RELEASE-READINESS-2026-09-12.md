# NUE Build v1.1 release readiness — 12 September 2026

Branch: `preview/nue-build-v1-1`
PR: #30
Status: **preview approved; production merge still requires explicit owner approval**

## Release state

NUE Build v1.1 has completed the page-by-page owner review and final repository QA pass.

The preview branch was brought fully up to date with current `main` at merge commit `653e4cfbd9fa6ed4438d63c45701aad894cc2cbc`. That merge preserved the newly published Free & Cheap Guide, its publication workflow/data and current sitemap changes while retaining the NUE v1.1 page work. After the merge, `compare_commits(main, preview/nue-build-v1-1)` reported `behind_by: 0`.

The only overlapping reader-facing file from the intervening main changes was `guides/index.html`. The preview keeps both the v1.1 Guide Finder/design work and the current production freshness wording: `Fully updated 12 September 2026`.

After owner screenshot review, the homepage desktop header was corrected to expose the same complete navigation as the other reader pages: Home, What’s On, Guides, Where to start, Join, Submit, Contact, Advertise and the Join free CTA. The earlier homepage-only CSS that visually reduced the menu is now overridden for desktop, and the homepage QA contract explicitly guards the full menu.

## Final automated gates

At commit `0035c819008b5fe52e472266a08263ef4f25c6d0`:

- Current content freshness — PASS
- Homepage V3 QA — PASS
- Post-launch site QA — PASS
- Cloudflare branch deployment — PASS

The Post-launch site QA now smoke-tests the branch preview for the core public experience rather than checking only a small subset.

Preview routes covered by the release smoke test:

- `/`
- `/whats-on/`
- `/guides/`
- `/start/`
- `/join/`
- `/submit/`
- `/contact/`
- `/submit-event/`
- `/business-submissions/`
- `/advertise.html`
- `/around-sk8/`
- `/food-drink/`
- `/kids-family/`
- `/outdoors/`
- `/local-history/`
- `/planning/`
- `/updates/`

The same public-route coverage is now included in the production smoke job that runs after a future push to `main`. Existing non-destructive validation checks for reader submission, event submission and advertiser enquiry routes remain in place, together with the contact transport reachability check.

## Owner-reviewed pages

The owner has supplied screenshot-led feedback during this build for the homepage, What’s On, Guides, Where to start, Join, Submit, Contact, Advertise and Submit Event. Concrete issues found during those reviews were corrected before this release gate.

Pages already judged strong were deliberately left stable rather than repeatedly redesigned.

## Content and trust safeguards

- No invented live events, prices, planning details or historical claims were introduced.
- What’s On automatically suppresses expired events and current/future entries were rechecked for 12 September 2026.
- Advertising remains clearly labelled and editorial inclusion remains separate from payment.
- Advertiser examples are explicitly format-only; no fake campaign results, open rates, conversion claims or case studies were created.
- The Free & Cheap Guide itself was not rewritten by NUE v1.1.
- The Progressive Novelty rule remains documented in `docs/NUE-RULES.md` so likely next-step pages provide new value instead of simply repeating the previous page.
- Generic AI-style SVG icon tiles were not reintroduced into the active NUE experience.

## Visual QA scope

This release has extensive owner-supplied desktop screenshot review plus repository and hosted-route QA. It is **not** a claim that a new automated screenshot suite has rendered every page at every viewport width. Responsive CSS and existing mobile fallbacks remain in place, and no viewport-level result is claimed unless it was actually inspected.

## Production safety

PR #30 remains a **draft** and is **unmerged**.

Do not merge or deploy this branch to production until the owner gives explicit production approval. No D1 migration is part of this release.
