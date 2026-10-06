# My SK8 MVP Experiment

Status: PREVIEW ONLY — do not merge or publish without Paul’s explicit approval.

## Outcome

Test whether a lightweight saved-planning layer makes SK8 Scoop more useful between newsletters, without building accounts, profiles or a recommendation engine first.

## MVP being tested

The preview tests:

- save / unsave current events;
- save selected articles and practical pages;
- a personal My SK8 page stored in the current browser;
- directions for individual events;
- map saved event locations as a route;
- add event to calendar;
- automatic movement of expired events into Past saves;
- save-from-newsletter links using `?save=<item-id>`;
- a weekend-plan view;
- “Remind me here” intent, surfaced on later SK8 visits rather than by push/email;
- same-area “also nearby” suggestions;
- shareable shortlists that can contain events and saved pages.

No login, account database or cross-device syncing is included.

## What we are trying to learn

1. Do readers notice and use Save?
2. Does saving lead to a useful later action rather than becoming a dead bookmark pile?
3. Do readers return to My SK8 on another day?
4. Is reminder demand strong enough to justify building real notifications later?
5. Do article/page saves add value as well as event saves?
6. Are maps, calendar, nearby ideas and sharing used enough to keep?
7. Is browser-only storage good enough for the first version, or does cross-device loss become a real problem?

## Measurement

Optional GA4 measurement remains consent-gated. My SK8 must still work when analytics is rejected.

Useful custom events:

- `my_sk8_action_view` — event save/action controls actually viewed;
- `my_sk8_page_save_view` — save control on a supported article/page viewed;
- `my_sk8_save` — new item saved, with `item_kind` and `save_source`;
- `my_sk8_unsave`;
- `my_sk8_page_visit`;
- `my_sk8_check_details`;
- `my_sk8_directions`;
- `my_sk8_calendar`;
- `my_sk8_map_saved`;
- `my_sk8_nearby`;
- `my_sk8_reminder_set` / `my_sk8_reminder_removed`;
- `my_sk8_weekend_plan_view`;
- `my_sk8_share`;
- `my_sk8_shared_list_view`;
- `my_sk8_shared_save_all`;
- `my_sk8_open_saved_page`.

Newsletter save links can also be measured with MailerLite unique clicks. Do not treat GA4 as the subscriber source of truth.

## Decision metrics

Treat these as experiment gates, not promises. Use users rather than raw event counts where possible and report sample sizes.

### Core adoption

**Event save rate** = users with at least one new event save / users who saw at least one event action row.

- Strong: 8%+
- Promising: 4–7.9%
- Weak: below 4%

**Article/page save rate** = users with at least one page save / users who saw a page-save control.

- Strong: 6%+
- Promising: 3–5.9%
- Weak: below 3%

### Utility after saving

Among users who save something, measure the share who later perform at least one useful follow-on action: check details, directions, calendar, map saved places, open a saved page, nearby click or share.

- Strong: 25%+
- Weak: below 10%

### Return habit

Measure the share of savers who visit My SK8 on a later calendar day within 28 days.

- Strong enough to investigate syncing/accounts: 15%+
- Do not build accounts from tiny samples. Prefer at least 20 returning savers before treating this as robust evidence.

### Feature-demand signals

Use these only once the underlying saver sample is large enough to be meaningful:

- reminder set by 10%+ of savers → investigate real email/push reminder options;
- map saved places used by 5%+ of My SK8 users → retain/improve;
- share used by 3%+ of My SK8 users → retain and test acquisition from shared lists;
- nearby clicked by 5%+ of savers → improve locality/distance logic;
- calendar used by 8%+ of event savers → retain prominently.

## Minimum test size

Run for roughly four weekly newsletter cycles.

For the core save-rate decision, aim for at least 100 analytics-consenting users who actually see a save control. If the sample is smaller after four weeks, report the result as directional rather than declaring success or failure.

## Abandonment / simplification criteria

Simplify or remove the feature if, after a meaningful sample:

- event save rate is below 3%;
- fewer than 10% of savers take any useful follow-on action;
- the interface materially harms What’s On usability on mobile;
- privacy or data-handling requirements become disproportionate to reader value;
- maintenance becomes more work than the reader utility justifies.

Do not build accounts, AI recommendations, public profiles, reviews or social-feed features merely because they are technically possible.

## Privacy and limitations

- Saved items and reminder choices are first-party browser local storage.
- No account identity is attached.
- Shared-list URLs contain public SK8 item IDs, not an email address or account ID.
- Analytics events are sent only when optional analytics consent is allowed.
- The reminder MVP does not send email or push alerts. “Remind me here” means SK8 will flag the item when the reader returns.
- “Nearby” is same-area logic in this test, not precise-distance ranking.

## Subscriber-access extension

The My SK8 preview also tests a lightweight subscriber shelf.

Current behaviour:

- a successful website/newsletter signup issues a long-lived first-party subscriber-access token;
- an existing subscriber can enter the same email again if the browser token has disappeared;
- a new email joins the normal SK8 Scoop subscriber audience and receives the existing welcome flow;
- one recognised browser can open the current Free & Cheap, 52 Adventures and Halloween & Half-Term guides;
- Treasure Hunts and future Pub Trails are explicitly excluded because they remain referral rewards or paid products;
- My SK8 is the subscriber home for current guides and future extras such as personal maps, stronger weekend planning, offers, extra local-history material, downloads and more powerful saved-item tools;
- this is a lightweight gate, not a password account or high-security entitlement system.

Useful measurements:

- `sign_up` by `form_position` for subscriber-shelf and guide landing conversions;
- `subscriber_shelf_view` split by locked/unlocked state;
- `subscriber_guide_open` for guide use after recognition;
- guide landing-page conversion into successful signup/unlock.

The main acquisition question is whether making useful guides visibly free to subscribers increases newsletter signups without creating enough friction to reduce guide usage.

## Production gate

Before any live experiment:

1. preview browser/mobile QA passes;
2. privacy notice explains My SK8 storage and measurement;
3. current event data remains healthy;
4. Paul explicitly approves merging PR #142;
5. live deployment and smoke tests pass after the approved merge.

