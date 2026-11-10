/* Page-local submit handler. It deliberately does not change the shared signup/attribution code. */
(function businessSubmissionsForm() {
  'use strict';
  const form = document.querySelector('form[data-form-kind="business-submission"]');
  if (!form) return;
  const status = form.querySelector('[data-form-status]');
  const button = form.querySelector('button[type="submit"]');
  const urlInput = form.querySelector('[name="official_url"]');
  const startedInput = form.querySelector('[name="sk8_started_at"]');
  const buttonLabel = button.textContent;
  let busy = false;
  if (startedInput) startedInput.value = String(Date.now());

  function cleanWebsite(raw) {
    const value = String(raw || '').trim();
    if (!value) return '';
    if (/^[a-z][a-z0-9+.-]*:\/\//i.test(value) && !/^https?:\/\//i.test(value)) return null;
    if (/^[^/]+@/.test(value)) return null;
    try {
      const url = new URL(/^https?:\/\//i.test(value) ? value : 'https://' + value);
      if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || !url.hostname.includes('.') || url.hostname.startsWith('.') || url.hostname.endsWith('.') || url.hostname.length > 253) return null;
      return url.href;
    } catch (_) { return null; }
  }

  function validateWebsite() {
    const clean = cleanWebsite(urlInput.value);
    if (clean === null) {
      urlInput.setCustomValidity('Please enter a link such as example.co.uk, or leave this blank.');
      return false;
    }
    urlInput.setCustomValidity('');
    if (clean) urlInput.value = clean;
    return true;
  }
  urlInput.addEventListener('input', () => urlInput.setCustomValidity(''));
  urlInput.addEventListener('blur', validateWebsite);

  // Registered in capture phase ahead of assets/site.js, avoiding a second POST.
  form.addEventListener('submit', async event => {
    event.preventDefault();
    event.stopImmediatePropagation();
    if (busy) return;
    if (!validateWebsite() || !form.reportValidity()) { form.reportValidity(); return; }

    busy = true;
    button.disabled = true;
    button.textContent = 'Sending…';
    status.className = 'status-box show';
    status.textContent = 'Saving your submission…';

    try {
      const data = {};
      for (const [key, value] of new FormData(form).entries()) data[key] = value;
      const response = await fetch(form.action, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(data)
      });
      let result = {};
      try { result = await response.json(); } catch (_) {}
      if (!response.ok) throw new Error(result.error || 'Your submission could not be saved.');

      status.className = 'status-box show success';
      status.textContent = result.message || 'Thank you. Your information has been saved for review.';
      if (typeof window.sk8Track === 'function') {
        window.sk8Track('business_submission_completed', {
          form_action: form.action,
          form_kind: 'business-submission'
        });
      }
      form.reset();
      if (startedInput) startedInput.value = String(Date.now());
    } catch (error) {
      status.className = 'status-box show error';
      // Keep the visitor's typed details in place so they can retry.
      status.textContent = /^Please |^This form |^Your submission /.test(String(error.message))
        ? error.message
        : 'Sorry, we could not save this. Please try again or email contact@sk8scoop.com.';
      if (typeof window.sk8Track === 'function') {
        window.sk8Track('form_error', {
          form_kind: 'business-submission',
          error_type: 'api_submission_failed'
        });
      }
    } finally {
      busy = false;
      button.disabled = false;
      button.textContent = buttonLabel;
    }
  }, true);
})();
