# SK8 Scoop website — Issue 8 update files

Prepared: 16 August 2026

## Upload these paths to the existing GitHub repository

Do **not** delete or rebuild the repository. Replace/add only these files at the same paths:

- `index.html`
- `latest/index.html`
- `archive.html`
- `about.html`
- `signup-success/index.html`
- `assets/config.js`
- `assets/issue8-update.css` (new)
- `assets/freshness.js` (new)

## What this changes

- Makes Issue 8 the current issue everywhere in the changed public pages.
- Uses the supplied Issue 8 URL: `https://preview.mailerlite.io/preview/2462354/emails/195857688022747045`.
- Adds Issue 8 to the archive and restores Issue 7 as a direct historical archive link.
- Updates subscriber count to 413 and issue count to 8.
- Uses combined Issue 8 main-send + resend performance on `/latest`: open rate 63.86% and CTOR 10.85%.
- Keeps the existing MailerLite signup endpoint and relies on the existing `assets/site.js` readable-JSON / `success === true` protection.
- Adds a small stylesheet loaded after the existing CSS. It shows more of the hero subjects and makes the mobile first screen prioritise the newsletter promise and email form.
- Removes the homepage secondary “Read Issue” button from the first mobile screen only; the latest issue remains available in the collapsed menu and lower homepage section.
- Makes the signup-success page more comfortable on 390px and narrower screens.

## Important deployment rule

Do not replace `assets/site.js`, Cloudflare Worker files, D1 bindings, QR files, consent code, analytics configuration or existing image assets with older versions.

## Post-upload checks

1. Open `/` at about 390 × 844. Confirm the promise, email field and Subscribe button are visible before scrolling into secondary content.
2. Confirm the homepage hero image shows the adult's head rather than centre-cropping it away.
3. Open `/latest` and confirm the same image framing improvement.
4. Confirm `/latest` says Issue 8 and opens the supplied Issue 8 MailerLite URL.
5. Confirm `/archive.html` shows Issue 8 first and Issue 7 still opens its historical MailerLite URL.
6. Confirm `/about.html` shows 413 subscribers and 8 issues.
7. Submit one controlled test email from the homepage on a phone. Expected result: the button changes to Joining…, MailerLite must return readable JSON with `success:true`, then the browser redirects to `/signup-success/`.
8. On `/signup-success/`, confirm Issue 8 is named and the page fits without horizontal scrolling at 390 × 844 and at a narrower width such as 360px.
9. Verify privacy choices still prevent GA4/Meta loading before consent.
10. Verify the QR landing/dashboard remain unchanged.

## Rollback

If anything unexpected appears after deployment, revert only this upload/commit. The package does not require any backend migration.

## Combined Issue 8 metric calculation

From the supplied MailerLite campaign rows:

- Main send: 404 recipients, 33.91% opened = **137 recorded opens**.
- Resend: 409 recipients, 29.58% opened = **121 recorded opens**.
- Total recorded opens: **258**.
- Combined open rate used on the website: **258 ÷ 404 original main-send recipients = 63.86%**.
- Main-send clicks: approximately **17**.
- Resend clicks: approximately **11**.
- Combined clicks: approximately **28**.
- Combined CTOR: **28 ÷ 258 = 10.85%**.

The combined open rate deliberately adds opens from the resend to opens from the original send, matching the established SK8 Scoop reporting method. It is not a deduplicated unique-reader reach rate, because one subscriber can open both sends.
