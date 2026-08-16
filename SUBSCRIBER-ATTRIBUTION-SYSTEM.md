# Subscriber Attribution System

This is the current SK8 Scoop subscriber-attribution setup for the website signup flow.

## Purpose

Track where new subscribers came from without turning MailerLite groups, forms or spreadsheets into a maintenance problem.

## MailerLite field status

Created in MailerLite on 16 August 2026:

| Name | Key | Type |
|---|---|---|
| `acquisition_channel` | `acquisition_channel` | text |
| `signup_source` | `signup_source` | text |
| `signup_campaign` | `signup_campaign` | text |
| `signup_content` | `signup_content` | text |
| `signup_landing_page` | `signup_landing_page` | text |

## Allowed acquisition channels

- `Paid Social`
- `Organic Social`
- `Offline QR`
- `SK8 Owned`
- `Referral`
- `Partner / Organiser`
- `Organic Search`
- `Direct`
- `Unknown`

Do not add new channels unless a business decision genuinely depends on them.

## What each field means

| Field | What it stores | Example |
|---|---|---|
| `acquisition_channel` | The broad route that first acquired the reader | `Paid Social` |
| `signup_source` | The practical source worth reporting on | `Facebook`, `Cheadlechat`, `Heald Green Library QR`, `Summer Guide` |
| `signup_campaign` | The named campaign or push | `Issue 9 Growth` |
| `signup_content` | The specific creative, post, group label or QR/content marker | `Case File Ad` |
| `signup_landing_page` | The page where the reader actually subscribed | `Homepage` |

`signup_landing_page` is the conversion page. The first four fields preserve first-touch acquisition where possible.

## First-touch rule

The website stores the first meaningful acquisition information in first-party browser storage for 90 days.

Meaningful first-touch means a route such as:

- paid social;
- organic social;
- offline QR;
- newsletter or other SK8-owned tracked link;
- referral/share;
- partner or organiser share;
- organic search.

Later direct visits must not overwrite a meaningful earlier acquisition.

Direct visits are used only when there is no better stored source.

## Website behaviour

The shared website script now does this on every page with a newsletter signup form:

1. Reads UTM values and relevant referrer information.
2. Classifies the broad acquisition channel.
3. Stores first-touch acquisition if it is meaningful.
4. Adds the five attribution fields to the MailerLite signup form automatically.
5. Sets `signup_landing_page` at the point of conversion.

No extra MailerLite group is needed for this website attribution.

## UTM rules

Use lowercase predictable UTMs:

```text
utm_source=
utm_medium=
utm_campaign=
utm_content=
```

Examples:

```text
utm_source=facebook
utm_medium=paid_social
utm_campaign=newsletter_aug_2026
utm_content=case_file_ad
```

```text
utm_source=facebook
utm_medium=group
utm_campaign=issue_9_growth
utm_content=cheadlechat
```

```text
utm_source=offline
utm_medium=qr
utm_campaign=qr_venue_programme
utm_content=gatley
```

## Facebook group tracking

Track important groups with a tracked URL.

Use:

- `utm_source=facebook`
- `utm_medium=group`
- `utm_campaign=` the push or period
- `utm_content=` the group identifier

The current website logic reports `utm_content` as the practical source for Facebook group signups.

Use the existing SK8 group list as the naming authority.

## QR tracking

Use one QR source per area or meaningful venue, not one per physical copy.

Current poster QR logic already supports venue reporting through:

- `assets/qr-locations.json`
- `qr-codes.csv`
- the private QR dashboard

When adding a new meaningful QR source:

1. Add or update the QR code destination with standard UTMs.
2. Add the venue/area mapping in `assets/qr-locations.json`.
3. Keep the source label simple enough to report later.

## Reporting

Use MailerLite subscriber fields as the source of truth for new subscriber attribution.

Use the advert measurement tracker for spend, daily context and paid-vs-organic interpretation.

Do not credit all growth to Meta by default.

The practical reporting cuts are:

- by `acquisition_channel`;
- by `signup_source`;
- by `signup_campaign`;
- by `signup_content` for ad/post/creative comparison;
- by `signup_landing_page` for page-conversion checks.

## What must not be changed lightly

- Do not replace first-touch with last-touch.
- Do not create a separate MailerLite group for each source.
- Do not remove the privacy-consent gate for GA4 or Meta.
- Do not send subscriber personal data to advertisers, Meta or GA4.
- Do not invent historical attribution.
- Do not break the existing QR dashboard and poster mapping.

## Post-upload checks

After uploading this update to GitHub and waiting for deployment:

1. Submit a fresh test signup from a paid-social test URL.
2. Submit a fresh test signup from a Facebook-group test URL.
3. Submit a fresh test signup from a QR test URL.
4. Confirm the five fields populate in the MailerLite subscriber profile.
5. Delete, label or exclude test subscribers before interpreting real growth.
