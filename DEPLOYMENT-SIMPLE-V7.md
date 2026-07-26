# SK8 Scoop v7 - simple deployment guide

This version is ready for GitHub and Cloudflare Pages. The website source, forms, tracking hooks, QR attribution, D1 schema and screenshots have already been prepared and tested locally.

## Before starting

You need:

- a GitHub account;
- a Cloudflare account;
- access to the DNS for `sk8scoop.com`;
- access to MailerLite;
- the downloaded `sk8-scoop-website-v7-conversion-commerce.zip` file.

Do not change the live `www.sk8scoop.com` domain until the temporary `pages.dev` version passes every test.

## Part 1 - put the site on GitHub

1. Download and extract the ZIP.
2. Open GitHub.
3. Create a new private repository called `sk8-scoop-website`.
4. Do not add a README, licence or `.gitignore` when creating it.
5. On the empty repository page, choose **uploading an existing file**.
6. Open the extracted website folder.
7. Select everything inside it, including `index.html`, `assets`, `functions`, `business-submissions` and the other folders.
8. Drag those items into GitHub.
9. Commit with the message: `Add SK8 Scoop v7 website`.
10. Confirm that `index.html` is visible at the repository root. It must not be inside an extra outer folder.

## Part 2 - create a temporary Cloudflare Pages site

1. Sign in to Cloudflare.
2. Open **Workers & Pages**.
3. Choose **Create application**.
4. Choose **Pages** and then **Connect to Git**.
5. Authorise GitHub and select `sk8-scoop-website`.
6. Use these settings:

| Setting | Value |
|---|---|
| Project name | `sk8-scoop` |
| Production branch | `main` |
| Framework preset | `None` |
| Build command | leave blank |
| Build output directory | `.` |
| Root directory | leave blank |

7. Select **Save and Deploy**.
8. Open the temporary address ending in `.pages.dev`.
9. Test the homepage, latest issue, Summer Guide, advertising and submission pages.

At this stage, the static pages should work. Database-backed forms will not work until Part 3 is complete.

## Part 3 - create and connect the D1 database

1. In Cloudflare, open **D1 SQL Database**.
2. Choose **Create database**.
3. Name it `sk8-scoop-data`.
4. Open the new database and select **Console**.
5. Open `schema.sql` from the extracted website folder.
6. Copy all of the SQL and paste it into the D1 Console.
7. Select **Execute**.
8. Return to **Workers & Pages** and open the `sk8-scoop` Pages project.
9. Open **Settings > Bindings**.
10. Add a **D1 database binding**.
11. Use the variable name `DB` exactly.
12. Choose the `sk8-scoop-data` database.
13. Save and redeploy the project.

## Part 4 - protect the private QR dashboard

1. Generate a long random password in your password manager.
2. In the Pages project, open **Settings > Variables and Secrets**.
3. Add a secret named `ADMIN_TOKEN`.
4. Paste the random password.
5. Save and redeploy.
6. Open `/admin/qr-dashboard/` on the temporary site and test the token.

Do not put the token in GitHub or `config.js`.

## Part 5 - test the database forms

Submit clearly labelled test records:

- Advertising: `TEST BUSINESS - DO NOT PROCESS`
- Business submission: `TEST SUBMISSION - DO NOT PUBLISH`
- Event submission: `TEST EVENT - DO NOT PUBLISH`

Then open the D1 database and run:

```sql
SELECT * FROM advertiser_enquiries ORDER BY created_at DESC;
SELECT * FROM business_submissions ORDER BY created_at DESC;
SELECT * FROM event_submissions ORDER BY created_at DESC;
```

Confirm that each test record appears.

## Part 6 - test newsletter signup

1. Use an email address that is not already subscribed.
2. Submit the homepage form.
3. Confirm the address appears in MailerLite.
4. Confirm the welcome email arrives.
5. Delete or label the test subscriber so it does not inflate reporting.

## Part 7 - configure MailerLite success pages

For the main website form, set the custom success page to:

`https://www.sk8scoop.com/signup-success/`

For the printed QR form, set the custom success page to:

`https://www.sk8scoop.com/qr-success/`

Use the temporary `.pages.dev` equivalents during testing. Change them to the branded URLs only when the custom domain is live.

## Part 8 - add analytics IDs

Open `assets/config.js` and enter:

- the GA4 Measurement ID beginning `G-`;
- the Meta Pixel ID.

Do not put private API keys or access tokens in this file.

Commit the updated file to GitHub and wait for Cloudflare to deploy it.

## Part 9 - final preview checks

Test these pages on phone and desktop:

- `/`
- `/latest-issue`
- `/archive`
- `/summer-guide`
- `/advertise`
- `/business-submissions/`
- `/submit-event/`
- `/about`
- `/editorial-policy`
- `/privacy`
- `/terms`
- `/localqr/?utm_content=poster_12&utm_source=local_business_display&utm_medium=qr&utm_campaign=local_displays_2026`
- `/admin/qr-dashboard/`

Poster 12 should identify Heald Green Library.

## Part 10 - connect the live domain

Only continue after the temporary site passes testing.

1. Open the Pages project.
2. Open **Custom domains**.
3. Choose **Set up a domain**.
4. Enter `www.sk8scoop.com`.
5. Follow Cloudflare's DNS prompts.
6. Do not manually create a CNAME before the domain has been associated with the Pages project.
7. Wait until the domain status is active.
8. Test the site in a private browser window and on a phone using mobile data.

Do not alter `summer-guide.sk8scoop.com`; it remains the branded Summer Guide landing page.

## Part 11 - after launch

1. Update `assets/config.js` when subscriber or issue counts change materially.
2. Add new poster locations to `assets/qr-locations.json` and `qr-codes.csv`.
3. Review D1 submissions weekly.
4. Keep the What’s On route hidden until enough events have been verified.
5. Add Stripe payment links only after the enquiry, suitability, proof and approval process is working.
