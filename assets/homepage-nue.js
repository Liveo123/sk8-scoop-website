(() => {
  const DATA_URL = '/data/homepage.json';
  const SUBSCRIBER_KEY = 'sk8_subscriber_recognition_v1';
  const SUBSCRIBER_DAYS = 365;

  const ensureHomepageV3Styles = () => {
    if (!document.querySelector('link[data-sk8-homepage-v3]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = '/assets/homepage-v3.css';
      link.dataset.sk8HomepageV3 = 'true';
      document.head.appendChild(link);
    }
    if (!document.querySelector('link[data-sk8-homepage-v5]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = '/assets/homepage-v5.css';
      link.dataset.sk8HomepageV5 = 'true';
      document.head.appendChild(link);
    }
  };

  const storyGraphicSvg = key => {
    const graphics = {
      planning: '<svg viewBox="0 0 320 180" aria-hidden="true" focusable="false" style="position:absolute;inset:0;width:100%;height:100%;display:block"><rect width="320" height="180" fill="#eef7f5"/><path d="M-15 130C55 100 72 70 142 68s87 44 193 5" fill="none" stroke="#bfd9d4" stroke-width="18"/><path d="M-10 136C58 105 82 80 146 78s88 38 190 8" fill="none" stroke="#fff" stroke-width="7"/><path d="M36 24v132M105 10v156M185 18v143M265 12v150M10 48h295M18 112h280" stroke="#d7e7e3" stroke-width="2"/><circle cx="242" cy="58" r="34" fill="#f8791b"/><circle cx="242" cy="58" r="28" fill="#fff"/><text x="242" y="68" text-anchor="middle" font-size="30" font-family="Arial,sans-serif" font-weight="900" fill="#073f48">20</text><circle cx="94" cy="102" r="8" fill="#0f6470"/><circle cx="168" cy="84" r="6" fill="#d6ea00"/><path d="M94 102l74-18 74-26" stroke="#0f6470" stroke-width="3" stroke-dasharray="6 6" fill="none"/></svg>',
      route: '<svg viewBox="0 0 320 180" aria-hidden="true" focusable="false" style="position:absolute;inset:0;width:100%;height:100%;display:block"><rect width="320" height="180" fill="#edf6ee"/><path d="M0 126C48 104 78 112 119 89s70-22 103-8 64 2 98-26v125H0Z" fill="#d7ead6"/><path d="M-20 62C42 78 70 45 117 56s72 39 119 18 72-18 106-5" fill="none" stroke="#9ed8e2" stroke-width="16"/><path d="M22 142C72 108 91 119 132 95s71-44 122-24" fill="none" stroke="#0f6470" stroke-width="4" stroke-dasharray="8 7"/><circle cx="26" cy="140" r="9" fill="#f8791b"/><circle cx="255" cy="72" r="9" fill="#f8791b"/><circle cx="145" cy="92" r="6" fill="#d6ea00"/><rect x="207" y="118" width="92" height="40" rx="20" fill="#073f48"/><text x="253" y="143" text-anchor="middle" font-size="20" font-family="Arial,sans-serif" font-weight="900" fill="#fff">2.9 mi</text></svg>',
      history: '<svg viewBox="0 0 320 180" aria-hidden="true" focusable="false" style="position:absolute;inset:0;width:100%;height:100%;display:block"><rect width="320" height="180" fill="#f5efe4"/><path d="M20 26h178v124H20z" fill="#e7dcc9"/><path d="M32 38h154v99H32z" fill="#fffaf0"/><path d="M45 119V74l24-17 19 14 29-26 36 27v47" fill="#c9b79d"/><path d="M45 119h108" stroke="#8a775e" stroke-width="4"/><rect x="154" y="26" width="105" height="72" rx="4" fill="#d9cbb7" transform="rotate(6 154 26)"/><path d="M174 74c23-18 43-19 66-2" fill="none" stroke="#8a775e" stroke-width="5"/><circle cx="243" cy="119" r="31" fill="none" stroke="#0f6470" stroke-width="8"/><path d="m266 142 30 25" stroke="#0f6470" stroke-width="10" stroke-linecap="round"/><circle cx="99" cy="77" r="7" fill="#f8791b"/><path d="M99 84v24M87 96h24" stroke="#f8791b" stroke-width="4"/></svg>'
    };
    return graphics[key] || '';
  };

  const readSubscriber = () => {
    try {
      const value = JSON.parse(localStorage.getItem(SUBSCRIBER_KEY) || 'null');
      if (!value || value.version !== 1 || !value.expiresAt || Date.now() > value.expiresAt) {
        localStorage.removeItem(SUBSCRIBER_KEY);
        return null;
      }
      return value;
    } catch (_) {
      return null;
    }
  };

  const markSubscriber = () => {
    try {
      localStorage.setItem(SUBSCRIBER_KEY, JSON.stringify({
        version: 1,
        recognised: true,
        savedAt: new Date().toISOString(),
        expiresAt: Date.now() + SUBSCRIBER_DAYS * 24 * 60 * 60 * 1000
      }));
    } catch (_) {}
  };

  const clearSubscriber = () => {
    try { localStorage.removeItem(SUBSCRIBER_KEY); } catch (_) {}
  };

  const previewHost = /workers\.dev$/i.test(location.hostname);
  if (previewHost) {
    const params = new URLSearchParams(location.search);
    if (params.get('subscriber') === '1') markSubscriber();
    if (params.get('subscriber') === '0') clearSubscriber();
  }

  document.addEventListener('sk8:mailerlite-success', markSubscriber);

  const applySubscriberState = () => {
    if (!readSubscriber()) return;
    document.body.dataset.recognisedSubscriber = 'true';

    const heroForm = document.querySelector('.reader-hero .reader-signup');
    if (heroForm) {
      heroForm.hidden = true;
      const replacement = document.createElement('div');
      replacement.className = 'button-row';
      replacement.innerHTML = '<a class="button" href="/latest">See what’s new</a><a class="button hero-secondary" href="/free-cheap-guide/">Open Free & Cheap</a>';
      heroForm.insertAdjacentElement('afterend', replacement);
    }

    const navJoin = document.querySelector('.reader-nav-join');
    if (navJoin) {
      navJoin.href = '/latest';
      navJoin.textContent = 'See what’s new';
    }

    const footerSignup = document.querySelector('.reader-footer-signup');
    if (footerSignup) {
      footerSignup.innerHTML = '<strong>You’re already on the list</strong><p>Jump straight to the latest useful local bits.</p><a class="button small-button" href="/latest">See what’s new →</a>';
    }
  };

  const normalisePreviewFooterSignup = () => {
    if (!previewHost || readSubscriber()) return;
    const footerSignup = document.querySelector('.reader-footer-signup');
    if (!footerSignup) return;
    footerSignup.dataset.previewSignup = 'true';
    footerSignup.innerHTML = '<strong>Get the Scoop</strong><p>New issue every Friday.</p><a class="button small-button" href="/join/">Join free →</a>';
  };

  const renderStories = data => {
    const cards = [...document.querySelectorAll('[data-home-story]')];
    (data.stories || []).forEach((story, index) => {
      const card = cards[index];
      if (!card) return;
      const image = card.querySelector('.reader-story-image');
      let label = image && image.querySelector('span');
      const title = card.querySelector('h3');
      const meta = card.querySelector('.reader-meta');
      const summary = card.querySelector('[data-story-summary]');
      const link = card.querySelector('.reader-link');

      if (image && story.visualType === 'dicm' && story.image) {
        image.classList.add('dicm-visual');
        image.style.backgroundImage = 'none';
        image.style.backgroundColor = '#f7faf8';
        image.replaceChildren();
        const art = document.createElement('img');
        art.className = 'dicm-art';
        art.src = story.image;
        art.alt = story.alt || '';
        art.loading = 'lazy';
        art.decoding = 'async';
        label = document.createElement('span');
        label.className = 'dicm-mode-label';
        image.append(art, label);
      } else if (image && story.graphic) {
        image.style.backgroundImage = 'none';
        image.style.backgroundColor = '#eef7f5';
        image.innerHTML = storyGraphicSvg(story.graphic);
        label = document.createElement('span');
        image.appendChild(label);
      } else if (image && story.image) {
        image.style.backgroundImage = `url("${story.image}")`;
      }

      if (label) {
        label.textContent = story.label || story.mode || '';
        label.classList.toggle('orange-label', story.mode === 'DISCOVER');
      }
      if (title) title.textContent = story.title || '';
      if (meta) meta.textContent = story.meta || '';
      if (summary) summary.textContent = story.summary || '';
      if (link) {
        link.href = story.href || '/latest';
        link.textContent = story.linkLabel || 'Read more →';
      }
    });
  };

  const renderExplore = data => {
    const grid = document.querySelector('[data-explore-grid]');
    if (!grid) return;
    grid.innerHTML = '';

    (data.explore || []).forEach(item => {
      const isOpen = item.status === 'OPEN' && item.href;
      const hasPhoto = item.visual === 'photo' && item.image;
      const node = document.createElement(isOpen ? 'a' : 'div');
      node.className = `reader-explore-tile${isOpen ? '' : ' is-soon'}`;
      if (isOpen) node.href = item.href;

      const visual = document.createElement('span');
      visual.className = `reader-explore-visual ${hasPhoto ? 'reader-explore-photo' : 'reader-explore-editorial-fallback'}`;
      visual.setAttribute('aria-hidden', 'true');
      if (hasPhoto) {
        if (item.fit === 'contain') {
          visual.classList.add('is-guide-logo');
          visual.style.backgroundImage = `url("${item.image}")`;
          visual.style.backgroundSize = 'contain';
          visual.style.backgroundRepeat = 'no-repeat';
          visual.style.backgroundColor = '#fff';
        } else {
          visual.style.backgroundImage = `linear-gradient(rgba(7,63,72,.02),rgba(7,63,72,.12)),url("${item.image}")`;
        }
        visual.style.backgroundPosition = item.position || 'center';
      } else {
        visual.textContent = 'SK8';
        visual.style.display = 'grid';
        visual.style.placeItems = 'center';
        visual.style.background = '#073f48';
        visual.style.color = '#d6ea00';
        visual.style.fontSize = '1.15rem';
        visual.style.fontWeight = '950';
        visual.style.letterSpacing = '.12em';
      }

      const copy = document.createElement('span');
      copy.className = 'reader-explore-copy';
      const title = document.createElement('strong');
      title.textContent = item.title || '';
      const description = document.createElement('small');
      description.textContent = item.description || '';
      const status = document.createElement('em');
      status.textContent = isOpen ? 'Open →' : 'In development';
      copy.append(title, description, status);
      node.append(visual, copy);
      grid.appendChild(node);
    });
  };

  const syncCurrentIssueLink = () => {
    const issue = window.SK8_CONFIG && window.SK8_CONFIG.currentIssue;
    const button = document.querySelector('.reader-latest-copy .button');
    if (issue && issue.url && button) button.href = issue.url;
  };

  const syncFreeCheapGuideLogo = () => {
    const image = document.querySelector('.reader-guide-grid .reader-mini-guide:first-child img');
    if (!image) return;
    image.src = '/assets/images/free-cheap-guide-logo.webp';
    image.alt = 'SK8 Scoop Free & Cheap Guide logo';
    image.classList.add('guide-logo-image');
    image.style.objectFit = 'contain';
    image.style.background = '#fff';
    image.style.padding = '8px';
    image.style.boxSizing = 'border-box';
  };

  const applyHomepageV3 = () => {
    const config = window.SK8_CONFIG || {};
    const stats = config.publicStats || {};
    const issue = config.currentIssue || {};

    document.body.classList.add('homepage-v3');

    const heroCopy = document.querySelector('.reader-hero-copy');
    if (heroCopy && !heroCopy.querySelector('.home-hero-eyebrow')) {
      const eyebrow = document.createElement('div');
      eyebrow.className = 'home-hero-eyebrow';
      eyebrow.textContent = 'Free Friday newsletter · SK8';
      heroCopy.insertBefore(eyebrow, heroCopy.firstChild);
    }

    const signup = document.querySelector('.reader-hero .reader-signup');
    if (signup) {
      signup.setAttribute('aria-label', 'Join the free SK8 Scoop newsletter');
      if (!signup.nextElementSibling?.classList.contains('home-signup-note')) {
        const note = document.createElement('p');
        note.className = 'home-signup-note';
        note.textContent = 'No spam. Unsubscribe any time.';
        signup.insertAdjacentElement('afterend', note);
      }
    }

    const proof = document.querySelector('.reader-proof');
    if (proof) {
      proof.innerHTML = [
        `<span><b>${stats.subscriberProof || stats.subscriberCount || '500+'}</b> local readers</span>`,
        `<span><b>${stats.issuesPublished || 12}</b> issues published</span>`,
        '<span><b>FRI</b> free every Friday</span>'
      ].join('');
    }

    const worthMore = document.querySelector('.reader-worth .reader-section-head .reader-link');
    if (worthMore) {
      worthMore.href = '/around-sk8/';
      worthMore.textContent = 'Explore more local stories →';
    }

    const guidesHeading = document.querySelector('.reader-guides-area .mini-head h2');
    if (guidesHeading) guidesHeading.textContent = 'Useful guides';
    const comingLaterGuide = document.querySelector('.reader-guide-grid .reader-mini-guide:nth-child(3)');
    if (comingLaterGuide) comingLaterGuide.remove();

    const latestEyebrow = document.querySelector('.reader-latest-copy .eyebrow');
    if (latestEyebrow) latestEyebrow.textContent = 'Latest issue';

    document.querySelectorAll('.reader-story img,.reader-mini-guide img').forEach((img) => {
      img.loading = 'lazy';
      img.decoding = 'async';
    });

    if (!document.querySelector('#sk8-home-schema-v3')) {
      const schema = document.createElement('script');
      schema.id = 'sk8-home-schema-v3';
      schema.type = 'application/ld+json';
      schema.textContent = JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'Organization',
            '@id': 'https://www.sk8scoop.com/#organisation',
            name: 'SK8 Scoop',
            url: 'https://www.sk8scoop.com/',
            description: 'Useful local news, events, guides and a free Friday newsletter for Cheadle, Cheadle Hulme, Gatley, Heald Green and nearby SK8.'
          },
          {
            '@type': 'WebSite',
            '@id': 'https://www.sk8scoop.com/#website',
            name: 'SK8 Scoop',
            url: 'https://www.sk8scoop.com/',
            publisher: {'@id': 'https://www.sk8scoop.com/#organisation'}
          },
          {
            '@type': 'Periodical',
            name: 'SK8 Scoop',
            url: issue.url || 'https://www.sk8scoop.com/latest',
            publisher: {'@id': 'https://www.sk8scoop.com/#organisation'}
          }
        ]
      });
      document.head.appendChild(schema);
    }
  };

  const loadHomepageData = async () => {
    try {
      const response = await fetch(DATA_URL, { cache: 'no-store' });
      if (!response.ok) throw new Error(`Homepage data returned ${response.status}`);
      const data = await response.json();
      renderStories(data);
      renderExplore(data);
    } catch (error) {
      console.error('SK8 homepage NUE data failed to load', error);
    }
  };

  ensureHomepageV3Styles();
  applySubscriberState();
  normalisePreviewFooterSignup();
  syncCurrentIssueLink();
  syncFreeCheapGuideLogo();
  applyHomepageV3();
  loadHomepageData();
})();
