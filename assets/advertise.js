(() => {
  const form = document.querySelector('[data-form-kind="advertiser"]');
  if (!form) return;

  const actionField = form.querySelector('[name="advert_copy"]');
  const packageInputs = [...form.querySelectorAll('input[name="package"]')];
  const goalLinks = [...document.querySelectorAll('[data-ad-goal]')];
  const packageJumps = [...document.querySelectorAll('[data-ad-package]')];

  function scrollToForm(focusTarget) {
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (focusTarget) {
      window.setTimeout(() => focusTarget.focus({ preventScroll: true }), 450);
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
})();
