# NUE reusable feature content model

Use this model for event, local oddity, food, walk and useful-local feature records. The existing `data/events.json` fields remain valid; the optional NUE fields below make a record capable of powering a richer card and a detail page without duplicating editorial decisions.

## Core fields

- `id`: stable slug-like identifier.
- `title`: reader-facing headline.
- `date`: `YYYY-MM-DD` when time-sensitive.
- `time`: optional start time.
- `area`: filterable place label.
- `venue`: useful human-readable location.
- `cost`: concise reader-facing cost.
- `category`: filterable content type.
- `description`: one-paragraph card intro.
- `source_url`: primary evidence / organiser source.
- `verification`: editorial verification state.
- `checked`: last checked date.
- `status`: `verified`, `draft`, `expired`, etc.

## Rich NUE fields

- `detail_url`: internal SK8 Scoop detail page.
- `why_it_matters`: one concise reason the item deserves attention.
- `image`: preferred visual URL.
- `image_alt`: meaningful accessible description; state when an image is an SK8 Scoop editorial illustration rather than documentary photography.
- `featured`: boolean for spotlight placement.
- `cta_label`: primary internal card CTA.
- `tags`: optional array for future search / recommendation logic.
- `audience`: optional tags such as `family`, `free`, `food`, `outdoors`, `history`.
- `expires_at`: optional ISO date/time for content that should leave prominent surfaces automatically.

## Card pattern

1. 16:9 editorial image with a short status badge such as `TODAY`, `THIS WEEKEND`, `FREE` or `LOCAL READ`.
2. Strong title.
3. Three compact metadata chips: place, cost, type.
4. 1–2 sentence useful intro.
5. `Why it’s worth it` line.
6. Primary CTA to the internal detail page; secondary CTA to the organiser/source when useful.

## Detail-page pattern

1. Eyebrow + strong H1 + one-sentence promise.
2. Hero visual and caption.
3. `At a glance` panel: when, where, cost, type, last checked.
4. `Why it made the Scoop` section.
5. Fuller article copy.
6. `Before you go` utility panel.
7. Primary organiser/source CTA.
8. Cross-links to latest newsletter, archive and one related feature.
9. Small, clearly separated advertising route where commercially appropriate.

## Advertising / editorial separation

Advertising must remain clearly labelled and visually separate from editorial recommendations. The NUE site can route businesses to `/advertise.html`, where products can cover newsletter placements, guide placements and NUE website placements without making editorial cards look paid.
