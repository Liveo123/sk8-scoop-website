# 52 Adventures premium gallery: safe current-main staging (28 Oct 2026)

**STATUS: DRAFT ONLY, NOT COMMERCIALLY AVAILABLE. NO LIVE INSERTION, PAYMENT, EMAIL OR INVENTORY RESERVATION.**

The original £39 introductory premium gallery (owner approved the price on 16 October) was prototyped in old draft PR #220 against an earlier guide source. Since 52 Adventures was approved and published as PR #265 (merge `028c8f801b5c90d586cdc5afdfc49bbbcc3a1854`), **do not merge PR #220**; it would contain a dated guide snapshot. This clean draft starts from the *current* production `main` and selectively stages the disabled, separately labelled optional ad module.

The guide has 52 unchanged editorial adventure JSON entries, 52 unchanged current image-data mappings, the original copy, selection order, art and rights credits. The new module sits in a distinct `section#sk8-52-premium-slot[hidden]` outside the independently ranked editorial cards, with separate config/css/js. All four activation flags are false by default: `enabled`, `ownerApproved`, `advertiserArtworkApproved` and `imageRightsCleared`. No business information, inventory, start/end dates, images or booking links are populated. No live prices, checkout codes or Stripe products changed.

**Offers**
- Existing ordinary Guide advert: £28 for one labelled 30-day card in an agreed Guide, subject to available inventory and price/checkout verification.
- New premium gallery: £39 introductory for one clearly labelled separate 30-day placement, with up to five advertiser-approved/licensed photos, practical details and a single booking/enquiry link. Approved **price**, not an enabled placement or public availability.

**Prerequisites before any owner-approved activation:**
1. Named advertiser/business suitability, actual available 30-day inventory, scope, start/end dates and stated tax/checkout amount verified.
2. The advertiser approves up to five exact photographs, usage rights and captions; original guide editorial order remains unchanged.
3. Explicit approval to activate that precise advertiser/creative and to send any outreach message; privacy/PECR/opt-out and all Gmail/CRM history checked.
4. Browser QA of the specifically populated gallery on 320px/390px/desktop, clearly labelled paid status, working booking link, truthful click/impression tracking; user-visible preview.
5. Separate revenue/lead experiment: record owner time, real replies, bookings, actual payments, and offer retention only if the incremental £11 premium covers extra creative and reporting effort.

**Companion outreach review (not sent):** https://docs.google.com/document/d/1QuLuUbyZqlFb6rWFSdBWcEP2Vkm9UIM-lkvJv7ob5Dc/edit

This draft is not suitable for merging into main merely because generic CI passed. The two-option featured-operator emails remain HOLD pending legal, inventory, premium availability and owner's exact-send authorisation.


## Operational handoff: first paid booking (28 October 2026)

**Do not confuse approved price, production code, sellable inventory and a paid booking.** These are four separate states. Current state is **preview-only, disabled, not bookable**. The current preview infrastructure retains one optional gallery slot, so do not promise overlapping 30-day placements or a fixed start date without checking that slot. Confirm the 30 *inclusive* UK calendar dates in writing.

### Live Stripe check (read-only, 28 October 2026)

- Active GBP one-time prices observed were £35.00, £14.99, £90.00 and £40.00. **No £39.00 price/product** was present, and no ordinary £28 Guide catalogue price was present in this connected Stripe account. No changes or charges were made.
- Stripe Tax settings report **pending**, with missing `head_office`. The account's Stripe Tax registrations list is empty. This **does not prove** that the proprietor is not registered for VAT elsewhere.
- The Company Operating Manual records **Paul Livesey as sole trader**, trading as JiveLoop, with SK8 Scoop as publication brand. The proprietor's tax establishment/VAT status must be confirmed by the owner or accountant; do not decide it from an Egyptian current location or empty Stripe registrations.
- GOV.UK sole-trader invoices require the proprietor's name, any trading name, an address for legal service, invoice identifier, dates, service description, customer details, amount and applicable VAT/total. Source: https://www.gov.uk/invoicing-and-taking-payment-from-customers/invoices-what-they-must-include . Do not display VAT as a charged line when it is not legally applicable or registration is unverified.

**Minimal payment design:** for the first sale use an individual **one-off Stripe invoice prepared after commercial and tax approval**, with an ad-hoc item rather than building a publicly accessible checkout or auto-activating a gallery from a webhook. Proposed line description: `52 Adventures premium photo-gallery advertisement | one agreed 30-day placement | [START–END UK dates] | [placement ID]`. Approved introductory product price: **£39 GBP**, with total/VAT treatment agreed in writing before invoice issue. Set invoice to human-review/draft while preparing; only finalize/send once specifically approved. Payment ordinarily precedes publication. Do not create a live reusable Stripe product, price, payment link or invoice as part of this technical PR.

### One placement, one controlled sale

1. **Lead and compliance:** featured operator already in guide; check legal contact classification, suppression, previous messages across aliases, business suitability, and exact corporate inbox. Keep all current unsent email holds intact.
2. **Availability and brief:** confirm the single paid slot does not conflict with an agreed campaign; record advertiser/business, one target booking/enquiry URL, exact dates, service promise and reporting limits. Confirm no payment buys editorial ranking or favourable treatment.
3. **Assets:** advertiser supplies 2–5 photos. For EACH photo save a local approved file, source/rights basis and permission/licence evidence, sensible alt text, visible caption/credit, mobile crop and advertiser approval. Verify each real business/photo; sample guide imagery used in isolated QA is NOT advertiser-clearance evidence. No SVG assets.
4. **Proof:** prepare the actual advertiser configuration in an isolated preview; test photographs and captions, link, name, prices and restrictions, 320/390/740/desktop widths, keyboard controls, label placement, expiry, and analytics consent. Obtain advertiser and owner creative sign-off. One reasonable correction round, not open-ended image production.
5. **Tax and invoice:** verify proprietor VAT/establishment status, Stripe invoicing/tax configuration, exact £39 price treatment and customer invoice details. Obtain owner consent to create/finalize/send the one-off invoice. Never infer `paid` from `draft` or `open`.
6. **Publication:** only on separate specific authorisation, merge/deploy the disabled module (if not yet done), then activate the advertiser's exact 30-day config after verified payment and fresh end-to-end production QA. Keep the normal guide independent and preserve fallback to `enabled:false`.
7. **Reporting:** reconcile actual Stripe cash and advertiser record, provide a modest report separating consented measured gallery views/clicks from unknown total reach, log owner hours and any advertiser-confirmed enquiries. On day after endDate, verify auto-hiding and no live CTA; disable/remove stale config.

### Minimum viable experiment and economics

- One first paid placement, not a multi-advertiser automation or subscription system.
- **Hypothesis A (sales):** among three cleared featured corporate operators, at least one concrete paid booking or qualified paid request within a 14-day observation window. Never count unopened drafts or speculative replies as revenue.
- **Hypothesis B (attention):** once live, measure properly consented 50%-visible-one-second impressions and unique/total booking clicks with limitations, without representing GA4 as complete reach or clicks as bookings.
- **Hypothesis C (workload):** the premium uplift is only **£11** above the £28 standard card. At an additional 30 minutes, uplift yields just £22/hour before payment costs/overhead; at 60 minutes only £11/hour. Track the actual extra time. Stop or simplify the 5-photo format if it repeatedly fails this test.

### Explicit release gates still outstanding

- Reviewer/owner approves the **disabled infrastructure production merge** after all staging CI and visual QA pass.
- Owner/accountant confirms the **tax/establishment treatment** and invoice identity. Stripe Tax `pending` cannot be silently treated as resolved.
- A **named real advertiser**, exact approved rights-cleared creative, booking URL, dates and current availability are required before any live advert, invoice, or sale.
- Contacting operators and collecting payment each require their own specific approval. A price approval alone is not one.

