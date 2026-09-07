# Free & Cheap Guide reusable sponsor slot

Temporary pre-NUE mechanism for the GROW product.

## What it does

A Cloudflare Pages Function middleware intercepts the full guide route at `/free-cheap-guide/guide/`. If the sponsor configuration is enabled and within its approved date window, it injects one clearly labelled sponsored callout at the top of the guide body.

No edit to the 22MB guide HTML is required for each campaign.

## Files

- `functions/_shared/guide-sponsor-config.js` — the single campaign configuration record.
- `functions/free-cheap-guide/guide/_middleware.js` — rendering, safety checks, expiry logic and UTM decoration.

## Campaign workflow

1. Confirm the advertiser is a genuine Free & Cheap Guide fit.
2. Agree GROW scope, price, dates, copy, CTA and destination.
3. Obtain advertiser approval and payment/terms clearance.
4. Update `GUIDE_SPONSOR` in `functions/_shared/guide-sponsor-config.js`.
5. Use an explicit `start_at` and `end_at` ISO timestamp. The slot renders only while `start_at <= now < end_at`.
6. Preview the branch and verify desktop/mobile appearance, destination URL and dates.
7. Merge/deploy through the normal GitHub/Cloudflare workflow after owner approval.
8. The callout stops rendering automatically after `end_at`, even if the config file remains in the repository.
9. After expiry, set `enabled: false` during the next housekeeping commit so the config accurately reflects no active inventory.

## Required configuration fields

- `enabled`
- `slot_id`
- `campaign_id`
- `business_name`
- `headline`
- `copy`
- `cta_text`
- `cta_url`
- `start_at`
- `end_at`

`image_url` is optional.

## Safety and trust rules

- The slot always displays `SPONSORED` and a paid-placement/editorial-independence line.
- The slot is separate from guide editorial entries and cannot confer ranking, recommendation, Top Pick status or editorial inclusion.
- External CTA links use `rel="sponsored noopener"` and open in a new tab.
- Sponsor text is escaped before injection.
- Invalid dates, missing core fields or an invalid CTA URL cause the slot to render nothing.
- No fake scarcity or automatic renewal.

## Tracking

The CTA URL is automatically decorated with:

- `utm_source=sk8_scoop`
- `utm_medium=guide_sponsor`
- `utm_campaign=<campaign_id>`
- `utm_content=<slot_id>`

This gives the advertiser a campaign-specific source where their analytics support UTMs. SK8 Scoop should still keep newsletter and Guide evidence separate and label advertiser-reported downstream outcomes as advertiser-reported.

## Preview QA before first live sponsor

Use a short-lived test configuration on a non-production branch and confirm:

- inactive configuration produces no injected slot;
- active configuration produces exactly one slot;
- the slot appears above guide editorial and remains visually separate;
- mobile width does not overflow;
- optional image and no-image states both render acceptably;
- CTA URL receives the four expected UTM parameters;
- slot disappears after the configured `end_at` time;
- invalid/missing dates or CTA URL fail closed and show nothing.

Then restore `enabled: false` before merging the generic mechanism if no paid sponsor is scheduled.

## Temporary limitation

This first version deliberately avoids a new D1 click table or admin UI. That keeps the bridge system small. Full NUE can replace the file-based configuration with managed inventory and first-party click reporting later while retaining the same slot/product concept.
