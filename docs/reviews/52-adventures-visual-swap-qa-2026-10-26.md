# 52 Adventures – 26 October approved image-swap stage: QA status

Paul said the six generated replacements were better, approved the final swap list, then instructed continuation. This **approves image choices and preparation of a preview, not production publication**.

- Final swap decisions: `docs/reviews/52-adventures-image-swap-decisions-2026-10-26.md`.
- Six optimised image files are preserved in the originating user session's `52-adventures-illustration-review-pack-26-Oct-2026.zip`, alongside alt/caption/rights manifest.
- A self-contained *separate card-layout review* was built as `visual-swap-staging.html`, with downloadable ZIP `52-adventures-card-preview-26-Oct-2026.zip`.
- Real Chromium QA of this **separate contact-card page**, at 390px mobile and 1280px desktop: 6/6 image decodes with natural size 1280 × 965; no horizontal overflow. This is **not evidence for the complete 52 Adventures website guide**.
- Cloudinary Upload API failed with `Unsupported source URL: /mnt/data/...` because the connector does not accept this sandbox filesystem. Raw GitHub fetch from sandbox failed due blocked network. Do not claim guide/Cloudflare deployment.
- No files were added to the existing website source and no changes were published. Cloudinary account storage remained unaffected by the failed upload.
- The generated Underbanks image is a **moodboard only**: fabricated town-centre clock tower; must never be presented as a photograph of the real Underbanks. Select authentic photo with permission/licence.
- Venue-looking 01/02/03/23 images also represent imaginary interiors, not photographs. For any eventual preview/display, conspicuous 'ILLUSTRATION · not actual venue' captions are required. For publication prefer real licensed venue photos.
- Chapter 04 illustration and #17 are separate editorial jobs; the collage is approved as a chapter visual concept but does not prove activity available on the River Mersey.

**Next technical integration:** Upload the six image assets to preview-only Cloudinary or GitHub branch using a connector that supports file-byte handoff or browser Work. Avoid replacing approved photographs with false documentary images. Then update every consistent card/dialog/hero/chapter reference, test complete branch at 320/390/tablet/desktop, verify alt/caption/rights records and links, request separate owner confirmation before production merge.