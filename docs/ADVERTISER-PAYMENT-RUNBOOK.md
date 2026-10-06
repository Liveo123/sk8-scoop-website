# SK8 Scoop advertiser payment runbook

Status: v1 operating process. Live payments remain approval-only.

## Core rule

No business gets a Stripe checkout route merely because it completed the Campaign Finder or advertiser enquiry form.

The order is:

1. enquiry exists in D1;
2. suitability, scope, timing and price are agreed;
3. SK8 Scoop explicitly approves the campaign;
4. one single-use Stripe payment route is created for that specific enquiry;
5. the route is sent to the advertiser;
6. Stripe payment updates D1 through the signed webhook;
7. only a matching paid record moves the campaign into production preparation.

## Current approved package amounts

For new campaigns, use the owner-restored prices approved on 5 October 2026:

- `starter_newsletter`: £40 GBP one-time
- `halloween_guide`: £35 GBP one-time
- `halloween_combo`: £75 GBP one-time
- `halloween_section`: £110 GBP one-time, only when specifically suitable or requested
- `halloween_main`: £150 GBP one-time, only when specifically suitable or requested

## Historical Stripe products

The older TEST/GROW Stripe products remain identifiers for earlier commitments only:

- historical TEST £40: product `prod_VHYWf1Aaa79P2q`, price `price_1UGzPUFYD08ziIGA1RAPi5cb`, key `temp_test`
- historical GROW £90: product `prod_VHYW7eAN2Mdyy3`, price `price_1UGzPWFYD08ziIGAbkZIDHZO`, key `temp_grow`

Product and price IDs are identifiers, not credentials.

## Campaign reference

Use:

`SK8-AD-<advertiser_enquiry_id>`

Example: enquiry 127 → `SK8-AD-127`.

The same reference must be put in the Payment Link metadata and advertiser communication.

## Required payment-route settings

For every approved campaign:

- Stripe-hosted Payment Link;
- one-time payment only;
- correct approved package amount;
- card payment;
- no subscription;
- no automatic renewal;
- no promotion codes;
- collect payer email;
- collect payer name;
- collect business name;
- maximum one completed checkout;
- do not publish the link on the website;
- do not reuse a link for another advertiser.

Required metadata on both the Payment Link / Checkout Session and PaymentIntent where supported:

- `advertiser_enquiry_id=<D1 enquiry id>`
- `campaign_reference=SK8-AD-<id>`
- `sk8_product=<approved package key>`; use `starter_newsletter`, `halloween_guide`, `halloween_combo`, `halloween_section` or `halloween_main` for new campaigns. Historical `temp_test` / `temp_grow` are only for earlier commitments.
- `approval_required=true`

## Live webhook

Endpoint:

`https://www.sk8scoop.com/api/stripe-webhook`

Events:

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `checkout.session.async_payment_failed`
- `checkout.session.expired`

The Worker must verify the Stripe signature and will only mark an enquiry paid when all of these match:

- production receives a live-mode event;
- metadata says approval was required;
- session mode is one-time payment;
- advertiser enquiry ID exists;
- Stripe product route matches the enquiry package;
- amount matches the approved package: newsletter £40; Halloween Guide £35; Guide + newsletter £75; section sponsor £110; main sponsor £150 (or the exact historical amount for an earlier `temp_test` / `temp_grow` commitment);
- enquiry is in an allowed pre-payment state.

Mismatches are not marked paid and require manual review.

## Preferred operating instruction

A normal approval instruction can be:

> Approve advertiser enquiry #127 for Newsletter TEST £40 and prepare its single-use live Stripe payment route.

Before any live Stripe write, re-read the enquiry and confirm the requested package and approval decision. Creating the payment route is not the same as charging the customer. The customer is charged only if they open the route and complete Stripe Checkout.

## Manual Stripe fallback

If ChatGPT/Stripe connection is unavailable:

1. Open Stripe live account.
2. Create a Payment Link using the agreed approved package amount.
3. Apply the required metadata above.
4. Restrict completed sessions to one.
5. Keep the route private.
6. Send it only to the approved advertiser.
7. Do not manually mark D1 paid. Let the signed Stripe webhook do that.
8. If webhook delivery fails, investigate the Stripe event before changing any campaign status.

## Failed or unusual payment

Do not treat these as paid automatically:

- wrong amount;
- wrong currency;
- wrong package;
- missing or incorrect enquiry ID;
- missing approval metadata;
- payment for a rejected/cancelled enquiry;
- webhook signature failure;
- live/test environment mismatch.

Resolve in Stripe and D1 before publication.

## Refunds

Refund handling is intentionally manual in v1. A future version can add refund webhook events once real volume justifies it. A refund must never silently alter editorial treatment.

## Security

- Card details are handled by Stripe, not SK8 Scoop.
- Never paste live Stripe signing secrets or API keys into GitHub, docs, emails or public pages.
- Preview and production use separate webhook signing secrets.
- The public Worker has no Stripe credential that can create charges.
- The private advertiser inbox is operational data, not a payment terminal.

## Pricing reversion — 5 October 2026

The temporary lower-price starter experiment was cancelled after an advertiser enquiry arrived. New campaigns returned to the established public prices:

- `starter_newsletter`: £40 GBP one-time
- `halloween_guide`: £35 GBP one-time
- `halloween_combo`: £75 GBP one-time
- `halloween_section`: £110 GBP one-time, only when specifically suitable or requested
- `halloween_main`: £150 GBP one-time, only when specifically suitable or requested

Historical `temp_test` £40 and `temp_grow` £90 routes remain accepted only to honour earlier commitments. They are not the default product keys for new enquiries.

The payment-link workflow remains approval-gated. Confirm the advertiser enquiry, agreed package, campaign reference, amount and timing before creating or sending a live payment route.
