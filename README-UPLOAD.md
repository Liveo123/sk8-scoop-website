# SK8 Scoop Issue 8 website correction package — 16 August 2026

This supersedes the earlier Issue 8 package.

## Correct current figures

- Subscribers: **413**
- Issues published: **8**
- Issue 8 recorded opens across main + resend: **258**
- Combined recorded open reach: **63.86%** (258 / original 404-recipient audience)
- Combined recorded clicks: **about 28**
- Combined click reach: **6.93%** (28 / 404)
- Combined CTOR: **10.85%** (28 / 258)
- Current issue: **Issue 8 — Friday 14 August 2026**
- Issue 8 public URL: `https://preview.mailerlite.io/preview/2462354/emails/195857688022747045`

## Upload/replace these paths

- `index.html`
- `latest/index.html`
- `archive.html`
- `about.html`
- `advertise.html`  ← this was missing from the earlier bundle
- `signup-success/index.html`
- `assets/config.js`
- `assets/issue8-update.css`
- `assets/freshness.js`

Do not replace `assets/site.js`, Cloudflare Worker/D1 files, QR files, analytics/consent code, or image assets.

## What fixes the screenshots you reported

1. `advertise.html` now replaces the old 385+/7/52.0%/4.3% Issue 5 snapshot with 413/8/63.86%/6.93% and an Issue 8 explanation.
2. `index.html` has a static 413 fallback in the signup reassurance and 413/8 in the proof strip.
3. `latest/index.html` has static Issue 8 content, the supplied Issue 8 URL, 413 subscribers, 63.86% combined open rate and 10.85% combined CTOR.
4. `assets/issue8-update.css` now uses a final high-specificity `object-position: center top` override on the homepage and latest-page hero image. This prevents the old centred crop from removing the upper part of the image.
5. `archive.html` keeps Issue 7 historically and adds Issue 8 first.

## Important note about the image

The CSS can reveal all upper content that exists in the original `hero-family-town.webp`. If the original image file itself was generated with the adult's head outside the source frame, CSS cannot invent the missing pixels. After deployment, check the image. If the full head still does not exist, replace the underlying image rather than applying another crop.

## Post-deployment check

Hard-refresh after Cloudflare deploy (`Ctrl+F5`) because the old HTML/CSS may be cached. Check:
- `/`
- `/latest/`
- `/advertise.html`
- `/archive.html`
- `/about.html`
- `/signup-success/`

Expected visible values: 413 subscribers, 8 issues, Issue 8 current, 63.86% combined open rate, 10.85% CTOR on latest, and 6.93% combined click reach on the advertiser snapshot.
