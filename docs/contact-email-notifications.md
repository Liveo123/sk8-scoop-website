# Contact and reader-submission email notifications

Status: preview implementation. Do not treat as production-ready until the D1 migration and Cloudflare Email Service checks below are complete.

## Design

Both `/api/contact-message` and `/api/reader-submission` save the submitted record to D1 first. The Worker then attempts an email notification. A mail failure must not discard an already-saved submission.

The Worker expects an optional Cloudflare Email Service binding named `CONTACT_EMAIL` and sends notifications:

- from: `website@sk8scoop.com`
- to: `contact@sk8scoop.com`

If the binding is missing, the database record is still kept and `notification_status` is recorded as `not_configured`. If sending fails, it is recorded as `failed`. Successful notification is recorded as `sent` with `notified_at`.

## One-time D1 migration

Apply the `reader_submissions` and `contact_messages` statements from the current `schema.sql` through the normal controlled D1 migration process before enabling these forms in production.

Do not rely on request-time schema creation. `worker.js` deliberately checks the new tables inside only the new handlers so an unapplied migration cannot break unrelated existing API routes.

## Cloudflare Email Service setup

Cloudflare Email Service must be onboarded for `sk8scoop.com` before adding the binding. Verify that the destination address which receives `contact@sk8scoop.com` mail is active and that `contact@sk8scoop.com` is accepted as the notification destination.

After Email Service is ready, add this binding to `wrangler.toml`:

```toml
[[send_email]]
name = "CONTACT_EMAIL"
allowed_destination_addresses = ["contact@sk8scoop.com"]
allowed_sender_addresses = ["website@sk8scoop.com"]
```

Do not commit credentials or API keys. The native binding does not require a public client-side secret.

## Verification before merge

1. Apply the two D1 tables in the intended environment.
2. Confirm the Email Service domain is onboarded and the destination is verified.
3. Add the `CONTACT_EMAIL` binding.
4. Submit one reader test entry and one contact test message.
5. Confirm each record exists in D1.
6. Confirm `notification_status = sent` and `notified_at` is populated.
7. Confirm the notification arrives in the intended inbox.
8. Test invalid email, invalid URL, missing consent and the honeypot field.
9. Confirm existing advertiser, business, event, QR and preference APIs still work.
10. Check mobile layout and form error/success states.

Publishing/merging remains a human-approved action.
