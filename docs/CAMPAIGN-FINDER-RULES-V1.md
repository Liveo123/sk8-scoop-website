# SK8 Scoop Campaign Finder rules v1

Status: internal deterministic decision logic for the temporary TEST/GROW operating mode. Not a promise of inventory or results. Human suitability approval remains required before any sale.

## Purpose

Turn a small set of business facts into one sensible next recommendation without pretending SK8 Scoop has enough evidence for an AI media-planning engine.

The engine is allowed to return:

- **TEST £40**
- **GROW £90**
- **FIX FIRST** — take a prerequisite action before buying advertising
- **WAIT** — timing/inventory does not justify spend now
- **NOT A FIT** — SK8 Scoop should not actively sell the campaign
- **HUMAN REVIEW** — facts/compliance/reputation/terms need judgement before a recommendation

The engine never guarantees bookings, enquiries, footfall, revenue or ROI.

## Inputs

Collect only fields that can change the decision.

1. **Desired reader action**
   - book
   - enquire
   - visit
   - register
   - buy / use an offer
   - know we are here / awareness
2. **Business category**
3. **Primary customer area**
   - Cheadle
   - Cheadle Hulme
   - Gatley
   - Heald Green
   - wider SK8 / immediate nearby
   - outside normal reader area
4. **When the action matters**
   - within 7 days
   - 1–4 weeks
   - 1–3 months
   - ongoing
5. **Specific useful reason to act now**
   - clear
   - weak / generic
   - none yet
6. **Action destination**
   - working booking / enquiry / sales / registration route
   - social/profile route that can realistically complete the action
   - no adequate route
7. **Typical customer / booking value**
   - under £20
   - £20–£100
   - £100–£500
   - £500+
   - unknown
8. **Free & Cheap Guide fit**
   - genuine reader fit
   - no genuine fit
   - unclear
9. **Observed trigger / source** for outbound prospects
10. **Any prior SK8 campaign evidence**

Budget is deliberately not required at the first step. The current product set is already small and fixed-price.

## Decision order

Always apply the gates in this order. A later commercial rule cannot override an earlier safety/fit gate.

### Gate 1 — advertiser suitability

Return **HUMAN REVIEW** when any of these applies:

- identity/operator/entity is unclear;
- recipient/contact route is not safely classified for outbound;
- regulated or sensitive claims need checking;
- unusually strong performance/health/financial/legal claims are proposed;
- editorial coverage and paid placement could be confused;
- exclusivity, discounts, non-standard payment terms or unusual guarantees are requested;
- there is a live complaint, suppression or reputational issue.

Return **NOT A FIT** when the business/campaign is clearly unsuitable for SK8 Scoop or would undermine reader trust.

### Gate 2 — geography / reader relevance

- Core SK8 / immediate reader area + genuine reader relevance -> continue.
- Outside normal area but unusually strong SK8 relevance -> **HUMAN REVIEW**.
- Outside normal area with weak reader relevance -> **NOT A FIT**.

Do not widen geography merely to find more advertisers.

### Gate 3 — action route

If the advertiser wants bookings, enquiries, registrations or purchases but has no practical destination that can complete that action, return **FIX FIRST**.

Suggested advice:

> Set up one clear booking/enquiry/sales route first. Paid attention is less useful if readers cannot complete the next step easily.

A working phone/contact route can count where that is normal for the category.

### Gate 4 — proposition clarity

If the goal is transactional but the proposed message is only generic awareness (for example “we are a lovely local business”), return **FIX FIRST** unless there is a strong reason to test awareness specifically.

Ask for one useful reason to act, such as:

- a bookable class/course;
- a dated event;
- a specific service;
- a genuine offer;
- a limited booking window;
- a new opening;
- a useful seasonal proposition;
- a clear local problem the service solves.

### Gate 5 — timing

**Within 7 days**

- If inventory, creative and approval can genuinely happen before the useful reader action expires -> TEST may continue to later gates.
- Otherwise -> **WAIT / NOT ENOUGH LEAD TIME**. Do not take money for a campaign that is unlikely to run usefully in time.

**1–4 weeks**

- Normal TEST/GROW decision window.

**1–3 months**

- If there is a real trigger/date -> continue, with publication timing selected later.
- If there is no reason to act yet -> **WAIT** and attach the next commercial opportunity/date.

**Ongoing**

- Temporary system does not yet have a standard recurring-awareness subscription.
- Recommend a defined TEST with a measurable question, or **WAIT**. Do not invent an ongoing package.

### Gate 6 — low-ticket economics sanity check

For **under £20 typical value**:

- Generic low-margin item + no event/bundle/offer -> normally **FIX FIRST** or **NOT A FIT** for paid TEST.
- Specific event, multi-person booking, bundle, repeat-customer proposition or meaningful basket value -> TEST can still be reasonable.

For **£20–£100**:

- TEST is normally economically plausible when the proposition/action is clear.

For **£100–£500 / £500+**:

- TEST is normally the appropriate first paid experiment when local fit and lead route are strong.
- Do not claim that one customer “covers the ad” as ROI unless margin and actual attribution are known. At most, describe revenue arithmetic as a rough sanity check and label its limitations.

For **unknown value**:

- Do not block the campaign automatically. Prefer TEST if the rest of the case is strong, but flag the unknown in the recommendation.

### Gate 7 — Guide fit

GROW is allowed only when the Free & Cheap Guide adds a genuinely useful second reader context.

**Genuine Guide fit examples:**

- free family activity;
- low-cost workshop or attraction;
- meaningful local discount / budget offer;
- useful free trial/taster where the Guide context remains honest;
- low-cost seasonal family proposition that belongs naturally in the Guide.

**Not a Guide fit merely because:**

- the business wants more exposure;
- it is a restaurant/pub;
- the advertiser can afford £90;
- the newsletter TEST feels “too small”;
- the system wants a higher order value.

If Guide fit is unclear -> default to TEST or **HUMAN REVIEW**, not GROW.

### Gate 8 — current-product selection

After all gates pass:

- genuine Guide fit -> **GROW £90** as the best fit, with **TEST £40** as the simpler alternative if one newsletter placement can still answer a useful question;
- no Guide fit -> **TEST £40**;
- awareness-only -> **TEST £40** only when framed as a defined experiment; otherwise WAIT;
- transactional/lead goal with specific offer + action route -> normally **TEST £40** unless Guide rule applies.

Do not return legacy/future products from the temporary public system.

## Human review handoff

When the finder returns **HUMAN REVIEW** for local-fit reasons:

- use the CTA **Request a local-fit check**;
- hand off with the route value `human_review` rather than preselecting TEST or GROW;
- make clear that no payment is taken for the fit check;
- save the request in the normal advertiser-enquiries queue;
- send the owner alert through the existing advertiser-enquiry notification path;
- send the business a confirmation that the request was received;
- only recommend TEST or GROW after the manual fit check.

## Business-category modifiers

These modifiers refine the recommendation but do not override the gates.

### Hospitality

Default: TEST.

Strong hooks:

- Christmas/seasonal booking window;
- special menu/event;
- group/private booking;
- opening/relaunch;
- concrete early-booking incentive.

Avoid broad “come to our pub/restaurant” messages when a more specific booking reason exists.

### Classes, courses and clubs

Default: TEST when there is a start date / limited places / registration route.

If the deadline is too close for useful publication -> WAIT rather than forcing a late advert.

### Children's/family businesses

Default: TEST.

Upgrade to GROW only where the actual proposition belongs naturally in Free & Cheap.

### Trades / property / professional services

Default: TEST, especially for high-value local leads.

Prefer one service/problem/lead action over “all our services”. Do not invent Guide fit.

### Retail

Low-ticket generic retail -> FIX FIRST unless there is a meaningful offer, event, product launch, bundle or seasonal proposition.

Higher-basket / appointment-led / experiential retail -> TEST may be appropriate.

### Fitness / wellbeing

Specific beginner course, class block, consultation or dated offer -> TEST.

Generic January awareness -> TEST only if there is a defined action and destination.

Health claims require human/factual review.

### Events

Clear date + useful audience fit + booking/registration route -> TEST.

Free/low-cost family/community event may be a GROW candidate only if the paid Guide callout is contextually appropriate and editorial/commercial separation remains clear.

## Recommendation output template

Every result must contain the following in this order:

1. **SK8 recommendation** — TEST / GROW / FIX FIRST / WAIT / NOT A FIT / HUMAN REVIEW.
2. **Your goal** — restate the desired customer action.
3. **Next step** — say clearly what should happen next. If no prerequisite needs fixing, say the answers are ready for a small test pending suitability and availability. Do not use placeholder wording such as “nothing obvious”.
4. **What to promote** — the specific offer/service/event/action, not the business in general. Write this as a complete sentence beginning with a capital letter.
5. **Why this recommendation** — 1–3 concise reasons tied to the inputs.
6. **Simpler alternative** — only where a real alternative exists. GROW can normally show TEST. TEST should not invent a cheaper paid product.
7. **Timing** — practical campaign window, subject to inventory.
8. **What SK8 prepares** — use conditional wording for FIX FIRST / WAIT / NOT A FIT so the result never implies a campaign is already going ahead.
9. **What the advertiser provides/checks** — facts, destination, assets/rights, terms, factual approval.
10. **Measurement** — SK8 interaction + advertiser-confirmed downstream outcome kept separate. Use conditional wording when the campaign may not run.
11. **No guarantee** — results are not guaranteed.

## Example decisions

### Restaurant Christmas bookings

Inputs: Cheadle Hulme, festive menu, bookings open, direct booking route, £20–£100+ booking value, three to eight weeks, no Free & Cheap fit.

Result: **TEST £40**.

Promote the strongest concrete booking reason, not general restaurant awareness.

### Children's free half-term taster

Inputs: core SK8, dated free/low-cost taster, registration route, several weeks lead time, genuine Free & Cheap reader fit.

Result: **GROW £90**, with TEST £40 as simpler alternative.

### Generic café awareness

Inputs: “get more customers”, no offer/event/new proposition, low average transaction, no defined reader action.

Result: **FIX FIRST**.

Suggested action: create a specific offer/event/bundle/reason to visit before buying paid visibility.

### High-value local trade

Inputs: SK8 service area, £500+ typical job, clear quote/enquiry page, one high-intent service.

Result: **TEST £40**.

Do not describe one lead as guaranteed ROI. Measure tracked enquiries/clicks and advertiser-confirmed leads separately.

### Event next weekend with no available newsletter slot

Result: **WAIT / NOT ENOUGH LEAD TIME**, even if the prospect is otherwise excellent.

## Post-campaign decision rules

Do not use arbitrary click thresholds until SK8 has enough campaign history.

**REPEAT**

Use when the advertiser reports a useful business outcome or there is strong enough evidence and a fresh reason to run again.

**CHANGE**

Use when attention occurred but the proposition/action/timing appears to need a different test, or the advertiser reports weak downstream conversion.

**STOP**

Use when the economics, fit or repeated evidence no longer justify spend.

**WAIT / NEXT OPPORTUNITY**

Use when the campaign has finished but the next natural buying moment is later.

Unknown downstream outcome remains **unknown**, never silently converted to zero.

## Data learning rule

After enough completed campaigns, review recommendation rules using SK8-specific evidence by:

- campaign recipe;
- business category;
- acquisition source;
- objective;
- spend;
- SK8-measured interaction;
- advertiser-confirmed outcome;
- repeat purchase.

Only promote an observed pattern into the rules when the sample is large and consistent enough to be useful. Until then, keep it labelled as a hypothesis rather than “what works”.
