(() => {
  const root = document.querySelector('[data-feature-root]');
  if (!root) return;

  const featureId = root.dataset.featureId || document.body.dataset.featureId || '';
  const text = (selector, value) => {
    const node = root.querySelector(selector);
    if (node) node.textContent = String(value || '');
  };
  const href = (selector, value) => {
    const node = root.querySelector(selector);
    if (node && value) node.href = value;
  };

  const renderError = () => {
    root.innerHTML = '<div class="feature-error"><div class="eyebrow">Feature unavailable</div><h1>This local feature could not be loaded.</h1><p>Try the current What’s On page or the latest newsletter instead.</p><div class="button-row"><a class="button" href="/whats-on/">See What’s On</a><a class="button secondary" href="/latest">Latest Scoop</a></div></div>';
  };

  fetch('/data/features.json', { cache: 'no-store' })
    .then(response => {
      if (!response.ok) throw new Error(`Feature data returned ${response.status}`);
      return response.json();
    })
    .then(items => {
      const feature = (Array.isArray(items) ? items : []).find(item => item.id === featureId || item.slug === featureId);
      if (!feature) throw new Error(`Feature ${featureId} not found`);

      document.title = `${feature.title} | SK8 Scoop`;
      const description = document.querySelector('meta[name="description"]');
      if (description) description.content = feature.dek || feature.why_it_matters || '';

      text('[data-feature-label]', feature.label);
      text('[data-feature-title]', feature.title);
      text('[data-feature-dek]', feature.dek);
      text('[data-feature-date]', feature.date_display);
      text('[data-feature-area]', feature.area);
      text('[data-feature-cost]', feature.cost);
      text('[data-feature-type]', feature.category);
      text('[data-feature-caption]', feature.image_credit);
      text('[data-feature-best]', feature.best_for);
      text('[data-feature-why]', feature.why_it_matters);
      text('[data-feature-when]', feature.when_to_go);
      text('[data-feature-venue]', feature.venue);
      text('[data-feature-time]', feature.time_display);
      text('[data-feature-source-note]', `Source checked ${feature.source_checked_at || 'recently'}. Event details can change, so check the organiser before setting off.`);

      href('[data-feature-source]', feature.source_url);
      text('[data-feature-source-label]', `${feature.source_label || 'Check current details'} →`);
      href('[data-feature-issue]', feature.issue_url);
      text('[data-feature-issue-label]', `Read Issue ${feature.issue_number || ''} in full →`);

      const image = root.querySelector('[data-feature-image]');
      if (image) {
        image.src = feature.image || feature.image_fallback || '';
        image.alt = feature.image_alt || '';
        if (feature.image_fallback) {
          image.addEventListener('error', () => {
            if (image.dataset.fallbackUsed === '1') return;
            image.dataset.fallbackUsed = '1';
            image.src = feature.image_fallback;
          }, { once: true });
        }
      }

      const article = root.querySelector('[data-feature-article]');
      if (article) {
        article.replaceChildren();
        const heading = document.createElement('h2');
        heading.textContent = 'What to know before you go';
        article.appendChild(heading);
        (feature.summary || []).forEach(paragraph => {
          const p = document.createElement('p');
          p.textContent = paragraph;
          article.appendChild(p);
        });
      }

      const facts = root.querySelector('[data-feature-facts]');
      if (facts) {
        facts.replaceChildren();
        (feature.useful_bits || []).forEach(value => {
          const li = document.createElement('li');
          li.textContent = value;
          facts.appendChild(li);
        });
      }

      const schema = document.createElement('script');
      schema.type = 'application/ld+json';
      schema.textContent = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Event',
        name: feature.title,
        startDate: feature.date,
        eventStatus: 'https://schema.org/EventScheduled',
        eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
        description: feature.dek,
        location: { '@type': 'Place', name: feature.venue, address: feature.area },
        url: feature.source_url,
        image: feature.image_fallback || feature.image
      });
      document.head.appendChild(schema);
    })
    .catch(error => {
      console.error('SK8 feature failed to load', error);
      renderError();
    });
})();
