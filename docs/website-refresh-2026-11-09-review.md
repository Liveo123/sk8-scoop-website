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
1. Issues 1–18 not comprehensively cross-checked article-by-article. Existing website has Issue 17/18 pages and older historical and outdoor features; remaining omissions need a tracked full audit.
2. Issue 19 and Issue 20 archive pages currently carry editorial story indexes, **not full newsletter text**, and are not substitutes for linked MailerLite browser versions.
3. Existing What's On listing supply, future date accuracy, owner/cadence, filter implementation, expiry, and mobile QA must pass before claiming a complete launch. The new Spectacular Sunday highlight must disappear or be removed after 15 November 2026.
4. The newly written pages are text-first. No photos were added without licence/approval. Source links should be click-tested and all pages should be reviewed at mobile widths.
5. Issue 20 archive title/metadata reflects sent campaign. Retain campaign content and the resend as distinct, not merged editorial proof.
6. Main-send performance figures deliberately remain unknown, rather than copying an outdated recipients number from Issue 18. Subscriber count is rounded, not a claimed live API total.
7. Source branches or other parallel site PRs may supersede pages before merge. Rebase/reconcile before any publication.

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
