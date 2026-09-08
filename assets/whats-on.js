(() => {
  const DATA_URL = '/data/events.json';
  const list = document.querySelector('[data-events-list]');
  const empty = document.querySelector('[data-events-empty]');
  const status = document.querySelector('[data-events-status]');
  const filters = [...document.querySelectorAll('[data-event-filter]')];
  if (!list) return;

  const config = window.SK8_CONFIG || {};
  const issueStories = Array.isArray(config.homeStories) ? config.homeStories : [];
  const mainIssueStory = issueStories[0] || {};

  const visualStyle = document.createElement('style');
  visualStyle.dataset.sk8WhatsOnVisuals = 'true';
  visualStyle.textContent = `
    body[data-page="whats-on"] .page-hero { padding: 48px 0 40px; }
    body[data-page="whats-on"] .whats-on-hero-grid {
      display: grid;
      grid-template-columns: minmax(0, 1.05fr) minmax(340px, .95fr);
      gap: 34px;
      align-items: center;
    }
    body[data-page="whats-on"] .whats-on-hero-copy { min-width: 0; }
    body[data-page="whats-on"] .whats-on-hero-visual {
      position: relative;
      min-height: 350px;
      margin: 0;
      overflow: hidden;
      border-radius: 18px;
      border: 1px solid var(--line);
      background: #dfe9e6;
      box-shadow: 0 14px 30px rgba(19,45,49,.12);
    }
    body[data-page="whats-on"] .whats-on-hero-visual img {
      width: 100%;
      height: 350px;
      object-fit: cover;
      display: block;
    }
    body[data-page="whats-on"] .whats-on-hero-visual:after {
      content: "";
      position: absolute;
      inset: 45% 0 0;
      background: linear-gradient(180deg, transparent, rgba(7,63,72,.78));
      pointer-events: none;
    }
    body[data-page="whats-on"] .whats-on-hero-caption {
      position: absolute;
      z-index: 2;
      left: 20px;
      right: 20px;
      bottom: 18px;
      color: #fff;
    }
    body[data-page="whats-on"] .whats-on-hero-caption span {
      display: inline-block;
      padding: 5px 9px;
      border-radius: 999px;
      background: rgba(255,250,240,.94);
      color: var(--teal);
      font-size: .68rem;
      font-weight: 900;
      letter-spacing: .08em;
      text-transform: uppercase;
      margin-bottom: 8px;
    }
    body[data-page="whats-on"] .whats-on-hero-caption strong {
      display: block;
      max-width: 520px;
      font: 800 1.45rem/1.12 Arial,sans-serif;
      text-shadow: 0 1px 8px rgba(0,0,0,.25);
    }
    body[data-page="whats-on"] .whats-on-filter-grid .reader-story {
      overflow: hidden;
    }
    body[data-page="whats-on"] .whats-on-filter-grid .reader-story-image {
      height: 150px;
      min-height: 150px;
      background-size: cover;
      background-position: center;
    }
    body[data-page="whats-on"] .whats-on-filter-grid .reader-story-image:after {
      content: "";
      position: absolute;
      inset: 0;
      background: linear-gradient(180deg, rgba(0,0,0,.03), rgba(0,0,0,.14));
    }
    body[data-page="whats-on"] .whats-on-filter-grid .reader-story-image span {
      position: relative;
      z-index: 1;
    }
    body[data-page="whats-on"] [data-events-list] .reader-story-image {
      height: 145px;
    }
    body[data-page="whats-on"] .whats-on-empty:not([hidden]) {
      display: grid;
      grid-template-columns: 190px minmax(0,1fr);
      gap: 24px;
      align-items: center;
      overflow: hidden;
    }
    body[data-page="whats-on"] .whats-on-empty-art {
      width: 190px;
      height: 150px;
      object-fit: cover;
      border-radius: 12px;
      border: 1px solid var(--line);
      background: #fff;
    }
    body[data-page="whats-on"] .whats-on-empty-copy h2 { margin-top: 5px; }
    @media (max-width: 900px) {
      body[data-page="whats-on"] .whats-on-hero-grid { grid-template-columns: 1fr; }
      body[data-page="whats-on"] .whats-on-hero-visual { min-height: 280px; }
      body[data-page="whats-on"] .whats-on-hero-visual img { height: 280px; }
    }
    @media (max-width: 680px) {
      body[data-page="whats-on"] .whats-on-empty:not([hidden]) { grid-template-columns: 1fr; }
      body[data-page="whats-on"] .whats-on-empty-art { width: 100%; height: 180px; }
      body[data-page="whats-on"] .whats-on-hero-visual,
      body[data-page="whats-on"] .whats-on-hero-visual img { min-height: 235px; height: 235px; }
      body[data-page="whats-on"] .whats-on-hero-caption strong { font-size: 1.15rem; }
    }
  `;
  document.head.appendChild(visualStyle);

  const addPageVisuals = () => {
    const heroWrap = document.querySelector('.page-hero > .wrap');
    if (heroWrap && !heroWrap.classList.contains('whats-on-hero-grid')) {
      const copy = document.createElement('div');
      copy.className = 'whats-on-hero-copy';
      [...heroWrap.childNodes].forEach(node => copy.appendChild(node));

      const visual = document.createElement('figure');
      visual.className = 'whats-on-hero-visual';
      const heroImage = mainIssueStory.image || '/assets/images/hero-family-market-clean.webp';
      const heroTitle = mainIssueStory.title || 'Useful local things worth knowing about this week';
      visual.innerHTML = `<img src="${heroImage}" alt="Featured image from the latest SK8 Scoop"><figcaption class="whats-on-hero-caption"><span>From the latest Scoop</span><strong>${heroTitle}</strong></figcaption>`;

      heroWrap.classList.add('whats-on-hero-grid');
      heroWrap.append(copy, visual);
    }

    const filterGrid = document.querySelector('button[data-event-filter="weekend"]')?.closest('.reader-card-grid');
    if (filterGrid && !filterGrid.classList.contains('whats-on-filter-grid')) {
      filterGrid.classList.add('whats-on-filter-grid');
      const images = {
        weekend: mainIssueStory.image || '/assets/images/hero-family-market-clean.webp',
        free: '/assets/images/free-cheap-landing-hero.webp',
        family: '/assets/images/family-picnic.webp'
      };
      const labels = {
        weekend: 'THIS WEEKEND',
        free: 'FREE IDEAS',
        family: 'FAMILY'
      };
      ['weekend','free','family'].forEach(key => {
        const button = filterGrid.querySelector(`[data-event-filter="${key}"]`);
        const card = button && button.closest('.reader-story');
        if (!card || card.querySelector('.reader-story-image')) return;
        const image = document.createElement('div');
        image.className = 'reader-story-image';
        image.style.backgroundImage = `url("${images[key]}")`;
        image.innerHTML = `<span>${labels[key]}</span>`;
        card.prepend(image);
      });
    }

    if (empty && !empty.classList.contains('whats-on-empty')) {
      const copy = document.createElement('div');
      copy.className = 'whats-on-empty-copy';
      [...empty.childNodes].forEach(node => copy.appendChild(node));
      const art = document.createElement('img');
      art.className = 'whats-on-empty-art';
      art.src = '/assets/images/free-cheap-pencil-adventure.webp';
      art.alt = 'SK8 Scoop pencil illustration of local low-cost days out and activities';
      empty.classList.add('whats-on-empty');
      empty.append(art, copy);
    }
  };

  addPageVisuals();

  let events = [];
  let activeFilter = 'all';

  const localToday = () => {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit'
    });
    return formatter.format(new Date());
  };

  const parseDate = value => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) return null;
    const [year, month, day] = String(value).split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day));
  };

  const prettyDate = value => {
    const date = parseDate(value);
    if (!date) return '';
    return new Intl.DateTimeFormat('en-GB', {
      weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC'
    }).format(date);
  };

  const weekendBounds = () => {
    const now = new Date(`${localToday()}T12:00:00Z`);
    const day = now.getUTCDay();
    const untilSaturday = (6 - day + 7) % 7;
    const saturday = new Date(now);
    saturday.setUTCDate(now.getUTCDate() + untilSaturday);
    const sunday = new Date(saturday);
    sunday.setUTCDate(saturday.getUTCDate() + 1);
    return [saturday, sunday];
  };

  const isFree = event => /(^|\b)free(\b|$)/i.test(String(event.cost || ''));
  const isFamily = event => /family|kids|children/i.test(`${event.category || ''} ${event.description || ''}`);
  const isWeekend = event => {
    const date = parseDate(event.date);
    if (!date) return false;
    const [start, end] = weekendBounds();
    return date >= start && date <= end;
  };

  const matches = event => {
    if (activeFilter === 'free') return isFree(event);
    if (activeFilter === 'family') return isFamily(event);
    if (activeFilter === 'weekend') return isWeekend(event);
    return true;
  };

  const eventCard = event => {
    const article = document.createElement('article');
    article.className = 'reader-story';
    const source = String(event.booking_url || event.source_url || '').trim();
    const when = [prettyDate(event.date), event.time].filter(Boolean).join(' · ');
    const meta = [when, event.area, event.cost].filter(Boolean).join(' · ');
    const image = String(event.image || '').trim();
    article.innerHTML = `${image ? `<div class="reader-story-image" style="background-image:url('${image.replace(/'/g, '%27')}')"><span>${event.category || 'LOCAL EVENT'}</span></div>` : ''}<div class="reader-story-body">
      <div class="eyebrow">${event.category || 'LOCAL EVENT'}</div>
      <h3>${event.title || ''}</h3>
      <p class="reader-meta">${meta}</p>
      <p>${event.description || ''}</p>
      ${source ? `<a class="reader-link" href="${source}" rel="noopener">Check current details →</a>` : ''}
    </div>`;
    return article;
  };

  const render = () => {
    list.innerHTML = '';
    const visible = events.filter(matches);
    visible.forEach(event => list.appendChild(eventCard(event)));
    if (empty) empty.hidden = visible.length > 0;
    if (status) status.textContent = visible.length
      ? `${visible.length} verified ${visible.length === 1 ? 'listing' : 'listings'} shown`
      : 'No verified listings match this view yet.';
    filters.forEach(button => {
      const selected = button.dataset.eventFilter === activeFilter;
      button.setAttribute('aria-pressed', String(selected));
    });
  };

  filters.forEach(button => button.addEventListener('click', () => {
    activeFilter = button.dataset.eventFilter || 'all';
    render();
  }));

  fetch(DATA_URL, { cache: 'no-store' })
    .then(response => {
      if (!response.ok) throw new Error(`Events data returned ${response.status}`);
      return response.json();
    })
    .then(data => {
      const today = localToday();
      events = (Array.isArray(data) ? data : [])
        .filter(event => event && event.status !== 'example')
        .filter(event => /^\d{4}-\d{2}-\d{2}$/.test(String(event.date || '')) && event.date >= today)
        .sort((a, b) => `${a.date || ''} ${a.time || ''}`.localeCompare(`${b.date || ''} ${b.time || ''}`));
      render();
    })
    .catch(error => {
      console.error('SK8 What’s On data failed to load', error);
      if (status) status.textContent = 'Current listings could not be loaded.';
      if (empty) empty.hidden = false;
    });
})();
