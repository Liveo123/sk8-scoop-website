(() => {
  const DATA_URL = '/data/events.json';
  const list = document.querySelector('[data-events-list]');
  const empty = document.querySelector('[data-events-empty]');
  const status = document.querySelector('[data-events-status]');
  const filters = [...document.querySelectorAll('[data-event-filter]')];
  if (!list) return;

  const iconSvg = key => {
    const icons = {
      calendar: '<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="8" y="11" width="32" height="28" rx="4"/><path d="M15 7v8M33 7v8M8 19h32M16 27l5 5 11-11"/></svg>',
      submit: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M8 14h24l8 8-8 8H8V14Z"/><path d="M16 22h13M14 36h22"/></svg>',
      compass: '<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="17"/><path d="m30 18-4 9-9 4 4-9 9-4Z"/></svg>',
      family: '<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="17" cy="15" r="5"/><circle cx="32" cy="17" r="4"/><path d="M8 39c1-9 5-14 10-14s9 5 10 14M25 39c1-7 4-11 8-11 4 0 7 4 8 11"/></svg>',
      food: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M14 7v14M20 7v14M14 14h6M17 21v20M31 7v34M31 7c5 5 6 12 2 17h-2"/></svg>',
      music: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M19 34V13l20-4v21"/><circle cx="14" cy="35" r="5"/><circle cx="34" cy="31" r="5"/></svg>',
      outdoors: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M6 38 19 17l7 10 5-7 11 18H6Z"/><path d="M19 17 23 9l5 8"/></svg>',
      market: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M8 19h32l-4-10H12L8 19Z"/><path d="M11 19v20h26V19M17 39V27h14v12"/></svg>',
      history: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M8 14h23v23H8zM12 10h23v23"/><path d="M14 21h11M14 27h8"/><circle cx="34" cy="34" r="7"/><path d="m39 39 5 5"/></svg>',
      community: '<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="17" cy="16" r="5"/><circle cx="32" cy="16" r="5"/><circle cx="24" cy="27" r="4"/><path d="M7 38c1-7 5-11 10-11M41 38c-1-7-5-11-10-11M15 41c1-6 4-9 9-9s8 3 9 9"/></svg>',
      wellness: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 40C13 33 8 26 8 18c0-6 4-10 9-10 4 0 6 2 7 5 2-3 4-5 8-5 5 0 8 4 8 9 0 9-7 16-16 23Z"/><path d="M24 35V20M24 27c-5 0-8-3-9-7M24 24c4 0 7-2 9-6"/></svg>',
      default: '<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="9" y="10" width="30" height="29" rx="4"/><path d="M15 7v7M33 7v7M9 19h30M16 27h7M27 27h5M16 33h10"/></svg>'
    };
    return icons[key] || icons.default;
  };

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

  const categoryIconKey = event => {
    const haystack = `${event.category || ''} ${event.title || ''} ${event.description || ''}`.toLowerCase();
    if (/family|kids|children|storytime/.test(haystack)) return 'family';
    if (/food|drink|cafe|restaurant|snack/.test(haystack)) return 'food';
    if (/music|concert|gig|disco/.test(haystack)) return 'music';
    if (/walk|park|outdoor|nature/.test(haystack)) return 'outdoors';
    if (/market|fair|makers/.test(haystack)) return 'market';
    if (/history|heritage|museum|hatting/.test(haystack)) return 'history';
    if (/wellness|yoga|health/.test(haystack)) return 'wellness';
    if (/community|brew|biscuit|social/.test(haystack)) return 'community';
    return 'default';
  };

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
      art.innerHTML = `${iconSvg('calendar')}<span class="empty-map-dot dot-one"></span><span class="empty-map-dot dot-two"></span><span class="empty-route"></span>`;
      empty.classList.add('whats-on-empty');
      empty.append(art, copy);
    }

    const panels = [...document.querySelectorAll('.reader-panel')];
    panels.forEach(panel => {
      const heading = panel.querySelector('h2');
      if (!heading || panel.querySelector('.whats-on-panel-icon')) return;
      const text = heading.textContent.trim();
      let icon = '';
      if (text.startsWith('Curated first')) icon = 'calendar';
      if (text.startsWith('Send in a local event')) icon = 'submit';
      if (text.startsWith('Still looking')) {
        icon = 'compass';
        panel.classList.add('whats-on-next-panel');
      }
      if (!icon) return;
      const iconWrap = document.createElement('div');
      iconWrap.className = 'whats-on-panel-icon';
      iconWrap.setAttribute('aria-hidden', 'true');
      iconWrap.innerHTML = iconSvg(icon);
      panel.prepend(iconWrap);
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
    const now = new Date(`${localToday()}T12:00:00Z`);
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
    article.className = 'reader-story';

    const imageUrl = safeUrl(event.image);
    if (imageUrl) {
      const visual = document.createElement('div');
      visual.className = 'reader-story-image';
      visual.style.backgroundImage = `url("${imageUrl}")`;
      const label = document.createElement('span');
      label.textContent = String(event.category || 'LOCAL EVENT');
      visual.appendChild(label);
      article.appendChild(visual);
    } else {
      const iconKey = categoryIconKey(event);
      const visual = document.createElement('div');
      visual.className = `event-icon-visual event-icon-${iconKey}`;
      visual.setAttribute('aria-hidden', 'true');
      visual.innerHTML = `<span class="event-icon-ring">${iconSvg(iconKey)}</span>`;
      article.appendChild(visual);
    }

    const body = document.createElement('div');
    body.className = 'reader-story-body';
    const eyebrow = document.createElement('div');
    eyebrow.className = 'eyebrow';
    eyebrow.textContent = String(event.category || 'LOCAL EVENT');
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
