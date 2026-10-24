# Birthday Time Machine: private family playtest portal

**Status:** Private deployment package complete. **NOT deployed and NOT approved for family distribution or production sales.** Owner approval required for external access.

## Reader experience

The family gets **one secure web link**, not a ZIP. After an emailed one-time sign-in PIN (first visit only), one responsive page includes:

- Open the 10-case illustrated interactive game on-screen.
- Open/print the optional 18-page detective casebook.
- See a spoiler warning before opening the 7-page adult host guide.
- Open/print a separate single-page certificate.
- Access optional 5-page illustrated scene cards.
- Complete a 90-second adult feedback form with no children's names requested. The form drafts an email to `contact@sk8scoop.com` or copies the answers; it does not automatically submit.
- Leave the game for the setup hub and resume the same case without resetting the iframe.

The design uses the source Clockmaker's Archive artwork and SK8 Scoop colour palette. Ages 8-11, target 4-12 children, 90-130 minutes including a break, all provisional until real playtest feedback.

## Prepared local artefacts (kept out of the public repository)

- `Birthday_Time_Machine_Family_Portal.html` — ~18 MB self-contained HTML, containing game and all documents; no installation or ZIP extraction for a pilot. Can be shared directly with adult testers but needs downloading before opening. Mobile file handling varies by browser.
- `Birthday_Time_Machine_Portal_Setup.zip` — safe placeholder only, no product files.
- `Birthday_Time_Machine_Private_Hosting_Pack.zip` — full hosting content (~11 MB) and security instructions. **Confidential; do not commit it to this public repository.**

## Security: mandatory two-upload Cloudflare process

1. Create a **new independent Cloudflare Pages Direct Upload project** using only the placeholder ZIP.
2. Enable Cloudflare Access on the **production `PROJECT.pages.dev` hostname** and on all preview aliases, with an allowed list of **adult tester** email addresses and one-time PIN sign-in. Cloudflare's Pages `Settings > General > Enable access policy` protects preview hostnames only. The primary production `pages.dev` domain must be protected **separately**. See official docs:
   - https://developers.cloudflare.com/pages/get-started/direct-upload/
   - https://developers.cloudflare.com/pages/configuration/preview-deployments/
   - https://developers.cloudflare.com/pages/platform/known-issues/
3. With a fresh incognito browser, confirm the placeholder hostname is NOT publicly accessible, and verify preview aliases as well.
4. Only after protection works, upload the full private hosting package to that project. Re-test root, direct game URL and PDF URLs as a signed-out visitor. **Any public response is a hard stop.**
5. Log in as an allowed adult tester, verify game, hint, certificate, printables and email/copy feedback. Share the one protected link with 2-3 volunteers.
6. Turn off access/revoke allowed addresses after playtest.

Do not upload any confidential game HTML, PDFs, images or answer sheets to `Liveo123/sk8-scoop-website`; it is a public repository. Do not merge staged pages or change live SK8 Scoop site for this pilot. Do not create a public sales link.

## QA completed locally

- 32/32 responsive interface and file-flow checks passed in Chromium.
- Mobile width 390 px and desktop width 1365 px showed no horizontal overflow.
- Embedded offline game launches and displays cases.
- Solved the first case, returned to hub and resumed in the same state.
- 18-page casebook, 7-page host answers, 1-page certificate and 5-page scene cards verified as readable PDFs.
- Adult spoiler gate, PDF opening, checklist and feedback copy worked.
- Both the private hosting archive and existing release candidate are structurally valid.

**Unverified:** actual Cloudflare-hosted authentication/deployment, mobile app file-download/open behaviour, family enjoyment/difficulty, emailed PIN receipt, mailto client delivery, commercial-use artwork rights, customer payment delivery and public sales terms.

## Critique/fix cycles

1. **Family effort:** replaced multi-file ZIP with one screen and one primary game action; optional printables are clearly separated.
2. **Practical operation:** included adult prep, no forced printing, spoiler guard, game state kept alive when visiting hub, feedback without children's details.
3. **Security and trust:** rejected public repo hosting for product files; established a placeholder-first Cloudflare Access gate and delayed all outward publication.

## Approval gate

- [x] Portal prototype built
- [x] Readable desktop/mobile layouts
- [x] Files and links tested in sandbox
- [x] No game files placed in public repository
- [ ] Owner approves creating a private Pages test deployment
- [ ] Production and preview hostnames confirmed to require Access login
- [ ] First invited adult's end-to-end test
- [ ] Two or three families provide feedback
- [ ] Family-identified issues fixed and re-tested
- [ ] Owner approves commercial release separately
