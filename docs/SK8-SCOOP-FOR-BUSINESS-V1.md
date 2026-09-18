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

Do not expand payment plumbing until the enquiry -> approval -> campaign workflow is proven and the approved Stripe implementation is ready.

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
- Static checks, JavaScript syntax checks and the full branch-preview smoke suite pass after bringing the branch up to date with current main.
- The one-time Resend smoke was removed after success so later PR updates cannot create repeat test enquiries or emails.
- The permanent preview test keeps the non-destructive bad-token 401 check.

Still human-gated before production merge:

1. open the private advertiser inbox with the existing valid `ADMIN_TOKEN` and confirm the latest test enquiry renders correctly;
2. visually review Campaign Finder, Christmas Eating Out acquisition page and the approval-gated payment page on the preview;
3. final owner approval to merge/deploy;
4. no additional advertiser outreach is authorised merely by the technical validation.

Commercial pilot status:

- Pointing Dog and Station House first contacts were sent on 15 September 2026;
- Gmail threads had no replies when checked on 18 September;
- the default follow-up point is about seven days, so no follow-up is due before roughly 22 September and every follow-up remains conditional on a fresh trigger/compliance/CRM check.
