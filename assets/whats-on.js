(() => {
  const DATA_URL = '/data/events.json';
  const list = document.querySelector('[data-events-list]');
  const empty = document.querySelector('[data-events-empty]');
  const status = document.querySelector('[data-events-status]');
  const filters = [...document.querySelectorAll('[data-event-filter]')];
  if (!list) return;

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
    article.innerHTML = `<div class="reader-story-body">
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
