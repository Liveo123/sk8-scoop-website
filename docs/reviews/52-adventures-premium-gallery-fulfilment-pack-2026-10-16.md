# 52 Adventures premium gallery: practical campaign fulfilment pack

**DRAFT OPERATIONS ONLY, 16 October 2026. No advert is booked, no email may be sent and no payment may be requested without Paul's later specific permission.**

## Locked commercial offer

| Item | Standard Guide advert | Premium 52 Adventures gallery |
|---|---|---|
| Owner-approved introductory price | £28 | **£39** |
| Length | 30 days for year-round Guides | **30 consecutive UK calendar days** |
| Creative | One separately labelled sponsored Guide card | One separately labelled, dedicated ADVERTISEMENT card with **2–5 approved photographs** |
| Copy | Concise copy, one agreed action | Practical operator copy, suitability/visit details, one agreed action |
| Report | Available tracked results without guarantees | Consented viewable paid-card views, gallery interactions and paid CTA clicks where measurable |
| Booking | Scope, timing, taxes and payment link agreed before money | **Unavailable until separate commercial activation and release approval** |

**Not included:** newsletter placement, guaranteed views or clicks, guaranteed bookings, preferential editorial ranking, automatic renewal, additional paid positions, ownership of the editorial adventure entry.

The £60 Guide + newsletter package includes the standard Guide advert, **not** the premium gallery by implication.

## Ready-to-complete campaign record template

Complete and independently corroborate each of these fields before Paul is asked to approve an actual placement. Never put private prospect details into public GitHub:

- `campaign_id`: unique internal key, not a customer's email address
- `guide_key`: `52-adventures`
- `existing_editorial_adventure_number`: numeric entry already in the guide; confirm operator's relationship to that entry
- `advertiser_trading_name`, `operator_legal_identity_evidence`, `published_corporate_contact`: record in restricted commercial CRM only, **not** in the public repo
- `sales_outreach_clearance`: legal route verified, suppressions verified, CRM/Gmail sent/received/drafts checked, SK8 geographical relevance documented
- `product_code`: `52_adventures_premium_gallery_intro`
- `amount_pence`: `3900` ; `currency`: `gbp` ; `recurring`: `false`
- `total_customer_payment`: confirmed amount and any applicable VAT treatment in writing; don't infer VAT status
- `placement_id`: the one approved commercial slot in the 52 Adventures Guide; record approved position
- `start_date_uk`, `end_date_uk`: inclusive YYYY-MM-DD dates exactly 29 days apart
- `headline`, `description`, `location`, `duration`, `suitable_for`, `visitor_price_from`: checked against the operator's current published materials
- `action_label`, `action_url`: one verified HTTPS destination; confirm actual booking action works
- `photos`: 2–5 unique HTTPS asset URLs, relevant alt text, source/credit and written rights evidence reference for **each** photograph; do not claim generated images depict a real venue
- `creative_approved_by_advertiser`: date and written confirmation in restricted record
- `owner_release_approval`: separate explicit approval of final creative and launch
- `payment_state`: `NOT_REQUESTED` until approved price/checkout/customer scope and webhook processing are reconciled
- `publication_state`: `DRAFT`, `HOLD`, `APPROVED_FOR_RELEASE`, `LIVE`, `EXPIRED` (manual commercial record, not automatically inferred from a branch)

**Technical config:** The branch's `assets/52-adventures-premium-config.js` deliberately contains no customer and keeps `enabled`, `ownerApproved`, `advertiserArtworkApproved`, `imageRightsCleared` false. A campaign may never be enabled merely because an invoice was paid or an enquiry arrived.

## Launch sign-off (future, not authorised now)

1. Merge the separate upstream 52 Adventures refresh (PR #172) **only after Paul's explicit release approval**, then reconcile/rebase PR #218, preserving other guide work.
2. Verify the exact sold slot, creative and asset rights; render a **real but unpublished** advertiser-approved preview inside the guide at 390, 740, 900 and 1440px.
3. Verify all media loaded, alt text and credit, buttons/keyboard focus, one paid booking URL, sponsor label, screen-reader name, no horizontal overflow and unchanged original editorial order.
4. Verify inclusive UK start/end dates (30), auto-removal/expiry, lost-consent operation, GA4 consent-aware `guide_advertiser_view` and `guide_advertiser_click` events, and that ordinary editorial clicks are not billed or attributed.
5. Reconcile Stripe live prices: previous read-only snapshot contained active legacy £40 TEST and £90 GROW products, **not** the approved £28/£39 products. Never silently repurpose an old product or send an old payment link. Confirm GBP 3900 pence, one-off pricing, VAT, invoicing, webhook fulfilment and legal proprietor identity separately before any payment.
6. Verify prospective operator and exact recipient from current official sources, and recheck full Gmail/CRM/Compliance history before Paul approves exact-copy emails.
7. Ask Paul to approve the finished campaign and its publishing/sending/payment steps specifically. Then, and only then, activate.
8. Confirm live URL, screenshot, recorded start time, first measurable event and automatic expiry. Stop and rectify if anything fails.

## Advertiser-facing proposal (internal copy to adapt, not an authorised email)

**Already featured in SK8 Scoop's 52 Adventures?** Your independent adventure listing stays exactly where it is whether or not you advertise. A separate **£28 standard Guide advert** can promote one booking action for 30 days. The **£39 introductory premium gallery**, once released and where an approved position is available, adds a clearly labelled, larger sponsored feature with up to five approved photographs, useful visit details and a prominent booking button for 30 days. We prepare the creative for approval. We can report measured clicks where analytics allow; no bookings or reach are guaranteed.

Only pitch the premium gallery once the actual placement and payment process are available. A bespoke mock-up must be clearly labelled as a sample, not a real booked campaign.

## 30-day reporting template

- Advertiser and campaign ID (restricted report)
- Guide, sponsored slot, dates and price agreed
- Measured consented **viewable sponsored-card events**: N (50% in viewport for ≥1 second, only where browser/consent enables tracking)
- Measured consented **booking-button clicks**: N
- Optional **gallery interactions**: N (exploration, not unique people)
- Measured click/view ratio if relevant, both denominators clearly defined; **not** a population-wide CTR or visitor conversion rate
- Advertiser-confirmed enquiries and bookings, when provided: N or **not available**
- Clicks in existing editorial listing: **excluded from paid results**
- Limitations: consent, blocked analytics, devices, browser support and no verified attribution to sales unless the advertiser supplies evidence
- Follow-up: one useful question about outcomes and whether they would book again, not an automatic upsell

## Final product review trigger

After **three genuinely completed premium placements or 60 days after the first live placement, whichever is later**, review margin (including editing time), paid clicks, advertiser-reported outcomes, renewals, reader complaints and any damage to editorial utility. The £39 price is approved as an **introductory commercial decision**, not an evidence-backed performance guarantee.
