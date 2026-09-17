(() => {
  const SUBSCRIBER_KEY = 'sk8_subscriber_recognition_v1';
  const SUBSCRIBER_DAYS = 365;
  const GUIDE_PATH = '/free-cheap-guide/guide/';
  const GUIDE_FORM_ACTION = 'https://assets.mailerlite.com/jsonp/2462354/forms/197763164630156630/subscribe';

  const readSubscriber = () => {
    try {
      const value = JSON.parse(localStorage.getItem(SUBSCRIBER_KEY) || 'null');
      if (!value || value.version !== 1 || !value.expiresAt || Date.now() > value.expiresAt) {
        localStorage.removeItem(SUBSCRIBER_KEY);
        return null;
      }
      return value;
    } catch (_) {
      return null;
    }
  };

  const markSubscriber = () => {
    try {
      localStorage.setItem(SUBSCRIBER_KEY, JSON.stringify({
        version: 1,
        recognised: true,
        savedAt: new Date().toISOString(),
        expiresAt: Date.now() + SUBSCRIBER_DAYS * 24 * 60 * 60 * 1000
      }));
    } catch (_) {}
  };

  const clearSubscriber = () => {
    try { localStorage.removeItem(SUBSCRIBER_KEY); } catch (_) {}
  };

  const previewHost = /workers\.dev$/i.test(location.hostname);
  if (previewHost) {
    const params = new URLSearchParams(location.search);
    if (params.get('subscriber') === '1') markSubscriber();
    if (params.get('subscriber') === '0') clearSubscriber();
  }

  const guideForms = [...document.querySelectorAll('[data-signup-kind="guide"]')];
  guideForms.forEach(form => {
    form.action = GUIDE_FORM_ACTION;
    form.method = 'post';
  });

  const shortcutMap = {
    'Something free': '#things-anytime',
    'Rainy afternoon': '#museums-heritage',
    'With grandparents': '#day-out-plans',
    'Older children & teens': '#more-ways-to-choose',
    'Quick visit': '#more-ways-to-choose',
    'Half-day': '#day-out-plans',
    'Local history': '#museums-heritage',
    'Fresh air': '#walks-nature',
    'Worth the short trip': '#more-ways-to-choose'
  };

  const enhanceChoiceLinks = recognised => {
    document.querySelectorAll('.mood-pills span').forEach(span => {
      const label = (span.textContent || '').trim();
      const anchor = shortcutMap[label] || '#start-here';
      const link = document.createElement('a');
      link.className = 'guide-choice-link';
      link.textContent = label;
      link.href = recognised ? `${GUIDE_PATH}${anchor}` : '#get-guide';
      link.dataset.guideChoice = 'true';
      link.dataset.guideAnchor = anchor;
      link.dataset.linkLocation = recognised ? 'recognised-guide-choice' : 'guide-acquisition-choice';
      span.replaceWith(link);
    });

    const band = document.querySelector('.mood-pills');
    if (band && !band.querySelector('[data-live-events-link]')) {
      const live = document.createElement('a');
      live.className = 'guide-choice-link guide-choice-live';
      live.href = '/whats-on/';
      live.textContent = 'What’s on now';
      live.dataset.liveEventsLink = 'true';
      live.dataset.linkLocation = 'guide-to-whats-on';
      band.appendChild(live);
    }
  };

  const replaceSignupWithAccess = card => {
    card.classList.add('guide-access-card');
    card.innerHTML = '<h2>Your guide is ready</h2><p>You’re already recognised as a SK8 Scoop reader, so there’s no need to enter your email again.</p><div class="guide-access-actions"><a class="guide-access-button" href="/free-cheap-guide/guide/">Open the full guide</a><a class="guide-access-secondary" href="/whats-on/">See what’s on now →</a></div>';
  };

  const applyRecognisedState = () => {
    const recognised = Boolean(readSubscriber());
    document.body.dataset.recognisedSubscriber = recognised ? 'true' : 'false';

    document.querySelectorAll('[data-guide-acquisition]').forEach(el => { el.hidden = recognised; });
    document.querySelectorAll('[data-guide-access]').forEach(el => { el.hidden = !recognised; });

    if (recognised) {
      document.querySelectorAll('.signup-card').forEach(replaceSignupWithAccess);
    }

    document.querySelectorAll('[data-guide-choice]').forEach(link => {
      const anchor = link.dataset.guideAnchor || '';
      link.href = recognised ? `${GUIDE_PATH}${anchor}` : '#get-guide';
      link.dataset.linkLocation = recognised ? 'recognised-guide-choice' : 'guide-acquisition-choice';
    });

    enhanceChoiceLinks(recognised);

    const navJoin = document.querySelector('.reader-nav-join');
    if (recognised && navJoin) {
      navJoin.href = '/latest';
      navJoin.textContent = 'See what’s new';
      navJoin.addEventListener('click', event => {
        event.preventDefault();
        event.stopImmediatePropagation();
        location.assign('/latest');
      }, true);
    }
  };

  document.addEventListener('sk8:mailerlite-success', event => {
    const form = event.target.closest && event.target.closest('[data-signup-kind="guide"]');
    if (!form) return;
    markSubscriber();
    if (typeof window.sk8Track === 'function') {
      window.sk8Track('free_cheap_guide_signup_completed', {
        form_position: form.dataset.formPosition || 'unknown'
      });
    }
  });

  document.addEventListener('click', event => {
    const choice = event.target.closest('[data-guide-choice]');
    if (!choice || readSubscriber()) return;
    const input = document.querySelector('#guide-email');
    if (input) window.setTimeout(() => input.focus(), 100);
  });

  applyRecognisedState();
})();
