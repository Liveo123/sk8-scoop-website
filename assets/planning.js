(() => {
  const cards = [...document.querySelectorAll('[data-deadline]')];
  if (!cards.length) return;

  const londonToday = () => {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit'
    }).formatToParts(new Date());
    const value = Object.fromEntries(parts.map(part => [part.type, part.value]));
    return `${value.year}-${value.month}-${value.day}`;
  };

  const toUtc = value => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) return null;
    const [year, month, day] = String(value).split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day));
  };

  const daysBetween = (start, end) => Math.round((end - start) / 86400000);
  const today = toUtc(londonToday());

  cards.forEach(card => {
    const deadline = toUtc(card.dataset.deadline);
    const state = card.querySelector('[data-deadline-state]');
    if (!deadline || !state || !today) return;

    const days = daysBetween(today, deadline);
    card.classList.remove('is-open', 'is-today', 'is-closed');

    if (days < 0) {
      card.classList.add('is-closed');
      state.textContent = 'Closed';
      return;
    }

    if (days === 0) {
      card.classList.add('is-today');
      state.textContent = 'Closes today';
      return;
    }

    card.classList.add('is-open');
    state.textContent = days === 1 ? '1 day left' : `${days} days left`;
  });
})();
