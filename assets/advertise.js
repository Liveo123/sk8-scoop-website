(() => {
  const form = document.querySelector('[data-form-kind="advertiser"]');
  if (!form) return;

  const actionField = form.querySelector('[name="advert_copy"]');
  const packageInputs = [...form.querySelectorAll('input[name="package"]')];

  document.querySelectorAll('[data-ad-goal]').forEach(link => {
    link.addEventListener('click', () => {
      const goal = String(link.dataset.adGoal || '').trim();
      if (goal && actionField && !actionField.value.trim()) {
        actionField.value = `${goal}: `;
        requestAnimationFrame(() => {
          actionField.focus();
          actionField.setSelectionRange(actionField.value.length, actionField.value.length);
        });
      }
      if (typeof window.sk8Track === 'function') {
        window.sk8Track('advertiser_goal_selected', { goal });
      }
    });
  });

  packageInputs.forEach(input => input.addEventListener('change', () => {
    if (!input.checked || typeof window.sk8Track !== 'function') return;
    window.sk8Track('advertiser_route_selected', { route: input.value });
  }));
})();
