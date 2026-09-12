(() => {
  const grid = document.querySelector('[data-surface-grid]');
  if (!grid) return;

  fetch('/data/advertising-surfaces.json', { cache: 'no-store' })
    .then(response => {
      if (!response.ok) throw new Error(`Advertising surface data returned ${response.status}`);
      return response.json();
    })
    .then(items => {
      grid.replaceChildren();
      (Array.isArray(items) ? items : []).forEach(item => {
        const article = document.createElement('article');
        article.className = 'surface-card';
        article.dataset.status = item.status || '';

        const status = document.createElement('span');
        status.className = 'surface-status';
        status.textContent = item.label || item.status || '';

        const heading = document.createElement('h2');
        heading.textContent = item.name || '';

        const role = document.createElement('p');
        role.textContent = item.role || '';

        const best = document.createElement('p');
        best.className = 'surface-best';
        best.innerHTML = `<strong>Best for:</strong> ${String(item.best_for || '')}`;

        const note = document.createElement('p');
        note.className = 'surface-note';
        note.textContent = item.commercial_note || '';

        article.append(status, heading, role, best, note);
        grid.appendChild(article);
      });
    })
    .catch(error => {
      console.error('Advertising surface map failed to load', error);
      grid.innerHTML = '<article class="surface-card"><span class="surface-status">Temporarily unavailable</span><h2>Surface map could not be loaded</h2><p>The standard advertising enquiry is still available.</p></article>';
    });
})();
