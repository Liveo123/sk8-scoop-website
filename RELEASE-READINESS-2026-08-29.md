# SK8 Scoop website release readiness — 29 August 2026

Branch: `preview/homepage-reader-pages-v1`
PR: #1
Status: READY FOR EXPLICIT PRODUCTION APPROVAL

## Verified working

- Latest Cloudflare branch-preview deployment succeeded for commit `20a0ddb6` before this documentation-only release note commit. No runtime code changed after that successful build.
- Contact page uses Formspark endpoint `https://submit-form.com/X3MWnWHXI`.
- Contact form was tested end-to-end successfully: provider submission succeeded and notification reached `contact@sk8scoop.com`.
- Production D1 database is `sk8-scoop-db`, bound to the Worker as `DB`.
- Submit-only `reader_submissions` migration was applied successfully to production D1.
- Submit form was tested end-to-end successfully. Verified row: `id=1`, `submission_type=puzzle_answer`, message `D1 Submit test 29 August 2026`, reference `Website release test`, status `pending`.
- Submit honeypot field is `website`; Worker returns before any D1 insert when it is populated.
- Issue 10 is current and uses the owner-supplied published MailerLite URL.
- Archive includes Issues 9 and 10.
- Public subscriber proof is 453, explicitly dated 28 August 2026 rather than presented as a live counter.
- Homepage and reader-page navigation include the approved Home, Guides, Where to start, Join, Submit, Contact and Advertise routes plus Join free.

## Final criticism/fix loop

### Cycle 1 — structure and value
PASS. The redesign remains newsletter-first. Homepage maintenance is concentrated in a small current-content area, while Join, Where to Start, Submit, Contact, Guides and Advertise have distinct reader jobs. No new parallel subscriber or contact database was introduced unnecessarily.

### Cycle 2 — accuracy and experience
PASS. Signup continues through the existing MailerLite form. Contact uses the tested Formspark route. Submit writes to the verified D1 table. Privacy confirmation remains required on Submit and Contact. Static navigation exists on the core reader pages. Issue 10 and the 453-reader proof are sourced from owner-supplied/current system evidence.

### Cycle 3 — final risk and polish
PASS WITH HUMAN RELEASE GATE. Contact and Submit backends work, the D1 change is minimal, and the PR remains draft/unmerged. No production traffic has been changed. The Company Operating Manual requires explicit human approval before a material production deployment.

## Release procedure after approval

1. Merge PR #1 to `main` using the repository's normal merge method.
2. Allow the Cloudflare production build to complete.
3. Verify production `/`, `/join/`, `/submit/`, `/contact/`, `/guides/`, `/advertise.html`, `/latest` and `/archive.html`.
4. Check one MailerLite signup route without creating unnecessary duplicate subscriber state.
5. Check Contact renders with the Formspark adapter and Submit renders against D1.
6. If any material regression appears, roll back to the previous Cloudflare/GitHub production version rather than patching blindly.

No production merge is authorised by this document itself.