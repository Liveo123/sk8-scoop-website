(() => {
  const form = document.querySelector('[data-form-kind="advertiser"]');
  if (!form) return;

  const actionField = form.querySelector('[name="advert_copy"]');
  const packageInputs = [...form.querySelectorAll('input[name="package"]')];

  const productSection = document.querySelector('#products');
  if (productSection && !document.querySelector('[data-surface-map-callout]')) {
    const section = document.createElement('section');
    section.className = 'section soft-teal';
    section.dataset.surfaceMapCallout = 'true';
    section.innerHTML = '<div class="wrap"><div class="section-kicker-row"><div><div class="eyebrow">Where a campaign can live</div><h2>Newsletter now. Guides when relevant. NUE website when it is ready.</h2></div><p>SK8 Scoop is preparing a joined-up set of commercial surfaces without pretending every surface is standard inventory yet.</p></div><div class="proof-grid"><div><strong>Newsletter</strong><span>available now</span></div><div><strong>Weekend email</strong><span>pilot / opportunistic</span></div><div><strong>Guides</strong><span>contextual fit</span></div><div><strong>NUE website</strong><span>being prepared</span></div></div><div class="button-row" style="margin-top:20px"><a class="button" href="/advertise-surfaces.html" data-nue-link data-nue-type="commercial">See the advertising surface map</a><a class="button secondary" href="#campaign-enquiry">Tell us the outcome you want</a></div></div>';
    productSection.insertAdjacentElement('afterend', section);
  }

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
