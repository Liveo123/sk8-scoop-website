# SK8 Scoop v7.6 QA

## Completed
- JavaScript syntax checked with Node.
- All public HTML pages checked for missing local images and stylesheets.
- Internal links checked; no broken local targets found.
- Desktop pages rendered at 1440 px without horizontal overflow.
- Homepage rendered at 390 px without horizontal overflow.
- Mobile menu opened and displayed correctly.
- New homepage, advertising, submission, About and latest-issue pages rendered successfully.
- MailerLite forms no longer use `target="_blank"`.
- Signup JavaScript now submits in the background and routes to the local success page.

## Needs one live check after deployment
- Submit one brand-new test address through the live Worker site.
- Confirm it reaches `/signup-success/` rather than a JSON response.
- Confirm MailerLite adds it to `sk8 Subscribers`.
- Confirm the active welcome workflow sends the first email.
