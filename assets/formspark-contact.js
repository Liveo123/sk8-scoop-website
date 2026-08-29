(() => {
  const form = document.querySelector('form[data-form-kind="contact-message"]');
  if (!form) return;

  const endpoint = String((window.SK8_CONFIG && window.SK8_CONFIG.formsparkContactEndpoint) || '').trim();
  if (!/^https:\/\/submit-form\.com\/[A-Za-z0-9_-]+$/.test(endpoint)) return;

  form.removeAttribute('data-api-form');
  form.action = endpoint;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const status = form.querySelector('[data-form-status]');
    const button = form.querySelector('button[type="submit"]');
    const data = Object.fromEntries(new FormData(form).entries());

    if (data.website) {
      form.reset();
      if (status) {
        status.className = 'status-box show success';
        status.textContent = 'Thank you. Your message has been sent.';
      }
      return;
    }

    delete data.website;
    data._email = {
      subject: `SK8 Scoop contact: ${data.category || 'general'}`,
      from: data.name || 'SK8 Scoop website visitor'
    };

    if (button) button.disabled = true;
    if (status) {
      status.className = 'status-box show';
      status.textContent = 'Sending…';
    }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      if (status) {
        status.className = 'status-box show success';
        status.textContent = 'Thank you. Your message has been sent to SK8 Scoop.';
      }
      if (typeof window.sk8Track === 'function') {
        window.sk8Track('contact_message_completed', {
          form_action: endpoint,
          form_kind: 'contact-message',
          form_provider: 'Formspark'
        });
      }
      form.reset();
    } catch (error) {
      if (typeof window.sk8Track === 'function') {
        window.sk8Track('form_error', {
          form_kind: 'contact-message',
          error_type: 'formspark_submission_failed'
        });
      }
      if (status) {
        status.className = 'status-box show error';
        status.textContent = 'This could not be sent automatically. Please email contact@sk8scoop.com instead.';
      }
    } finally {
      if (button) button.disabled = false;
    }
  });
})();
