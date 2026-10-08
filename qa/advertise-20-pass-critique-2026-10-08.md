# Advertising page: 20-pass criticism-and-fix record
Date: 8 October 2026
Scope: PREVIEW ONLY, PR #183. Live production unchanged. Approved primary rates: newsletter £35; Halloween Guide £28; combination £60.

Each pass tests one different failure mode, explains the weakness in the then-existing preview and identifies the implemented corrective action. “Code fixed” means changed in the preview branch, **not** independently verified on every device. Browser and payment tests are release gates.

| Pass | Lens | Criticism found | Improvement made | Verification |
| --- | --- | --- | --- | --- |
| 01 | Above-fold proposition | Hero described a local advert but barely mentioned the two channels. | Hero now says newsletter and local Guides, with specific SK8 places. | Static check |
| 02 | Primary CTA | “See an example” delayed the commercial decision. | Main button now jumps directly to the prices; example is secondary. | Browser QA |
| 03 | Page hierarchy | Long fictional example appeared before the packages. | Three packages now appear immediately after the hero/proof strip; example later. | Static check |
| 04 | Choice overload | Seasonal packages, old TEST/GROW and complex finder competed for attention. | Three primary choices; sponsorships collapsed in a details control; Finder optional. | Static check |
| 05 | Naming | Internal TEST terminology and overlapping offer labels made the packages sound complicated. | Reader-facing “Newsletter advert”, “Halloween Guide card” and “Guide + newsletter”. | Static check |
| 06 | Cross-page rates | Campaign Finder/Christmas route still recommended £40 and older packages. | Updated those offer references to the £35 newsletter rate. | Static/preview check |
| 07 | Renewal anxiety | It was unclear whether prices were a subscription. | Explicit one-off payment, no automatic renewal. | Static check |
| 08 | Guide longevity | No clear date guarantee and seasonal/archive risk. | Copy explicitly requires an agreed start/end and distinguishes archive from paid exposure. | Exact booked dates still require manual confirmation |
| 09 | Audience claims | Static 600+ fallback could become stale. | Neutral SK8 fallback until publicStats fills in a verified value. | Source review |
| 10 | Repetition | Duplicate four-step process buried the form. | Removed duplicated process block; short checkout-process explanation directly after pricing. | Static check |
| 11 | Advert example | Fictional example could be mistaken for proof of results. | Existing conspicuous fictional-label and sponsored disclosure retained. | Visual check pending |
| 12 | Form burden | Phone, category and area were optional but visually cluttered a first enquiry. | Removed non-essential fields; kept operationally required core fields. | Backend contract review |
| 13 | Route visibility | Guide and bundle were selected using hidden radios, making correction difficult. | Three visible form radio choices; dynamically visible sponsor route when selected. | Browser QA |
| 14 | Package handoff | Button click did not give a clear selected-price confirmation. | Selected package summary with aria-live, synchronised to every choice. | Browser QA |
| 15 | Meaningful enquiry | Script inserted promotional text into required free text, allowing an empty business goal. | Prevented auto-filled goals and added meaningful minimum client-side length. | Browser QA |
| 16 | Mobile legibility | Compact small-print and CTA hit areas discouraged mobile completion. | Raised key copy to ~16px, CTA min-height 52px and clear keyboard focus. | Browser QA |
| 17 | Tablet/phone layout | Three equal cards could crowd smaller screens. | 3 desktop, 2+1 tablet, 1 phone and form-column fallback. | Browser QA |
| 18 | Paying next | Customers could mistake an enquiry for checkout or worry about card details. | Clear approval → secure Stripe payment link wording; no payment collected by form. | Static check |
| 19 | Payment safety | Underlying Stripe checks and back-office email used old £40/£35/£75 amounts. | New price-versioned amounts; legacy unversioned approved links retain former amounts; unknown versions require review. | Stripe E2E still required before release |
| 20 | Trust after submission | Generic confirmation left customers unsure what they selected or what happened next. | Package-specific success text, transactional acknowledgement and privacy/link fallback. | Email deliverability live test required |

## Stripe cutover instruction (release blocker)
The existing verified Stripe webhook expects checkout-session metadata. After launch, every *new* approved checkout session for the £35/£28/£60 offers **must** include `sk8_pricing_version=2026-10-v2`, `approval_required=true`, `advertiser_enquiry_id=<approved D1 enquiry ID>` and `sk8_product=<selected package key>`. Current package keys: `starter_newsletter`, `halloween_guide`, `halloween_combo` (also optional `halloween_section` and `halloween_main`). Old payment sessions with no version continue to be checked against formerly approved prices. Verify a new-price test session and an existing-price test session in Stripe test mode, including email receipts and D1 status, before changing the live page. Never create a public direct Stripe payment link before suitability, dates and proof approval.

## Release gate
Do not merge/deploy until: Website Health green; full Post-launch preflight green; five-width Chromium UX test green; Cloudflare Preview markers and layout verified; payment/notification E2E test with no live charge, using both new and historical prices; owner approval of new live pricing and auto acknowledgement. Current QA runs are still in progress at the time of this record. Unknown results are **not** passes.

## Deferred work
The advertiser page still references many historical CSS files. Consolidating them may improve performance, but removing them opportunistically could break approved imagery and site-wide form styling. Treat stylesheet consolidation as a separate measured change after this simpler purchasing flow is released.

## Owner-requested revision (later on 8 October 2026): supersedes initial Halloween-only packages

The owner then explicitly requested the following revisions, all implemented on this **preview branch only**:

- Three-word hero: **Advertise with SK8**, with one shorter sentence explaining the newsletter and Guides.
- Hero artwork replaced by three **real, clickable mini-pricing choices** (£35 newsletter, £28 Guide, £60 Guide + newsletter).
- The formerly collapsed premium section is now visibly available at **£96** (Guide section sponsor) and **£125** (main Guide sponsor). Both have working package choices in the enquiry form.
- **£28 Guide cards and £60 combined adverts apply to any suitable SK8 Scoop Guide** with available advertising space, not only Halloween. Guide selection includes all current Guide categories plus forthcoming Christmas and help-me-choose. Ongoing Guides: 30-day paid period; seasonal Guides: exact agreed remaining promotional window. Dates are confirmed before payment.
- Prominent, separate **Campaign Finder** and **Christmas hospitality** helper blocks.
- Example advert moved left (~60% of desktop content), six **always-visible** goal options placed on the right. Fictional and sponsored labels remain.
- Removed standalone analytics-results section and duplicated "Who it is for" section. A brief promise of an **end-of-placement advert-link report** now appears in the purchase process and FAQ.
- Retained a compact labelled **independent editorial policy** section and updated the FAQ for five prices, all Guides, duration, reporting and payment.
- Mobile first-visit privacy panel compacted **on the Advertise page only**, retaining Allow, Reject and Choose separately.
- Generic new form package IDs (`guide_card`, `guide_bundle`, `guide_section`, `guide_main`) replace Halloween-specific IDs for new requests; historic Halloween routes remain accepted for previous commitments. The selected Guide is saved via existing `invoice_details` field, so no migration is required.
- **Stripe release requirement:** New generic Guide Checkout Sessions and newsletter sessions must carry `sk8_pricing_version=2026-10-v3`, `approval_required=true`, `advertiser_enquiry_id` and `sk8_product`. The webhook expects exactly £35/£28/£60/£96/£125 for v3; v2 and unversioned legacy sessions remain separately validated at old amounts.

The prior table above is a **historical record**, not the current final design: £110/£150 premium pricing, Halloween-only card availability, and the old v2 prices are superseded by this revision.

**Verification:** website-health/static business-contract preflight and Chromium browser QA for 360, 390, 768, 1024 and 1440 px, including all five prices and product-to-form hand-offs, are required green before review. The cloud preview is `https://preview-advertise-simple-pricing-oct2026.previews.sk8scoop.com/advertise.html`.

**Still not verified:** New- and old-price Stripe test-mode E2E sessions and transactional acknowledgement delivery. Never infer that a public payment checkout is working from a static preview alone. Keep the PR draft and main production branch unchanged until approval.
