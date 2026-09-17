# SK8 Scoop newsletter archive article batch v1

Status: PREVIEW ONLY — not approved for production

Branch: `preview/newsletter-archive-articles-v1`

Date: 17 September 2026

## Outcome

Turn the strongest useful material from earlier SK8 Scoop newsletters into permanent, searchable website pages without turning the whole newsletter archive into a stale search index.

The newsletter archive is a **source pool**, not a corpus that should automatically be indexed.

## Selection rule

A newsletter item earns a permanent website page only when it clears the editorial bar for at least one of these jobs:

- durable local history or local knowledge;
- useful practical information with a meaningful current lifespan;
- a major local development that readers may keep searching for;
- a high-value parent/family explainer;
- a distinctive SK8 story worth finding after the original Friday email has disappeared down the inbox.

It should also be strong enough to stand alone after the newsletter-specific framing is removed.

## Deliberately excluded

Do not make permanent search pages from:

- expired weekend events;
- expired offers or temporary promotions;
- old opening/closing snippets where the current position is unclear;
- routine wider-Stockport items without a strong SK8 reason;
- weak one-paragraph fillers;
- time-sensitive claims that cannot be reverified;
- newsletter archive pages themselves as search results.

This protects Search & Discovery from being swamped by yesterday’s useful information.

## Batch 1 selected articles

### 1. The Gatley Shouter

Source issue: Issue 10, 28 August 2026.

Permanent route: `/local-history/gatley-shouter/`

Why it qualifies: distinctive Gatley folklore with a documentary trail, including an 1886 glossary entry and Fletcher Moss’s Victorian versions.

Evidence rule: the ghost narrative stays labelled as folklore. The 1886 expression is documentary evidence. Jim Barrow’s identity and the supposed Shouter’s Stone remain unresolved.

### 2. Before the Cheshire Line Tavern, it was Cheadle station

Source issue: Issue 9, 21 August 2026.

Permanent route: `/local-history/cheadle-station-cheshire-line-tavern/`

Why it qualifies: strong evergreen local history attached to a building many Cheadle readers still use.

Current source check: opening, renaming and closure dates were rechecked against the Architects of Greater Manchester record.

### 3. Why Heald Green has a giant frog called Mercury

Source issue: Issue 8.

Permanent route: `/local-history/heald-green-mercury-frog/`

Why it qualifies: memorable Heald Green history connecting the 1959 MERcury telephone exchange, local naming and the later Mercury Frog.

Evidence rule: the page keeps the telephone-exchange history separate from later frog-project reporting and avoids oversimplifying the change from named exchanges to later telephone numbers.

### 4. Heald Green East: the 675-home outline application

Source issue: Issue 4, 17 July 2026.

Permanent route: `/planning/heald-green-east/`

Why it qualifies: a major local planning proposal likely to remain searchable well beyond one newsletter issue.

Current source check: application DC/095134 was still shown as pending when checked on 17 September 2026. The page tells readers to use Stockport Council’s planning database for the live position.

Political/editorial rule: SK8 Scoop explains the application but does not tell readers whether to support or oppose it. Developer masterplan items are labelled as developer proposals and are not presented as secured delivery.

### 5. Secondary-school applications for September 2027

Source issue: Issue 9, 21 August 2026.

Permanent route: `/kids-family/secondary-school-applications-2027/`

Why it qualifies: high-value practical information for the core SK8 parent audience during the current application window.

Current source check: dates were checked against Stockport Council on 17 September 2026.

Search expiry: `2026-10-31`. The page may remain accessible for context after that date, but it should not keep appearing as a current search result after the initial application deadline.

### 6. Cheadle Eco Park

Source issue: Issue 5, 24 July 2026.

Permanent route: `/planning/cheadle-eco-park/`

Why it qualifies: a conspicuous local construction project that creates a natural “what is that?” search need.

Current source check: Stockport Council’s July 2026 project update gives six light-industrial units, an engineered timber frame and a March 2027 completion target.

Claim rule: jobs, BREEAM status and sustainability figures are described at the evidence level used by the council/project. Targets and expectations are not rewritten as completed guarantees.

## Search integration

All six pages are added to `data/discovery.json` with useful natural-language tags rather than relying only on their headlines.

Representative queries include:

- `Gatley ghost`
- `Gatley Shouter`
- `Cheadle station`
- `Cheshire Line Tavern`
- `Mercury frog`
- `Heald Green housing`
- `675 homes`
- `secondary school applications`
- `Year 7`
- `Bird Hall Lane`
- `Cheadle Eco Park`

The search index continues to exclude old newsletter issues as individual results.

## Category integration

The permanent pages are surfaced through the relevant reader routes:

- Local History: Gatley Shouter, Cheadle station, Mercury Frog.
- Planning & Development: Heald Green East, Cheadle Eco Park.
- Kids & Family: current secondary-school application guide.

This keeps search useful even for readers who prefer browsing by topic.

## Image rule for this batch

The six new pages are text-first in the initial preview. This avoids reusing newsletter images whose web-republication rights may differ from email usage and keeps the first release focused on useful searchable content.

Images can be added later only where rights are clear and they materially improve the page.

## Maintenance rule

- Evergreen history pages receive a source-led correction if better evidence appears.
- Current planning/development pages need a status recheck when a decision or major project milestone occurs.
- Dated practical pages use search expiry where appropriate.
- Search demand can suggest future archive extraction, but search volume does not automatically override editorial relevance or verification.
- Advertising potential never changes article selection or search rank.

## Future candidates held for a later batch

Potential follow-up material includes Moseley Old Hall, the Ladybrook route/history, Abney Hall and Agatha Christie, the new St Ann’s Hospice building, and historical material that could enrich the existing Gatley Carrs page.

These are deliberately not bundled into this first release. Batch 1 is meant to prove the extraction model with a small set of high-value pages.

## Approval state

Everything in this branch is preview work. No merge to `main` is authorised by this document. Browser/mobile preview review and Paul’s explicit production approval remain required.
