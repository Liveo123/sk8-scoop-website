# Website growth readiness audit — 26 October 2026

Status: PREVIEW ONLY. No production deployment, publishing, paid spending or external messages authorised.

## Verified, read-only evidence
- MailerLite active subscribers: **820** (checked 26 October 2026). MailerLite is authoritative for subscriber state.
- Main-branch `assets/config.js`: displayed public approximate claim **780+**, checked 24 October 2026. This is conservative, not automatically a false claim, and should not be replaced with a maintenance-intensive exact count without approval.
- Homepage already contains activity search, SK8 area/date filters, current-event feed, newsletter form, holiday-club promotion, Issue 18 and 52 Adventures. Do not duplicate.
- `/whats-on/` already has date, audience and area filters, an event calendar and an empty-results state. Before promoting, verify that genuinely SK8 events are numerous/current enough. Web search crawls from 23-24 October indicate about a dozen family-filtered listings, but this is not a fresh authoritative live count.
- `/kids-family/holiday-club-finder/` is for **26–30 October 2026**, explicitly `noindex,follow`, with organiser booking links and an expiry panel. It is a seasonal promotion, not an evergreen search-indexing opportunity.
- Main branch sitemap had stale `lastmod` on homepage, latest, archive, kids-family and local-history compared with the Issue 18 release. This preview branch corrects dates to 24 October 2026, matching the major content update.
- GA4 + Search Console are connected to Windsor.ai, **but reads are paused by its free-plan connection limit**. Windsor returns a warning row and artificial zeros. THESE ARE NOT TRAFFIC RESULTS. GSC Wizard is also subscription-blocked. No valid traffic baseline can presently be asserted.
- Existing organic-growth experiment `JL-OG-2026-01` already runs 26 October–22 November with organiser, reader-referral and value-first sharing tracks; do not launch a second conflicting campaign.

## Immediate recommendation
1. Keep existing tools, confirm production Cloudflare/preview visual QA, verify seasonal/current events and direct URLs before distribution.
2. Use the existing `JL-OG-2026-01` test, not a new programme: source checked local content; max 2–3 eligible voluntary organiser asks per issue (approval gate), one reader-forward line, one useful value-first social pack, all with documented attribution and no bulk messaging.
3. Obtain GA4 and Search Console source-data access without interpreting Windsor's false-zero rows. Continue MailerLite first-touch attribution and confirmed-subscriber tracking in the meantime.
4. Match growth decisions to cash: use verified commercial outcomes to prepare renewal/upsell evidence without linking payment to editorial placement.

## Existing tracking reference (not a new campaign)
- Growth experiment: https://docs.google.com/document/d/1JncJJdljc3oLTzS3qUyA06QI4JDd9I9pdnMD4dxy3AQ/edit
- SK8 growth factory: https://docs.google.com/document/d/1pCHaq8ASzuGVFxdxxiynLmTdmHuh9Q6EgSGC-npHIYk/edit
- Canonical signup: https://www.sk8scoop.com/join/
- Working guide route: https://www.sk8scoop.com/kids-family/holiday-club-finder/

## Release gate
- Confirm exact Cloudflare production version, and ensure the intended GitHub commit matches before publishing.
- Run mobile and desktop browser tests on homepage, What’s On, holiday finder, signup and joined-user guide route.
- Verify image crops, data/price/date accuracy, no expired promotional elements and event count.
- Check UTM link navigation and MailerLite acquisition fields with a controlled test.
- Preview branch is NOT approval to merge, deploy, send or post.

## Known limitations
This audit has source and platform-account evidence but not direct Cloudflare production state or a real GA4/GSC traffic report. Do not describe the source-only checks as a completed end-to-end live QA.
