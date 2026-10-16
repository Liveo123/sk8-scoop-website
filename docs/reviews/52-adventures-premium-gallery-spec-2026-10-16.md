# 52 Adventures premium photo gallery: controlled pre-launch record

**Decision date:** 16 October 2026  
**Owner approval:** £39 introductory price for one 30-day premium-gallery advert, separate from the existing £28 standard Guide advert.  
**Status:** PRODUCT PRICE APPROVED; no publishing, outbound sending, checkout/payment changes or campaign booking authorised.  
**Preferred draft:** [main-based draft PR #220](https://github.com/Liveo123/sk8-scoop-website/pull/220).  
**History:** old draft PR #218 depends on conflicted, unmerged guide refresh PR #172 and is superseded by PR #220 for review. Neither should be merged without explicit owner approval.

## 1. Approved commercial offer

| Product | Price | Contract |
| --- | ---: | --- |
| Ordinary Guide advert | £28 | Existing approved standard Guide card, 30 days in year-round guides, separate from premium |
| **52 Adventures premium gallery** | **£39 introductory** | One clearly labelled premium photo-gallery paid card, 30 UK calendar days, one agreed booking/enquiry action |
| Newsletter | £35 | One agreed issue, unchanged |
| Guide + newsletter | £60 | One ordinary Guide card plus one newsletter placement, unchanged, not inclusive of premium gallery |
| Section / main Guide sponsor | £96 / £125 | Existing separate products, unchanged |

The £39 is the **total one-off premium gallery price**, not £28 plus £39. No automatic renewal, discount claim, guarantee of bookings or pre-payment reservation. One gallery slot maximum for the MVP. Exact availability and placement remain subject to approval; do not manufacture scarcity.

## 2. Paid/editorial boundary and production inclusions

- A standalone, visibly labelled **ADVERTISEMENT** before the promotional headline; separated from the 52 independently chosen adventure entries and their editorial rankings. Payment does not secure or change an editorial recommendation.
- Two to five approved photographs (aim for five), each with meaningful alt text, approved reuse basis, appropriate credit, and proof recorded in the image-rights workflow. An enum value or advertiser claim alone is not legal evidence.
- Short specific headline, concise description, practical visitor information (where, duration, suitability and any verified price), and **one** HTTPS booking/enquiry link agreed with the operator.
- SK8 Scoop may format submitted artwork and copy for approval; advertiser must approve exact creative, booking URL and factual claims in writing before any publication.
- Promotional/AI-generated photos must be presented as **illustrations**, never as evidence of the actual advertiser's venue, session, facilities or customer experience.
- The product's 30 days are inclusive of the agreed UK start date and end date, with automatic expiry. No evergreen paid placement or implied permanent top spot.

## 3. Code and measurement contract

- Branch `preview/52-adventures-gallery-mainline-oct16` is created directly from current main. The actual Guide file receives only a hidden module insertion, one stylesheet link and two script links. The original 52 entries and their order are untouched.
- `assets/52-adventures-premium-config.js`: all campaign, artwork and owner-approval switches default **false**; business, booking and image fields are blank.
- `assets/52-adventures-premium-gallery.js`: validates required fields, 2–5 image records with PAUL/PERMISSION/LICENCE rights basis, HTTPS links, strict 30-day UK civil dates, and approval switches. Expired campaigns vanish even from an open browser tab. Data is inserted via text nodes, not raw HTML.
- `assets/52-adventures-premium-gallery.css`: separated commercial layout, mobile breakpoint styling, keyboard-visible controls and one obvious white-text CTA on deep teal.
- Analytics through the existing consent-respecting `sk8Track`: `guide_advertiser_render` means DOM insertion, **not** an impression; `guide_advertiser_view` needs ≥50% visible for a continuous second; `guide_advertiser_gallery` logs gallery interaction; `guide_advertiser_click` logs the paid CTA. Never mix paid performance with editorial guide clicks, or describe consenting-event counts as full readership.
- Do not treat gallery navigation, page loads or organic entry opens as paid advertiser clicks. Report only measurable actions with limitations and confidence, never invented conversions.

## 4. QA and safety testing

- `scripts/check-52-adventures-premium.mjs`: regression checks original adventure count, disabled default, expiry, safe links, photo rights gate, date arithmetic, visibility interruption and paid click counts.
- `scripts/check-52-adventures-premium-browser.mjs`: injects a **fictional, temporary** QA card into an isolated Cloudflare preview browser tab only; tests default-hidden state, 390 / 740 / 900 / 1440 widths, images, thumbnails, arrows, keyboard and paid click event; reload verifies fictional advert does not persist.
- Workflow `.github/workflows/post-launch-site-qa.yml` runs both checks and archives screenshots for seven days. Browser smoke cannot be considered passed simply because CI is green: explicitly inspect the premium browser step result.
- The standalone local sales preview was independently checked at the four viewport widths after removing three contradictory obsolete £39-pricing statements. Its photographs are illustrative examples, not proof of a real operator. A standalone sales mock-up is not a deployed sales route.
- Before any real launch, repeat browser QA using the advertiser's approved creative, including real image crops, alt text, mobile layout, caption contrast, keyboard navigation, reduced motion, link response, cookie-denied analytics behaviour and scheduled expiry. Run post-deployment smoke only after separate publication approval.

## 5. Payment and booking control (read-only findings)

- On 16 October, a **read-only** check of the connected live SK8 Scoop Stripe account showed two active legacy one-off catalogue prices: £40 TEST and £90 GROW, with no active payment links. Neither the £28 Guide advert nor the £39 premium gallery existed as an active live Stripe price.
- The current public standard advertising pages include the approved five standard products, but no enabled £39 premium selection. This is appropriate while the gallery is not available to book.
- Do not alter, retire or charge anything in Stripe without a new explicit owner authorisation. Before payment, reconcile exact £39/GBP one-time price, VAT status, sole-trader/JiveLoop identity, invoice/receipt, approved placement ID, agreed dates and payment webhook fulfilment.
- Once separately authorised, create an isolated approved payment route after manual campaign/availability confirmation, not an automatic purchase button that could sell unavailable inventory. Payment success must be verified server-side; a user reaching a success page is not enough.

## 6. Outreach only to businesses already in the guide

- This is a **52 Adventures featured-operator upgrade campaign**, not a generic advertiser or page-testing campaign. Approach only appropriately vetted operators already featured in 52 Adventures and with a genuine current booking angle.
- Existing core-SK8/hyperlocal preference, lawful recipient/legal-entity checks, suppression, complete Gmail/CRM alias history, proof of current activity, unique human copy and no unsupported click claims remain mandatory.
- Explain that the current adventure remains editorial regardless of advertising. A £28 standard card and £39 premium gallery are distinct options. Until the gallery is genuinely bookable, any outreach material is HOLD and must not imply it can be purchased today.
- Historic held drafts: Graystone, Manchester River Cruises and The Snow Centre; outside core SK8 pending specific exception and current-offer verification. Venture Out in nearby Heaton Mersey is potentially stronger geographically but an earlier Gmail draft attempt failed; do not claim it was saved. Suppressed/prior-contact operators (including Avro Heritage) must not be re-added as cold leads.
- Do not send any email or social DM without a separate owner approval for exact copy and recipients; a product pricing approval does not authorise sending.

## 7. Real launch gates, in order

1. Owner approves the actual commercial slot location/inventory policy after seeing the gallery within the production-context guide, with one gallery placement maximum.
2. Run and inspect every contract and Chromium preview step on PR #220; if main changes, update the draft and rerun. Do not merge old PR #172 to make this function.
3. Verify exact advertiser entity, contact clearance, copy, one approved booking URL, approval emails and each photo's underlying rights. Record start and inclusive 30-day end in the commercial pipeline.
4. Reconcile published offer, approved tax treatment, live Stripe price and webhooks with the £39 total before issuing a payment request; no changes until authorised.
5. Secure Paul's **specific permission** to merge/publish the implementation, send each approved outreach batch, and take actual campaign payments. These are separate consequential approvals.
6. After approved deployment, verify the actual live placement, paid/organic analytics distinction, user-facing disclosures, pricing and auto expiry. Remove the placement on expiry and report consenting clicks with limitations.

**Recommendation:** Keep the single-slot £39 introductory test until at least three genuinely delivered campaigns or 60 days of relevant observation. Evaluate paid enquiries/bookings, actual fulfilment minutes, repeat interest, consented link clicks and any impact on editorial trust. Do not sell reach or outcomes not supported by measured data.
