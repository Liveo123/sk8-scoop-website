# SK8 Scoop Issue 22: Birthday Time Machine launch gate
Status: **PRIVATE REVIEW / NOT DEPLOYED / NOT SENT**. Owner choices received on 20 November 2026.

## Confirmed owner decisions
- Place Birthday Time Machine immediately **below the full SK8 Pinboard** and above After School, Before Tea.
- Present the creative as a SK8 Scoop-owned commercial product, separate from independent editorial and Pinboard community notices.
- Experimental **£9.99 newsletter-only price for two weeks**, compared with the standard £14.99. This is a **£5 Payhip product-only coupon**, not a permanent product price cut.
- Alternative: one free Birthday Time Machine digital kit after **three different genuinely new SK8 Scoop subscribers** join voluntarily using the referrer's personal code and independently confirm the separate referral email. One reward per existing eligible referrer.
- Use **automatic transactional email delivery** as in the existing Radar mechanism, while keeping **SK8 and Radar subscribers and rewards separate**.
- Issue 22 is still a review, not permission to schedule/send or modify live services.

## Exact newsletter proof and staging
- Base source: **SK8 Scoop Issue 22 Review v15.html**, the newest private layout from the Library, not the earlier Draft 1 PDF. Source remains unchanged.
- New derivative proof: **Issue 22 v16**, scoped to one product module immediately after Pinboard. No other module intentionally changed.
- The v16 version contains proprietary clockwork artwork, £9.99 experimental offer and two visible but **non-clickable placeholders** until both routes pass actual QA.
- Keep original logo and verified v15 image credits and the v13 NUE link map. Do not promote unpublished poll, guessing form or placeholder links.
- Preserve a dated v16 handover; never overwrite v15 or the master.

## Coupon state confirmed by owner screenshot (20 November 2026)
- **Created:** `SK8CLOCK5` for Birthday Time Machine, fixed amount 5.00 (creation form explicitly showed GBP), no uses so far. The list view displays **$5.00 off**, so **checkout currency and actual amount have NOT been verified**. Do not claim the live checkout is £9.99 until a test proves it.
- **Expiry currently shown:** 4 December 2026. Payhip documentation says coupons expire at **00:00 UTC at the start of the chosen end date**. If an approved email goes out on **20 November 2026 at 18:00 UTC**, a full 14-day validity requires expiry at least 4 December 18:00 UTC. To cover the full day on a date-only picker, choose **5 December 2026** (expiry 00:00 UTC), which provides 14 days plus six hours. If send delayed, move expiry accordingly.
- **Next owner action:** verify GBP product and exact £9.99 total at checkout after the correct release ZIP is attached and the product is switched to Unlisted for a controlled test. A real card payment is not authorised.

## Reader-paid checkout (Payhip, no development necessary)
- Product: `https://payhip.com/b/r5tML` (from owner setup). Historical configured price **£14.99 GBP** and Stripe connected in Payhip.
- **To set up in Payhip, owner must authorise/test:** create a **product-specific £5.00 discount code**, proposed label `SK8CLOCK5`. This makes £14.99 - £5.00 = £9.99.
- Assign an expiry **14 days after the actual email send**, not before. Use Payhip coupon timezone/date rules and verify a checkout at precisely £9.99.
- Correct sales description to match product: ages 8–11, roughly 4–12 children and 90–130 minutes incl. break as **provisional** until independent child playtesting. Confirm taxes, digital-content returns and seller details.
- Replace the older **v8 Product Test Pack** with the clean, validated **Birthday Time Machine Release Candidate ZIP** only after explicit approval. Do not advertise instant delivery until a separate 100% coupon checkout proves ZIP and emailed link.
- Temporarily **Unlisted**, not Invisible, for the supervised customer checkout test; Unlisted permits direct-link purchase while Invisible can prevent purchasers downloading.
- Do not promote until product is accessible and no wrong-version ZIP is attached.
- The two-week voucher should be delivered via a tracked `?coupon=...` or Payhip coupon link **only after verifying the actual checkout supports the URL parameter**. If not, use product URL and clear on-page coupon instructions; never invent URL parameters.

## Free referral architecture (distinct from Radar)
- Existing production Radar code is live and independent. New branch **`issue22-btm-offer-referrals-20261120`** stages its adapted system, all feature flags **OFF**.
- Main SK8 newsletter group: `190964754190174086`; never route Radar subscribers there automatically.
- A current, active SK8 reader requests a non-personal opaque `BTM-` code by email. Turnstile, anti-enumeration response, same-origin guard, 12-hour cooldown.
- The reader voluntarily shares their personal link. Recipient enters their own email and consents to **SK8 Scoop**. Existing SK8 group, suppressed/unsubscribed, invalid/self or duplicate addresses cannot count.
- On new SK8 membership, an independent confirmation email requests a click within 48 hours solely for referral credit (not subscription consent).
- After three confirmed **distinct** active new readers, backend checks email alias identities, referrer still active, then triggers one Resend email with a private random 30-day download link, limited to five downloads. Ledger persists in D1.
- Private ZIP must be uploaded to **R2 private bucket** bound to Worker as `BTM_REWARDS`, object key `birthday-time-machine/Birthday_Time_Machine_Release_Candidate.zip`. R2 bucket not yet bound or populated; **no automatic delivery possible until configured and tested**. Do not expose package or answers in public GitHub.
- Resend ACCEPTED does not mean inbox DELIVERED; check provider logs. Failed transactions do not reaward automatically, admin reconciliation needed.
- Store only opaque codes and minimal IDs/status in D1. No referrer sees the friend's address.
- Test via mocks, then one allowed end-to-end test with separate real or authorised test inboxes, including 3 unique, duplicates/self/inactive, confirmation expiry, download expiry, provider failures and retry handling.
- Ensure GitHub branch previews cannot write live MailerLite contacts or send emails; flags off in preview and default source.

## Referral security note
- `birthday_time_machine_referral_code` MailerLite custom field exists. New D1 ledger has separate SK8 names from Radar. Attribution for truly new records uses existing fields only; maintain first-touch attribution for existing SK8/Radar readers.
- Do not switch flags on until the owner approves *both* test and production launch. No automatic migration or cross-brand list sharing.

## Hard blocks before Issue 22 is sent
- [ ] Correct landing/page CTA target to working product and referral URLs (replace the two inert newsletter button placeholders).
- [ ] Payhip product currently priced £14.99 GBP, correct PDF/HTML release pack and readable order confirmation.
- [ ] £5 coupon code created product-only, actually yields £9.99, expires after two weeks from the approved send.
- [ ] Owner confirms R2 private bucket, uploads final ZIP, binds `BTM_REWARDS` and performs independent 3-referral delivery tests.
- [ ] Rights check for product artwork and claim review; no child-data collection.
- [ ] Newsletter's own unrelated release holds (mystery photo rights/guessing link, poll, approvals, external booking availability, native MailerLite inbox/mobile/footer) resolved.
- [ ] Specific final-owner signoff for publishing the landing/referral system, for checkout activation, and separately for sending Issue 22.
- [ ] No send or production merge until these pass.

## Rollback
- Revoke flags `SK8_BTM_SIGNUP_ENABLED`, `SK8_BTM_REFERRAL_ENABLED`, `SK8_BTM_REWARD_ENABLED` to false (do not turn off Radar).
- Disable or expire the Payhip offer coupon without deleting the digital product or already paid customer files.
- Leave earned referral records intact for manual fulfilment if outage occurred during promotion.
