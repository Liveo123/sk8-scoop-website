# Analytics events in SK8 Scoop v7

The analytics loader activates only when valid IDs are entered in `assets/config.js`.

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

A reliable `signup_completed` event requires MailerLite to redirect successful signups to `/signup-success/`.

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

QR visits and form submissions are also stored in D1 when the `DB` binding is active.
