# South Manchester Radar signup funnel | release checklist | 28 October 2026

## State
- **OWNER-APPROVED CONTROLLED LAUNCH: PR ready for review, NOT MERGED or deployed. Cloudflare build for b8b0bb9f failed; do not merge until a fresh build and preview checks pass.**
- Launch PR: https://github.com/Liveo123/sk8-scoop-website/pull/262
- Existing Cloudflare Worker and MailerLite account reused. No new subscription, service or MailerLite form-editor work.
- Temporary Radar signup home: \`https://www.sk8scoop.com/radar/\` after owner-approved deployment. Its host is SK8's existing infrastructure, not a new independent Radar domain.
- Existing MailerLite Radar subscribers group: \`202394374779176114\`. SK8's group is never passed to the Radar API.
- Existing active Radar welcome automation (confirmed via MailerLite on 28 October): \`202394608790930821\`.
- Existing MailerLite embedded Radar forms remain inactive and incomplete **by design**; this implementation does not depend on them.

## Implemented
1. \`radar/index.html\` + \`radar/style.css\` + \`radar/signup.js\`: responsive, brand-distinct landing form with required explicit subscription checkbox, anti-bot honeypot, Turnstile widget and accessible status messages.
2. \`radar-signup-api.js\`: Cloudflare endpoint, server-side Turnstile verification, same-origin check, separate Radar group, no global resubscribe, and prevention of existing SK8 account-level field overwrites. Existing Radar members are not duplicated.
3. \`worker-business-v2.js\`: mounts \`POST /api/radar-signup\`, preserving the existing SK8 signup path.
4. \`radar/success/index.html\`: confirms Radar-only subscription and offers a separate SK8 Scoop signup.
5. \`radar/privacy/index.html\`: Radar-specific explanation and contact details.
6. Five SK8 signup success pages now offer an optional, **separate** Radar signup. No SK8 subscriber is moved.
7. \`wrangler.toml\` includes \`RADAR_SIGNUP_ENABLED = "true"\` on the unmerged approved launch branch; the production website remains unchanged until merge and successful deployment.
8. \`tests/radar-signup-qa.mjs\`: offline-only tests. No subscriber writes or live messages.

## Current verified MailerLite configuration
- Radar group has zero subscribers as at 28 October 2026.
- Main and SK8 invitation embedded forms are single-opt-in and inactive, and are not needed for the custom page.
- Radar welcome workflow: active (verified via MailerLite; no public website signup is deployed yet). Two designed welcome emails, with Radar sender, contact@sk8scoop.com, the supplied Stockport postal address, unsubscribe links and optional SK8 invitation.
- Dry run: all three steps (welcome, delay, follow-up) executed without warnings. Prior controlled inbox tests were reported as delivered; a genuine new signup from the public page still needs checking.

## Remaining checks before approved launch
1. **Subscription preferences:** Review shared MailerLite account unsubscribe behaviour. The native email unsubscribe may stop **both** publications. The Radar privacy notice explicitly warns of this and gives an email-based publication-specific preference route. Group-specific self-service preferences should be enabled before broad promotion if practical.
2. **Visual QA:** Check pages at 320, 390, 768, 1440px, keyboard/focus and Turnstile widget. Review branding and privacy text; production Turnstile key must cover \`www.sk8scoop.com\`.
3. **Consent QA:** Confirm the public form uses no unrelated trackers. The Radar group must remain the only group assigned by its endpoint.
4. **Launch coordination:** Owner approved the controlled launch. Welcome automation is active; the launch flag is true on the unmerged branch. PR is ready for review. Do not merge until Cloudflare Workers Builds and preview-smoke pass on the current head, then verify deployment before a real signup.
5. **Real inbox test** with an explicitly authorised test address, after owner approval: submit to public form, verify membership and no SK8 group assignment; verify welcome delivery, correct sender/footer/links, unsubscribe and cross-signup invitation. Use a separate address already in SK8 to confirm existing membership is preserved. Remove or label tests before counting growth.
6. **Final status:** Controlled launch approval was provided. No campaign sends are included; the public route remains unpublished pending a green build and merge.

## Known edge cases and constraints
- A contact that has unsubscribed from the shared MailerLite account cannot automatically join Radar via this API. The endpoint refuses reactivation and directs them to contact the publisher for the supported MailerLite re-subscribe route.
- Existing SK8 subscribers remain in SK8 when they separately join Radar; the upsert only appends the Radar group and does not overwrite their global opt-in timestamp or original IP.
- New Radar subscribers use single opt-in; explicit checkbox, Turnstile, opt-in timestamp and IP are sent to MailerLite.
- MailerLite does not provide distinct independent unsubscribe states at account level by default; a group-specific preference strategy remains a launch consideration.
- A disabled Radar workflow cannot deliver the promised welcome email; coordinate the switch with the signup release.
- The custom page is deliberately on SK8's existing domain to avoid new hosting or DNS work. Move to a future Radar domain only after a separately approved migration and retest.
- Server logs record only aggregate acquisition channel, not email or IP. No external tracking scripts are loaded on the Radar signup page.

## How to test offline
With Node.js 20+ in the repository root:
\`\`\`sh
node tests/radar-signup-qa.mjs
\`\`\`
Tests mock MailerLite and Turnstile; they cannot prove inbox deliverability or live provider configuration.

## Definition of done
A person can discover Radar, explicitly join *Radar only*, arrive at a success page, receive the two intended Radar emails, and safely opt out. SK8 subscribers can discover Radar separately from their signup success pages. None of these actions must silently subscribe someone to both newsletters. Any unresolved unsubscribe/preference limitations must be disclosed before launch.
