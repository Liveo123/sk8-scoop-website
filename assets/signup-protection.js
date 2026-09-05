(() => {
  const forms = [...document.querySelectorAll('[data-signup-form]')];
  if (!forms.length) return;

  const startedAt = Date.now();
  let turnstileReady = false;
  let siteKey = '';
  let initPromise = null;

  const getKind = form => {
    const explicit = String(form.dataset.signupKind || '').trim().toLowerCase();
    if (explicit === 'guide') return 'guide';
    return form.matches('[data-qr-form]') ? 'qr' : 'main';
  };

  const getStatus = form => {
    let status = form.nextElementSibling && form.nextElementSibling.classList.contains('signup-status')
      ? form.nextElementSibling
      : null;
    if (!status) {
      status = document.createElement('p');
      status.className = 'signup-status';
      status.setAttribute('role', 'status');
      form.insertAdjacentElement('afterend', status);
    }
    return status;
  };

  const ensureHidden = (form, name, value) => {
    let input = form.querySelector(`input[name="${name}"]`);
    if (!input) {
      input = document.createElement('input');
      input.type = 'hidden';
      input.name = name;
      form.appendChild(input);
    }
    input.value = String(value);
    return input;
  };

  const addHoneypot = form => {
    if (form.querySelector('input[name="website"]')) return;
    const wrap = document.createElement('div');
    wrap.setAttribute('aria-hidden', 'true');
    wrap.style.position = 'absolute';
    wrap.style.left = '-10000px';
    wrap.style.width = '1px';
    wrap.style.height = '1px';
    wrap.style.overflow = 'hidden';
    const label = document.createElement('label');
    label.textContent = 'Leave this field empty';
    const input = document.createElement('input');
    input.type = 'text';
    input.name = 'website';
    input.tabIndex = -1;
    input.autocomplete = 'off';
    label.appendChild(input);
    wrap.appendChild(label);
    form.appendChild(wrap);
  };

  const addTurnstileContainer = form => {
    const position = form.dataset.formPosition || 'unknown';
    let container = form.parentElement && form.parentElement.querySelector(`:scope > [data-sk8-turnstile-for="${position}"]`);
    if (container) return container;
    container = document.createElement('div');
    container.id = `sk8-turnstile-${Math.random().toString(36).slice(2, 9)}`;
    container.dataset.sk8Turnstile = 'true';
    container.dataset.sk8TurnstileFor = position;
    container.style.marginTop = '10px';
    container.style.maxWidth = '360px';
    container.style.minHeight = '65px';
    form.insertAdjacentElement('afterend', container);
    return container;
  };

  forms.forEach(form => {
    addHoneypot(form);
    ensureHidden(form, 'sk8_started_at', startedAt);
    ensureHidden(form, 'sk8_form_kind', getKind(form));
    ensureHidden(form, 'cf-turnstile-response', '');
    addTurnstileContainer(form);
  });

  const loadTurnstileScript = () => new Promise((resolve, reject) => {
    if (window.turnstile) return resolve();
    const existing = document.querySelector('script[data-sk8-turnstile-script]');
    if (existing) {
      existing.addEventListener('load', resolve, { once: true });
      existing.addEventListener('error', reject, { once: true });
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.defer = true;
    script.dataset.sk8TurnstileScript = 'true';
    script.addEventListener('load', resolve, { once: true });
    script.addEventListener('error', reject, { once: true });
    document.head.appendChild(script);
  });

  const initialise = async () => {
    if (initPromise) return initPromise;
    initPromise = (async () => {
      const configResponse = await fetch('/api/signup-config', { headers: { accept: 'application/json' }, cache: 'no-store' });
      const config = await configResponse.json().catch(() => ({}));
      if (!configResponse.ok || !config.siteKey) throw new Error('Signup protection is not configured yet.');
      siteKey = String(config.siteKey);
      await loadTurnstileScript();
      if (!window.turnstile) throw new Error('The human check could not load.');

      forms.forEach(form => {
        const formPosition = form.dataset.formPosition || 'unknown';
        const container = form.parentElement && form.parentElement.querySelector(`:scope > [data-sk8-turnstile-for="${formPosition}"]`);
        if (!container || container.dataset.rendered === 'true') return;
        const tokenField = ensureHidden(form, 'cf-turnstile-response', '');

        const widgetId = window.turnstile.render(container, {
          sitekey: siteKey,
          theme: 'auto',
          size: 'flexible',
          appearance: 'always',
          'response-field': false,
          callback: token => {
            tokenField.value = String(token || '');
            container.dataset.verified = token ? 'true' : 'false';
          },
          'expired-callback': () => {
            tokenField.value = '';
            container.dataset.verified = 'false';
          },
          'error-callback': () => {
            tokenField.value = '';
            container.dataset.verified = 'false';
          }
        });
        container.dataset.rendered = 'true';
        container.dataset.widgetId = String(widgetId);
      });
      turnstileReady = true;
    })();
    return initPromise;
  };

  initialise().catch(error => {
    console.error('SK8 signup protection failed to initialise', error);
  });

  document.addEventListener('submit', async event => {
    const form = event.target.closest && event.target.closest('[data-signup-form]');
    if (!form) return;

    event.preventDefault();
    event.stopImmediatePropagation();

    if (!form.reportValidity()) return;

    const kind = getKind(form);
    const status = getStatus(form);
    const button = form.querySelector('button[type="submit"]');
    const original = button ? button.textContent : '';
    if (button) {
      button.disabled = true;
      button.textContent = kind === 'guide' ? 'Sending…' : 'Joining…';
    }

    try {
      if (!turnstileReady) await initialise();
      ensureHidden(form, 'sk8_form_kind', kind);
      const tokenField = form.querySelector('input[name="cf-turnstile-response"]');
      if (!tokenField || !String(tokenField.value || '').trim()) {
        throw new Error('Please complete the quick human check, then try again.');
      }

      status.className = 'signup-status show';
      status.textContent = kind === 'guide' ? 'Getting your guide ready…' : 'Adding you to SK8 Scoop…';

      const response = await fetch('/api/newsletter-signup', {
        method: 'POST',
        headers: { accept: 'application/json' },
        body: new FormData(form)
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.success !== true) {
        throw new Error(result.error || 'That did not complete. Please try again.');
      }

      const formPosition = form.dataset.formPosition || 'unknown';
      const signupSource = kind === 'qr' ? 'local_qr' : kind === 'guide' ? 'free_cheap_guide' : 'website';
      if (typeof window.sk8Track === 'function') {
        window.sk8Track('sign_up', {
          method: 'MailerLite + Turnstile',
          form_position: formPosition,
          signup_source: signupSource
        });
      }

      form.dispatchEvent(new CustomEvent('sk8:mailerlite-success', { bubbles: true, detail: { result } }));
      status.className = 'signup-status show success';
      status.textContent = kind === 'guide' ? 'Done. Opening your guide…' : 'You’re in. Opening the welcome page…';
      const success = kind === 'qr' ? '/qr-success/' : kind === 'guide' ? '/free-cheap-guide/success/' : '/signup-success/';
      window.setTimeout(() => location.assign(success), 350);
    } catch (error) {
      if (typeof window.sk8Track === 'function') {
        window.sk8Track('form_error', {
          form_kind: kind,
          form_position: form.dataset.formPosition || 'unknown',
          error_type: 'captcha_or_signup_failed'
        });
      }
      status.className = 'signup-status show error';
      status.textContent = error && error.message
        ? error.message
        : 'That did not complete. Please try again or email contact@sk8scoop.com.';
      if (window.turnstile) {
        const formPosition = form.dataset.formPosition || 'unknown';
        const container = form.parentElement && form.parentElement.querySelector(`:scope > [data-sk8-turnstile-for="${formPosition}"]`);
        if (container && container.dataset.widgetId) {
          try { window.turnstile.reset(container.dataset.widgetId); } catch (_) {}
        }
      }
    } finally {
      if (button) {
        button.disabled = false;
        button.textContent = original;
      }
    }
  }, true);
})();
