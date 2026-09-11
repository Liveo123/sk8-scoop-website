(() => {
  const eventsSection = document.querySelector('[data-family-events-section]');
  const eventsGrid = document.querySelector('[data-family-events-grid]');
  const eventsIntro = document.querySelector('[data-family-events-intro]');
  if (!eventsSection || !eventsGrid) return;

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

  const eventCard = event => {
    const article = document.createElement('article');
    article.className = 'reader-story family-event-card';

    const top = document.createElement('div');
    top.className = 'family-event-top';

    const meta = document.createElement('div');
    meta.className = 'family-event-meta';
    const area = document.createElement('span');
    area.className = 'family-event-area';
    area.textContent = String(event.area || 'Nearby').trim();
    const stamp = document.createElement('span');
    stamp.className = 'family-event-stamp';
    stamp.textContent = 'WHAT’S ON';
    meta.append(area, stamp);

    const date = document.createElement('strong');
    date.className = 'family-event-date';
    date.textContent = prettyDate(event.date);

    const time = document.createElement('span');
    time.className = 'family-event-time';
    time.textContent = [String(event.time || '').trim(), String(event.cost || '').trim()].filter(Boolean).join(' · ');

    top.append(meta, date, time);

    const body = document.createElement('div');
    body.className = 'reader-story-body';
    const eyebrow = document.createElement('div');
    eyebrow.className = 'family-event-eyebrow';
    eyebrow.textContent = 'FAMILY';
    const heading = document.createElement('h3');
    heading.textContent = String(event.title || 'Family event');
    const venue = document.createElement('p');
    venue.className = 'family-event-venue';
    venue.textContent = String(event.venue || '').trim();
    const description = document.createElement('p');
    description.textContent = String(event.description || '');
    body.append(eyebrow, heading);
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

    article.append(top, body);
    return article;
  };

  fetch('/data/events.json', { cache: 'no-store' })
    .then(response => {
      if (!response.ok) throw new Error(`Events data returned ${response.status}`);
      return response.json();
    })
    .then(data => {
      const today = localToday();
      const upcoming = (Array.isArray(data) ? data : [])
        .filter(event => event && event.status !== 'example')
        .filter(event => String(event.category || '').toLowerCase() === 'family')
        .filter(event => /^\d{4}-\d{2}-\d{2}$/.test(String(event.date || '')) && event.date >= today)
        .sort((a, b) => `${a.date || ''} ${a.time || ''}`.localeCompare(`${b.date || ''} ${b.time || ''}`));

      if (!upcoming.length) return;

      if (eventsIntro) {
        const freeCount = upcoming.filter(event => /(^|\b)free(\b|$)/i.test(String(event.cost || ''))).length;
        eventsIntro.textContent = `${upcoming.length} checked family ${upcoming.length === 1 ? 'event is' : 'events are'} coming up${freeCount ? `, including ${freeCount} listed as free` : ''}. These come from the same checked What’s On data and disappear automatically once their date has passed.`;
      }

      eventsGrid.replaceChildren();
      upcoming.slice(0, 6).forEach(event => eventsGrid.appendChild(eventCard(event)));
      eventsSection.hidden = false;
    })
    .catch(error => {
      console.error('SK8 Kids & Family event data failed to load', error);
    });
})();
