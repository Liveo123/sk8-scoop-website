(() => {
  const summaryCard = document.querySelector('[data-food-event-summary]');
  const countText = document.querySelector('[data-food-event-count]');
  const nextDateText = document.querySelector('[data-food-event-next-date]');
  const summaryCopy = document.querySelector('[data-food-event-summary-copy]');
  const eventsSection = document.querySelector('[data-food-events-section]');
  const eventsGrid = document.querySelector('[data-food-events-grid]');

  if (!summaryCard && !eventsSection) return;

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
    article.className = 'reader-story food-event-card';

    const visual = document.createElement('div');
    visual.className = 'food-event-date-block';
    const kicker = document.createElement('span');
    kicker.className = 'category-stat-kicker';
    kicker.textContent = String(event.area || 'Nearby').trim();
    const date = document.createElement('strong');
    date.textContent = prettyDate(event.date);
    const time = document.createElement('small');
    time.textContent = [String(event.time || '').trim(), String(event.cost || '').trim()].filter(Boolean).join(' · ');
    visual.append(kicker, date, time);

    const body = document.createElement('div');
    body.className = 'reader-story-body';
    const eyebrow = document.createElement('div');
    eyebrow.className = 'eyebrow food-event-eyebrow';
    eyebrow.textContent = 'FOOD & DRINK';
    const heading = document.createElement('h3');
    heading.textContent = String(event.title || 'Food event');
    const venue = document.createElement('p');
    venue.className = 'food-event-venue';
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

    article.append(visual, body);
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
        .filter(event => String(event.category || '').toLowerCase() === 'food & drink')
        .filter(event => /^\d{4}-\d{2}-\d{2}$/.test(String(event.date || '')) && event.date >= today)
        .sort((a, b) => `${a.date || ''} ${a.time || ''}`.localeCompare(`${b.date || ''} ${b.time || ''}`));

      if (!upcoming.length) return;

      const first = upcoming[0];
      if (countText) countText.textContent = String(upcoming.length);
      if (nextDateText) nextDateText.textContent = `Next: ${prettyDate(first.date)}`;
      if (summaryCopy) {
        const place = String(first.area || '').trim();
        summaryCopy.textContent = `Next up is ${String(first.title || 'a checked food event')}${place ? ` in ${place}` : ''}. The list below updates from What’s On as new checked events are added.`;
      }
      if (summaryCard) summaryCard.hidden = false;

      if (eventsGrid) {
        eventsGrid.replaceChildren();
        upcoming.slice(0, 4).forEach(event => eventsGrid.appendChild(eventCard(event)));
      }
      if (eventsSection) eventsSection.hidden = false;
    })
    .catch(error => {
      console.error('SK8 Food & Drink event data failed to load', error);
    });
})();