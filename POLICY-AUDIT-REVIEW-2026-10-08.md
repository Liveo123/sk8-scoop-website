# SK8 Scoop policy correction review: 8 October 2026
Status: DRAFT / NOT PUBLISHED

## Changes staged
- editorial-policy.html: revised independence, commercial labels, directory rankings, corrections, conflict disclosure, listing quality and affiliate explanations.
- terms.html: submissions licence, external booking limitations, fair paid-placements remedies, copyright and non-excludable rights.
- privacy.html: expanded subject rights and ICO complaint route (no invented controller name or retention commitment).

## Outstanding approval and verification gates
1. STATUS CONFIRMED BY OWNER ON 8 OCTOBER 2026: SK8 Scoop operates as a **sole trader**, not a limited company. Public policy drafts now describe that structure. BEFORE PUBLICATION: confirm the proprietor's **full legal name**, geographic business establishment/address suitable for required public disclosure, service/correspondence address for invoices and the correct country of establishment. Internal documentation contains an owner name, but do not assume it is the exact current legal proprietor without verification. No company registration number, Ltd or Inc claim should appear.
2. Map personal data processing, lawful bases, processors, international transfer mechanism and retention; test actual deletion.
3. Verify all tracking and consent journeys via browser network on main site and separately hosted properties.
4. Current main site and Campaign Finder still contain historical GBP 40 newsletter and GBP 35/75/110/150 Halloween prices. User's latest GBP 28/60/96/125 decision requires complete product-scope/terms mapping before updating every related offer surface and the Drive pricing source of truth; honour existing agreements.
5. worker.js /api subscriber preference storage permits updating preferences using an unverified address; implement email-control verification before those selections drive consequential email changes. Do not change live handling untested.
6. Prepare specific Advertising Booking Terms after confirmation of scope, VAT status, payment, amendments, cancellation and refund position.
7. Check guide direct-access policy against published route behaviour; reconcile privacy description without reintroducing subscriber gates.
8. Distinguish anonymous Secret Trail feedback from identified Halloween feedback/reward flows.
9. Review rights, submissions and competitions terms for named promotions; ensure forms disclose licence and material terms.
10. Independent UK legal review advised for definitive compliance conclusions.

## Tests and boundaries
- Static checks performed: balanced section markup on all three revised pages; compared with original source.
- Browser/network/production smoke tests NOT RUN.
- No changes to production main, prices, mail, databases, adverts, tracking or subscriber preferences in this draft.
- Draft is NOT ready to merge for public compliance claims until blockers resolved.

## Sole-trader legal checklist (added 8 October 2026)
- GOV.UK confirms that sole traders using a business name must state the individual's name and business name on official paperwork. Invoices must include their legal name, trading name, and a usable address for service: https://www.gov.uk/become-sole-trader/choose-your-business-name and https://www.gov.uk/invoicing-and-taking-payment-from-customers/invoices-what-they-must-include
- The Electronic Commerce (EC Directive) Regulations 2002, regulation 6, generally require easily accessible provider identity, geographic establishment address and contact details for online services, plus clarity on tax in prices: https://www.legislation.gov.uk/uksi/2002/2013/regulation/6
- The ICO's right-to-be-informed guidance calls for the actual data controller's name and contact details: https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/individual-rights/the-right-to-be-informed/what-privacy-information-should-we-provide/
- Do not assume whether the proprietor is established in the UK from a UK audience alone. If outside the UK without a UK establishment, check Article 27/UK representative duties and whether any exception applies: https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/international-transfers/receiving-personal-information-from-the-eea/
- Assess whether an ICO data protection fee is payable; not all sole traders are exempt, and processing personal information may bring an obligation: https://ico.org.uk/for-organisations/data-protection-fee/faqs-data-protection-fee-payment-and-online-registration/
- Confirm VAT registration/status and quoted-price tax wording; do not invent VAT registration or number.
- Consider suitable sole-trader professional/public liability and advertising/media liability cover, proportionate to actual activities (commercial recommendation, not automatic legal duty).
- Privacy and Terms pages contain prominent DRAFT placeholders so they must not be merged/published as-is. Once legitimate operator/address details are supplied for public display, replace placeholders and run fresh QA; do not put a private home address on a public website without deliberate informed choice.

## Additional independent Summer Guide check
- A public search snapshot of https://summer-guide.sk8scoop.com/ (indexed approximately two months before 8 October 2026) displayed the footer `© 2026 SK8 Scoop, Inc. All rights reserved.` That corporate suffix is inconsistent with the owner-confirmed sole-trader status. The snapshot is dated, not proof of current live content. Verify the current separately hosted landing page and correct the suffix before presenting it as an accurate legal designation. This page is not part of the main GitHub website deployment; any correction requires a separate authorised publishing workflow.

## Commercial alignment completed 8 October 2026
- Identified distinct already-existing advertiser preview PR #183, with the exact five standard options: newsletter GBP 35; Guide GBP 28; Guide + newsletter GBP 60; section sponsorship GBP 96; main sponsorship GBP 125. No duplicate pricing implementation has been created in this policy branch.
- Inserted clearly controlling 8 October decision headings into the existing Google Drive Current Advertiser Offer & Pricing Record and Pre-NUE Advertiser Agent Brief. Historic figures retained as dated evidence. Auto-send remains PAUSED.
- Added ADVERTISING-BOOKING-TERMS-REVIEW-2026-10-08.md as an UNPUBLISHED and NOT YET ACCEPTED contractual draft. It requires confirmed sole-trader particulars, tax treatment, acceptance and payment-flow verification before use.
- PR #183 is separate and remains a draft at this check. It must receive full review and approval including test payments and appropriate regression checks before merge.
- Policy review PR #185 is not publish-ready: current privacy and terms draft HTML still contain deliberately visible editorial placeholders for sole-trader name and geographic address. NEVER MERGE THOSE PLACEHOLDERS.
