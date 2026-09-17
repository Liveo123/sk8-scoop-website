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

  const guideHref = anchor => `${GUIDE_PATH}${anchor || ''}`;

  const applyRecognisedState = () => {
    const recognised = Boolean(readSubscriber());
    document.body.dataset.recognisedSubscriber = recognised ? 'true' : 'false';

    document.querySelectorAll('[data-guide-acquisition]').forEach(el => { el.hidden = recognised; });
    document.querySelectorAll('[data-guide-access]').forEach(el => { el.hidden = !recognised; });

    document.querySelectorAll('[data-guide-choice]').forEach(link => {
      const anchor = link.dataset.guideAnchor || '';
      link.href = recognised ? guideHref(anchor) : '#get-guide';
      link.dataset.linkLocation = recognised ? 'recognised-guide-choice' : 'guide-acquisition-choice';
    });

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
    window.setTimeout(() => location.assign('/free-cheap-guide/success/'), 60);
  });

  document.addEventListener('click', event => {
    const choice = event.target.closest('[data-guide-choice]');
    if (!choice || readSubscriber()) return;
    const input = document.querySelector('#guide-email');
    if (input) window.setTimeout(() => input.focus(), 100);
  });

  applyRecognisedState();
})();
