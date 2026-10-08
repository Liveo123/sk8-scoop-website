(() => {
  const form = document.querySelector('[data-form-kind="advertiser"]');
  if (!form) return;

  const actionField = form.querySelector('[name="advert_copy"]');
  const preferredMonthField = form.querySelector('[name="preferred_date"]');
  const packageInputs = [...form.querySelectorAll('input[name="package"]')];
  const sponsorOptions = [...form.querySelectorAll('[data-sponsor-option]')];
  const selectionSummary = form.querySelector('[data-ad-selection-summary]');
  const packageLabels = {starter_newsletter:'Newsletter advert · £35',halloween_guide:'Halloween Guide card · £28',halloween_combo:'Guide + newsletter · £60',halloween_section:'Section sponsor · £110',halloween_main:'Main Guide sponsor · £150',human_review:'Local-fit check · no payment'};
  const localFitRoute = form.querySelector('[data-local-fit-route]');
  const formTitle = form.querySelector('[data-ad-form-title]');
  const formIntro = form.querySelector('[data-ad-form-intro]');
  const termsCopy = form.querySelector('[data-ad-terms-copy]');
  const submitButton = form.querySelector('[data-ad-submit]');
  // Distinguish new above-the-fold engagement from enquiry submissions.
  document.querySelectorAll('[data-ad-hero-action]').forEach(link => {
    link.addEventListener('click', () => {
      const action = String(link.dataset.adHeroAction || '').trim();
      if (action && typeof window.sk8Track === 'function') {
        window.sk8Track('advertiser_hero_action', { action, variant: 'local_hero_v2' });
      }
    });
  });
  const goalLinks = [...document.querySelectorAll('[data-ad-goal]')];
  const packageJumps = [...document.querySelectorAll('[data-ad-package]')];
  const issueStat = document.querySelector('[data-stat="issuesPublished"]');
  const startedAtField = form.querySelector('[name="sk8_started_at"]');
  if (startedAtField) startedAtField.value = String(Date.now());

  if (issueStat && window.SK8_CONFIG?.publicStats?.issuesPublished) {
    issueStat.textContent = String(window.SK8_CONFIG.publicStats.issuesPublished);
  }

  const goalWrap = document.querySelector('.ad-goal-wrap');
  if (goalWrap && !goalWrap.querySelector('[data-campaign-finder-link]')) {
    const finderLink = document.createElement('a');
    finderLink.href = '/advertise/finder/';
    finderLink.className = 'button secondary';
    finderLink.dataset.campaignFinderLink = 'true';
    finderLink.textContent = 'Not sure? Use the 4-step Campaign Finder';
    finderLink.style.marginTop = '0.8rem';
    goalWrap.appendChild(finderLink);
  }

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
    'Get bookings',
    'Generate enquiries',
    'Get more people to visit',
    'Get registrations',
    'Generate purchases or offer use',
    'Build useful local awareness'
  ]);

  function setReviewMode(enabled) {
    if (localFitRoute) localFitRoute.hidden = !enabled;
    if (formTitle) formTitle.textContent = enabled ? 'Request a local-fit check' : 'Request your advert';
    if (formIntro) {
      formIntro.textContent = enabled
        ? 'No payment is taken for this check. SK8 Scoop will first decide whether the business is a sensible match for core SK8 readers.'
        : 'Newsletter £35, Halloween Guide £28, or both for £60. We confirm suitability, exact dates and payment details before you commit.';
    }
    if (termsCopy) {
      termsCopy.textContent = enabled
        ? 'I understand this is a fit check only. Any later paid campaign would still be subject to suitability, availability and separate agreement.'
        : 'I understand this is clearly labelled paid visibility, subject to suitability and availability, and that advertising does not guarantee results or favourable editorial coverage.';
    }
    if (submitButton) submitButton.textContent = enabled ? 'Send local-fit check' : 'Send enquiry · no payment now';
  }

  function setSeasonalMode(choice = '') {
    if (localFitRoute) localFitRoute.hidden = true;
    if (formTitle) formTitle.textContent = 'Halloween & Half-Term advertising enquiry';
    if (formIntro) {
      formIntro.textContent = choice && choice.includes('sponsor')
        ? `${choice}. Subject to available inventory; we confirm dates and price before payment.`
        : 'Halloween Guide £28 or Guide + newsletter £60. We confirm the Guide period and issue date before payment.';
    }
    if (termsCopy) {
      termsCopy.textContent = 'I understand this is clearly labelled paid visibility, subject to suitability and availability, and that advertising does not buy editorial inclusion, ranking, recommendation or guaranteed results.';
    }
    if (submitButton) submitButton.textContent = 'Send enquiry · no payment now';

    // Do not put package text into the required goal field: the user must write a real objective.
    if (preferredMonthField && !preferredMonthField.value) preferredMonthField.value = '2026-10';
  }

  if (finderSource === 'campaign_finder') {
    if (allowedFinderPackages.has(finderPackage)) {
      const selected = packageInputs.find(input => input.value === finderPackage);
      if (selected) {
        if (finderPackage === 'human_review' && localFitRoute) localFitRoute.hidden = false;
        selected.checked = true;
        setReviewMode(finderPackage === 'human_review');
      }
    }

    if (actionField && allowedFinderGoals.has(finderGoal) && !actionField.value.trim()) {
      const opportunityLabel = allowedFinderOpportunities.get(finderOpportunity);
      actionField.placeholder = `Your goal: ${finderGoal}. Please describe your actual offer or message here.`;
    }

    if (typeof window.sk8Track === 'function') {
      window.sk8Track('advertiser_campaign_finder_handoff', {
        route: allowedFinderPackages.has(finderPackage) ? finderPackage : 'review',
        goal: allowedFinderGoals.has(finderGoal) ? finderGoal : 'unknown'
      });
    }
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
        actionField.placeholder = `What would you like readers to ${goal.toLowerCase()}? Include a specific offer, event or useful reason.`;
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
      const seasonalChoice = String(button.dataset.seasonalChoice || '').trim();
      if (route.startsWith('halloween_')) setSeasonalMode(seasonalChoice);
      scrollToForm(form.querySelector('[name="business_name"]'));

      if (typeof window.sk8Track === 'function') {
        window.sk8Track('advertiser_package_jump', { route });
      }
    });
  });

  function reflectSelection(route) {
    sponsorOptions.forEach(label => { label.hidden = label.dataset.sponsorOption !== route; });
    if (selectionSummary) selectionSummary.textContent = `Selected: ${packageLabels[route] || 'Advertising enquiry'} · No payment taken now`;
  }

  packageInputs.forEach(input => input.addEventListener('change', () => {
    if (!input.checked) return;
    reflectSelection(input.value);
    if (input.value.startsWith('halloween_')) setSeasonalMode(packageLabels[input.value] || '');
    else setReviewMode(input.value === 'human_review');
    if (typeof window.sk8Track === 'function') {
      window.sk8Track('advertiser_route_selected', { route: input.value });
    }
  }));

  form.addEventListener('reset', () => {
    window.setTimeout(() => {
      setReviewMode(false);
      if (localFitRoute) localFitRoute.hidden = true;
      reflectSelection('starter_newsletter');
    }, 0);
  });

  reflectSelection(form.querySelector('input[name="package"]:checked')?.value || 'starter_newsletter');

  /* The established backend already accepts the generic `bespoke` route.
     Keep the reader-facing value specific and useful, then map it only at submit time. */
  form.addEventListener('submit', () => {
    const websiteInput = packageInputs.find(item => item.value === 'temp_website');
    if (!websiteInput?.checked) return;
    websiteInput.value = 'bespoke';
    queueMicrotask(() => { websiteInput.value = 'temp_website'; });
  }, true);
})();
