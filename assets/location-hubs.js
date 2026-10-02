(() => {
  const root = document.querySelector('[data-local-events]');
  const status = document.querySelector('[data-local-events-status]');
  const area = String(document.body.dataset.location || '').trim();
  if (!root || !area) return;

  const localToday = () => {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit'
    }).formatToParts(new Date());
    const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
    return `${values.year}-${values.month}-${values.day}`;
  };

  const prettyDate = value => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) return '';
    const [year, month, day] = String(value).split('-').map(Number);
    return new Intl.DateTimeFormat('en-GB', {
      weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC'
    }).format(new Date(Date.UTC(year, month - 1, day)));
  };

  const safeUrl = value => {
    try {
      const url = new URL(String(value || ''), window.location.origin);
      return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
    } catch (_) { return ''; }
  };

  const renderEvent = event => {
    const article = document.createElement('article');
    article.className = 'locality-event-card';
    const meta = document.createElement('div');
    meta.className = 'locality-event-meta';
    meta.textContent = [event.date_range || prettyDate(event.date), event.time, event.cost].filter(Boolean).join(' · ');
    const title = document.createElement('h3');
    title.textContent = event.title || '';
    const venue = document.createElement('p');
    venue.className = 'locality-event-venue';
    venue.textContent = event.venue || '';
    const description = document.createElement('p');
    description.textContent = event.description || '';
    article.append(meta, title);
    if (venue.textContent) article.appendChild(venue);
    article.appendChild(description);
    const url = safeUrl(event.booking_url || event.source_url);
    if (url) {
      const link = document.createElement('a');
      link.className = 'reader-link';
      link.href = url;
      link.rel = 'noopener';
      link.textContent = 'Check current details →';
      article.appendChild(link);
    }
    return article;
  };

  fetch('/data/events.json', { cache: 'no-store' })
    .then(response => response.ok ? response.json() : Promise.reject(new Error('events failed')))
    .then(data => {
      const today = localToday();
      const events = (Array.isArray(data) ? data : [])
        .filter(event => event && event.status !== 'example')
        .filter(event => String(event.area || '').trim().toLowerCase() === area.toLowerCase())
        .filter(event => /^\d{4}-\d{2}-\d{2}$/.test(String(event.date || '')) && String(event.end_date || event.date) >= today)
        .sort((a, b) => `${a.date || ''} ${a.time || ''}`.localeCompare(`${b.date || ''} ${b.time || ''}`))
        .slice(0, 3);
      root.replaceChildren();
      events.forEach(event => root.appendChild(renderEvent(event)));
      if (status) status.textContent = events.length
        ? `${events.length} next checked ${events.length === 1 ? 'listing' : 'listings'} in ${area}`
        : `No current checked ${area} listings in the short list right now.`;
      if (!events.length) {
        const fallback = document.createElement('div');
        fallback.className = 'reader-panel locality-events-empty';
        fallback.innerHTML = `<h3>No padding with stale events.</h3><p>Use the full What’s On page for nearby listings, or come back when a new ${area} event has been checked.</p><a class="button small-button" href="/whats-on/?area=${encodeURIComponent(area)}">Open What’s On</a>`;
        root.appendChild(fallback);
      }
    })
    .catch(() => {
      if (status) status.textContent = 'Current local listings could not be loaded just now.';
    });
})();