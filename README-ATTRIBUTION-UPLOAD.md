# SK8 Scoop Subscriber Attribution Upload Pack

Created: 16 August 2026

This update applies subscriber attribution to the current full website package supplied as `sk8-scoop-website-main (1).zip`.

## Upload these files to GitHub

- `assets/site.js`
- `SUBSCRIBER-ATTRIBUTION-SYSTEM.md`

`assets/site.js` is intentionally included even though the earlier Issue 8 correction note said not to replace it. That earlier note was for the Issue 8 visual/content correction. This attribution update must change `assets/site.js` because that is where the shared signup logic lives.

## MailerLite status

These five custom subscriber fields already exist in MailerLite:

- `acquisition_channel`
- `signup_source`
- `signup_campaign`
- `signup_content`
- `signup_landing_page`

## Expected behaviour after deployment

- Website signup forms automatically pass the five attribution fields to MailerLite.
- Meaningful first-touch source is remembered for 90 days.
- Later direct visits do not overwrite a stored paid/social/QR/search source.
- QR signups keep the existing QR tracking and also populate the standard attribution fields.
- GA4 and Meta consent behaviour remains unchanged.

## Quick tests after deployment

Use a fresh test email address for each route.

Paid advert test:

```text
https://www.sk8scoop.com/?utm_source=facebook&utm_medium=paid_social&utm_campaign=test&utm_content=case_file
```

Expected MailerLite fields:

```text
acquisition_channel = Paid Social
signup_source = Facebook
signup_campaign = Test
signup_content = Case File
signup_landing_page = Homepage
```

Facebook group test:

```text
https://www.sk8scoop.com/?utm_source=facebook&utm_medium=group&utm_campaign=test&utm_content=cheadlechat
```

Expected MailerLite fields:

```text
acquisition_channel = Organic Social
signup_source = Cheadlechat
signup_campaign = Test
signup_content = Cheadlechat
signup_landing_page = Homepage
```

QR test:

```text
https://www.sk8scoop.com/localqr/?utm_source=offline&utm_medium=qr&utm_campaign=test&utm_content=gatley
```

Expected MailerLite fields:

```text
acquisition_channel = Offline QR
signup_source = Gatley QR
signup_campaign = Test
signup_content = Gatley
signup_landing_page = Local QR
```
