# SK8 Scoop for Business v1

Status: working implementation specification. Non-production branch. Owner approval remains required for external outreach, paid publication and deployment.

## 1. Purpose

Build one advertiser growth system that finds suitable local businesses, helps them choose the smallest sensible campaign, makes approval/payment/creative easy, measures the result and creates the next relevant opportunity.

Core loop:

Commercial opportunity -> acquisition -> campaign diagnosis -> recommendation -> request -> SK8 suitability approval -> payment -> creative -> publication -> result -> repeat/change/stop -> referral/next opportunity.

Advertising remains clearly separate from editorial. Payment never buys editorial inclusion, ranking, recommendation or favourable treatment.

## 2. Operating principles

1. Start with the advertiser's desired customer action, not an ad-format catalogue.
2. Recommend no more than two routes: best fit plus a simpler viable alternative.
3. The system may recommend not advertising yet.
4. Sell campaigns/objectives, not raw newsletter slots.
5. Keep the first transaction low risk and measurable.
6. SK8 normally creates the paid creative; advertiser checks facts, offer, links and brand details.
7. Human approval remains at suitability, non-standard commercial terms, final paid creative and publication.
8. Automate administration, not judgement.
9. Unknown outcomes remain unknown. Do not infer a sale from a click.
10. Build more software only after real advertiser volume proves the need.

## 3. Current commercial products

Temporary pre-NUE operating set:

- TEST £40: one clearly labelled sponsored newsletter placement, one objective, one primary reader action, SK8-created creative, approval and short evidence review.
- GROW £90: newsletter plus a clearly labelled Free & Cheap Guide sponsored callout for up to four weeks only where Guide context genuinely improves the campaign.

Do not force GROW merely to increase order value. Hospitality/food is normally TEST-first unless the specific offer genuinely belongs in the Free & Cheap Guide.

Future SPONSOR / premium products remain outside the standard temporary sellable set until their readiness gates pass.

## 4. Commercial Opportunity Database

Use two opportunity classes.

### Scheduled

Christmas dining, Christmas gifts/experiences, January restart, February half term, Mother's Day, Easter, spring home and garden, May half term, summer activities, September restart.

### Triggered

New opening, new service, new class/course, event, recruitment, launch, limited-time offer, expansion, new booking window.

Each opportunity record should contain:

- opportunity ID/name
- reader need
- business problem/customer action
- suitable business categories
- target geography
- trigger signals
- acquisition start date
- booking/creative window
- publication window
- recommended campaign recipe
- available SK8 surfaces
- current inventory state
- existing advertisers to reactivate
- new prospects
- measurement plan
- next natural opportunity
- status: planned / acquiring / selling / full / running / reporting / closed

## 5. Acquisition engine

Initial effort mix, to be replaced by actual measured performance:

- targeted trigger-based prospecting: primary launch channel
- SK8-owned audience/site/newsletter/guides
- seasonal opportunity pages
- referrals from advertisers/readers
- a small local partner network
- useful searchable business resources
- paid acquisition only after the conversion funnel is proven

Outbound is selective, not mass cold email. Use the most appropriate lawful channel after classification. The first message should normally sell the next useful step, not dump a media kit.

A standing supervised prospect workflow prepares up to five eligible prospects per weekday. It must re-check the current trigger, CRM history, suppression/opt-out status and contact classification before a message becomes send-ready. A smaller batch, including zero, is correct when the quality/compliance gates do not produce five suitable prospects. No prospect email is sent until Paul explicitly approves that batch or named messages.

All channels should feed the same useful hook: a relevant opportunity page, campaign route or short recommendation.

## 6. Prospect qualification

Use existing compliance gates before unsolicited electronic outreach. Corporate / individual / unknown classification remains mandatory. Unknown or individual recipients do not receive cold electronic marketing unless a valid basis exists.

Practical commercial score, 100 points:

- core SK8 geographic fit: 20
- live/timely commercial trigger: 20
- strong reader relevance: 15
- customer/booking value supports paid acquisition: 15
- specific promotable proposition: 10
- clear booking/action route: 10
- strong timing: 5
- existing SK8 relationship/evidence: 5

Suggested action:

- 80-100: priority
- 65-79: worthwhile
- 50-64: reserve
- below 50: do not spend active sales time unless circumstances change

This score supplements, not replaces, the established legal/compliance classification.

## 7. Campaign Finder

Generic route asks only information that changes the recommendation:

1. What should local people do? Book / enquire / visit / register / buy-use an offer / know we are here.
2. Business/category and area.
3. When does the result matter?
4. Relevant website, booking or social route.
5. A short description of the useful offer/event/service.

Opportunity-specific routes pre-fill known facts. Example: Christmas Eating Out already establishes hospitality + festive-booking context, so the business should not repeat generic questions unnecessarily.

## 8. Campaign recipes

Maintain a small rules-based catalogue rather than generating media plans from scratch:

- single-action TEST
- two-touch bookings/enquiries
- event/class countdown
- new opening/launch
- limited places
- seasonal booking push
- high-value local lead
- family/activities
- ongoing local awareness (future recurring product only when approved)
- relevant Guide-supported GROW

During temporary mode, recipes must resolve only to currently deliverable TEST/GROW inventory.

Each recipe specifies objective, primary CTA, timing, surfaces, creative requirements, measurement and stop/repeat rule.

## 9. Recommendation output

Return:

- stated business objective
- what SK8 thinks should be promoted
- do-this-first advice if a prerequisite is weak
- best-fit current product and why
- simpler viable alternative where useful
- exact approved current price
- timing/window
- what SK8 creates
- what advertiser supplies/checks
- what will be measured
- clear caveat that results are not guaranteed

Do not manufacture a second option if one sensible route is enough.

## 10. Booking flow

Do not make advertisers select internal inventory.

Recommended flow:

Campaign recommendation -> Request campaign -> SK8 suitability/availability review -> Approve / recommend different route / decline -> scope and timing confirmed in writing -> payment -> short creative brief -> SK8 creates placement -> advertiser fact-check -> Paul publication approval -> schedule/publish.

Public availability can remain Available / Limited / Full. Internal inventory may be more precise.

## 11. Payment

Stripe remains the payment backbone.

Current standard:

- no payment at initial enquiry
- scope, price and timing agreed first
- payment normally before campaign/publication
- Stripe invoice/approved Stripe route where available
- no automatic discounts
- non-standard terms require human approval
- no surprise automatic charging for ordinary campaigns

Successful approved live payments trigger two operational notifications: an internal payment-received email to SK8 Scoop and a concise confirmation email to the advertiser explaining the campaign reference and next steps. These notifications are deduplicated by Stripe Checkout Session so webhook retries do not create repeated payment emails.

Do not expand payment plumbing beyond the approved workflow unless real operating volume proves the need.

## 12. Creative and pre-flight

Advertiser supplies verified facts, offer, dates, destination, logo/images with rights and material terms. SK8 prepares reader-facing paid creative.

Normal approval is factual/brand accuracy, not unlimited redesign.

Pre-flight checks:

- advertiser/business suitability
- factual claims and offer terms
- destination link
- rights/permissions
- clear sponsored/paid labelling
- mobile readability
- one primary CTA
- tracking plan
- advertiser approval
- payment/terms clearance
- Paul publication approval

## 13. Measurement

Define objective before campaign.

Keep layers separate:

1. delivery/exposure where meaningful
2. SK8-measured interaction, e.g. tracked clicks
3. advertiser-confirmed downstream outcome, e.g. enquiries/bookings/sales/redemptions
4. caveats/unknowns
5. learning
6. recommendation: repeat / change / stop / wait until next opportunity

Do not replace unknown outcomes with zero.

## 14. Retention engine

Each completed campaign receives one next-state:

- REPEAT: another test is justified soon
- CHANGE: proposition/timing/creative needs a different test
- STOP: further spend is not justified on current evidence
- WAIT: no sensible reason to advertise now
- NEXT OPPORTUNITY: attach a future commercial opportunity and re-enter the action queue when relevant

After a genuinely useful outcome, ask for an introduction/referral and, with explicit permission, capture evidence for a case study/testimonial.

## 15. CRM model

One business record wherever practical.

Minimum operational fields:

- business/contact/category/area/contact route
- entity/contact classification and outreach eligibility
- source/prospect trigger/source date
- priority score
- acquisition channel
- commercial objective
- preferred channel/reason
- current stage and next-action date
- proposed/selected product
- campaign ID
- price/payment state
- campaign dates
- creative/pre-flight state
- results by evidence source
- repeat/change/stop decision
- next relevant opportunity
- suppression/opt-out status

Simple sales stages remain preferable: Prospect -> Ready -> Contacted -> Follow-up Due -> Replied -> Interested -> Proposal Sent -> Decision Due -> Won / Lost / Later.

## 16. Automation boundary

Automate where reliable:

- enquiry capture
- record creation/dedupe prompts
- reminders/next-action queue
- payment confirmation when approved implementation exists
- creative-asset collection
- tracking-link generation
- result-report assembly
- future-opportunity reminders

Keep human:

- outreach exceptions/compliance uncertainty
- advertiser suitability
- final recommendation where judgement is material
- non-standard price/terms/exclusivity
- sensitive/reputational replies
- final creative/publication
- editorial decisions

## 17. First live opportunity: Christmas Eating Out 2026

Objective: festive meal, group/party, Christmas Day or relevant seasonal-event bookings.

Target: suitable restaurants, pubs and venues primarily in Cheadle, Cheadle Hulme, Gatley and Heald Green, widening only where reader relevance is strong.

High-value trigger signals:

- Christmas bookings now open
- festive menu live
- party/group bookings
- private dining
- Christmas Day availability
- seasonal events
- genuine early-booking offer

Current temporary product default: TEST £40. Do not force Guide-supported GROW for normal restaurant bookings.

Preferred primary CTA: Book / Enquire.

Suggested campaign ID format: 2026-10-businessshortname-test (month adjusted to actual campaign start).

Measure: tracked destination clicks plus advertiser-confirmed enquiries/bookings where identifiable. Never claim ROI until supported by recorded evidence.

## 18. Current implementation/readiness notes

As of 15 September 2026:

- main advertiser page already presents current TEST £40 and GROW £90 and uses outcome-first positioning.
- main `/api/advertiser-enquiry` stores enquiries to the existing D1 `advertiser_enquiries` table.
- the main enquiry handler currently does not provide the private advertiser-enquiries GET/admin view or advertiser-specific email notification that existed on the older `pre-nue-advertiser-page` branch.
- the older branch is heavily diverged from current main and should not be merged wholesale.
- the old `/advertise/pay/` page still contains historical £35 / legacy package logic and must not be surfaced as the current booking route.
- Stripe links in the old client configuration are blank; this is consistent with keeping payment behind approval rather than exposing an unfinished checkout.
- Guide sponsor-slot work exists on the older branch and previously passed branch-preview active-state QA, but should be ported deliberately to current main only if/when GROW is ready for production use.

## 19. Next technical implementation slice

Build against current main, not the diverged old advertiser branch:

1. advertiser-enquiry notification using the site's existing CONTACT_EMAIL mechanism;
2. authenticated advertiser-enquiry admin/read endpoint and private admin view;
3. optional status update action only if it reduces real admin work;
4. retire or quarantine the stale `/advertise/pay/` route until the approved Stripe flow is connected;
5. port Guide sponsor slot separately, with current-main integration and fresh preview QA;
6. run a real labelled test enquiry and confirm D1 + notification + admin visibility;
7. only then start the supervised first outreach batch.

## 20. Success measures

Acquisition:
- qualified businesses entering system by source
- outreach reply/positive reply rate
- opportunity-page / Campaign Finder completions

Commercial:
- request -> approved -> paid conversion
- average campaign value
- time/effort per sale/campaign

Advertiser outcome:
- tracked response
- advertiser-confirmed outcomes
- repeat rate
- referral rate

Guardrails:
- opt-outs/complaints
- mistaken or unsupported claims
- editorial-trust issues
- unsuitable advertisers rejected

The system succeeds when more suitable businesses enter, purchase with less admin, obtain enough evidence to make a sensible next decision, and a growing share of future revenue comes from repeat/referral/inbound rather than Paul restarting from zero each month.


## 21. Runtime validation update — 18 September 2026

Validated on the current post-NUE branch:

- Cloudflare non-production builds now inject `RESEND_API_KEY` into preview Worker versions.
- A labelled advertiser test completed the real preview POST path. The enquiry saved to D1 first and the wrapper then returned `notification_status: sent`.
- Resend returned message ID `01a0b3d5-0208-7499-a9e4-1b5b5b688d65`.
- Gmail confirmed delivery to `contact@sk8scoop.com` immediately afterwards.
- The private advertiser-enquiries API returns HTTP 401 for an intentionally wrong bearer token. This proves the preview route is live and `ADMIN_TOKEN` is configured rather than missing.
- A one-time preview-only self-test then exercised the same admin handler with the actual runtime `ADMIN_TOKEN` without exposing the token. The authenticated query succeeded and returned 11 advertiser-enquiry records. The temporary self-test route and workflow step were removed immediately afterwards.
- Static checks, JavaScript syntax checks and the full branch-preview smoke suite pass after bringing the branch up to date with current main.
- The one-time Resend smoke was removed after success so later PR updates cannot create repeat test enquiries or emails.
- The permanent preview test keeps the non-destructive bad-token 401 check.
- `wrangler.toml` now declares the four critical runtime secrets as required, so a deployment should fail clearly rather than silently ship without them.
- The preview-only diagnostic response used for the successful Resend test has been removed from the Worker before production.
- Production deploy still needs the build-time `RESEND_API_KEY` injected into `wrangler deploy` (or the same key added as a runtime secret in Cloudflare). Build-time variables are not runtime variables.

Still human-gated before production merge:

1. visually review Campaign Finder, Christmas Eating Out acquisition page and the approval-gated payment page on the preview;
2. final owner approval to merge/deploy;
3. no additional advertiser outreach is authorised merely by the technical validation.

Completed gates:
- Cloudflare production Deploy command updated so the build-time `RESEND_API_KEY` is uploaded with `wrangler deploy`.
- authenticated advertiser-inbox backend tested successfully with the actual runtime `ADMIN_TOKEN`; no token value was exposed.

Commercial pilot status:

- Pointing Dog and Station House first contacts were sent on 15 September 2026;
- Gmail threads had no replies when checked on 18 September;
- the default follow-up point is about seven days, so no follow-up is due before roughly 22 September and every follow-up remains conditional on a fresh trigger/compliance/CRM check.


## 22. Payment system decision — Stripe sandbox validation

Sandbox validation completed on 18 September 2026:

- TEST £40 completed successfully as a one-time GBP payment.
- GROW £90 completed successfully as a one-time GBP payment.
- both flows collected business name, payer name and campaign reference;
- both carried the expected SK8 product metadata and approval-required metadata;
- neither created a subscription or renewal;
- each sandbox Payment Link was restricted to one successful checkout and became inactive after that checkout;
- Stripe-hosted confirmation worked as expected.
- full end-to-end campaign test `SK8-E2E-013` then passed: Stripe recorded £40 GBP as paid, the signed webhook updated D1, advertiser enquiry #13 became `paid`, and the D1 payment row stored `payment_status: paid`, `amount_pence: 4000` and the campaign reference.
- the temporary E2E status probe and workflow assertion used to confirm that result were removed afterwards; the permanent unsigned-webhook 400 check remains.

### Three-criticism payment loop

**Criticism 1 — one reusable public TEST/GROW link is too loose.**  
It is efficient, but it weakens the approval gate because a link can be forwarded or reused outside the campaign review process.

**Revision:** one approved campaign gets one single-use payment route.

**Criticism 2 — letting the public website create Stripe payments automatically is technically neat but adds a powerful Stripe secret and more failure modes to the Worker.**  
At current advertiser volume this would automate a step that is intentionally human-approved.

**Revision:** keep payment creation human-gated. Use the authenticated Stripe connection / Stripe Dashboard to create the single-use route after approval. Do not give the public website authority to create charges.

**Criticism 3 — payment still needs to close the loop back into the operating system.**  
A Stripe receipt alone leaves the advertiser queue blind and creates manual reconciliation.

**Revision:** use a signed Stripe webhook whose only job is to record payment status against the approved advertiser enquiry in D1. The website receives no Stripe charge-creation key.

### Final payment architecture for v1

1. advertiser submits an enquiry;
2. D1 stores it and SK8 Scoop is notified;
3. Paul reviews suitability, timing and package;
4. only after approval, SK8 Scoop creates a **single-use Stripe payment route** for that campaign;
5. the Stripe route carries `advertiser_enquiry_id`, `campaign_reference` and `sk8_product` metadata;
6. advertiser pays on Stripe-hosted Checkout;
7. Stripe sends a signed event to `/api/stripe-webhook`;
8. the Worker verifies the Stripe signature, records the payment in `advertiser_payments`, and marks the advertiser enquiry `paid`;
9. the private advertiser inbox shows payment status/reference/amount;
10. production work then moves to creative, pre-flight, publication and reporting.

This intentionally keeps **ability to take money** outside the public Worker while allowing **payment status** to return automatically.

### Sandbox webhook

Sandbox endpoint created in Stripe:

`https://sk8-business-growth-engine-v2-sk8-scoop.quiet-term-e047.workers.dev/api/stripe-webhook`

Subscribed only to:

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `checkout.session.async_payment_failed`
- `checkout.session.expired`

The signing secret is stored in Cloudflare as `STRIPE_WEBHOOK_SECRET` and is included in both preview and production deploy-secret injection. Do not put it in GitHub.


## 23. Security hardening before live Stripe

Before connecting the live Stripe account, the advertiser branch received an additional security pass.

Implemented:

- Stripe remains hosted by Stripe. SK8 Scoop does not collect or process card numbers on its own pages.
- Browser-facing responses now add baseline hardening headers: `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, `X-Frame-Options: DENY`, and a partial CSP blocking framing, object embedding and hostile base-URL changes.
- Production SK8 domains receive HSTS for one year.
- Private admin and approved-payment routes are returned with `Cache-Control: no-store`.
- Advertiser form POSTs must be same-origin when an Origin header is present.
- Advertiser enquiries now include a honeypot and minimum/maximum completion-time screen before D1 write and notification.
- Stripe webhooks continue to require a valid signature, a configured signing secret, approved SK8 product metadata, a real advertiser enquiry ID, and the exact current GBP amount before an enquiry can be marked paid.
- Amount or currency mismatches are recorded as `review_required`, not paid.
- PR diff was scanned for Stripe, Resend and webhook-secret patterns; no live secret is committed in GitHub.

Important operational notes:

- The private advertiser page is noindex but noindex is not a security control. Its API remains protected by a high-entropy `ADMIN_TOKEN`. Cloudflare Access would be a worthwhile later defence-in-depth improvement if the private operating UI grows.
- The advertiser enquiry endpoint is now materially harder to spam, but Cloudflare rate limiting can still be added later if automated abuse appears.
- A fresh live Stripe webhook secret should be copied directly from Stripe to Cloudflare and should not be pasted into chat or committed to GitHub.
- The previously disclosed sandbox webhook secret is test-only. The Resend API credential previously shown during debugging should be rotated before final production launch as good secret-hygiene practice.


## 24. Live Stripe account prepared

Live Stripe account preparation completed on 18 September 2026 without creating any public live checkout links.

Live products:

- TEST product `prod_VHYWf1Aaa79P2q`, default price `price_1UGzPUFYD08ziIGA1RAPi5cb`, £40 GBP one-time.
- GROW product `prod_VHYW7eAN2Mdyy3`, default price `price_1UGzPWFYD08ziIGAbkZIDHZO`, £90 GBP one-time.

Live webhook:

- endpoint `we_1UGzPhFYD08ziIGAkbgSHdrn`
- URL `https://www.sk8scoop.com/api/stripe-webhook`
- enabled only for checkout completion/success/failure/expiry events needed by the advertiser flow.

Live payment-link check: zero active live Payment Links exist. This is intentional. A live advertiser payment route should be created only after a specific campaign is approved.

### Secret separation

Preview and production must no longer share one build-time Stripe webhook secret.

Use two Cloudflare build secrets:

- `STRIPE_WEBHOOK_SECRET_PREVIEW` for the rotated sandbox webhook.
- `STRIPE_WEBHOOK_SECRET_LIVE` for the live webhook.

Map either one to runtime `STRIPE_WEBHOOK_SECRET` only in the relevant deploy command:

- non-production/version upload uses `STRIPE_WEBHOOK_SECRET_PREVIEW`;
- production deploy uses `STRIPE_WEBHOOK_SECRET_LIVE`.

The previous sandbox webhook `we_1UGyrHJzdvodh5ZEPaFwNDmR` was disabled because its signing secret had been exposed during debugging. A replacement sandbox endpoint `we_1UGzQWJzdvodh5ZENLRbi04D` is active. Retrieve both new signing secrets directly in Stripe and copy them directly into Cloudflare. Do not paste them into chat or GitHub.


Cloudflare preview/production Stripe webhook secret split confirmed by owner on 18 September 2026.


- Resend rotation completed on 18 September 2026: the two older API keys were revoked, only `SK8 advertiser notifications production` remains, and a fresh advertiser enquiry sent afterwards was confirmed delivered by Resend and present in the SK8 Scoop Gmail inbox. This proves the Cloudflare deployment is using the replacement credential.

- Sandbox webhook re-established on 18 September 2026 as an active Workbench destination pointing to the branch preview URL; Cloudflare build secret `STRIPE_WEBHOOK_SECRET_PREVIEW` was rotated to the new signing secret.

- Final sandbox Stripe proof on 18 September 2026: a real £40 sandbox Checkout completed through the newly active Workbench webhook, and Stripe recorded `checkout.session.completed` as Delivered with HTTP 200. The Worker returned `{received:true, ignored:true}` because the temporary verification payment intentionally lacked approved advertiser metadata; this confirms signature verification and routing without changing advertiser payment state.


## Daily supervised outreach

The detailed operating rules for the weekday prospect batch are in `docs/DAILY-PROSPECT-OUTREACH-RUNBOOK.md`. The main advertising CRM remains the source of truth for duplicate, suppression and contact-history checks.
