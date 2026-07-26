# Exact deployment steps

## 1. Back up the current site
1. Download the current deployed files or create a GitHub release/tag.
2. Record current Cloudflare Pages settings, custom domains, D1 binding and environment variables.
3. Do not change DNS yet.

## 2. Upload this package to the existing repository
1. Extract the ZIP.
2. Copy the files inside the extracted folder into the repository root.
3. Keep `index.html`, `assets`, `functions`, `schema.sql` and `wrangler.toml` at the top level.
4. Review the changed files.
5. Commit with: `Update SK8 Scoop utility and commerce website`.
6. Push to the existing preview or non-production branch first where possible.

## 3. Update the D1 database
1. Open Cloudflare → Storage & Databases → D1.
2. Open the existing SK8 Scoop database.
3. Open Console.
4. Paste the contents of `schema.sql`.
5. Run it once.
6. Confirm the new tables with:

```sql
SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;
```

You should see `business_submissions` and `subscriber_preferences` as well as the existing tables.

## 4. Check the Pages binding
1. Open Cloudflare → Workers & Pages → the SK8 Scoop project.
2. Open Settings → Bindings.
3. Confirm the D1 variable name is exactly `DB`.
4. Confirm it points to the existing SK8 Scoop database.
5. Redeploy after any binding change.

## 5. Add analytics IDs
1. Open `assets/config.js`.
2. Add the GA4 Measurement ID beginning `G-` if available.
3. Add the Meta Pixel ID if available.
4. Do not add access tokens or secrets.
5. Commit and redeploy.

## 6. Configure MailerLite success handling
1. In the active MailerLite form settings, find the success action or redirect setting.
2. Set the successful subscription redirect to:
   `https://www.sk8scoop.com/signup-success/`
3. Repeat for the QR form if MailerLite supports a separate success redirect, using:
   `https://www.sk8scoop.com/qr-success/`
4. Test with a new email address.
5. Confirm the address appears in MailerLite before treating `signup_completed` as valid.

## 7. Deploy to a test address
1. Use the existing Cloudflare Pages preview deployment or `pages.dev` address.
2. Test all pages and forms before making the production branch live.
3. Do not point `www.sk8scoop.com` at an untested build.

## 8. Production release
1. Merge or push the tested build to the production branch.
2. Wait for Cloudflare Pages to report a successful deployment.
3. Open `https://www.sk8scoop.com/` in a private browser window.
4. Run the mobile and analytics checklists in `TESTING-CHECKLIST.md`.
5. Keep the previous deployment available for rollback.
