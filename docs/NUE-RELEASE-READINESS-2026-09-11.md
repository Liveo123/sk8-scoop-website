# NUE preview release readiness — 11 September 2026

Branch: `preview/homepage-nue-v1`

Status: **preview build complete enough for owner review; do not merge or publish without explicit approval.**

## Completed in this continuation

- Updated central current-issue configuration from Issue 11 to Issue 12.
- Updated public subscriber proof to the rounded `500+` milestone rather than a volatile exact count.
- Current Issue 12 public preview URL is wired into the central configuration and Join page fallback.
- Refreshed homepage weekly routes:
  - KNOW → Nansen/Firs 20mph proposal and deadline.
  - DO → current checked What’s On listings, led by Bramhall Wellness Day this weekend.
  - DISCOVER → Issue 12 Gatley Carrs feature.
- Removed the stale Issue 11 example from the general Submit form.
- Added `functions/api/reader-submission.js` as a Pages-function compatibility route. The Worker remains the primary API implementation and already contains `/api/reader-submission` and `/api/contact-message` handlers.

## Existing NUE scope retained

- Homepage with KNOW / DO / DISCOVER weekly cards.
- Explore SK8 with eight open destinations.
- What’s On with dated checked listings, filters and automatic expiry.
- Food & Drink, Kids & Family, Outdoors, Local History, Planning & Development, Useful Updates and Around SK8 gateway/content pages.
- Guides, Where to start, Join, Submit, Contact, event submissions, business submissions and advertiser enquiry routes.
- Existing Free & Cheap Guide left intact.
- Rich existing artwork retained; no generic-icon visual downgrade.
- Preview-only `noindex` treatment retained where appropriate.

## Production blocker requiring owner approval

The Worker deliberately refuses to save general reader submissions unless the `reader_submissions` D1 table exists. The migration is present at:

`migrations/2026-08-28-reader-contact.sql`

The migration must **not** be applied to the production D1 database until Paul explicitly approves production release work.

Contact messages use Formspark and do not require the D1 contact table.

## Before production merge

1. Apply the `reader_submissions` migration to the production D1 database after explicit approval.
2. Run one real submission test through Submit and confirm it reaches the moderation data path.
3. Run one contact-form test and confirm Formspark delivery.
4. Recheck current What’s On source links and remove/replace any directory-only links that are not strong enough for production evidence.
5. Confirm mobile/desktop visual QA on the latest preview deployment.
6. Only then merge the preview branch to `main` and publish.

## Do not change automatically

- Do not merge to `main`.
- Do not apply production database migrations.
- Do not publish/deploy to the live domain.
- Do not rewrite the Free & Cheap Guide.
- Do not replace approved rich artwork with generic SVG/icon placeholders.
