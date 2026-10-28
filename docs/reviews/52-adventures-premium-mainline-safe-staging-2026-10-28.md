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
