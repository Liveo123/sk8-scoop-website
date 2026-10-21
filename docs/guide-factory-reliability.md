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
