(() => {
  const main = document.querySelector('main');
  if (!main) return;

  const page = document.body.dataset.page || '';
  const journeys = {
    'whats-on': {
      eyebrow: 'Next useful experience',
      title: 'Found the right day, but not the right idea?',
      text: 'Try the cheaper evergreen list or narrow the search to family-friendly local ideas.',
      links: [
        ['/free-cheap-guide/', 'Open Free & Cheap', 'guide'],
        ['/kids-family/', 'See Kids & Family', 'category']
      ]
    },
    'food-drink': {
      eyebrow: 'Next useful experience',
      title: 'Turn the food idea into a plan.',
      text: 'See what else is happening nearby, or jump to the latest Scoop for this week’s newest local picks.',
      links: [
        ['/whats-on/', 'See What’s On', 'events'],
        ['/latest', 'Read the latest Scoop', 'latest']
      ]
    },
    'kids-family': {
      eyebrow: 'Next useful experience',
      title: 'Need another family option?',
      text: 'Start with the cheapest ideas, then check the current local listings for something date-specific.',
      links: [
        ['/free-cheap-guide/', 'Find free & cheap ideas', 'guide'],
        ['/whats-on/', 'See current events', 'events']
      ]
    },
    outdoors: {
      eyebrow: 'Next useful experience',
      title: 'Keep the day going.',
      text: 'Pair an outdoor route with another local place worth exploring, or find options that cost little or nothing.',
      links: [
        ['/around-sk8/', 'Explore Around SK8', 'category'],
        ['/free-cheap-guide/', 'Find free & cheap ideas', 'guide']
      ]
    },
    'local-history': {
      eyebrow: 'Next useful experience',
      title: 'Follow the story back into the place.',
      text: 'Explore more of the patch or catch this week’s newest local discoveries in the Scoop.',
      links: [
        ['/around-sk8/', 'Explore Around SK8', 'category'],
        ['/latest', 'Read the latest Scoop', 'latest']
      ]
    },
    planning: {
      eyebrow: 'Next useful experience',
      title: 'What else could affect your week?',
      text: 'Check practical local changes next, or return to the latest Scoop for the wider picture.',
      links: [
        ['/updates/', 'See Useful Updates', 'category'],
        ['/latest', 'Read the latest Scoop', 'latest']
      ]
    },
    updates: {
      eyebrow: 'Next useful experience',
      title: 'Need the change behind the change?',
      text: 'Open current consultations and development proposals, or check What’s On before making plans.',
      links: [
        ['/planning/', 'See Planning & Development', 'category'],
        ['/whats-on/', 'Check What’s On', 'events']
      ]
    },
    'around-sk8': {
      eyebrow: 'Next useful experience',
      title: 'Pick a direction.',
      text: 'Go outside with a practical local route, or dig into the stories hiding behind familiar streets and buildings.',
      links: [
        ['/outdoors/', 'Find walks & outdoors', 'category'],
        ['/local-history/', 'Explore local history', 'category']
      ]
    },
    guides: {
      eyebrow: 'Next useful experience',
      title: 'Start with the guide that saves the most faff.',
      text: 'Free & Cheap is the best developed evergreen collection. For date-specific ideas, check the live What’s On list.',
      links: [
        ['/free-cheap-guide/', 'Open Free & Cheap', 'guide'],
        ['/whats-on/', 'See What’s On', 'events']
      ]
    },
    'latest-issue': {
      eyebrow: 'Next useful experience',
      title: 'Keep going without hunting around.',
      text: 'Browse current events for something to do next, or use the archive to nose through earlier Scoops.',
      links: [
        ['/whats-on/', 'See What’s On', 'events'],
        ['/archive.html', 'Browse the archive', 'archive']
      ]
    }
  };

  const makeLinks = links => links.map(([href,label,type], index) =>
    `<a class="button${index ? ' secondary' : ''}" href="${href}" data-nue-link data-nue-type="${type}">${label}</a>`
  ).join('');

  const journey = journeys[page];
  if (journey) {
    const html = `<div class="eyebrow">${journey.eyebrow}</div><h2>${journey.title}</h2><p>${journey.text}</p><div class="button-row">${makeLinks(journey.links)}</div>`;
    const existingEyebrow = [...main.querySelectorAll('.reader-panel .eyebrow')]
      .find(node => node.textContent.trim().toLowerCase() === 'next useful experience');
    const existingPanel = existingEyebrow && existingEyebrow.closest('.reader-panel');
    if (existingPanel) {
      existingPanel.innerHTML = html;
      existingPanel.dataset.nueGenerated = 'true';
    } else {
      const section = document.createElement('section');
      section.className = 'section nue-next-section';
      section.dataset.nueGenerated = 'true';
      section.innerHTML = `<div class="wrap"><div class="reader-panel nue-next-panel">${html}</div></div>`;
      main.appendChild(section);
    }
  }

  const photoPanels = {
    'food-drink': {
      image: 'https://res.cloudinary.com/gocq00bt/image/upload/v1789129866/sk8-scoop/issue12/john-millington-cc-david-dixon.jpg',
      alt: 'The John Millington pub on Station Road in Cheadle Hulme',
      eyebrow: 'Recognisably local',
      title: 'The John Millington, Cheadle Hulme',
      text: 'A real SK8 place from the current Scoop, rather than generic food photography.',
      credit: 'Photo: David Dixon / Geograph, CC BY-SA 2.0'
    },
    'local-history': {
      image: 'https://res.cloudinary.com/gocq00bt/image/upload/v1789129855/sk8-scoop/issue12/abney-hall-cc-benjamin-shaw.jpg',
      alt: 'Exterior view of Abney Hall in Cheadle',
      eyebrow: 'Recognisably local',
      title: 'Abney Hall, Cheadle',
      text: 'Local-history pages work better when the place itself is visible, not replaced by generic heritage imagery.',
      credit: 'Photo: Benjamin Shaw, CC BY-SA 4.0'
    }
  };

  const photo = photoPanels[page];
  if (photo && !main.querySelector('[data-local-photo-panel]')) {
    const section = document.createElement('section');
    section.className = 'section white nue-local-photo-section';
    section.dataset.localPhotoPanel = 'true';
    section.innerHTML = `<div class="wrap"><figure class="nue-local-photo"><img src="${photo.image}" alt="${photo.alt}" loading="lazy" decoding="async"><figcaption><div class="eyebrow">${photo.eyebrow}</div><h2>${photo.title}</h2><p>${photo.text}</p><small>${photo.credit}</small></figcaption></figure></div>`;
    const next = main.querySelector('[data-nue-generated]');
    if (next) main.insertBefore(section, next);
    else main.appendChild(section);
  }
})();
