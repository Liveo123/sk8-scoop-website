(() => {
  const form = document.querySelector('[data-signup-form][data-signup-kind="guide"]');
  if (!form) return;

  const sendClarityEvent = name => {
    if (typeof window.clarity === 'function') window.clarity('event', name);
  };

  let formStarted = false;
  let lastErrorText = '';

  form.addEventListener('focusin', () => {
    if (formStarted) return;
    formStarted = true;
    sendClarityEvent('free_cheap_form_start');
  });

  // Listen on window in the capture phase so this records the attempt before
  // the protected signup handler stops propagation at document level.
  window.addEventListener('submit', event => {
    const submittedForm = event.target && event.target.closest
      ? event.target.closest('[data-signup-form][data-signup-kind="guide"]')
      : null;
    if (submittedForm === form) sendClarityEvent('free_cheap_signup_attempt');
  }, true);

  form.addEventListener('sk8:mailerlite-success', () => {
    sendClarityEvent('free_cheap_signup_success');
  });

  const card = form.closest('.signup-card') || form.parentElement;
  if (card && 'MutationObserver' in window) {
    const observer = new MutationObserver(() => {
      const status = card.querySelector('.signup-status.show.error');
      if (!status) return;
      const text = String(status.textContent || '').trim();
      if (!text || text === lastErrorText) return;
      lastErrorText = text;
      sendClarityEvent('free_cheap_signup_error');
    });
    observer.observe(card, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true
    });
  }
})();
