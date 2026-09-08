(() => {
  const DATA_URL = '/data/homepage.json';
  const SUBSCRIBER_KEY = 'sk8_subscriber_recognition_v1';
  const SUBSCRIBER_DAYS = 365;

  const layoutStyle = document.createElement('style');
  layoutStyle.dataset.sk8HomepageNueLayout = 'true';
  layoutStyle.textContent = `
    @media (min-width: 901px) {
      .reader-home [data-explore-grid] {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 12px;
        width: 100%;
      }
    }
  `;
  document.head.appendChild(layoutStyle);

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
      node.innerHTML = `<span class="reader-explore-glyph" aria-hidden="true">${item.glyph || '•'}</span><strong>${item.title || ''}</strong><small>${item.description || ''}</small><em>${isOpen ? 'Open →' : 'Next to build'}</em>`;
      grid.appendChild(node);
    });
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
  loadHomepageData();
})();
