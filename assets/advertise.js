(() => {
  const form = document.querySelector('[data-form-kind="advertiser"]');
  if (!form) return;

  const goalField = form.querySelector('[name="advert_copy"]');
  const packageInputs = [...form.querySelectorAll('input[name="package"]')];
  const guideSelect = form.querySelector('[name="guide_choice"]');
  const guideWrap = form.querySelector('[data-guide-choice-wrap]');
  const selectionSummary = form.querySelector('[data-ad-selection-summary]');
  const localFitRoute = form.querySelector('[data-local-fit-route]');
  const formTitle = form.querySelector('[data-ad-form-title]');
  const formIntro = form.querySelector('[data-ad-form-intro]');
  const termsCopy = form.querySelector('[data-ad-terms-copy]');
  const submitButton = form.querySelector('[data-ad-submit]');
  const startedAtField = form.querySelector('[name="sk8_started_at"]');
  const goalLinks = [...document.querySelectorAll('[data-ad-goal]')];
  const packageButtons = [...document.querySelectorAll('[data-ad-package]')];

  const packageLabels = {
    starter_newsletter: 'Newsletter advert · £35',
    guide_card: 'Guide card · £28',
    guide_bundle: 'Guide + newsletter · £60',
    guide_section: 'Guide section sponsor · £96',
    guide_main: 'Main Guide sponsor · £125',
    human_review: 'Local-fit check · no payment'
  };
  const guidePackages = new Set(['guide_card', 'guide_bundle', 'guide_section', 'guide_main']);
  const finderParams = new URLSearchParams(window.location.search);
  const finderSource = finderParams.get('finder_source');
  const finderPackage = finderParams.get('finder_package');
  const finderGoal = finderParams.get('finder_goal');
  const finderOpportunity = finderParams.get('finder_opportunity');
  const allowedFinderPackages = new Set(['starter_newsletter', 'human_review']);
  const allowedFinderOpportunities = new Map([
    ['christmas-eating-out', 'Christmas Eating Out 2026']
  ]);
  const allowedFinderGoals = new Set([
    'Get bookings', 'Generate enquiries', 'Get more people to visit',
    'Get registrations', 'Generate purchases or offer use', 'Build useful local awareness'
  ]);

  if (startedAtField) startedAtField.value = String(Date.now());

  function track(name, data) {
    if (typeof window.sk8Track === 'function') window.sk8Track(name, data);
  }

  document.querySelectorAll('[data-ad-hero-action]').forEach(link => {
    link.addEventListener('click', () => {
      const action = String(link.dataset.adHeroAction || '').trim();
      if (action) track('advertiser_hero_action', { action, variant: 'local_hero_v2' });
    });
  });

  function setReviewMode(enabled) {
    if (localFitRoute) localFitRoute.hidden = !enabled;
    if (formTitle) formTitle.textContent = enabled ? 'Request a local-fit check' : 'Request your advert';
    if (formIntro) formIntro.textContent = enabled
      ? 'We check whether your business is a good fit for SK8 readers. No payment or booking is taken yet.'
      : 'Choose from £35, £28, £60, £96 or £125. We confirm the Guide, dates and payment details before you commit.';
    if (termsCopy) termsCopy.textContent = enabled
      ? 'I understand this is a fit check only. Any later advertising would need a separate agreement and approval.'
      : 'I understand this is clearly labelled paid visibility, subject to suitability and availability, and does not guarantee results or favourable editorial coverage.';
    if (submitButton) submitButton.textContent = enabled ? 'Send local-fit check' : 'Send enquiry · no payment now';
  }

  function reflectSelection(route) {
    const isReview = route === 'human_review';
    const includesGuide = guidePackages.has(route);
    if (guideWrap) guideWrap.hidden = !includesGuide;
    if (guideSelect) guideSelect.disabled = !includesGuide;
    setReviewMode(isReview);
    if (selectionSummary) {
      const label = packageLabels[route] || 'Advertising enquiry';
      selectionSummary.textContent = `Selected: ${label} · No payment now`;
    }
  }

  function scrollToForm(focusTarget) {
    const headerHeight = document.querySelector('.site-header')?.getBoundingClientRect().height || 0;
    const target = form.getBoundingClientRect().top + window.scrollY - headerHeight - 26;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: Math.max(0, target), behavior: reduced ? 'instant' : 'smooth' });
    if (focusTarget) {
      window.setTimeout(() => focusTarget.focus({ preventScroll: true }), reduced ? 0 : 460);
    }
  }

  packageButtons.forEach(button => {
    button.addEventListener('click', () => {
      const route = String(button.dataset.adPackage || '').trim();
      const input = packageInputs.find(item => item.value === route);
      if (!input) return;
      input.checked = true;
      input.dispatchEvent(new Event('change', { bubbles: true }));
      scrollToForm(form.querySelector('[name="business_name"]'));
      track('advertiser_package_jump', { route });
    });
  });

  packageInputs.forEach(input => input.addEventListener('change', () => {
    if (!input.checked) return;
    reflectSelection(input.value);
    track('advertiser_route_selected', { route: input.value });
  }));

  goalLinks.forEach(link => {
    link.addEventListener('click', event => {
      event.preventDefault();
      const goal = String(link.dataset.adGoal || '').trim();
      goalLinks.forEach(other => {
        other.classList.toggle('is-selected', other === link);
        if (other === link) other.setAttribute('aria-current', 'true');
        else other.removeAttribute('aria-current');
      });
      if (goal && goalField && !goalField.value.trim()) {
        goalField.placeholder = `Your goal: ${goal}. Tell us the specific service, offer or event.`;
      }
      scrollToForm(goalField);
      track('advertiser_goal_selected', { goal });
    });
  });

  if (finderSource === 'campaign_finder') {
    const selected = allowedFinderPackages.has(finderPackage)
      ? packageInputs.find(input => input.value === finderPackage) : null;
    if (selected) selected.checked = true;
    if (goalField && allowedFinderGoals.has(finderGoal)) {
      const opportunity = allowedFinderOpportunities.get(finderOpportunity);
      goalField.placeholder = `Your goal: ${finderGoal}.${opportunity ? ` About ${opportunity}.` : ''} Please give details of your offer.`;
    }
    track('advertiser_campaign_finder_handoff', {
      route: selected ? finderPackage : 'review',
      goal: allowedFinderGoals.has(finderGoal) ? finderGoal : 'unknown'
    });
  }

  form.addEventListener('reset', () => window.setTimeout(() => {
    reflectSelection('starter_newsletter');
    goalLinks.forEach(link => { link.classList.remove('is-selected'); link.removeAttribute('aria-current'); });
    if (startedAtField) startedAtField.value = String(Date.now());
  }, 0));

  reflectSelection(form.querySelector('input[name="package"]:checked')?.value || 'starter_newsletter');
})();
