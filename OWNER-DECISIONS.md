# Owner decisions still needed

1. Decide whether Category Partner exclusivity is limited to one calendar month and whether renewals require manual approval.
2. Confirm whether Monthly Partner includes exactly two newsletter placements per month.
3. Configure MailerLite successful signup redirects to `/signup-success/` and QR signups to `/qr-success/`.
4. Add approved Stripe payment links only after the enquiry and approval flow is tested.
5. Decide when the What’s On page has enough verified events to return to navigation and the XML sitemap.
6. Update public stats in `assets/config.js` when subscriber count or issue count changes materially.

## Confirmed on 28 July 2026

- GA4 Measurement ID: `G-8L0ER92Y7L`.
- Meta Pixel ID: `4649116095416763`.
- Both services are consent-gated and remain off until the visitor allows the relevant category.
