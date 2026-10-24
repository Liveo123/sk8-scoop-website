# October 2026 SK8 holiday club: core-area gap verification and cautious staged addition
Status: DRAFT ONLY. Created 23 October 2026. **No production merge, provider contact, marketing, MailerLite email or spending authorised.**
Current verified live website has 28 venue/programme entries, of which 10 are core SK8. Draft adds only one **caveated** venue in Heald Green for a conditional 29.

## Stage A: one source-backed local candidate, with material uncertainties visible
**SportsCool Cheshire / Etchells Primary School, East Avenue, Heald Green, SK8 3DL**
- Search-indexed FIRST-PARTY organiser page on 23 October 2026: paid holiday club Tuesday 27 to Friday 30 October 2026, 08.55–15.25, £20 per paid day. Direct source https://www.sportscoolcheshire.org/etchellshc
- First-party relocated-club notice independently confirms Etchells is the current location, not old Outwood Primary: https://www.sportscoolcheshire.org/opsclub
- **Serious source conflict**: full-page retrieval can serve a cached 2025 October 28–31 version instead of the newer 2026 indexed version. User-facing copy cautions that current dates must be confirmed directly before booking; review the normal provider browser before any production merge.
- **Child ages not confirmed for this venue**: stage `ages:null` and show "Confirm with organiser". Selecting any age deliberately excludes this entry; it is not silently assumed to accept all ages.
- **Funding is NOT verified**. The first-party 2026 index says 27–30 Oct under "Funded" but the same page says "Government Funded (Summer/Christmas Only)". Do NOT claim free October HAF, or describe this as an Ofsted/safeguarding endorsement.
- Direct external link goes to the organiser's own site, not a guaranteed checkout. Spaces unknown, not booked.
- No other SportsCool venue is counted as this one: St John Fisher & Thomas More M22 9NW is a distinct Manchester location and was not added.

## Stage B: high-priority leads, deliberately NOT published
**LSC, Lum Head Primary School, Gatley SK8 4RR**
- School directly confirms recurring October holiday club, but current linked e-flyer is for Whit 2026 and exact October dates remain unavailable: https://www.lumhead.stockport.sch.uk/extended-school/
- LSC venue index and live booking list verify a holiday-club option, Reception–Year 6, 08.00–18.00, advertised from £34, and label TUE–FRI; however the booking-list snapshot does NOT provide date/year for these weekdays. A general venue multi-sports course might be another schedule. Do not infer 27–30 Oct from weekdays alone. https://wearelsc.co.uk/book/ ; https://wearelsc.co.uk/holiday-clubs/venues/
- More concerning: LSC's explicit October-themed page lists Thorn Grove and St Winifred but NOT Lum Head among October booking links. This omission does not prove cancellation, but it strengthens the release hold. https://wearelsc.co.uk/holiday-clubs/october-half-term/
- Verification contact if the owner approves outreach: info@wearelsc.co.uk. Never send without explicit contact approval.
**Barney's Breakout, Lady Barn House School, Schools Hill, Cheadle SK8 1JE**
- Official Ofsted registration https://reports.ofsted.gov.uk/provider/16/2682114 confirms existing childcare (not 2026 dates). Ofsted's 2024 inspection describes age 3–11 and holiday Monday–Friday hours 08.00–18.00.
- School's dated 2026 job listing says this established holiday club welcomes local non-pupils, operates in school holidays other than Christmas. This gives strong **recurring-provider** evidence, NOT a verified Oct 26–30 live booking or price. https://www.tes.com/jobs/vacancy/holiday-club-manager-cheadle-sk8-1je-2292594
- Official school/Ofsted contact numbers exist; ask for dated 2026 schedule, 2026 bookable ages, price, booking URL and whether outsider places remain before seasonal publication.
**ZoZo's Nursery, Gatley**
- Google's current indexed home result advertises Oct bookings, but full page fetch shows outdated Feb dates, and age/eligibility unclear. https://zozosdaynursery.co.uk/
**Fun Fest Cheadle-Bolshaw, Heald Green**: organiser's available calendar shows Summer 2026 but October 2026 is not explicitly confirmed. https://fun-fest.co.uk/cheadle-bolshaw/
**Activate Camps and Kings Camps, Cheadle Hulme School**: recurring organisers registered at venue, but currently published local camp data is July/Easter/summer rather than confirmed October 2026. Do not include until venue- and week-specific booking exists.

## Source/coverage integrity
- Accurate totals on the existing live website remain 28, including Cheadle 0, Gatley 2, Heald Green 1, Cheadle Hulme 7; the draft is 29 (Heald Green 2) if approved.
- Do not add nearby clubs solely to increase a headline number. Do not count one-day short workshops as full-day childcare.
- Do not imply a '100 verified clubs' inventory. Keep this October page non-indexable, with the existing 1 November auto-expiry.
- If a potential source cannot prove this holiday, record as a candidate but never insert a fabricated programme row.
- Specific date, age, paid price, free HAF, booking-link and current vacancies are independent verification dimensions; one confirmed dimension does not validate the others.

## Ten-pass critique and fix
1. Reader need: focus on SK8 choices, not numerical size; one authentic local lead is worth more than dozens of poor-fit nearby listings. PASS.
2. Geographic balance: Heald Green becomes two; Cheadle remains zero. Gap unresolved, explicitly retained. PASS WITH OPEN RESEARCH.
3. Duplicates: Etchells not present in 28, distinct from old Outwood venue and non-SK8 Manchester SportsCool sites. PASS.
4. Dates and freshness: conflicting cache versions explicitly flagged; conditional release block pending normal-browser validation. NOT FULLY VERIFIED.
5. Age/price/availability utility: paid day price qualified; ages and funded eligibility unknown, no fictitious values. PASS WITH CAVEATS.
6. Navigability: null-age result appears in unfiltered/area/day, but is hidden from age-specific results to avoid false positives. Browser QA added. PASS SUBJECT TO TEST.
7. Editorial voice: direct, descriptive, no provider endorsement; user checks provider. PASS.
8. Visual/accessibility: retain existing responsive semantic cards; no image-rights changes. PHONE QA REQUIRED.
9. Maintenance/trust: retain source check date, noindex, expiry, privacy and independent editorial order. PASS.
10. Sceptical parent: avoid guaranteeing Oct funding or club availability; direct organiser page may be stale, so human source confirmation needed before production. HOLD.

## Final release gate
This PR is intentionally a **draft**. Even with green CI, do not mark publish-ready until organiser's real browser page and age eligibility/October dates can be reconciled. Publication would also require fresh explicit Paul approval. When not verifiable in time for 26 October, keep 28 live listings and carry the Etchells venue into a season-independent research register for February/Easter.

## 23 October 2026 — approved editorial fact-check enquiries sent

Paul approved three limited factual verification emails, following a mailbox search for correspondence and opt-outs. All three were sent through the connected SK8 Scoop Gmail account. This is **not** authorisation for advertiser follow-ups, new sales approaches or immediate listing publication.

| Provider | Recipient | Subject | Gmail sent message ID | Status |
| --- | --- | --- | --- | --- |
| SportsCool Cheshire, Etchells | bookings@sportscoolcheshire.org | SK8 Scoop fact-check: Etchells holiday club, 27–30 October | 1a168116ed60e573 | SENT, reply pending |
| LSC, Lum Head | info@wearelsc.co.uk | SK8 Scoop fact-check: Lum Head, Gatley, October half-term | 1a168117f053d38a | SENT, reply pending |
| Barney's Breakout, Lady Barn House | holidayclub@ladybarnhouse.org | SK8 Scoop fact-check: Barney's Breakout, October half-term | 1a1681192d23c6f0 | SENT, reply pending |

**Duplicate-contact safeguards:** earlier unanswered SportsCool advertising emails were sent on 14 and 21 October; LSC advertiser approaches on 23 September and 2 October; Lady Barn House has a separate 16 October nursery advertising email and a still-unsent marketing follow-up draft at info@ladybarnhouse.org. The new messages explicitly identify themselves as independent editorial accuracy checks and make no advertising offer. No matching opt-out surfaced in the Gmail searches. Do not send reminder emails on these editorial enquiries without a new appropriate gate; do not send the existing Lady Barn marketing draft as part of this task.

**Reply action:** check written provider confirmation against October 2026 dates, eligible ages, attendance by external pupils, session times, fees, public/funded availability rules and booking URLs. Change only evidence-supported fields. If replies are incomplete or contradictory, retain HOLD and the 28-entry production listing count. The date-sensitive October page expires on 1 November 2026 regardless of response timing.
