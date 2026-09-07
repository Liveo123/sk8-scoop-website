# Free & Cheap Guide reusable sponsor slot

Temporary pre-NUE mechanism for the GROW product.

## What it does

The deployed Cloudflare Worker intercepts the full guide route at `/free-cheap-guide/guide/`. If the sponsor configuration is enabled and within its approved date window, it fetches the normal static Guide from the `ASSETS` binding and injects one clearly labelled sponsored callout at the top of the page before returning it.

No edit to the 22MB Guide HTML is required for each campaign.

## Deployment architecture

This site is deployed as a Cloudflare Worker with static assets, not as a classic Cloudflare Pages Functions project. The authoritative runtime entry point is `worker-protected.js`, configured by `wrangler.toml`.

`wrangler.toml` must include the Guide route in `assets.run_worker_first`, otherwise Cloudflare serves the static Guide directly and the sponsor renderer never runs.

Current relevant files:

- `functions/_shared/guide-sponsor-config.js` — the single campaign configuration record.
- `worker-protected.js` — active-state check, rendering, safety checks, expiry logic and UTM decoration.
- `wrangler.toml` — routes `/free-cheap-guide/guide` and `/free-cheap-guide/guide/*` through the Worker before static asset serving.

Do not recreate this as a `functions/.../_middleware.js` Pages Function unless the deployment architecture itself is intentionally changed.

## Campaign workflow

1. Confirm the advertiser is a genuine Free & Cheap Guide fit.
2. Agree GROW scope, price, dates, copy, CTA and destination.
3. Obtain advertiser approval and payment/terms clearance.
4. If an image is used, upload an approved image to the SK8 Scoop site and use its root-relative path. Remote advertiser-hosted images are deliberately not accepted by the slot.
5. Update `GUIDE_SPONSOR` in `functions/_shared/guide-sponsor-config.js`.
6. Use an explicit `start_at` and `end_at` ISO timestamp. The slot renders only while `start_at <= now < end_at`.
7. Preview the branch and verify desktop/mobile appearance, destination URL and dates.
8. Merge/deploy through the normal GitHub/Cloudflare workflow after owner approval.
9. The callout stops rendering automatically after `end_at`, even if the config file remains in the repository.
10. After expiry, set `enabled: false` during the next housekeeping commit so the config accurately reflects no active inventory.

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

`image_url` is optional. If used, it must be a root-relative SK8 Scoop site path such as `/assets/images/advertiser-name.webp`.

## Safety and trust rules

- The slot always displays `SPONSORED` and a paid-placement/editorial-independence line.
- The slot is separate from Guide editorial entries and cannot confer ranking, recommendation, Top Pick status or editorial inclusion.
- External CTA links use `rel="sponsored noopener"` and open in a new tab.
- Sponsor text is escaped before injection.
- Invalid dates, missing core fields or an invalid CTA URL cause the slot to render nothing.
- Remote image URLs are ignored. This avoids third-party image tracking and keeps creative under SK8 control.
- While a sponsor is active, the transformed Guide response is returned with `Cache-Control: no-store` so expiry is not undermined by a stale cached sponsored page.
- No fake scarcity or automatic renewal.

## Tracking

The CTA URL is automatically decorated with:

- `utm_source=sk8_scoop`
- `utm_medium=guide_sponsor`
- `utm_campaign=<campaign_id>`
- `utm_content=<slot_id>`

This gives the advertiser a campaign-specific source where their analytics support UTMs. SK8 Scoop should still keep newsletter and Guide evidence separate and label advertiser-reported downstream outcomes as advertiser-reported.

## Temporary limitation

This first version deliberately avoids a new D1 click table or campaign admin UI. That keeps the bridge system small. Full NUE can replace the file-based configuration with managed inventory and first-party click reporting later while retaining the same slot/product concept.

## Pre-launch checks

Before enabling the first paid Guide campaign, verify on a Cloudflare preview/development deployment:

- slot absent when `enabled` is false;
- slot absent before `start_at`;
- slot present during the active date window;
- slot absent after `end_at`;
- malformed CTA URL fails closed;
- external `image_url` is ignored;
- mobile layout remains readable;
- CTA receives the expected UTM parameters;
- `SPONSORED` and the editorial-independence line are visible;
- the underlying Guide remains usable and unchanged when the slot is absent.

## Preview QA result, 7 September 2026

The active-state test passed on the Cloudflare branch preview. The sponsored unit rendered above the Guide hero, the `SPONSORED` label and editorial-independence line were clearly visible, and the underlying Guide remained intact.

After that successful visual check, the branch configuration was restored to `enabled: false` with blank campaign content and dates. No preview sponsor should be present in the production candidate.
