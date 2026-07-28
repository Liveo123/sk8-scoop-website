# SK8 Scoop v8.2 signup verification fix

Date: 28 July 2026

## Problem

The v8.1 signup handler used a `no-cors` request. Browsers hide the response to
such a request, so the website displayed “You’re in” and recorded a QR
submission even when MailerLite had rejected the address.

## Fix

- Read MailerLite's CORS-enabled JSON response.
- Continue to the success page only when MailerLite returns `success: true`.
- Display MailerLite's first validation error when it rejects a submission.
- Keep QR signup attempts separate from MailerLite-accepted responses.
- Calculate QR conversion from accepted responses, not raw attempts.
- Preserve all existing form IDs, group assignments, tracking IDs, poster
  records and Cloudflare bindings.

## Reporting rule

`MailerLite accepted` is stronger than a form attempt but is not automatically
a net-new subscriber. Reconcile accepted responses with the
`Local Business QR Displays – 2026` group before quoting subscriber results.
