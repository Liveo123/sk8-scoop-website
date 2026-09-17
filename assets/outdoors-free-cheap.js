(() => {
  const section = document.querySelector('#outdoor-picks');
  if (!section) return;

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
      const item = (Array.isArray(data.items) ? data.items : [])
        .find(record => record && record.id === 'gatley-carrs' && record.verification_status === 'VERIFIED');
      if (!item) return;

      const cards = [...section.querySelectorAll('.reader-story')];
      const accessCard = cards.find(card => /start at the carrs itself/i.test(card.querySelector('h3')?.textContent || ''));
      if (accessCard) {
        accessCard.dataset.freeCheapId = item.id;
        const place = accessCard.querySelector('.outdoor-feature-place');
        const value = accessCard.querySelector('.outdoor-feature-value');
        const title = accessCard.querySelector('.outdoor-feature-title');
        const detail = accessCard.querySelector('.outdoor-feature-detail');
        const copy = accessCard.querySelector('.reader-story-body p');
        const official = accessCard.querySelector('.reader-link');

        if (place) place.textContent = item.area || 'Reserve access';
        if (value) value.textContent = item.postcode || '';
        if (title) title.textContent = 'Brookside Road';
        if (detail) detail.textContent = item.card_detail || (Array.isArray(item.caveats) && item.caveats[0] ? item.caveats[0] : item.cost_text || '');
        if (copy) copy.textContent = `${item.summary || ''}${item.access_text ? ` ${item.access_text}` : ''}`.trim();
        if (official && item.official_url) {
          official.href = item.official_url;
          official.rel = 'noopener';
          official.textContent = 'Check local access details →';
        }
      }

      const checked = section.querySelector('.reader-section-head .eyebrow');
      const checkedDate = prettyCheckedDate(data.checked_date);
      if (checked && checkedDate) checked.textContent = `Checked ${checkedDate}`;
    })
    .catch(error => {
      console.error('SK8 shared Free & Cheap data failed to hydrate Outdoors', error);
    });
})();
