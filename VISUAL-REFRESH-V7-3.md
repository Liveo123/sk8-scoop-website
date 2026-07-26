# SK8 Scoop v7.3 visual and conversion refresh

## Main fix

The header **Join free** button no longer jumps to the middle of the homepage. It opens an accessible signup panel in place, focuses the email field and keeps the page at the same scroll position.

## New visual assets

- Illustrated SK8 area collage for the homepage hero
- Illustrated newsletter preview for the homepage, latest issue, archive and Summer Guide
- Local campaign illustration for the advertising page and homepage business section
- Community noticeboard illustration for the local information submission page
- Illustrated SK8 map for the About page

All illustrations are original lightweight SVG files stored in `assets/illustrations/` and use the existing teal, orange and cream branding.

## Page changes

- `index.html`: richer first screen, illustrated local hero, issue preview and advertiser illustration
- `advertise.html`: campaign illustration and more visual reporting section
- `business-submissions/index.html`: illustrated noticeboard and clearer hero explanation
- `about.html`: illustrated SK8 area map
- `latest-issue.html`: illustrated issue preview behind the signup card
- `summer-guide.html`: extra family-planning illustration
- `archive.html`: illustrated archive header
- `assets/styles.css`: paper texture, richer cards, hover effects, visual layouts and signup modal
- `assets/site.js`: non-jumping signup modal and keyboard/close behaviour

## Tests completed locally

- Header Join free button kept the page at scroll position 0
- Signup panel opened and focused `modal-email`
- Desktop homepage at 1440 px
- Mobile homepage at 390 px
- Advertising page at 1440 px
- Business submission page at 1440 px
- About page at 1440 px
- JavaScript syntax check
- Worker syntax check
- Internal image reference check
