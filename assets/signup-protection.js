(() => {
  const forms = [...document.querySelectorAll('[data-signup-form]')];
  if (!forms.length) return;

  const startedAt = Date.now();
  let turnstileReady = false;
  let siteKey = '';
  let initPromise = null;

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
    let container = form.querySelector('[data-sk8-turnstile]');
    if (container) return container;
    container = document.createElement('div');
    container.dataset.sk8Turnstile = 'true';
    container.style.marginTop = '8px';
    container.style.minHeight = '1px';
    form.appendChild(container);
    return container;
  };

  forms.forEach(form => {
    addHoneypot(form);
    ensureHidden(form, 'sk8_started_at', startedAt);
    ensureHidden(form, 'sk8_form_kind', form.matches('[data-qr-form]') ? 'qr' : 'main');
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
        const container = form.querySelector('[data-sk8-turnstile]');
        if (!container || container.dataset.rendered === 'true') return;
        window.turnstile.render(container, {
          sitekey: siteKey,
          theme: 'auto',
          size: 'normal',
          appearance: 'interaction-only',
          'response-field': true,
          'response-field-name': 'cf-turnstile-response'
        });
        container.dataset.rendered = 'true';
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

    const status = getStatus(form);
    const button = form.querySelector('button[type="submit"]');
    const original = button ? button.textContent : '';
    if (button) {
      button.disabled = true;
      button.textContent = 'Joining…';
    }

    try {
      if (!turnstileReady) await initialise();
      const tokenField = form.querySelector('input[name="cf-turnstile-response"]');
      if (!tokenField || !String(tokenField.value || '').trim()) {
        throw new Error('Please complete the quick human check, then try again.');
      }

      status.className = 'signup-status show';
      status.textContent = 'Adding you to SK8 Scoop…';

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
      const signupSource = form.matches('[data-qr-form]') ? 'local_qr' : 'website';
      if (typeof window.sk8Track === 'function') {
        window.sk8Track('sign_up', {
          method: 'MailerLite + Turnstile',
          form_position: formPosition,
          signup_source: signupSource
        });
      }

      form.dispatchEvent(new CustomEvent('sk8:mailerlite-success', { bubbles: true, detail: { result } }));
      status.className = 'signup-status show success';
      status.textContent = 'You’re in. Opening the welcome page…';
      const success = form.matches('[data-qr-form]') ? '/qr-success/' : '/signup-success/';
      window.setTimeout(() => location.assign(success), 350);
    } catch (error) {
      if (typeof window.sk8Track === 'function') {
        window.sk8Track('form_error', {
          form_kind: 'newsletter_signup',
          form_position: form.dataset.formPosition || 'unknown',
          error_type: 'captcha_or_signup_failed'
        });
      }
      status.className = 'signup-status show error';
      status.textContent = error && error.message
        ? error.message
        : 'That did not complete. Please try again or email contact@sk8scoop.com.';
      if (window.turnstile) {
        const container = form.querySelector('[data-sk8-turnstile]');
        if (container) {
          try { window.turnstile.reset(container); } catch (_) {}
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
