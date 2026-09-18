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

## Current live products

- TEST: £40 GBP one-time
  - product: `prod_VHYWf1Aaa79P2q`
  - price: `price_1UGzPUFYD08ziIGA1RAPi5cb`
  - metadata product key: `temp_test`
- GROW: £90 GBP one-time
  - product: `prod_VHYW7eAN2Mdyy3`
  - price: `price_1UGzPWFYD08ziIGAbkZIDHZO`
  - metadata product key: `temp_grow`

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
- correct live TEST or GROW price;
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
- `sk8_product=temp_test` or `temp_grow`
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
- TEST equals £40 GBP or GROW equals £90 GBP;
- enquiry is in an allowed pre-payment state.

Mismatches are not marked paid and require manual review.

## Preferred operating instruction

A normal approval instruction can be:

> Approve advertiser enquiry #127 for TEST £40 and prepare its single-use live Stripe payment route.

Before any live Stripe write, re-read the enquiry and confirm the requested package and approval decision. Creating the payment route is not the same as charging the customer. The customer is charged only if they open the route and complete Stripe Checkout.

## Manual Stripe fallback

If ChatGPT/Stripe connection is unavailable:

1. Open Stripe live account.
2. Create a Payment Link using the existing TEST or GROW price.
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
