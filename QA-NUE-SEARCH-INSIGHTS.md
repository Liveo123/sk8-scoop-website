# NUE Search Insights QA

Branch: `preview/nue-search-discovery-v2`
Date: 17 September 2026
Status: PREVIEW ONLY

## Purpose

Add first-party reader-search demand insight without turning search into a reader-profiling system.

## Cycle 1 — Editorial usefulness

Criticism:
- storing searches without a way to review them would create data but not a useful operating loop;
- raw totals alone would not identify missing coverage;
- repeated searches should inform editorial judgement, not dictate it.

Fixes:
- added private `/admin/search-insights/` view;
- added top repeated searches;
- added explicit zero-result / unmet-search table;
- added latest 50 searches for early signals;
- added 7, 30, 90 and 365-day windows;
- added editorial warning that search demand does not override relevance, verification or independence.

## Cycle 2 — Privacy and minimisation

Criticism:
- free-text searches can accidentally contain personal data;
- storing IP, email, user agent or persistent identifiers would be unnecessary for the editorial purpose;
- indefinite retention would be excessive.

Fixes:
- search log stores no email address, IP address, device identifier, account identifier or user-agent string;
- obvious emails are replaced with `[email]`;
- obvious URLs are replaced with `[link]`;
- obvious telephone-number patterns are replaced with `[phone]`;
- query text is capped at 160 characters;
- rows older than 365 days are removed on new search writes;
- rapid identical repeat submissions in the same browser session are de-duplicated;
- search page and Privacy Notice disclose the storage purpose;
- raw search text is not sent to GA4 or Meta Pixel.

## Cycle 3 — Technical resilience

Criticism:
- requiring Paul to run a migration before the preview could record anything would make the feature fragile;
- a missing D1 table should not break the public search experience;
- the private dashboard must not expose results without authentication.

Fixes:
- canonical `schema.sql` and a dated migration both contain the `search_events` table;
- search write and stats endpoints defensively create the table/indexes if missing;
- public search logging is fire-and-forget: a storage failure does not block search results;
- `/api/search-stats` requires the existing `ADMIN_TOKEN` bearer token;
- admin output is rendered with `textContent`, not injected HTML;
- all D1 values are parameter-bound.

## Data stored

- sanitised query text
- normalised query text
- result count
- search type filter
- search area filter
- source (`homepage`, `search_page` or `direct`)
- timestamp

## Data deliberately not stored

- email
- IP address
- device ID
- subscriber/account ID
- user agent
- referrer URL

## Required preview checks

1. Submit a search from the homepage and confirm it appears with source `homepage`.
2. Submit a different search from `/search/` and confirm source `search_page`.
3. Search for an invented term and confirm it appears in the unmet-search table with zero results.
4. Search with an email address, phone number and URL and confirm stored display uses `[email]`, `[phone]` and `[link]` respectively.
5. Repeat the same search immediately and confirm accidental duplicate counting is suppressed.
6. Confirm the Search Insights endpoint rejects an absent/incorrect admin token.
7. Confirm 7/30/90/365-day selector loads without breaking tables.
8. Confirm public search still works if the logging request fails.
9. Confirm mobile search-page privacy note remains readable and does not dominate the interface.

## Release gate

Do not merge solely because automated static QA passes. Before production:

- Paul should approve the updated search-page disclosure;
- one real preview search should be recorded and visible in Search Insights;
- admin authentication should be verified;
- production remains approval-gated.
