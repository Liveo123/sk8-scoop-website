# Issue 13 Post-send NUE Website Update

**Source issue:** SK8 Scoop Issue 13 — 18 September 2026  
**Status:** LIVE / PRODUCTION QA PASSED  
**Production commit:** `b5f10a0a366414270116c8e15d220c8e2fc007c5`  
**Trigger:** Issue 13 sent; run the normal post-send Website Harvest + NUE reuse pass.

## Delivery note

Issue 13 was not one clean A/B send. The initial MailerLite A/B test reached 136 recipients (25% test split). A ProtonMail compatibility/delivery problem was then corrected and a separate recovery campaign sent the fixed version to 403 recipients.

Treat Issue 13 subject-line and aggregate campaign performance as **confounded**. Do not declare a clean A/B winner or compare its raw early rates directly with a normal single campaign without accounting for the incident, separate send times and unequal campaign types.

## Smallest useful post-send release

### Homepage
Rotate Know / Do / Discover to:
- KNOW — Heald Green Regulation 19 Local Plan
- DO — Heald Green North History Walk
- DISCOVER — eight civilian names on Cheadle War Memorial

These now lead to SK8-owned pages rather than back into the newsletter archive.

### What's On
Remove expired listings and ingest verified future Issue 13 events:
- Cheadle CoderDojo — 19 Sep
- Manchester Mid-Autumn Festival — 19–20 Sep
- Visit My Mosque — 19 Sep
- Avro Heritage Museum free day — 20 Sep
- These Shining Lives — 21–26 Sep
- John Lewis Beauty Takeover — 24 Sep
- Lifesavers basic life-support — 26 Sep

Retain still-current existing listings. Add multi-day event support using `end_date` / `date_range`.

### Planning & Development
- Add durable Heald Green Regulation 19 Local Plan explainer.
- Add it to the Planning hub.
- Replace the expired Mona Avenue consultation card with the current Bramhall Park Road Toucan-crossing proposal.
- Keep Nansen/Firs and Oakwood current deadlines visible.

### Outdoors / Local History
- Surface the Heald Green North History Walk on Outdoors.
- Preserve the full Local History route page.
- Add NUE continuations between the walk page, Outdoors, Free & Cheap and the Cheadle War Memorial story.
- Carry Tiny SK8 Adventure #1 — One Stop Away — into Outdoors and Free & Cheap as an evergreen mini-adventure.

### Free & Cheap Guide
- Add Heald Green North History Walk to the permanent walks section.
- Add One Stop Away to the permanent small-day-out ideas.
- Refresh the disposable What's On Now layer to 18–30 September.
- Remove expired early-September event material.
- Link readers onward to What's On, Planning and Latest rather than ending at the guide.

### Freshness / discovery
- Refresh sitemap dates for changed hubs.
- Add the new Local Plan explainer to sitemap.
- Update the public Issue 13 configuration and homepage fallback copy.

## NUE experiments

### Experiment 1 — owned continuation from homepage
**Hypothesis:** replacing newsletter-preview destinations with relevant SK8-owned article/route/planning pages increases meaningful owned-site continuation.  
**Variable:** Know / Do / Discover destinations and content.  
**Primary metric:** SK8-owned continuation clicks / useful path depth from homepage.  
**Baseline:** previous weekly homepage cards primarily routed back to the newsletter preview.

### Experiment 2 — connected route experience
**Hypothesis:** a connected path between Outdoors → Heald Green walk page → Free & Cheap / Local History produces more useful continued exploration than a single isolated article.  
**Variable:** contextual NUE continuation links.  
**Primary metric:** cross-surface owned continuation clicks.  
**Guardrail:** do not add links that merely create loops without extra reader value.

### Experiment 3 — harvested What’s On
**Hypothesis:** a smaller current event set, fed from verified newsletter research and with multi-day support, produces better event-detail actions than a stale larger list.  
**Variable:** refreshed event set + expiry + multi-day handling.  
**Primary metric:** `event_detail_click` and filter use, interpreted alongside listing volume.  
**Guardrail:** no filler and no unverified event insertion.

## Three-cycle QA

### Cycle 1 — structure and value
Passed after limiting reuse to surfaces where Issue 13 materially improves reader utility. No forced Kids & Family or Food & Drink update was added merely for volume.

### Cycle 2 — accuracy and reader experience
Fixed expired What’s On entries; kept dates/costs/venues/action links from verified Issue 13 source; preserved the Local Plan / planning-permission distinction; added multi-day filtering; kept route/access caveats visible.

### Cycle 3 — final risk and polish
- modified page section/article/div counts balance;
- no placeholder, JavaScript or insecure HTTP links in changed files;
- key internal destination files exist on the branch;
- homepage contains exactly three weekly story cards;
- old Issue 12 homepage preview reference removed;
- sitemap contains the new planning page;
- What’s On contains no event whose effective end date is before 19 September.

## Freshness / review points

- Mid-Autumn Festival / Visit My Mosque / CoderDojo / Avro: expire after their event dates.
- Bramhall Park Road comments: review after 23 Sep.
- Nansen/Firs consultation: review after 24 Sep.
- John Lewis event: expire after 24 Sep.
- These Shining Lives / Lifesavers: expire after 26 Sep.
- Local Plan explainer: recheck on/after 23 Sep when the Regulation 19 participation route opens and again after 8 Nov.
- Heald Green history walk: recheck route/diversion/access facts on the normal outdoors/history cadence.

## Measurement note

Do not use Issue 13's early MailerLite results as a clean subject-line experiment. The ProtonMail incident and split recovery send are material confounders. Keep the delivery incident attached to any future Issue 13 analysis.


## Production close-out

The Issue 13 NUE release is live. Production smoke checks passed for the homepage and the wider post-launch site suite after deployment through Cloudflare.

Guide routing was tightened after the first release pass:
- public website visitors continue to the Free & Cheap landing/sign-up page;
- visitors recognised as SK8 Scoop subscribers can be routed directly to the relevant full-guide section;
- SK8 Scoop email UTM traffic is used to recognise the subscriber journey;
- non-JavaScript fallback remains the public guide landing page.

The three Issue 13 NUE experiments are instrumented with `data-experiment` markers and the existing NUE analytics layer:
- `issue13-home-owned-continuation`
- `issue13-connected-route`
- `issue13-harvested-whats-on`

Do not retrospectively treat Issue 13 as a clean email A/B experiment. The delivery incident and recovery campaign remain part of the permanent analysis context.

## Website-only harvest additions

The first post-send pass leaned too heavily on material already present in the newsletter or Free & Cheap Guide. A second small Website Harvest pass now deliberately adds useful verified items that did **not** make either surface, so the website has some independent discovery value rather than merely mirroring them.

Added to What’s On:
- **Avatar: The Last Airbender Day** — Stockroom, 19 September at 11am; free; wider-Stockport family/pop-culture option.
- **Sisters Islam Essentials** — Cheadle Masjid, starts 21 September, 7pm–8:30pm; free 10-week adult course.
- **The Unfriend** — Heald Green Theatre, 29 September–3 October, 7:30pm; later-window local theatre option.

Selection logic:
- all three were verified/current;
- none appeared in the Free & Cheap Guide;
- all were omitted from the final Issue 13 newsletter;
- two are core SK8 and one is a distinctive wider-Stockport option;
- the additions improve What’s On breadth without padding the guide or manufacturing extra permanent pages.

Do not infer a rule that every rejected newsletter candidate should be published on the website. Website-only additions still need independent utility, freshness, verification and local-fit checks.

