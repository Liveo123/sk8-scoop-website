# Reader pages preview QA

Branch: `preview/homepage-reader-pages-v1`
Status: PREVIEW ONLY - do not merge or deploy to production until the listed blockers are cleared.

## Cycle 1 - structure and reader value

Checked:
- homepage remains newsletter-first rather than becoming a second weekly publication;
- dedicated Join, Where to Start, Submit and Contact routes have distinct jobs;
- Submit separates lightweight reader responses from the existing detailed event/business forms;
- homepage maintenance is limited to a small current-story area rather than a large live portal.

Fixes made:
- kept the new structure compact;
- reused MailerLite for subscription rather than creating a second subscriber system.

## Cycle 2 - accuracy and reader experience

Checked:
- current `data-api-form` browser code serialises the new forms to JSON and handles success/error responses;
- reader and contact inputs have server-side allowed-value checks, email validation, length limits and consent checks;
- optional reader links must begin with http:// or https://;
- both public forms include a simple honeypot field;
- new D1 records are saved before any email notification attempt;
- privacy notice now describes reader/contact submissions.

Fixes made:
- added `reader_submissions` and `contact_messages` to canonical `schema.sql`;
- added isolated Worker handlers for `/api/reader-submission` and `/api/contact-message`;
- added notification status tracking so email failure does not erase a saved message;
- added canonical URLs and navigation/accessibility attributes to the new form pages.

## Cycle 3 - risk and polish

Checked:
- `main` is untouched;
- existing API routes still depend only on the established D1 tables;
- the two new handlers check their own new tables, so a missed migration cannot take down existing forms;
- no API key, password or email-service secret is committed;
- Cloudflare Email Service is optional in code until the account/domain binding is deliberately configured;
- the inactive What's On route is not promoted in the new primary navigation.

Open blockers before production approval:
1. Apply the two new D1 tables through the controlled migration process.
2. Onboard/verify Cloudflare Email Service for the intended sender and destination, then add the `CONTACT_EMAIL` binding.
3. Run live preview submissions for both new forms and confirm D1 + inbox delivery.
4. Verify the Issue 10 `/latest` website content is current before publishing the redesigned homepage.
5. Check the preview visually on desktop and mobile.
6. Decide whether to roll the new navigation across the older permanent pages in the same release or a separate follow-up, to avoid mixed navigation after launch.

No production merge or deployment is authorised by this QA record.
