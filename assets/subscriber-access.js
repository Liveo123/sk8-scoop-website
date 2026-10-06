(() => {
  const unlockBlocks = [...document.querySelectorAll('[data-subscriber-unlocked]')];
  const lockedBlocks = [...document.querySelectorAll('[data-subscriber-locked]')];
  const shelf = document.querySelector('[data-subscriber-shelf]');
  const shelfLocked = document.querySelector('[data-subscriber-shelf-locked]');
  const shelfUnlocked = document.querySelector('[data-subscriber-shelf-unlocked]');

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
  };

  fetch('/api/subscriber-access-status', {
    headers: { accept: 'application/json' },
    credentials: 'same-origin',
    cache: 'no-store'
  })
    .then(response => response.ok ? response.json() : Promise.reject(new Error('status unavailable')))
    .then(result => setState(result && result.active === true))
    .catch(() => setState(false));
})();