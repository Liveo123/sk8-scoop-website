// Temporary reusable sponsored-callout configuration for the Free & Cheap Guide.
// Update only this object when a GROW campaign is approved.
// The slot renders only when enabled === true and current time is within start_at <= now < end_at.
// image_url is optional and, if used, must be a root-relative SK8-hosted path such as /assets/images/example.webp.
// PREVIEW QA NOTE: this branch currently uses an obvious non-commercial test sponsor so the preview deployment can be visually checked. Disable before merge.
export const GUIDE_SPONSOR = {
  enabled: true,
  slot_id: 'free-cheap-guide-primary',
  campaign_id: 'preview-guide-slot-qa',
  business_name: 'SK8 Scoop Preview Test',
  headline: 'This is a preview test of the reusable sponsored slot.',
  copy: 'This temporary message exists only on the preview branch so we can check placement, labelling, layout, tracking and automatic expiry before anything goes live.',
  cta_text: 'Test the advert link',
  cta_url: 'https://www.sk8scoop.com/advertise',
  image_url: '',
  start_at: '2026-09-07T14:00:00Z',
  end_at: '2026-09-08T14:00:00Z'
};
