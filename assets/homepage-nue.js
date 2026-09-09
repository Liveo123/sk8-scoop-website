(() => {
  const DATA_URL = '/data/homepage.json';
  const SUBSCRIBER_KEY = 'sk8_subscriber_recognition_v1';
  const SUBSCRIBER_DAYS = 365;

  const iconSvg = key => {
    const icons = {
      food: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M14 7v14M20 7v14M14 14h6M17 21v20M31 7v34M31 7c5 5 6 12 2 17h-2"/></svg>',
      family: '<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="17" cy="15" r="5"/><circle cx="32" cy="17" r="4"/><path d="M8 39c1-9 5-14 10-14s9 5 10 14M25 39c1-7 4-11 8-11 4 0 7 4 8 11"/></svg>',
      outdoors: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M6 38 19 17l7 10 5-7 11 18H6Z"/><path d="M19 17 23 9l5 8"/></svg>',
      history: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M10 12h23a6 6 0 0 1 6 6v21H16a6 6 0 0 1-6-6V12Z"/><path d="M16 12v27M21 19h12M21 25h12M21 31h8"/></svg>',
      planning: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M10 8h20l8 8v24H10V8Z"/><path d="M30 8v9h8M16 24h16M16 30h12"/><path d="m17 17 3 3 6-7"/></svg>',
      updates: '<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="17"/><path d="m15 24 6 6 12-14"/></svg>'
    };
    return icons[key] || icons.updates;
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

  const renderStories = data => {
    const cards = [...document.querySelectorAll('[data-home-story]')];
    (data.stories || []).forEach((story, index) => {
      const card = cards[index];
      if (!card) return;
      const image = card.querySelector('.reader-story-image');
      const label = card.querySelector('.reader-story-image span');
      const title = card.querySelector('h3');
      const meta = card.querySelector('.reader-meta');
      const summary = card.querySelector('[data-story-summary]');
      const link = card.querySelector('.reader-link');
      if (image && story.image) image.style.backgroundImage = `url("${story.image}")`;
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
      const node = document.createElement(isOpen ? 'a' : 'div');
      node.className = `reader-explore-tile${isOpen ? '' : ' is-soon'}`;
      if (isOpen) node.href = item.href;

      const visual = document.createElement('span');
      visual.className = `reader-explore-visual ${item.visual === 'photo' && item.image ? 'reader-explore-photo' : 'reader-explore-icon'}`;
      visual.setAttribute('aria-hidden', 'true');
      if (item.visual === 'photo' && item.image) {
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
        visual.innerHTML = iconSvg(item.icon);
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

  applySubscriberState();
  syncCurrentIssueLink();
  syncFreeCheapGuideLogo();
  loadHomepageData();
})();
