# SK8 Scoop NUE post-launch v2

Date: 11 September 2026
Status: release candidate
Owner: SK8 Scoop

## Purpose

Implement the highest-value improvements identified immediately after the NUE website launch, without adding speculative product complexity.

## Included improvements

1. Current-content fallback drift was fixed separately in PR #25 and is protected by the current-content freshness workflow.
2. Advertising is rebuilt around the current approved TEMP TEST £40 and TEMP GROW £90 offer, with a goal-first enquiry journey.
3. What’s On is moved out of launch-era noindex state and given stronger local-search metadata and structured data.
4. What’s On gains Today, Next 7 days and core-patch area filters for Cheadle, Cheadle Hulme, Gatley and Heald Green.
5. Consent-aware NUE measurement adds missing page events, contextual continuation events, filter-use events and experiment exposure events.
6. Release QA verifies live public routes, production API validation paths and Formspark reachability without creating fake production records.
7. Major reader destinations receive a reusable contextual Next Useful Experience continuation rather than a generic dead end.
8. The homepage retains “What’s good around SK8?” but tests a clearer first-screen utility promise beneath it.
9. Food & Drink and Local History gain recognisably local rights-cleared photography with visible credit and useful alt text.
10. The launch-era `nue-preview.css` name is retired in favour of production `nue.css`, and the Worker-first API architecture is documented with compatibility parity checks.

## Deliberate experiments

These are before/after product experiments rather than cookie-heavy A/B tests. Results should be treated directionally because traffic mix and weekly content change.

### Experiment 1: homepage utility promise

Hypothesis: explaining “things to do, useful local updates and money-saving ideas” directly under the distinctive homepage headline will help new visitors understand the product faster and increase useful progression.

Changed variable: homepage lead copy only.

Primary metric: `signup_completed / homepage_visit` among consented analytics traffic.

Supporting metric: `nue_continuation / homepage_visit` where a measured continuation is available.

Guardrail: no material increase in immediate exits or drop in reader progression that would suggest the copy is over-specific.

Decision: compare the post-release period with the nearest useful pre-release period, record the traffic/context caveat, then keep, revise or revert.

### Experiment 2: What’s On local decision filters

Hypothesis: Today / Next 7 days plus core-patch place filters will help readers reach an actionable event faster than a single undifferentiated list.

Changed variable: local/date filtering layer.

Primary metric: `(event_detail_click + nue_continuation) / whats_on_page_visit` among consented analytics traffic.

Supporting metrics: `whats_on_filter_used`, filter mix, and empty-result frequency observed during QA/content review.

Guardrail: filters must not create dead ends; All areas remains the default and nearby useful listings remain available.

Decision: retain filters that produce useful progression, simplify or remove filters that are rarely used or frequently empty.

### Experiment 3: advertiser goal-first journey

Hypothesis: starting with the advertiser’s desired customer action and presenting the current TEST/GROW routes will produce better-qualified enquiries than a generic “advertise from £35” page.

Changed variable: hero framing, product explanation and current offer presentation.

Primary metric: `advertising_enquiry_completed / advertising_page_visit` among consented analytics traffic.

Supporting metrics: `advertiser_goal_selected`, `advertiser_route_selected`, positive replies and eventual paid tests.

Guardrails: form errors, wrong-fit enquiries, pricing misunderstanding, complaints and any weakening of the editorial-independence message.

Decision: optimise for qualified enquiries and positive business outcomes, not raw form volume.

## Commercial boundaries

Current standard customer-facing products in this release are TEMP TEST £40 and TEMP GROW £90. GROW is newsletter plus Free & Cheap Guide only when the Guide is a genuine contextual fit.

Recurring sponsorship, premium/category exclusivity, paid public-web placements and paid subscriber-area placements remain behind their approved readiness gates and are not presented as ordinary live inventory in this release.

## Image rights

The release uses two existing rights-cleared local images from the SK8 Scoop Image Rights Register:

- The John Millington, Cheadle Hulme: David Dixon / Geograph, CC BY-SA 2.0.
- Abney Hall, Cheadle: Benjamin Shaw, CC BY-SA 4.0.

Both are served from SK8 Scoop Cloudinary, have visible credit in the page component, and are displayed without forced cropping.

## QA and release controls

Three review cycles:

1. Structure/value: every change must map to a listed improvement or required supporting control.
2. Accuracy/experience: current issue/pricing/rights are checked against authoritative records, public reader flows remain clear, and What’s On keeps stale-event expiry.
3. Final risk/polish: permanent preflight passes on the exact PR head, Cloudflare branch build succeeds, temporary migration machinery is removed, and the final diff is reviewed before production merge.

After production merge, the main-branch workflow waits for Cloudflare and checks changed live GET routes. It then sends deliberately invalid JSON to reader-submission, event-submission and advertiser-enquiry endpoints and requires their normal 400 validation response. This verifies routing without creating production records. It also checks the configured Formspark endpoint is reachable without submitting a contact message.

## Known limitation

An automated release check deliberately does not create a fake successful subscriber, reader submission, event, advertiser enquiry or contact message. Successful production writes remain business data, so the release uses prior verified signup evidence plus non-destructive route/validation checks instead of polluting live systems.
