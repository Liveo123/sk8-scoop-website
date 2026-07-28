# SK8 Scoop website — utility and commerce update

This package updates the existing website without replacing the original logo, MailerLite forms, QR system, established URLs or working Cloudflare structure.

## Core positioning
SK8 Scoop is a local utility and commerce company whose core product is a free weekly newsletter containing the best things to do, useful local updates, new openings and money-saving ideas across SK8.

## Main public URLs
- Website: https://www.sk8scoop.com/
- Summer Guide: https://summer-guide.sk8scoop.com
- Facebook: https://www.facebook.com/profile.php?id=61591008764200
- Contact: contact@sk8scoop.com

## New public pages
- `/business-submissions/` — events, openings, offers, classes, jobs, community information and advertising enquiries.
- `/editorial-policy.html` — editorial independence, labels, corrections, free listings, privacy and affiliate disclosure.

## New supporting pages
- `/preferences/` — optional post-signup interests.
- `/signup-success/` — recommended MailerLite success redirect and completed-signup analytics event.

## Existing features preserved
- Original logo and brand palette.
- MailerLite subscription form actions.
- `/localqr/`, `/qrlocal/`, QR venue mapping and QR dashboard.
- Prepared What’s On route and event data file. The route remains hidden/noindex until enough verified events exist.
- Cloudflare D1 schema and Pages Functions.
- Mobile menu and responsive layouts.

## Important configuration
`assets/config.js` contains these public tracking IDs:
- GA4 `G-8L0ER92Y7L`
- Meta Pixel `4649116095416763`

Both providers are consent-gated. Do not replace the consent controls with
unconditional tracking scripts.

Add only public IDs or approved payment links to this file:
- Stripe Payment Links for `local_spotlight`, `monthly_partner`, `category_partner`

Never put passwords, API secrets, private keys or Cloudflare admin tokens in public website files.

## MailerLite completion event
The website now tracks `signup_completed` on `/signup-success/` and `/qr-success/`. To make this a genuine completed-signup signal, configure MailerLite to redirect successful subscriptions to:

`https://www.sk8scoop.com/signup-success/`

Until that redirect is configured and tested, use `signup_form_submit` as a form-attempt metric and MailerLite as the source of truth for confirmed subscribers.

## Database update
Run the full `schema.sql` in the existing Cloudflare D1 database. It is non-destructive and uses `CREATE TABLE IF NOT EXISTS`.

New tables:
- `business_submissions`
- `subscriber_preferences`

## Growth pages
No weak placeholder growth pages were published. See `GROWTH-PAGES-ROADMAP.md` for evidence thresholds and update cycles.


## v7 conversion and commerce update

- Conversion-led homepage with dated public proof: 282 active subscribers on 28 July 2026 and 5 issues.
- Advertising page uses Issue 5 main-send and resend figures as dated evidence, not as an average.
- £35 Local Spotlight, £79 Monthly Partner and £129 Category Partner pilot packages.
- Simplified advertiser enquiry and structured business-submission forms.
- Original logo, MailerLite forms, QR attribution, analytics loader and Cloudflare Functions preserved.
