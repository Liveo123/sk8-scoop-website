(() => {
  const unlockBlocks = [...document.querySelectorAll('[data-subscriber-unlocked]')];
  const lockedBlocks = [...document.querySelectorAll('[data-subscriber-locked]')];
  const shelf = document.querySelector('[data-subscriber-shelf]');
  const shelfLocked = document.querySelector('[data-subscriber-shelf-locked]');
  const shelfUnlocked = document.querySelector('[data-subscriber-shelf-unlocked]');

  const track = (name, params = {}) => {
    if (typeof window.sk8Track === 'function') window.sk8Track(name, params);
  };

  const setState = active => {
    document.querySelectorAll('[data-subscriber-guide]').forEach(el => {
      const target = String(el.dataset.subscriberGuide || '');
      if (active && target.startsWith('/')) el.setAttribute('href', target);
      else el.removeAttribute('href');
    });
    unlockBlocks.forEach(el => { el.hidden = !active; });
    lockedBlocks.forEach(el => { el.hidden = active; });
    if (shelf) shelf.dataset.subscriberState = active ? 'unlocked' : 'locked';
    if (shelfLocked) shelfLocked.hidden = active;
    if (shelfUnlocked) shelfUnlocked.hidden = !active;
    document.documentElement.dataset.sk8SubscriberAccess = active ? 'true' : 'false';
    if (shelf) track('subscriber_shelf_view', { access_state: active ? 'unlocked' : 'locked' });
  };

  window.addEventListener('sk8:subscriber-preview-unlocked', () => setState(true));
  document.addEventListener('sk8:subscriber-preview-unlocked', () => setState(true));

  document.addEventListener('click', event => {
    const link = event.target.closest && event.target.closest('[data-subscriber-guide], [data-subscriber-guide-open]');
    if (!link) return;
    track('subscriber_guide_open', {
      guide: String(link.dataset.subscriberGuide || link.dataset.subscriberGuideOpen || '').slice(0, 120),
      source: location.pathname.slice(0, 120)
    });
  });

  fetch('/api/subscriber-access-status', {
    headers: { accept: 'application/json' },
    credentials: 'same-origin',
    cache: 'no-store'
  })
    .then(response => response.ok ? response.json() : Promise.reject(new Error('status unavailable')))
    .then(result => setState(result && result.active === true))
    .catch(() => setState(false));
})();