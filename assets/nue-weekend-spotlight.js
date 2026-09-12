(() => {
  const spotlight = document.querySelector('#weekend-spotlight');
  if (!spotlight) return;

  const grid = spotlight.querySelector('.nue-spotlight-grid');
  const heading = spotlight.querySelector('.nue-spotlight-head h2');
  const intro = spotlight.querySelector('.nue-spotlight-head p');
  const cards = [...spotlight.querySelectorAll('.nue-feature-card')];
  if (!grid || !cards.length) return;

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

  const today = londonDate();
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
      else badge.textContent = new Intl.DateTimeFormat('en-GB', {
        weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC'
      }).format(parseIsoDay(eventDate)).toUpperCase();
    }
  });

  if (visibleCount === 0) {
    grid.hidden = true;
    spotlight.querySelector('.nue-spotlight-head')?.setAttribute('hidden', '');
    return;
  }

  grid.hidden = false;
  if (heading) heading.textContent = visibleCount === 1
    ? 'One thing actually worth knowing about this weekend'
    : `${visibleCount} things actually worth knowing about this weekend`;
  if (intro) intro.textContent = visibleCount === 1
    ? 'A current checked pick, with the useful details first and a deeper page if you want more.'
    : 'Fast decisions first: current checked picks, with deeper pages if you want the useful details.';
})();