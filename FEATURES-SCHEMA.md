# NUE reusable feature schema

This file defines the current data contract for reusable local feature pages and feature cards.

## Required fields

| Field | Purpose |
| --- | --- |
| `id` | Stable unique record ID. Include date for time-sensitive events. |
| `slug` | Human-readable URL slug. |
| `status` | Workflow state: `preview`, `verified`, `published`, or `archived`. |
| `label` | Editorial mode such as `DO THIS`, `GO WEIRD`, `KNOW THIS`, `DISCOVER THIS`. |
| `title` | Strong reader-facing headline. |
| `dek` | Short useful intro / proposition. |
| `category` | Reusable category for filtering and display. |
| `area` | Reader-facing area label. |
| `venue` | Venue / place name and useful location detail. |
| `date` | ISO date `YYYY-MM-DD` for time-sensitive features. |
| `date_display` | Human-readable date. |
| `time_display` | Human-readable timing or schedule caveat. |
| `cost` | Reader-facing price / free status. |
| `best_for` | Quick decision support: who / what the feature is best for. |
| `why_it_matters` | Short editorial explanation of why it deserves attention. |
| `when_to_go` | Practical timing advice, including uncertainty where relevant. |
| `summary[]` | Paragraphs for the fuller article body. |
| `useful_bits[]` | Scannable facts for the sidebar / at-a-glance block. |
| `source_url` | Primary source used for verification. |
| `source_label` | CTA label for the source link. |
| `source_checked_at` | ISO date of the latest source check. |
| `feature_url` | Internal NUE feature route. |
| `image` | Preferred approved image asset. |
| `image_fallback` | Optional fallback only. Never use a lower-quality substitute as the preferred asset. |
| `image_alt` | Useful descriptive alt text. |
| `image_credit` | Rights / editorial-status credit. |
| `issue_number` | Newsletter issue that originated or expanded the feature. |
| `issue_url` | Direct route to that full newsletter issue. |

## Visual rules

- Approved SK8-created editorial illustrations are labelled as illustrations, not documentary photography.
- DICM and approved raster art use `contain` unless crop safety has been explicitly checked.
- Never upscale a small image past its intended display width merely to fill space.
- Do not substitute generic SVG / icon art for approved richer imagery.
- Alt text describes what the image communicates; the credit separately explains its editorial / rights status.

## Verification rules

- Time-sensitive facts need a primary or official source check before a record can move from `preview` to `verified` / `published`.
- Keep `source_checked_at` visible in the data even if it is not always shown prominently in the UI.
- If times, prices or availability can move, say so in `when_to_go` rather than implying false certainty.

## Lifecycle / expiry

- Event listings use the ISO `date` field and automatically disappear from the current What’s On list after the event date.
- The standalone feature page can remain available for archive/history purposes, but its status should move to `archived` and time-sensitive CTAs should be reviewed.
- Evergreen features can omit event-style expiry only when their underlying facts are genuinely current enough to remain useful.

## CTA hierarchy

1. Internal SK8 feature CTA: fuller useful context.
2. Official / primary source CTA: current details, booking or verification.
3. Newsletter route: the originating full issue and archive.
4. Commercial route: clearly labelled advertising information, separate from editorial judgement.
