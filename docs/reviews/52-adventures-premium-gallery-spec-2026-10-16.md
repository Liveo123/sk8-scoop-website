# 52 Adventures premium gallery: owner-approved direction, NOT approved launch

**Status:** PRICE APPROVED, TECHNICAL PREVIEW ONLY. On 16 October 2026 Paul approved **£39 introductory / 30 days** for this separate 52 Adventures premium gallery. Existing **£28 standard Guide advert** is unchanged. Price approval does **not** authorise publishing, sending emails, payment collection, live activation or promising available inventory.

## Product / editorial contract
- Standard Guide card **£28** for 30 days remains unchanged and must remain independently available as approved.
- **Approved introductory price: £39 per 30-day premium gallery** (Paul, 16 October 2026). It is £11 above the £28 standard Guide advert. Price approved, **sale and activation on hold** until placement, billing and fulfilment checks pass and owner expressly authorises publishing, sending and accepting payment.
- Premium product: one separate, up-front **ADVERTISEMENT** block in the 52 Adventures home view, one paid slot maximum, 2–5 approved operator photographs (target five), useful practical details, one booking/enquiry CTA, tracking, and advertiser approval. This is **in addition** to, not a rewrite of, the original editorial listing. Do not sell improved editorial ranking, placement within the editorial eight picks, or other organic advantage.
- One paid placement only for this MVP, duration 30 days inclusive; monthly reach and measurable link clicks reported without minimum guarantees or identifying reader data. Operator supplies correct information, usage rights and approval; SK8 checks, edits and publishes; no automatic renewal.
- Labels and border distinguish paid material; write *ADVERTISEMENT* at top. <https://www.asa.org.uk/advice-online/recognising-ads-advertisement-features.html>.
- Use visually labelled thumbnails, arrows and accessible image descriptions. <https://baymard.com/research-articles/always-use-thumbnails-additional-images>.
- Ad content must not make the fictional preview seem like a real promoted venue; do not use generated illustrations as documentary evidence.

## Implementation on this branch
- This clean implementation branch is based directly on **current `main`**, independent of the older unmerged/conflicted guide refresh PR #172. The premium placement can be reviewed and tested without the availability refresh, which retains its own owner approval and release gate.
- `52-adventures/guide/index.html`: a new **hidden**, standalone section after quick routes and before editorial picks. Existing 52 entries, finder data and editorial recommendations unchanged.
- `assets/52-adventures-premium-gallery.css`: independent responsive styles, high-contrast ad header, keyboard focus, no forced oversized white panels.
- `assets/52-adventures-premium-config.js`: all required activation flags default `false`; no current advertiser.
- `assets/52-adventures-premium-gallery.js`: checks owner, artwork and rights approval, exactly 30 inclusive UK calendar days, essential fields, HTTPS-only action/image links, and 2–5 images. Every image must have alt text and an accepted PAUL / PERMISSION / LICENCE rights basis; one invalid image blocks the entire advert. Uses Europe/London to respect BST, hides expired cards in long-open tabs, and avoids untrusted innerHTML. All 52 independent adventures remain usable.
- Tracks `guide_advertiser_render` (component inserted), `guide_advertiser_view` (at least 50% visible for one uninterrupted second), `guide_advertiser_gallery` (image navigation) and `guide_advertiser_click` (CTA clicks) via consent-aware `window.sk8Track`. Never treat renders as impressions; disclose tracking-consent limitations. Clicks are not bookings.
- Original guide tracking remains separate from paid performance: don't count ordinary editorial entry opens or internal guide navigation as sponsor results.

## Blockers before any real booking
1. **Pricing done:** £39 for 30 days approved 16 October. Owner still needs to approve specific available inventory, detailed creative scope and slot location at the release gate.
2. Review and approve the production gallery change as its own PR from current main. Older guide refresh PR #172 remains separate and must not be accidentally merged as a dependency. Rebase this draft if main changes before release, then rerun QA.
3. Verify operational checkout/product identifiers, VAT/tax status, booking form, invoice and confirmation against approved price; don't modify payments until authorisation.
4. Reconfirm advertiser's exact operator, contact legality, complete inbox/CRM history, objections and actual current campaign fit. Don't send held prospect drafts.
5. Collect written advertiser creative approval; establish image reuse rights (including generated imagery disclosure where applicable) and a booking URL; fill a campaign record and expiry date.
6. Verify real deployment and browser interactions on phones/desktop including assistive and reduced-motion modes. Check images, links, copy, labels and events after deployment.
7. Obtain owner approval for the exact campaign and publication, then confirm slots and schedule. Never trigger from configuration edits alone.

## Measurement / pricing review
Guide Performance worksheet: 8–14 October full-guide active users **10**, guide_view events **36**, listing_open events **8** (not necessarily unique people). These data are early and do not establish readership of any specific sponsored slot. Small sample and current inventory uncertainty mean pricing is a **test hypothesis**, not market-validated.

Proposed review after three compliant paid placements or 60 days, whichever is later: total paid GBP, editorial impact complaints, guide traffic, sponsored clicks/CTR if actual viewable impressions are measured, business-confirmed leads/bookings where voluntarily provided, renewal, production minutes. Do not attribute page visits or organic editorial clicks to paid ads.

## Verification and safe launch handoff (16 October 2026)
- Original draft PR #218 is against conflicted guide refresh PR #172 and has been superseded by a main-based, still-disabled alternative. The original PR remains unmerged, as does the new draft.
- Continuous PR QA added at scripts/check-52-adventures-premium.mjs: activation gates, expiry, 30-day UK dates, licence/permissions, safe URLs, all 52 original entries, gallery navigation, one-second view event, tab visibility/return and paid-click classification.
- On GitHub commit 0c22ec89156f3ae9f7df20283ebb7136e76d4e50, Website Health, Post-launch site QA, the new premium regression step and preview smoke all PASSED. Main live smoke and header-layout were SKIPPED.
- The separate standalone sales-page preview with fictional photography was checked in Chromium at 390, 740, 900 and 1440 pixels: zero horizontal overflow, missing images or JavaScript errors. This does NOT amount to rendered browser QA of a real activated card inside the production guide.
- Campaign publication requires written advertiser content and photo approval, actual rights evidence for each photo, correct operator and contact checks, final approved public position, 30-day exact booking dates, and a confirmed secure HTTPS booking URL.
- Approved £39 gallery is a ONE-OFF INTRODUCTORY product; it does not change the £28 Guide card, nor silently alter the £60 standard Guide + newsletter bundle.
- Commercial measurement: consenting tracked viewable-card events and paid CTA clicks, no false impression or booking guarantee. Explicitly separate paid clicks from organic editorial adventure clicks.
- Release is still blocked until PR #172 is individually approved/merged, gallery is rebased and visually QA-tested with genuinely cleared images, inventory and VAT/invoice/Stripe mapping are checked, and Paul gives fresh approval before publication, sending any outreach or charging.
- The premium config starts with enabled=false, ownerApproved=false and imageRightsCleared=false; an enquiry alone must not flip those flags.
- Practical launch checklist: approve a single suitable placement, collect original sources and written creative permission, check one booking link and copy, record campaign ID and exact UK start/end dates, verify access and interaction on phone/tablet/desktop, confirm consent-gated analytics, gain owner publication approval, then run post-launch smoke and expiry check.

## 16 October additional verified preview and payment checks

- GitHub PR #218 remains a **draft**, with upstream guide PR #172 still open/unmerged; neither represents a production release.
- Commit `d05161e52cbbeab3620f5f74e7394c039ede6e63`: Website Health and Post-launch site QA **PASSED**. In the preview-smoke job, **Test disabled and fictional paid-gallery states in Chromium: SUCCESS** and **Save premium gallery browser QA screenshots: SUCCESS**. The browser check exercises the deployed guide at 390, 740, 900 and 1440 pixels, with a temporary, browser-only fictional gallery built from existing guide imagery. The gallery is absent before and after reload. It tests the thumbnail/arrow/keyboard navigation, visibility and one tracked paid CTA click. The runner archives screenshots for seven days. Do not misstate this as a real campaign going live.
- The first attempt at adding this browser test was marked **SKIPPED** despite a green build because the preview-smoke job did not check out the repo. That defect was corrected in the draft workflow before the subsequent successful run.
- Read-only inspection of **SK8 Scoop live Stripe account** on 16 October found exactly two active historical one-off products and two active prices: GROW £90 and TEST £40. No active payment links. There is **no** corresponding active £39 premium gallery product and no £28 Guide advert price in the current connected catalogue. Existing products have **not** been altered. The 14 October standard rate card and 16 October premium price are sales/operating decisions, **not payment-catalogue parity**. Do not request or collect money until a separately authorised billing reconciliation.
- Public advertiser-facing `advertise.html` and `advertise/intro/index.html` on the inspected GitHub default branch still list the standard five products only, so a £39 gallery selection is **not** part of the published standard enquiry form. This is intentional while the premium product stays under release hold. The existing form should not be made to pretend it books the new product.

### Final safe handoff for the owner

1. The **price decision is done**: £39 introductory one-off gallery for 30 days; £28 ordinary Guide card unchanged.
2. Before releasing anything, approve an actual paid-slot position/inventory policy and the upstream guide refresh PR #172; rebase and rerun PR #218's Chromium and contract tests against its eventual main-branch context.
3. Obtain advertiser creative, factual copy, explicit rights for each photograph, operator booking URL, action and the exact inclusive UK calendar dates.
4. Verify tax treatment, £39 one-time GBP amount, payment approval and webhooks against the live Stripe account **without** overwriting or retiring historical products unless separately instructed.
5. Recheck all specific email recipients against outreach legal, hyperlocal, suppression and correspondence gates; only send owner-approved exact messages once the product is demonstrably bookable.
6. Secure explicit owner permission to publish, send and take payment; then verify the deployed advert, run expiry check and report consented measurable paid clicks, not estimated sales.

## Mainline preparation note (16 October 2026)
The original preview PR #218 was anchored to the unmerged 52 Adventures refresh PR #172. Because PR #172 now reports a conflict against main, a clean second draft branch `preview/52-adventures-gallery-mainline-oct16` copies only the approved premium-gallery module and safety tests onto the current main guide. This avoids importing unrelated editorial updates. The paid slot stays hidden, all approval flags remain false, and no production changes follow merely from staging the branch. Subsequent review should prefer the new main-based PR once its browser checks are green.
