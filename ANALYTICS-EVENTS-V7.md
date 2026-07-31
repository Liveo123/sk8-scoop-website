# Analytics events in SK8 Scoop v8.3

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
- `about_page_visit`
- `archive_page_visit`
- `event_submission_page_visit`
- `whats_on_page_visit`
- `summer_guide_signup_completed`

## Newsletter conversion events

- `signup_form_view`
- `signup_form_submit`
- `sign_up` — GA4 recommended event, sent only after MailerLite returns `success: true`
- `signup_completed`
- `form_start`
- `form_error`

The website only opens `/signup-success/` or `/qr-success/` after MailerLite returns `success: true`. Use `sign_up` as the main GA4 key event. `signup_completed` remains available for comparison with earlier reporting.

## Reader action events

- `latest_issue_click`
- `summer_guide_click`
- `summer_guide_campaign_click`
- `campaign_link_click`
- `archive_click`
- `outbound_click`
- `contact_click`
- `social_click`

## Advertising events

- `advertising_cta_click`
- `advertiser_packages_view`
- `advertiser_package_click`
- `advertiser_package_selected`
- `advertising_enquiry_completed`
- `generate_lead` — GA4 recommended event for an accepted advertising enquiry

## Submission events

- `business_submission_type_selected`
- `business_submission_completed`
- `event_submission_completed`
- `subscriber_preferences_saved`

## QR events

- `qr_landing_view`
- `qr_signup_submit`

QR visits, signup attempts and MailerLite-accepted responses are stored separately in D1 when the `DB` binding is active.

## Parameters added to every custom event

- `page_name`
- `page_title`
- `page_location`
- `page_path`
- `content_group`

Link events also include `link_url`, `link_text`, `link_location` and, where available, `link_domain`. No visitor email address or form-entered personal data is sent to GA4.

## GA4 configuration

Mark only these as key events:

- `sign_up`
- `generate_lead`
- `business_submission_completed`
- `event_submission_completed`

Do not mark page views, form starts, form submissions or outbound clicks as key events.
