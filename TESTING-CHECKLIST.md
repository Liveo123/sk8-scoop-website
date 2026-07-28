# Website testing checklist

## Mobile widths
Test at 320px, 375px, 390px, 430px and 768px.

- Logo is sharp and not replaced.
- Menu opens, closes and does not cover important content.
- Homepage headline wraps cleanly without one-word orphan lines where possible.
- Email fields are readable and at least 44px high.
- Buttons are easy to tap and do not overflow.
- Price cards stack cleanly.
- Business and event forms do not create horizontal scrolling.
- Footer columns stack in a sensible order.
- Summer Guide image does not dominate the screen.

## Links and domains
- Main logo returns to the homepage.
- Latest issue opens Issue 5.
- Summer Guide opens `https://summer-guide.sk8scoop.com`.
- Facebook opens the supplied SK8 Scoop profile.
- Email links use `contact@sk8scoop.com`.
- No hidden or private Summer Guide link is exposed.
- Privacy, Terms and Editorial Policy load.

## Forms
- Homepage MailerLite signup works with a new test email.
- QR signup still stores poster information.
- Event submission saves to `event_submissions`.
- Business submission saves to `business_submissions`.
- Advertising enquiry saves to `advertiser_enquiries`.
- Preferences save to `subscriber_preferences`.
- Failure messages direct users to the contact email.

## Content and trust
- No invented subscriber counts, engagement claims or testimonials appear.
- Advertising prices are £35, £79/month and £129/month.
- Pilot or introductory wording appears.
- No sales guarantee is implied.
- Paid placement is clearly separated from editorial inclusion.
- Growth pages are not published as empty placeholders.

## Analytics
Use GA4 DebugView or Realtime and Meta Test Events after deployment.
- In a new private window, neither `googletagmanager.com` nor `connect.facebook.net` loads before a choice.
- `Reject optional` keeps both providers unloaded.
- `Allow both` loads GA4 `G-8L0ER92Y7L` and Meta Pixel `4649116095416763`.
- `Choose separately` respects each individual checkbox.
- The `Privacy choices` button reopens the controls.
- Withdrawing consent stops future tracking and clears first-party GA/Meta cookies where the site can do so.
- `homepage_visit`
- `signup_form_view`
- `signup_form_submit`
- `signup_completed` after a successful redirect
- `advertising_page_visit`
- `advertising_enquiry_completed`
- `summer_guide_visit`
- `summer_guide_click`
- `summer_guide_campaign_click`
- `latest_issue_click`
- `business_submission_page_visit`
- `business_submission_completed`
- `event_submission_completed`
- `subscriber_preferences_saved`
- `campaign_link_click`
- `qr_landing_view`
- `qr_signup_submit`

## Final production check
- Test desktop and mobile in a private window.
- Confirm Cloudflare reports no deployment error.
- Confirm D1 forms work on the production domain.
- Confirm no secrets appear in page source.
- Confirm the old site can be restored quickly if needed.
