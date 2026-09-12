(() => {
  const londonDate = () => {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/London',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).formatToParts(new Date());
    const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
    return `${values.year}-${values.month}-${values.day}`;
  };

  const parseIsoDay = value => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) return null;
    const [year, month, day] = String(value).split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day));
  };

  const dayDiff = (from, to) => {
    const start = parseIsoDay(from);
    const end = parseIsoDay(to);
    if (!start || !end) return null;
    return Math.round((end - start) / 86400000);
  };

  const prettyBadgeDate = value => {
    const date = parseIsoDay(value);
    if (!date) return '';
    return new Intl.DateTimeFormat('en-GB', {
      weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC'
    }).format(date).toUpperCase();
  };

  const today = londonDate();
  const spotlight = document.querySelector('#weekend-spotlight');

  if (spotlight) {
    const grid = spotlight.querySelector('.nue-spotlight-grid');
    const heading = spotlight.querySelector('.nue-spotlight-head h2');
    const intro = spotlight.querySelector('.nue-spotlight-head p');
    const cards = [...spotlight.querySelectorAll('.nue-feature-card')];

    if (grid && cards.length) {
      let visibleCount = 0;

      cards.forEach(card => {
        const eventDate = card.dataset.eventDate;
        const difference = dayDiff(today, eventDate);
        const badge = card.querySelector('.nue-feature-card-badge');

        if (difference === null) return;
        if (difference < 0) {
          card.hidden = true;
          return;
        }

        card.hidden = false;
        visibleCount += 1;
        if (badge) {
          if (difference === 0) badge.textContent = 'TODAY';
          else if (difference === 1) badge.textContent = 'TOMORROW';
          else badge.textContent = prettyBadgeDate(eventDate);
        }
      });

      if (visibleCount === 0) {
        grid.hidden = true;
        spotlight.querySelector('.nue-spotlight-head')?.setAttribute('hidden', '');
      } else {
        grid.hidden = false;
        if (heading) heading.textContent = visibleCount === 1
          ? 'One thing actually worth knowing about this weekend'
          : `${visibleCount} things actually worth knowing about this weekend`;
        if (intro) intro.textContent = visibleCount === 1
          ? 'A current checked pick, with the useful details first and a deeper page if you want more.'
          : 'Fast decisions first: current checked picks, with deeper pages if you want the useful details.';
      }
    }
  }

  const list = document.querySelector('[data-events-list]');
  if (!list) return;

  const normalisePath = value => {
    try {
      const path = new URL(String(value || ''), window.location.origin).pathname;
      return path.endsWith('/') ? path : `${path}/`;
    } catch (_) {
      return '';
    }
  };

  const syncListingBadges = eventMap => {
    list.querySelectorAll('.event-listing-card').forEach(card => {
      const detailLink = card.querySelector('h3 a[href]');
      const event = detailLink && eventMap.get(normalisePath(detailLink.href));
      if (!event || !/^(TODAY|TOMORROW)$/i.test(String(event.card_badge || ''))) return;

      const badge = card.querySelector('.reader-story-image > span');
      const difference = dayDiff(today, event.date);
      if (!badge || difference === null) return;

      if (difference === 0) badge.textContent = 'TODAY';
      else if (difference === 1) badge.textContent = 'TOMORROW';
      else if (difference > 1) badge.textContent = prettyBadgeDate(event.date);
    });
  };

  fetch('/data/events.json', { cache: 'no-store' })
    .then(response => response.ok ? response.json() : Promise.reject(new Error(`Events data returned ${response.status}`)))
    .then(data => {
      const eventMap = new Map((Array.isArray(data) ? data : [])
        .filter(event => event && event.detail_url)
        .map(event => [normalisePath(event.detail_url), event]));
      const sync = () => syncListingBadges(eventMap);
      sync();
      new MutationObserver(sync).observe(list, { childList: true, subtree: true });
    })
    .catch(error => console.warn('SK8 NUE date labels could not be refreshed', error));
})();