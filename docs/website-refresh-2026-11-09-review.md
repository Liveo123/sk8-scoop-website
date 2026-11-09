# Website refresh release checklist — 9 November 2026

STATUS: PREVIEW ONLY — production approval not granted.

## Prepared on branch
- Shared configuration moved to Issue 20, sent Friday 6 November; public active subscriber milestone moved to **900+**, from two account-connection reads of MailerLite: 907 active subscribers on 9 November 2026.
- Issue 19 and Issue 20 added as historically labelled editorial **indexes**. They are not yet full article-by-article issue reproductions. For events that have passed, retain historical framing and do not present them as active events.
- Archive cards and XML sitemap entries added.
- Bruntwood Park orienteering article based on Greater Manchester Orienteering Activities course/map notes, July 2026 check, and Manchester & District Orienteering Club map information.
- Cheadle Green archaeology article grounded in the Cheadle Heritage Archive and archaeological project publications.
- Stockport Spectacular Sunday current event entry and What's On highlight sourced from Stockport Council and Totally Stockport.

## Not complete / release blockers
1. A 20-issue heading-level inventory and topic/URL disposition is recorded at `docs/issues-01-20-editorial-disposition-20261109.md`. Full paragraph-by-paragraph article verification and archive-link checks remain incomplete.
2. Issue 19 and Issue 20 archive pages currently carry editorial story indexes, **not full newsletter text**, and are not substitutes for linked MailerLite browser versions.
3. The static What's On highlight was removed because automatic expiry was not confirmed. The merged #295 expiry fix cleaned the live source to 10 events; companion DRAFT PR #301 proposes 3 more, giving 13 verified-source future listings. Full cadence/filter/mobile QA and the larger target remain outstanding.
4. The newly written pages are text-first. No photos were added without licence/approval. Source links should be click-tested and all pages should be reviewed at mobile widths.
5. Issue 20 archive title/metadata reflects sent campaign. Retain campaign content and the resend as distinct, not merged editorial proof.
6. An additional St Mary's medieval crosses article is staged, checked against three Historic England records, without claiming a precise 11th-century date. Main-send performance figures deliberately remain unknown, rather than copying an outdated recipients number from Issue 18. Subscriber count is rounded, not a claimed live API total.
7. PR #295 is merged. Before release, rebase/reconcile against the latest main and preserve its cleaned 10-record event feed; companion PR #301 adds three distinct entries.

## Pre-publication checks
- Confirm latest GitHub main and current Cloudflare production revision.
- Test navigation, archive, links, sitemap, robots, canonical URLs, visual rendering, mobile, keyboard access, tracked owned links, signup, consent and forms.
- Run What's On expiry/duplicate/live-date QA; verify the event is still happening.
- Do not merge or deploy until explicit owner approval.
- Three proposed experiments for a later release: current-week event highlight click-through vs baseline; historical index to evergreen article continuation; archive-to-newsletter-join CTA click-through. No experiment has yielded results yet.

## Sources
- MailerLite Campaign 203412139477567224 (Issue 20) and 202779676888795072 (Issue 19)
- https://www.stockport.gov.uk/events/stockports-spectacular-sunday?date=2026-11-15
- https://totallystockport.co.uk/stockports-spectacular-sunday-15-november-2026-12pm-5pm-stockport-town-centre-free/
- https://gmoa.org.uk/borough_stockport/bruntwood-park-orienteering/
- https://www.mdoc.org.uk/maps/bruntwood-park
- https://cheadlearchive.omeka.net/collections/show/6

## Additional QA completed 9 November 2026
- Reviewed all 20 main sent MailerLite issue campaigns for topic/URL disposition, recording the results in the new 20-issue audit file.
- Checked local href paths in ten changed HTML/config paths against the PR #296 GitHub tree: zero unmatched internal routes, a static check only.
- PR #301 contains valid JSON with 13 distinct verified-source records; dates, source and checked date are present in the new rows. No full browser/mobile CI pass has been observed.
- The primary archaeological project report confirms the Cheadle Hall excavation and historical details. The Cheadle Heritage Archive returned HTTP 429 and MDOC showed a verification challenge, requiring manual browser link checks.
- Both PR #296 and PR #301 remain draft and NOT approved for production.
