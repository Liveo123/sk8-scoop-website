(() => {
  const extraStylesheet = '/assets/advertise-v5.css';
  if (!document.querySelector(`link[href="${extraStylesheet}"]`)) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = extraStylesheet;
    link.dataset.sk8AdvertiseV5 = 'true';
    document.head.appendChild(link);
  }

  const form = document.querySelector('[data-form-kind="advertiser"]');
  if (!form) return;

  const actionField = form.querySelector('[name="advert_copy"]');
  const packageInputs = [...form.querySelectorAll('input[name="package"]')];
  const goalLinks = [...document.querySelectorAll('[data-ad-goal]')];
  const packageJumps = [...document.querySelectorAll('[data-ad-package]')];
  const issueStat = document.querySelector('[data-stat="issuesPublished"]');

  if (issueStat && window.SK8_CONFIG?.publicStats?.issuesPublished) {
    issueStat.textContent = String(window.SK8_CONFIG.publicStats.issuesPublished);
  }

  function scrollToForm(focusTarget) {
    const header = document.querySelector('.site-header');
    const headerHeight = header ? header.getBoundingClientRect().height : 0;
    const safeGap = 28;
    const top = form.getBoundingClientRect().top + window.scrollY - headerHeight - safeGap;
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });

    if (focusTarget) {
      window.setTimeout(() => focusTarget.focus({ preventScroll: true }), 500);
    }
  }

  goalLinks.forEach(link => {
    link.addEventListener('click', event => {
      event.preventDefault();
      const goal = String(link.dataset.adGoal || '').trim();

      goalLinks.forEach(item => item.classList.toggle('is-selected', item === link));
      goalLinks.forEach(item => item.setAttribute('aria-current', item === link ? 'true' : 'false'));

      if (goal && actionField && !actionField.value.trim()) {
        actionField.value = `${goal}: `;
      }

      scrollToForm(actionField);

      if (typeof window.sk8Track === 'function') {
        window.sk8Track('advertiser_goal_selected', { goal });
      }
    });
  });

  packageJumps.forEach(button => {
    button.addEventListener('click', () => {
      const route = String(button.dataset.adPackage || '').trim();
      const input = packageInputs.find(item => item.value === route);
      if (input) {
        input.checked = true;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
      scrollToForm(input || form.querySelector('input,textarea,select'));

      if (typeof window.sk8Track === 'function') {
        window.sk8Track('advertiser_package_jump', { route });
      }
    });
  });

  packageInputs.forEach(input => input.addEventListener('change', () => {
    if (!input.checked || typeof window.sk8Track !== 'function') return;
    window.sk8Track('advertiser_route_selected', { route: input.value });
  }));

  /* The established backend already accepts the generic `bespoke` route.
     Keep the reader-facing value specific and useful, then map it only at submit time. */
  form.addEventListener('submit', () => {
    const websiteInput = packageInputs.find(item => item.value === 'temp_website');
    if (!websiteInput?.checked) return;
    websiteInput.value = 'bespoke';
    queueMicrotask(() => { websiteInput.value = 'temp_website'; });
  }, true);
})();
