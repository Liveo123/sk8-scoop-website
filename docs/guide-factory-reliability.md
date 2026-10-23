# Guide Factory reliability QA: GQ-01 to GQ-10

Approved Guide Factory Manual: https://docs.google.com/document/d/1iHj4qZSK3hCBwD-k5jM7m_MQj-Wyq34xIUl7lN7z3Zo/edit

## Use
Run `node tests/guide-reliability-fixtures.mjs` and `node scripts/check-guide-reliability.mjs` from repository root. These tests are an addition to, not a replacement for, the existing preflight, browser QA, ten Critique/Fix cycles, approval and expiry tests. The new workflow runs relevant tests on guide-changing PRs and on main.

## Current technical coverage
- GQ-01: checks existing Free & Cheap claims register for source, date and claim-scope evidence; not blanket verification. New claims should use the `validateClaim` schema in `scripts/guide-reliability-core.mjs`.
- GQ-02: checks the 52 Adventure master against both pre-rendered Finder copies, including numeric GBP cost consistency, kind, region and duration. Wording that conveys different conditions despite matching amounts still needs editorial review.
- GQ-03: checks explicit disputed Free & Cheap event markers do not present verified event dates; reusable `eligibleForAction` helper refuses unsupported price/calendar eligibility. Embed this helper or equivalent in future interactive templates.
- GQ-04: checks duplicate HTML IDs on all three guide sources. Exact deployed commit/approved build/Cloudflare parity is still a separate release gate.
- GQ-05: reproducible negative tests for malformed claims, mismatched prices, incorrect Finder card metadata, missing guide delivery links and HTTP 403 misclassification.
- GQ-06: verifies the schema requires price's product name, GBP amount and correct unit. Exact source-table/menu alignment is a manual or specialist extraction gate, not inferred from price values.
- GQ-07: preserves existing rights-record SHA256 and WebP integrity checks for 52 Adventures. Live hosted image fetch and decode should be run for changed images before release.
- GQ-08: verifies all three success pages point to their matching direct full-guide URL. Does not submit a form, subscribe an address, trigger or claim MailerLite delivery.
- GQ-09: reuses existing guide/browser QA scripts. New state combinations and exact release browser verification remain a separate task; JS/static source checks are not browser evidence.
- GQ-10: provides reliable HTTP-result state classification (200 verified; 403/429 blocked; confirmed 404/410 broken; redirect, timeout or 5xx unverified) with negative tests. No external links are claimed checked by this offline script.

## Reporting and failure policy
All controls carry PASS, FAIL, NOT APPLICABLE or NOT VERIFIED. Preserve NOT VERIFIED until that exact test has run; a passing source checker cannot certify an email, browser, Cloudflare deployment, rights permission or third-party provider. Release-relevant FAIL blocks. Do not turn missing evidence or retrieval restrictions into a PASS. Current guide content, imagery, buttons, subscriber automation and production routes are not modified by this QA-only branch.

## Future improvement route
As each guide adopts structured claim-level master records, integrate those claims directly into the existing generation step, then extend the checker to cover initial HTML, filter state, dialogue state and calendar/saved values without manually duplicating facts. Before substantial releases, store a compact GQ-01..GQ-10 evidence record alongside the existing guide release log and execute controlled MailerLite tests only where authorised.


## Second-stage QA on review branch (22 October 2026; not merged)

New, read-only tools:
- tests/guide-hosted-fixtures.mjs checks valid and invalid image signatures, blocked/broken HTTP states and Halloween structured event assets and organiser links without external requests.
- scripts/check-guide-hosted-assets-links.mjs inventories the three full guides, compares checked-out HTML byte-for-byte with HTML served from GUIDE_QA_BASE_URL, fetches a spread of image bytes and samples HTTP reachability of organiser links. Use GUIDE_QA_PARITY_STRICT=1 with a local static server to require exact matching.
- tests/guide-reliability-browser.mjs uses Chrome to check direct guide access, 320px and 390px layouts, visible heading hierarchy and horizontal overflow; 52 Adventures Finder empty/recovered states, modal Escape, blocked storage, temporary saved state and actual sampled image decoding.
- .github/workflows/guide-hosted-browser-qa.yml runs these against localhost and creates a separate non-blocking read-only live sample. Retain both QA evidence artifacts.

Evidence must be interpreted narrowly:
- Image response headers and dimensions support technical validation; a Chrome img.decode() check is a separate test of practical display. Sampling does not verify every image or substitute for image-rights clearance.
- An HTTP 200 third-party link only demonstrates HTTP reachability. It does not prove the URL leads to the intended organiser, nor that the date, offer or price is current. Treat 403/429/timeout as blocked or unverified, not broken.
- The Halloween guide uses structured JSON event records in const E. Include their u organiser URLs and explicit visual assets; a scan of static anchor/image tags alone misses them.
- SHA-256 equality between checked-out and served HTML is content parity. Actual Cloudflare release/version identity still requires corresponding checked deployment and Git commit evidence.
- Opening a full guide without a cookie does not verify MailerLite subscription, group placement, welcome email delivery or cross-device entitlement. Use a properly authorised test subscriber, not a production send.
- Keep GQ-04, GQ-06, GQ-07, GQ-08, GQ-09 and GQ-10 dimensions not actually executed marked NOT VERIFIED. Passing individual technical checks is not a blanket release pass.
- This second stage remains proposed QA code pending owner approval of its pull request; it is not yet a new production rule or a live guide/content modification.
