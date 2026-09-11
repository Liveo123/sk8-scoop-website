(() => {
  const DATA_URL = '/data/events.json';
  const list = document.querySelector('[data-events-list]');
  const empty = document.querySelector('[data-events-empty]');
  const status = document.querySelector('[data-events-status]');
  const filters = [...document.querySelectorAll('[data-event-filter]')];
  if (!list) return;

  const safeUrl = value => {
    const raw = String(value || '').trim();
    if (!raw) return '';
    try {
      const url = new URL(raw, window.location.origin);
      return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
    } catch (_) {
      return '';
    }
  };

  const slugifyCategory = value => String(value || 'local-event')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'local-event';

  const addPageVisuals = () => {
    const heroWrap = document.querySelector('.page-hero > .wrap');
    if (heroWrap && !heroWrap.classList.contains('whats-on-hero-grid')) {
      const copy = document.createElement('div');
      copy.className = 'whats-on-hero-copy';
      [...heroWrap.childNodes].forEach(node => copy.appendChild(node));

      const visual = document.createElement('figure');
      visual.className = 'whats-on-hero-visual';
      const image = document.createElement('img');
      image.src = '/assets/images/nue/whats-on-hero.webp';
      image.alt = 'Editorial collage of a local events map, tickets, calendar and stage lights';
      const caption = document.createElement('figcaption');
      caption.className = 'whats-on-hero-caption';
      const badge = document.createElement('span');
      badge.textContent = 'What’s On';
      const strong = document.createElement('strong');
      strong.textContent = 'Local events, useful filters and things actually worth leaving the house for.';
      caption.append(badge, strong);
      visual.append(image, caption);

      heroWrap.classList.add('whats-on-hero-grid');
      heroWrap.append(copy, visual);
    }

    const filterGrid = document.querySelector('button[data-event-filter="weekend"]')?.closest('.reader-card-grid');
    if (filterGrid && !filterGrid.classList.contains('whats-on-filter-grid')) {
      filterGrid.classList.add('whats-on-filter-grid');
      const images = {
        weekend: '/assets/images/nue/whats-on-weekend.webp',
        free: '/assets/images/free-cheap-guide-logo.webp',
        family: '/assets/images/nue/whats-on-family.webp'
      };
      const labels = { weekend: 'THIS WEEKEND', free: 'FREE IDEAS', family: 'FAMILY' };
      ['weekend','free','family'].forEach(key => {
        const button = filterGrid.querySelector(`[data-event-filter="${key}"]`);
        const card = button && button.closest('.reader-story');
        if (!card || card.querySelector('.reader-story-image')) return;
        const image = document.createElement('div');
        image.className = 'reader-story-image';
        image.style.backgroundImage = `url("${images[key]}")`;
        if (key === 'free') {
          image.style.backgroundSize = 'contain';
          image.style.backgroundRepeat = 'no-repeat';
          image.style.backgroundColor = '#fff';
        }
        const label = document.createElement('span');
        label.textContent = labels[key];
        image.appendChild(label);
        card.prepend(image);
      });
    }

    if (empty && !empty.classList.contains('whats-on-empty')) {
      const copy = document.createElement('div');
      copy.className = 'whats-on-empty-copy';
      [...empty.childNodes].forEach(node => copy.appendChild(node));
      const art = document.createElement('div');
      art.className = 'whats-on-empty-art whats-on-empty-illustration';
      art.setAttribute('aria-hidden', 'true');
      empty.classList.add('whats-on-empty');
      empty.append(art, copy);
    }

    const panels = [...document.querySelectorAll('.reader-panel')];
    panels.forEach(panel => {
      const heading = panel.querySelector('h2');
      if (!heading || panel.querySelector('.whats-on-panel-icon')) return;
      const text = heading.textContent.trim();
      let marker = '';
      if (text.startsWith('Curated first')) marker = 'curated';
      if (text.startsWith('Send in a local event')) marker = 'submit';
      if (text.startsWith('Still looking')) {
        marker = 'next';
        panel.classList.add('whats-on-next-panel');
      }
      if (!marker) return;
      const markerWrap = document.createElement('div');
      markerWrap.className = `whats-on-panel-icon whats-on-marker-${marker}`;
      markerWrap.setAttribute('aria-hidden', 'true');
      panel.prepend(markerWrap);
    });
  };

  addPageVisuals();

  let events = [];
  let activeFilter = 'all';

  const localToday = () => {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit'
    }).formatToParts(new Date());
    const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
    return `${values.year}-${values.month}-${values.day}`;
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
    const now = parseDate(localToday());
    const day = now.getUTCDay();
    if (day === 0) return [now, now];
    const untilSaturday = (6 - day + 7) % 7;
    const saturday = new Date(now);
    saturday.setUTCDate(now.getUTCDate() + untilSaturday);
    const sunday = new Date(saturday);
    sunday.setUTCDate(saturday.getUTCDate() + 1);
    return [saturday, sunday];
  };

  const isFree = event => /(^|\b)free(\b|$)/i.test(String(event.cost || ''));
  const isFamily = event => /family|kids|children|storytime/i.test(`${event.category || ''} ${event.title || ''} ${event.description || ''}`);
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
    article.className = 'reader-story event-listing-card';

    const category = String(event.category || 'LOCAL EVENT').trim() || 'LOCAL EVENT';
    article.dataset.category = slugifyCategory(category);

    const imageUrl = safeUrl(event.image);
    if (imageUrl) {
      const visual = document.createElement('div');
      visual.className = 'reader-story-image';
      visual.style.backgroundImage = `url("${imageUrl}")`;
      const label = document.createElement('span');
      label.textContent = category;
      visual.appendChild(label);
      article.appendChild(visual);
    }

    const body = document.createElement('div');
    body.className = 'reader-story-body';
    const eyebrow = document.createElement('div');
    eyebrow.className = 'eyebrow';
    eyebrow.textContent = category;
    const heading = document.createElement('h3');
    heading.textContent = String(event.title || '');
    const when = [prettyDate(event.date), String(event.time || '').trim()].filter(Boolean).join(' · ');
    const metaText = [when, String(event.area || '').trim(), String(event.cost || '').trim()].filter(Boolean).join(' · ');
    const meta = document.createElement('p');
    meta.className = 'reader-meta';
    meta.textContent = metaText;
    const venue = document.createElement('p');
    venue.className = 'event-venue';
    venue.textContent = String(event.venue || '').trim();
    const description = document.createElement('p');
    description.textContent = String(event.description || '');
    body.append(eyebrow, heading, meta);
    if (venue.textContent) body.appendChild(venue);
    body.appendChild(description);

    const source = safeUrl(event.booking_url || event.source_url);
    if (source) {
      const link = document.createElement('a');
      link.className = 'reader-link';
      link.href = source;
      link.rel = 'noopener';
      link.textContent = 'Check current details →';
      body.appendChild(link);
    }

    article.appendChild(body);
    return article;
  };

  const render = () => {
    list.replaceChildren();
    const visible = events.filter(matches);
    visible.forEach(event => list.appendChild(eventCard(event)));
    if (empty) empty.hidden = visible.length > 0;
    if (status) status.textContent = visible.length
      ? `${visible.length} checked ${visible.length === 1 ? 'listing' : 'listings'} shown`
      : 'No checked listings match this view yet.';
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
