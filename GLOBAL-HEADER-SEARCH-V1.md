# Global Header Search v1

Status: PREVIEW ONLY — production remains approval-gated

Branch: `preview/newsletter-archive-articles-v1`

Date: 17 September 2026

## Goal

Make SK8 Scoop search available from any normal public page without building a second search system or turning the navigation into another content menu.

## Reader behaviour

### Large desktop

- Show a compact visible search field in the sticky header.
- Keep the existing `Join free` action visually stronger than search.
- Hide the duplicate plain `Join` navigation link at this width because `Join free` remains present.
- Submit directly to the existing `/search/` results page.

### Laptop / tablet / mobile

- Show a compact search icon in the header.
- Tapping it opens a full-width search field immediately below the header.
- Opening search closes the mobile navigation menu so the two layers do not compete.
- Escape closes the search panel and restores focus.

### Keyboard shortcut

On pages where the user is not already typing into a form, `/` focuses or opens the global search control.

## Search architecture

The global control is only an entry point. It reuses the existing Search & Discovery system:

`header search → /search/?q=...&source=header → existing ranking / filters / result cards`

There is no second index, ranking algorithm, hosted search service or duplicated content source.

## Measurement

Consent-gated analytics events:

- `header_search_open`
- `header_search_submit`

Only interaction metadata such as query length, interface surface and originating path is sent through the optional GA4/Meta measurement layer. Raw query text is not included in those events.

First-party Search Insights continues to store privacy-minimised submitted search phrases for editorial learning. Header-origin searches are stored with source `header` (or `preview_header` on the Cloudflare preview), allowing the private Search Insights dashboard to distinguish them from homepage, search-page and direct searches.

## Privacy

The normal GET search route still places the search phrase in the browser URL as `q=...`. This is the same behaviour as the existing search form and should not be described as anonymous browsing.

The first-party search log keeps the existing safeguards: obvious email addresses, phone-number patterns and URLs are redacted; no email, device identifier or user-agent is attached to the search log; raw rows are retained for up to 365 days.

## Responsive design

- `>= 1280px`: visible compact input in the navigation row.
- `< 1280px`: icon trigger plus expandable panel.
- `<= 820px`: icon sits beside the mobile Menu control.
- very narrow screens retain 44px controls and allow the logo to contract only when required to prevent overflow.

## Accessibility

- native `form`, `input type=search` and submit button;
- explicit accessible labels;
- keyboard focus styles;
- Escape closes the compact panel;
- `/` shortcut is suppressed while typing or using interactive controls;
- no colour-only state;
- 44px compact header control targets.

## Deliberately not included

- autocomplete suggestions;
- live-as-you-type results in the header;
- AI answers;
- search history tied to a person;
- a second navigation redesign;
- paid result boosts.

Those should only be considered after real reader search behaviour justifies them.

## Release gate

1. Automated preflight passes.
2. Cloudflare branch preview smoke test passes, including global-search JS/CSS assets.
3. Human visual check on large desktop, laptop/tablet and mobile.
4. Confirm a preview header search arrives on `/search/` and appears as `preview_header` in Search Insights.
5. Explicit Paul approval before merge to `main`.