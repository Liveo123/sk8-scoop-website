# Analytics events in SK8 Scoop v7

The configured IDs are:

- GA4: `G-8L0ER92Y7L`
- Meta Pixel: `4649116095416763`

Neither provider loads until a visitor gives the relevant consent. Visitors
can allow both, reject both or choose Google Analytics and Meta Pixel
separately. The choice is remembered for up to 90 days and can be reopened
through the `Privacy choices` button.

## Page and content events

- `homepage_visit`
- `latest_issue_page_visit`
- `summer_guide_visit`
- `advertising_page_visit`
- `business_submission_page_visit`
- `preferences_page_visit`

## Newsletter conversion events

- `signup_form_view`
- `signup_form_submit`
- `signup_completed`
- `form_start`

The website only opens `/signup-success/` or `/qr-success/` after MailerLite returns `success: true`, so `signup_completed` now represents an accepted MailerLite response.

## Reader action events

- `latest_issue_click`
- `summer_guide_click`
- `summer_guide_campaign_click`
- `campaign_link_click`

## Advertising events

- `advertising_cta_click`
- `advertiser_packages_view`
- `advertiser_package_click`
- `advertiser_package_selected`
- `advertising_enquiry_completed`

## Submission events

- `business_submission_type_selected`
- `business_submission_completed`
- `event_submission_completed`
- `subscriber_preferences_saved`

## QR events

- `qr_landing_view`
- `qr_signup_submit`

QR visits, signup attempts and MailerLite-accepted responses are stored separately in D1 when the `DB` binding is active.
