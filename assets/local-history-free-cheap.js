(() => {
  const caseboard = document.querySelector('.history-caseboard-section');
  if (!caseboard) return;

  const safeUrl = value => {
    try {
      const url = new URL(String(value || ''), window.location.origin);
      return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
    } catch (_) {
      return '';
    }
  };

  const prettyCheckedDate = value => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) return '';
    const [year, month, day] = value.split('-').map(Number);
    return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
      .format(new Date(Date.UTC(year, month - 1, day)));
  };

  fetch('/data/free-cheap.json', { cache: 'no-store' })
    .then(response => {
      if (!response.ok) throw new Error(`Free & Cheap data returned ${response.status}`);
      return response.json();
    })
    .then(data => {
      const items = (Array.isArray(data.items) ? data.items : [])
        .filter(item => item && item.verification_status === 'VERIFIED')
        .filter(item => Array.isArray(item.nue_surfaces) && item.nue_surfaces.includes('local-history'));
      if (!items.length) return;

      const section = document.createElement('section');
      section.className = 'section';
      section.dataset.freeCheapHistory = 'true';

      const wrap = document.createElement('div');
      wrap.className = 'wrap';
      const panel = document.createElement('div');
      panel.className = 'reader-panel';

      const eyebrow = document.createElement('div');
      eyebrow.className = 'eyebrow';
      eyebrow.textContent = 'Free & Cheap × Local History';
      const heading = document.createElement('h2');
      heading.textContent = 'Want some local history you can actually walk into?';
      const intro = document.createElement('p');
      const checked = prettyCheckedDate(data.checked_date);
      intro.textContent = `These free-entry history options come from the same verified Free & Cheap records used elsewhere in NUE${checked ? `, checked ${checked}` : ''}.`;

      const grid = document.createElement('div');
      grid.className = 'reader-route-grid';
      items.slice(0, 4).forEach(item => {
        const source = safeUrl(item.official_url);
        if (!source) return;
        const card = document.createElement('a');
        card.className = 'reader-route';
        card.href = source;
        card.rel = 'noopener';
        card.dataset.freeCheapId = item.id;

        const kicker = document.createElement('div');
        kicker.className = 'eyebrow';
        kicker.textContent = `${item.cost_band || 'VALUE'} · ${item.area || ''}`;
        const title = document.createElement('h3');
        title.textContent = item.title || '';
        const copy = document.createElement('p');
        copy.textContent = item.summary || item.cost_text || '';
        const detail = document.createElement('span');
        detail.className = 'reader-link';
        detail.textContent = `${item.card_detail || 'Check current details'} →`;
        card.append(kicker, title, copy, detail);
        grid.appendChild(card);
      });

      const actions = document.createElement('div');
      actions.className = 'button-row';
      const guide = document.createElement('a');
      guide.className = 'button';
      guide.href = '/free-cheap-guide/';
      guide.textContent = 'Open Free & Cheap';
      const whatsOn = document.createElement('a');
      whatsOn.className = 'button secondary';
      whatsOn.href = '/whats-on/';
      whatsOn.textContent = 'See What’s On';
      actions.append(guide, whatsOn);

      panel.append(eyebrow, heading, intro, grid, actions);
      wrap.appendChild(panel);
      section.appendChild(wrap);
      caseboard.insertAdjacentElement('afterend', section);
    })
    .catch(error => {
      console.error('SK8 shared Free & Cheap data failed to hydrate Local History', error);
    });
})();
