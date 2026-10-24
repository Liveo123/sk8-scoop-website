# SK8 Scoop homepage visual refresh | 24 October 2026
## Editorial/design decision
Paul flagged three weak homepage surfaces: identical-looking area links; fuzzy six-category collages; three small, uninteresting images across the latest issue, Free & Cheap Guide and 52 Adventures.

Implementation is a source-first, **text-and-CSS original artwork** refresh inside the review-only usability PR #247. No photos were newly sourced and no image licences or photographer permissions were assumed. The existing category collage URLs remain in the static HTML and data-driven fallback for graceful degradation, but their CSS backgrounds are superseded by original sharp typography-led posters. The established SK8 Scoop real master logo remains intact and is used as a masthead on the latest-issue cover, rather than a solitary oversized sticker.

## Changes
- Four areas: distinct pale peach, sage, aqua and gold link tiles, descriptive subtext, clear circular arrow, accessible focus and mobile two-column layout.
- Six categories: original, screen-sharp typographic editorial treatments (**PLAY, ROAM, TASTE, KNOW, THEN, NEXT**), individual colour/grain motifs, no documentary claim, full existing categories and links retained.
- Reader resources: one larger featured issue plus two supporting cards. Issue number uses the current-issue configuration; free/cheap and 52 Adventures use full-card editorial poster typography with no floating miniature logos. Media/heading/copy remain live text. Standard action links unchanged.
- No new image files, SVG, external asset requests, analytics events, subscriber logic or content rankings. No new claim about a specific local place.

## Rights/provenance ledger (ready for current Image Rights Register)
| Visual | Production basis | Sources / ingredient rights | Credit / use | Accessible name |
| --- | --- | --- | --- | --- |
| Cheadle, Cheadle Hulme, Gatley, Heald Green link tile decoration | ORIGINAL | Original HTML/CSS colour, typography and abstract ornament; no third-party artwork | Graphic: SK8 Scoop; reusable | The adjacent real link names |
| Kids & Family “PLAY” category cover | ORIGINAL | Original CSS pattern/typography; no photo or third-party logo | Graphic: SK8 Scoop; reusable | Adjacent “Kids & Family” heading/link |
| Outdoors “ROAM” category cover | ORIGINAL | As above | Graphic: SK8 Scoop; reusable | Adjacent “Outdoors” heading/link |
| Food & Drink “TASTE” category cover | ORIGINAL | As above | Graphic: SK8 Scoop; reusable | Adjacent “Food & Drink” heading/link |
| Useful Updates “KNOW” category cover | ORIGINAL | As above | Graphic: SK8 Scoop; reusable | Adjacent “Useful Updates” heading/link |
| Local History “THEN” category cover | ORIGINAL | As above | Graphic: SK8 Scoop; reusable | Adjacent “Local History” heading/link |
| Planning & Development “NEXT” category cover | ORIGINAL | As above | Graphic: SK8 Scoop; reusable | Adjacent “Planning & Development” heading/link |
| Latest issue editorial feature cover | ORIGINAL | Original CSS illustration + previously approved original SK8 Scoop master brand logo | Graphic and logo: SK8 Scoop; reusable once issue number and copy update with actual current issue | Real SK8 Scoop logo; issue number updated from canonical configuration; adjacent heading and summary |
| Free & Cheap “MORE. LESS.” guide poster | ORIGINAL | Original HTML/CSS typography; existing hidden approved guide-logo fallback only | Graphic: SK8 Scoop; reusable | Adjacent Free & Cheap Guide heading/link |
| 52 Adventures “52” field-guide poster | ORIGINAL | Original HTML/CSS typography; existing hidden approved montage fallback only | Graphic: SK8 Scoop; reusable | Adjacent 52 Adventures heading/link |

These rows are staged here, **not yet written to the shared Image Rights Register**. The Brand Manual's current five-basis authority applies. On-screen CSS-only artwork is decorative (aria-hidden); navigational text remains live and screen-reader accessible.

## Release gates
- The new cover art must actually be visible in the exact Cloudflare preview, not merely present in GitHub.
- At 1366 px and 390 px: all tiles readable; no horizontal overflow; resources clearly weighted and correctly routed; CTA text white on dark teal; focus indicators visible.
- Latest issue number and title update from the canonical issue config while headings satisfy source QA.
- Existing navigation, What’s On filters, MailerLite signup and ads untouched.
- PR remains **draft / review-only** until Paul explicitly approves this visual version. Never assume prior homepage approval extends to this design.
