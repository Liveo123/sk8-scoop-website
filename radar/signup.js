(() => {
  'use strict';
  const form = document.getElementById('radar-signup');
  if (!form) return;
  const status = document.getElementById('form-message');
  const button = document.getElementById('join-button');
  const tokenField = document.getElementById('turnstile-token');
  const started = document.getElementById('started-at');
  const source = document.getElementById('source');
  const turnstileBox = document.getElementById('turnstile-container');
  const query = new URLSearchParams(location.search);
  source.value = query.get('via') === 'sk8' ? 'sk8_invite' : 'radar_main';
  started.value = String(Date.now());
  // The code field and programme are invisible while the referral feature flag is off.
  (async () => {
    const holder = document.getElementById('radar-referral-field');
    const nav = document.getElementById('referral-intro');
    const field = document.getElementById('referral-code');
    try {
      const res = await fetch('/api/radar-referral-status', { cache: 'no-store' });
      const config = await res.json();
      if (!res.ok || config.enabled !== true) return;
      holder.hidden = false; nav.hidden = false;
      const code = String(query.get('ref') || '').trim().toUpperCase();
      if (/^R[A-HJ-NP-Z2-9]{12}$/.test(code)) field.value = code;
    } catch {
      // Referral extras are optional; failed configuration must never block Radar signup.
    }
  })();
  let widgetId = null;

  function message(text, good = false) {
    status.textContent = text;
    status.style.color = good ? '#0e6470' : '#a64519';
  }

  function loadTurnstile() {
    return new Promise((resolve, reject) => {
      if (window.turnstile) return resolve(window.turnstile);
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.onload = () => window.turnstile ? resolve(window.turnstile) : reject(Error('Human check unavailable.'));
      script.onerror = () => reject(Error('Human check could not load.'));
      document.head.append(script);
    });
  }

  async function ready() {
    try {
      const res = await fetch('/api/signup-config', { headers: { accept: 'application/json' }, cache: 'no-store' });
      const config = await res.json();
      if (!res.ok || !config.siteKey) throw Error('Signup verification is not configured.');
      const turnstile = await loadTurnstile();
      widgetId = turnstile.render(turnstileBox, {
        sitekey: String(config.siteKey),
        action: 'newsletter_signup',
        theme: 'light',
        appearance: 'always',
        size: 'flexible',
        'response-field': false,
        callback: token => { tokenField.value = token; message(''); },
        'expired-callback': () => { tokenField.value = ''; message('Human verification expired. Please try again.'); },
        'error-callback': () => { tokenField.value = ''; message('Human verification failed. Please retry.'); }
      });
      button.disabled = false;
    } catch (error) {
      message('Sign-up is temporarily unavailable. Please email contact@sk8scoop.com.');
    }
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    if (!tokenField.value) {
      message('Please complete the human check before subscribing.');
      return;
    }
    button.disabled = true;
    button.textContent = 'Joining Radar…';
    message('');
    try {
      const body = new URLSearchParams(new FormData(form));
      const res = await fetch('/api/radar-signup', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok || result.success !== true) throw Error(result.error || 'The sign-up did not complete.');
      if (result.already_subscribed === true) {
        message('This address is already on the Radar list. No changes were made. A referral code can only be used by a genuinely new Radar reader during signup.', true);
        return;
      }
      message('Your Radar subscription is confirmed. Opening your welcome page…', true);
      location.assign('/radar/success/');
    } catch (error) {
      message(error && error.message ? error.message : 'Please try again.');
      tokenField.value = '';
      if (window.turnstile && widgetId !== null) window.turnstile.reset(widgetId);
      started.value = String(Date.now());
    } finally {
      button.disabled = false;
      button.textContent = 'Get Radar free';
    }
  });

  ready();
})();
