(() => {
  const form = document.querySelector('[data-form-kind="advertiser"]');
  if (!form) return;

  const packageField = form.querySelector('[data-package-field]');
  const actionField = form.querySelector('[name="advert_copy"]');
  const preferredMonthField = form.querySelector('[name="preferred_date"]');
  const formTitle = form.querySelector('[data-ad-form-title]');
  const formIntro = form.querySelector('[data-ad-form-intro]');
  const submitButton = form.querySelector('[data-ad-submit]');
  const startedAtField = form.querySelector('[name="sk8_started_at"]');

  if (startedAtField) startedAtField.value = String(Date.now());

  function scrollToForm(focusTarget) {
    const header = document.querySelector('.site-header');
    const headerHeight = header ? header.getBoundingClientRect().height : 0;
    const top = form.getBoundingClientRect().top + window.scrollY - headerHeight - 28;
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    if (focusTarget) {
      window.setTimeout(() => focusTarget.focus({ preventScroll: true }), 500);
    }
  }

  function setRoute(route, label = '') {
    if (packageField) packageField.value = route;

    if (route === 'human_review') {
      if (formTitle) formTitle.textContent = 'Tell us about your business';
      if (formIntro) formIntro.textContent = 'No payment is taken for this check. We will first decide whether the business is a sensible match for SK8 readers.';
      if (submitButton) submitButton.textContent = 'Send fit check';
      return;
    }

    if (route === 'temp_test') {
      if (formTitle) formTitle.textContent = 'Ask about the £40 newsletter advert';
      if (formIntro) formIntro.textContent = 'We will still check fit, timing and availability before asking for payment.';
      if (submitButton) submitButton.textContent = 'Send £40 advert enquiry';
      return;
    }

    if (route === 'temp_grow') {
      if (formTitle) formTitle.textContent = 'Ask about the £90 newsletter + guide option';
      if (formIntro) formIntro.textContent = 'We will confirm that the Free & Cheap Guide is genuinely relevant before recommending this route.';
      if (submitButton) submitButton.textContent = 'Send £90 advert enquiry';
      return;
    }

    if (route === 'bespoke') {
      if (formTitle) formTitle.textContent = 'Seasonal advertising enquiry';
      if (formIntro) formIntro.textContent = 'We will confirm the available seasonal placement, scope, timing and price before payment.';
      if (submitButton) submitButton.textContent = 'Send seasonal advertising enquiry';
      if (label && actionField && !actionField.value.trim()) {
        actionField.value = label + '. What I want local readers to do: ';
      }
      if (label.includes('Halloween') && preferredMonthField && !preferredMonthField.value) {
        preferredMonthField.value = '2026-10';
      }
    }
  }

  document.querySelectorAll('[data-fit-check-jump]').forEach(control => {
    control.addEventListener('click', event => {
      if (control.tagName === 'A') event.preventDefault();
      setRoute('human_review');
      scrollToForm(form.querySelector('[name="business_name"]'));
      if (typeof window.sk8Track === 'function') {
        window.sk8Track('advertiser_fit_check_started', {});
      }
    });
  });

  document.querySelectorAll('[data-ad-package]').forEach(control => {
    control.addEventListener('click', () => {
      const route = String(control.dataset.adPackage || '').trim();
      const seasonalChoice = String(control.dataset.seasonalChoice || '').trim();
      setRoute(route, seasonalChoice);
      scrollToForm(form.querySelector('[name="business_name"]'));
      if (typeof window.sk8Track === 'function') {
        window.sk8Track('advertiser_route_selected', { route });
      }
    });
  });

  const params = new URLSearchParams(window.location.search);
  if (params.get('finder_source') === 'campaign_finder') {
    const allowed = new Set(['temp_test', 'temp_grow', 'human_review']);
    const requested = params.get('finder_package');
    const route = allowed.has(requested) ? requested : 'human_review';
    setRoute(route);

    const finderGoal = params.get('finder_goal');
    if (finderGoal && actionField && !actionField.value.trim()) {
      actionField.value = 'Campaign Finder goal: ' + finderGoal + '. ';
    }
  }

  form.addEventListener('reset', () => {
    window.setTimeout(() => setRoute('human_review'), 0);
  });
})();