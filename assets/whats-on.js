(() => {
  const DATA_URL = '/data/events.json';
  const list = document.querySelector('[data-events-list]');
  const empty = document.querySelector('[data-events-empty]');
  const status = document.querySelector('[data-events-status]');
  const count = document.querySelector('[data-events-count]');
  const checked = document.querySelector('[data-events-checked]');
  const filters = [...document.querySelectorAll('[data-event-filter]')];
  const areaFilters = [...document.querySelectorAll('[data-event-area]')];
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
      ['weekend', 'free', 'family'].forEach(key => {
        const button = filterGrid.querySelector(`[data-event-filter="${key}"]`);
        const card = button && button.closest('.reader-story');
        if (!card || card.querySelector('.reader-story-image')) return;
        const visual = document.createElement('div');
        visual.className = 'reader-story-image';
        visual.style.backgroundImage = `url("${images[key]}")`;
        if (key === 'free') {
          visual.style.backgroundSize = 'contain';
          visual.style.backgroundRepeat = 'no-repeat';
          visual.style.backgroundColor = '#fff';
        }
        const label = document.createElement('span');
        label.textContent = labels[key];
        visual.appendChild(label);
        card.prepend(visual);
      });
    }

    if (empty && !empty.classList.contains('whats-on-empty')) {
      const copy = document.createElement('div');
      copy.className = 'whats-on-empty-copy';
      [...empty.childNodes].forEach(node => copy.appendChild(node));
      const art = document.createElement('div');
      art.className = 'whats-on-empty-art';
      art.setAttribute('aria-hidden', 'true');
      empty.classList.add('whats-on-empty');
      empty.append(art, copy);
    }
  };

  addPageVisuals();

  let events = [];
  let activeFilter = 'all';
  let activeArea = 'all';

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

  const dateParts = value => {
    const date = parseDate(value);
    if (!date) return { weekday: '', day: '', month: '' };
    const weekday = new Intl.DateTimeFormat('en-GB', { weekday: 'short', timeZone: 'UTC' }).format(date).toUpperCase();
    const day = new Intl.DateTimeFormat('en-GB', { day: 'numeric', timeZone: 'UTC' }).format(date);
    const month = new Intl.DateTimeFormat('en-GB', { month: 'short', timeZone: 'UTC' }).format(date).toUpperCase();
    return { weekday, day, month };
  };

  const prettyCheckedDate = value => {
    const date = parseDate(value);
    if (!date) return '';
    return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(date);
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

  const nextSevenDayBounds = () => {
    const start = parseDate(localToday());
    const end = new Date(start);
    end.setUTCDate(start.getUTCDate() + 6);
    return [start, end];
  };

  const isFree = event => /(^|\b)free(\b|$)/i.test(String(event.cost || ''));
  const isFamily = event => /family|kids|children|storytime/i.test(`${event.category || ''} ${event.title || ''} ${event.description || ''}`);
  const isToday = event => String(event.date || '') === localToday();
  const isWeekend = event => {
    const date = parseDate(event.date);
    if (!date) return false;
    const [start, end] = weekendBounds();
    return date >= start && date <= end;
  };
  const isNextSevenDays = event => {
    const date = parseDate(event.date);
    if (!date) return false;
    const [start, end] = nextSevenDayBounds();
    return date >= start && date <= end;
  };

  const matchesNeed = event => {
    if (activeFilter === 'free') return isFree(event);
    if (activeFilter === 'family') return isFamily(event);
    if (activeFilter === 'weekend') return isWeekend(event);
    if (activeFilter === 'today') return isToday(event);
    if (activeFilter === 'week') return isNextSevenDays(event);
    return true;
  };

  const matchesArea = event => activeArea === 'all' || String(event.area || '').trim().toLowerCase() === activeArea.toLowerCase();
  const matches = event => matchesNeed(event) && matchesArea(event);

  const fact = (label, value) => {
    const clean = String(value || '').trim();
    if (!clean) return null;
    const node = document.createElement('span');
    const key = document.createElement('b');
    key.textContent = label;
    node.append(key, document.createTextNode(clean));
    return node;
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

    const top = document.createElement('div');
    top.className = 'event-card-top';
    const parts = dateParts(event.date);
    const dateBlock = document.createElement('div');
    dateBlock.className = 'event-date-block';
    const weekday = document.createElement('span');
    weekday.textContent = isToday(event) ? 'TODAY' : parts.weekday;
    const day = document.createElement('strong');
    day.textContent = parts.day;
    const month = document.createElement('small');
    month.textContent = parts.month;
    dateBlock.append(weekday, day, month);

    const eyebrow = document.createElement('div');
    eyebrow.className = 'eyebrow';
    eyebrow.textContent = category;
    top.append(dateBlock, eyebrow);

    const heading = document.createElement('h3');
    heading.textContent = String(event.title || '');

    const facts = document.createElement('div');
    facts.className = 'event-facts';
    [fact('Time', event.time), fact('Area', event.area), fact('Cost', event.cost)].filter(Boolean).forEach(node => facts.appendChild(node));

    const venue = document.createElement('p');
    venue.className = 'event-venue';
    venue.textContent = String(event.venue || '').trim();

    const description = document.createElement('p');
    description.className = 'event-description';
    description.textContent = String(event.description || '');

    body.append(top, heading);
    if (facts.childElementCount) body.appendChild(facts);
    if (venue.textContent) body.appendChild(venue);
    body.appendChild(description);

    const source = safeUrl(event.booking_url || event.source_url);
    if (source) {
      const link = document.createElement('a');
      link.className = 'reader-link event-check-link';
      link.href = source;
      link.rel = 'noopener';
      link.textContent = 'Check current details →';
      link.addEventListener('click', () => {
        if (typeof window.sk8Track === 'function') {
          window.sk8Track('event_detail_click', {
            event_id: String(event.id || '').slice(0, 120),
            event_area: String(event.area || '').slice(0, 80),
            event_category: category.slice(0, 80)
          });
        }
      });
      body.appendChild(link);
    }

    article.appendChild(body);
    return article;
  };

  const filterLabel = () => {
    const labels = { all: 'all', today: 'today', week: 'next 7 days', weekend: 'weekend', free: 'free', family: 'family' };
    const need = labels[activeFilter] || activeFilter;
    if (activeArea === 'all') return need === 'all' ? '' : ` · ${need}`;
    return ` · ${activeArea}${need === 'all' ? '' : ` · ${need}`}`;
  };

  const updateFreshness = visible => {
    if (count) count.textContent = `${visible.length} current checked ${visible.length === 1 ? 'listing' : 'listings'}`;
    if (checked) {
      const latestChecked = events.map(event => String(event.checked || '')).filter(value => /^\d{4}-\d{2}-\d{2}$/.test(value)).sort().pop();
      checked.textContent = latestChecked ? `Sources checked through ${prettyCheckedDate(latestChecked)}` : 'Source dates checked before publication';
    }
  };

  const render = () => {
    list.replaceChildren();
    const visible = events.filter(matches);
    visible.forEach(event => list.appendChild(eventCard(event)));
    if (empty) empty.hidden = visible.length > 0;
    if (status) status.textContent = visible.length
      ? `${visible.length} ${visible.length === 1 ? 'result' : 'results'} shown${filterLabel()}`
      : `No checked listings match this view${filterLabel()}.`;
    updateFreshness(visible);
    filters.forEach(button => {
      const selected = button.dataset.eventFilter === activeFilter;
      button.setAttribute('aria-pressed', String(selected));
    });
    areaFilters.forEach(button => {
      const selected = button.dataset.eventArea === activeArea;
      button.setAttribute('aria-pressed', String(selected));
    });
  };

  const syncEventSchema = () => {
    document.getElementById('sk8-event-list-schema')?.remove();
    const schema = document.createElement('script');
    schema.type = 'application/ld+json';
    schema.id = 'sk8-event-list-schema';
    schema.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'Current checked events around SK8',
      itemListElement: events.map((event, index) => {
        const source = safeUrl(event.booking_url || event.source_url) || 'https://www.sk8scoop.com/whats-on/';
        const startDate = `${event.date}${event.time ? `T${event.time}:00` : ''}`;
        const item = {
          '@type': 'Event',
          name: String(event.title || ''),
          startDate,
          eventStatus: 'https://schema.org/EventScheduled',
          eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
          location: {
            '@type': 'Place',
            name: String(event.venue || event.area || 'SK8'),
            address: String(event.area || '')
          },
          url: source,
          description: String(event.description || '')
        };
        if (isFree(event)) item.offers = { '@type': 'Offer', price: '0', priceCurrency: 'GBP', url: source, availability: 'https://schema.org/InStock' };
        return { '@type': 'ListItem', position: index + 1, item };
      })
    });
    document.head.appendChild(schema);
  };

  const jumpToResults = () => {
    const target = document.getElementById('current-listings');
    if (!target) return;
    const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
  };

  filters.forEach(button => button.addEventListener('click', () => {
    activeFilter = button.dataset.eventFilter || 'all';
    render();
    if (button.dataset.eventJump === 'results') window.requestAnimationFrame(jumpToResults);
  }));
  areaFilters.forEach(button => button.addEventListener('click', () => {
    activeArea = button.dataset.eventArea || 'all';
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
      syncEventSchema();
      render();
    })
    .catch(error => {
      console.error('SK8 What’s On data failed to load', error);
      if (status) status.textContent = 'Current listings could not be loaded.';
      if (count) count.textContent = 'Listings unavailable';
      if (checked) checked.textContent = 'Please try again shortly';
      if (empty) empty.hidden = false;
    });
})();
