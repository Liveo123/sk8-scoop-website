(() => {
  const card = document.querySelector('[data-food-event-card]');
  if (!card) return;

  const title = card.querySelector('[data-food-event-title]');
  const dateText = card.querySelector('[data-food-event-date]');
  const timeText = card.querySelector('[data-food-event-time]');
  const placeText = card.querySelector('[data-food-event-place]');
  const description = card.querySelector('[data-food-event-description]');
  const link = card.querySelector('[data-food-event-link]');

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

      const event = upcoming[0];
      if (!event) return;

      if (title) title.textContent = String(event.title || 'Next food event');
      if (dateText) dateText.textContent = prettyDate(event.date);
      if (timeText) {
        const bits = [String(event.time || '').trim(), String(event.cost || '').trim()].filter(Boolean);
        timeText.textContent = bits.join(' · ');
      }
      if (placeText) {
        const bits = [String(event.area || '').trim(), String(event.venue || '').trim()].filter(Boolean);
        placeText.textContent = bits.join(' · ');
      }
      if (description) description.textContent = String(event.description || '');

      const source = safeUrl(event.booking_url || event.source_url);
      if (link && source) {
        link.href = source;
        link.hidden = false;
      } else if (link) {
        link.hidden = true;
      }

      card.hidden = false;
    })
    .catch(error => {
      console.error('SK8 Food & Drink event data failed to load', error);
    });
})();
