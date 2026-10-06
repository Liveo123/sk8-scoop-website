# SK8 Scoop NUE Quick Answers + Website Health v1

Status: PREVIEW SPECIFICATION — not approved for production

Branch: `preview/nue-quick-answers-freshness-v1`

Date: 6 October 2026

## Outcome

Make the current NUE site faster to use without adding another destination or another database.

The current site already has:
- cross-site search;
- What’s On with current-event filtering;
- eight Explore routes;
- Around SK8;
- four locality hubs;
- guide discovery;
- Next Useful Experience links.

The next useful step is therefore not another hub. It is:

1. a compact **Quick Answers** layer on the homepage that routes readers straight into existing useful views; and
2. a **Website Health** check that flags stale, duplicate, contradictory or structurally risky content before it quietly degrades the site.

The desired reader flow is:

`homepage → immediate intent → existing useful result → next useful SK8 experience → newsletter / return use`

The desired editorial loop is:

`verified content → reused across surfaces → health check → exception flagged → human judgement → correction`

## Reader-facing MVP

Add six quick-answer routes inside the existing homepage “What do you need?” section.

1. **Today** → `/whats-on/?filter=today`
2. **This weekend** → `/whats-on/?filter=weekend`
3. **Free** → `/whats-on/?filter=free`
4. **Family** → `/whats-on/?filter=family`
5. **What’s changed** → `/updates/`
6. **Your area** → `#your-area`

These are shortcuts into existing content. They are not new content sections.

The current search box remains directly below the shortcuts with the relationship made clear:
- quick answers for common needs;
- search when the reader knows what they want;
- Explore tiles for browsing by topic.

Do not add a new Discover page, AI assistant, map database, account system or recommendation engine.

## What’s On URL contract

Extend the current What’s On client-side state so the existing filters can be opened directly from a URL.

Supported `filter` values:
- `today`
- `week`
- `weekend`
- `free`
- `family`

Supported `area` values remain:
- Cheadle
- Cheadle Hulme
- Gatley
- Heald Green

Rules:
- unknown values fall back safely to `all`;
- filter and area may be combined;
- selecting a filter or area updates the URL using `history.replaceState`;
- canonical URL remains the base What’s On page;
- no server-side routing change is required.

Examples:
- `/whats-on/?filter=weekend`
- `/whats-on/?filter=free&area=Gatley`
- `/whats-on/?filter=family&area=Cheadle%20Hulme`

## Homepage information hierarchy

Do not simply append another large section.

Inside the existing Explore section, use this order:

1. section heading: **What do you need?**
2. compact Quick Answers row/grid;
3. locality strip;
4. existing search box;
5. existing topic Explore tiles.

On mobile:
- quick answers must remain scannable without creating a long stack of large cards;
- use compact touch targets with clear labels;
- no decorative image is required;
- no SVG or generic icon row;
- the first screen after the story cards should communicate utility, not decoration.

## Tracking

Each quick answer should carry a normal first-party/consent-aware interaction event.

Event: `homepage_quick_answer_click`

Useful parameters:
- `quick_answer`: today / weekend / free / family / changed / area
- `link_location`: home-quick-answers

Do not add a new analytics platform.

## Website Health checker

Add a small, dependency-free Node script that reads the current website source and reports exceptions.

The checker must not silently alter editorial content.

### Event checks

For `data/events.json`:

ERROR:
- invalid JSON;
- missing required event title/date;
- malformed date;
- duplicate event ID.

WARNING:
- event has expired but remains in the dataset;
- checked date is materially old for a current/future event;
- probable duplicate based on overlapping date, area and title/venue similarity;
- verified/current event has no source URL or booking/source route;
- cancelled/sold-out content remains marked as verified/current.

Probable duplicates are warnings for human review, not automatic deletion.

### Homepage/current-content checks

For `data/homepage.json`:

ERROR:
- invalid JSON;
- story has no title or href;
- malformed expiry date.

WARNING:
- expired story remains in current homepage data;
- homepage updated date is old;
- duplicate hrefs among current story cards.

### Discovery/search checks

For `data/discovery.json`:

ERROR:
- invalid JSON;
- duplicate record IDs.

WARNING:
- expired record remains in the current discovery dataset;
- duplicate destination URLs;
- missing useful title/href;
- route appears to target a non-public/admin surface.

### Config/freshness checks

For `assets/config.js`, use conservative source-text checks rather than executing browser code.

WARNING:
- current issue date appears materially old;
- public checked date appears materially old;
- issue number/date values appear absent.

The checker should flag evidence, not invent a replacement value.

## Severity and exit behaviour

- **ERROR**: structural defect likely to break or corrupt the experience. Exit non-zero.
- **WARNING**: requires editorial/maintenance attention. Report clearly but do not fail the build by default.
- **PASS**: no material exception found for that rule.

The output should be compact and usable in GitHub Actions logs.

## Automation

Add a GitHub Actions workflow:

- on pull request;
- on pushes to preview branches and main;
- manual `workflow_dispatch`.

Use the repository checkout and Node 20 only. No paid service and no third-party package dependency.

This is decision support, not autonomous publishing or deletion.

## Three release experiments

### Experiment 1 — Quick-answer use

Hypothesis:
Common intent shortcuts generate more useful continuations than requiring every reader to use search or browse categories.

Primary metric:
Quick-answer clicks per homepage visitor who reaches the Explore section.

Secondary:
Destination continuation clicks.

### Experiment 2 — Common intent mix

Hypothesis:
The distribution of Today / Weekend / Free / Family / Changed / Area clicks will reveal which utility should receive stronger homepage priority.

Primary metric:
Share of quick-answer clicks by intent.

Decision:
Do not permanently prioritise one intent until the sample is meaningful.

### Experiment 3 — Health exceptions prevented

Hypothesis:
A lightweight automated health pass will catch stale/duplicate content before readers encounter it and will reduce manual checking time.

Primary measure:
Number of actionable warnings/errors caught before release.

Secondary:
False-positive rate and time spent resolving them.

Abandon or simplify the checker if it produces repetitive noise without useful action.

## Definition of done for preview

- Quick Answers are present within the existing homepage Explore section.
- No new top-level content destination is created.
- What’s On supports `filter` in the URL and still supports `area`.
- Filter + area combinations work.
- Existing on-page buttons continue to work.
- Mobile layout remains compact and readable.
- Search remains available and unchanged in purpose.
- Health script runs without external dependencies.
- The health script detects the known historical duplicate/expired event pattern in the current dataset as a warning rather than editing it automatically.
- No production merge/deploy occurs without the existing approval gate.
- Preview/browser QA remains required before production.

## Explicit non-goals

Not in this release:
- AI chatbot;
- personalised recommendations;
- user accounts;
- business directory;
- new content taxonomy;
- new map system;
- automatic editorial deletion;
- automatic publication;
- broad redesign;
- paid-placement influence on reader-facing ranking.

## Recommendation

Ship only if the preview demonstrates that Quick Answers make the current architecture simpler rather than adding another layer of visible complexity.

If the page feels busier, remove or reduce existing Explore chrome rather than adding more UI.
