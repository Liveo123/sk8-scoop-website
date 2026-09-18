(() => {
  const form = document.getElementById('campaign-finder');
  const result = document.querySelector('[data-finder-result]');
  const errorBox = document.querySelector('[data-finder-error]');
  if (!form || !result) return;

  const goalLabels = {
    book: 'Get bookings',
    enquire: 'Generate enquiries',
    visit: 'Get more people to visit',
    register: 'Get registrations',
    buy: 'Generate purchases or offer use',
    awareness: 'Build useful local awareness'
  };

  const categoryLabels = {
    hospitality: 'restaurant, pub, café or venue',
    class: 'class, course or club',
    family: 'children or family activity',
    trade: 'trade, property or home service',
    professional: 'professional or local service',
    retail: 'shop or retail business',
    fitness: 'fitness or wellbeing business',
    event: 'event or experience',
    other: 'local business'
  };

  const timingLabels = {
    under7: 'within 7 days',
    weeks: 'within 1–4 weeks',
    months: 'within 1–3 months',
    ongoing: 'as an ongoing objective'
  };

  const valueLabels = {
    under20: 'under £20',
    '20to100': '£20–£100',
    '100to500': '£100–£500',
    '500plus': '£500+',
    unknown: 'unknown'
  };

  const transactionalGoals = new Set(['book', 'enquire', 'visit', 'register', 'buy']);

  function fieldValue(name) {
    const field = form.elements[name];
    if (!field) return '';
    if (field instanceof RadioNodeList) return field.value || '';
    return String(field.value || '');
  }

  function checked(name) {
    const field = form.elements[name];
    return Boolean(field && field.checked);
  }

  function inputs() {
    return {
      goal: fieldValue('goal'),
      category: fieldValue('category'),
      area: fieldValue('area'),
      timing: fieldValue('timing'),
      value: fieldValue('value'),
      specific: checked('specific'),
      route: checked('route'),
      freecheap: checked('freecheap'),
      none: checked('none')
    };
  }

  function requiredComplete(v) {
    return Boolean(v.goal && v.category && v.area && v.timing && v.value && (v.specific || v.route || v.freecheap || v.none));
  }

  function progress() {
    const v = inputs();
    const steps = [...document.querySelectorAll('.finder-progress span')];
    const done = [
      Boolean(v.goal),
      Boolean(v.category && v.area),
      Boolean(v.timing && v.value),
      Boolean(v.specific || v.route || v.freecheap || v.none)
    ];
    steps.forEach((step, index) => step.classList.toggle('is-complete', done[index]));
  }

  function genericPromotion(v) {
    const category = categoryLabels[v.category] || 'local business';
    const action = {
      book: 'one specific bookable proposition',
      enquire: 'one specific service or problem you can solve',
      visit: 'one concrete reason to visit now',
      register: 'the dated class, course, event or registration opportunity',
      buy: 'one specific product, bundle or genuine offer',
      awareness: 'one clear reason local people should remember you'
    }[v.goal] || 'one clear proposition';
    return `${action} from your ${category}, rather than the business in general.`;
  }

  function recommendation(v) {
    const base = {
      goal: goalLabels[v.goal],
      promote: genericPromotion(v),
      timing: timingLabels[v.timing],
      value: valueLabels[v.value],
      state: 'test',
      badge: 'TEST',
      title: 'TEST £40 is the sensible first route.',
      price: '£40',
      doFirst: 'Nothing obvious from these answers. The final suitability and availability check still comes before payment.',
      why: [
        'A single newsletter placement can answer one useful question before you spend more.',
        'Your proposition has a practical next action for readers.'
      ],
      alternative: '',
      package: 'temp_test',
      cta: 'Request this TEST route'
    };

    if (v.area === 'outside') {
      return {
        ...base,
        state: 'notfit',
        badge: 'NOT A FIT',
        title: 'SK8 Scoop is probably not the right paid channel for this campaign.',
        price: '',
        doFirst: 'Put the budget where the audience is actually concentrated rather than widening SK8 Scoop’s geography to make the sale.',
        why: ['Your customers are mainly outside the normal SK8 reader area.'],
        alternative: '',
        package: '',
        cta: ''
      };
    }

    if (v.area === 'nearby') {
      return {
        ...base,
        state: 'review',
        badge: 'HUMAN REVIEW',
        title: 'This needs a quick local-fit check first.',
        price: '',
        doFirst: 'Let SK8 Scoop check whether the proposition is genuinely useful enough to core SK8 readers to justify widening the normal geography.',
        why: ['The business is immediately nearby rather than squarely inside the core SK8 area.'],
        alternative: '',
        package: '',
        cta: 'Ask SK8 Scoop to check the fit'
      };
    }

    if (v.timing === 'under7') {
      return {
        ...base,
        state: 'wait',
        badge: 'WAIT / CHECK TIMING',
        title: 'Do not pay until SK8 Scoop confirms there is enough lead time.',
        price: '',
        doFirst: 'Check newsletter availability, creative time and your deadline. A good prospect can still be a bad campaign if it runs too late.',
        why: ['The result matters within seven days, so timing is now the main constraint.'],
        alternative: '',
        package: '',
        cta: 'Ask about urgent availability'
      };
    }

    if (transactionalGoals.has(v.goal) && !v.route) {
      return {
        ...base,
        state: 'fix',
        badge: 'FIX FIRST',
        title: 'Make the next step easy before buying attention.',
        price: '',
        doFirst: 'Set up one working booking, enquiry, registration, purchase or normal phone/contact route that can complete the action.',
        why: ['The campaign asks readers to act, but there is not yet a clear way for them to complete that action.'],
        alternative: '',
        package: '',
        cta: ''
      };
    }

    if (transactionalGoals.has(v.goal) && !v.specific) {
      return {
        ...base,
        state: 'fix',
        badge: 'FIX FIRST',
        title: 'Give readers a concrete reason to act before paying for a placement.',
        price: '',
        doFirst: 'Choose one bookable service, dated event, offer, launch, menu, course, limited-space opportunity or similarly clear proposition.',
        why: ['A transactional goal with only generic awareness gives the TEST very little to test.'],
        alternative: '',
        package: '',
        cta: ''
      };
    }

    if (v.goal === 'awareness' && !v.specific) {
      return {
        ...base,
        state: 'fix',
        badge: 'FIX FIRST',
        title: 'Define what you want local people to remember.',
        price: '',
        doFirst: 'Turn “more awareness” into one memorable local proposition, service or reason to care. Then TEST can become a defined experiment rather than vague exposure.',
        why: ['The goal is awareness but there is not yet a specific message to measure or learn from.'],
        alternative: '',
        package: '',
        cta: ''
      };
    }

    if (v.timing === 'ongoing' && v.goal === 'awareness') {
      base.why = [
        'SK8 Scoop does not currently sell an automatic recurring-awareness subscription.',
        'A defined one-off TEST can still answer whether this message earns local attention.'
      ];
      base.doFirst = 'Treat this as one defined TEST rather than an open-ended advertising commitment.';
    }

    if (v.value === 'under20' && ['retail', 'hospitality'].includes(v.category) && !v.specific) {
      return {
        ...base,
        state: 'fix',
        badge: 'FIX FIRST',
        title: 'Strengthen the economics before buying the advert.',
        price: '',
        doFirst: 'Create a useful bundle, event, booking proposition or genuine offer so the likely transaction value is not relying on a low-ticket generic purchase.',
        why: ['The typical transaction is under £20 and there is no stronger proposition yet.'],
        alternative: '',
        package: '',
        cta: ''
      };
    }

    if (v.freecheap) {
      return {
        ...base,
        state: 'grow',
        badge: 'GROW CANDIDATE',
        title: 'GROW £90 may be the best fit, subject to a Guide check.',
        price: '£90',
        doFirst: 'SK8 Scoop must confirm that the proposition genuinely belongs in the Free & Cheap Guide. The checkbox alone does not guarantee that fit.',
        why: [
          'You have a specific action and working next step.',
          'You have identified a genuinely free or low-cost proposition that may add a useful second reader context.'
        ],
        alternative: 'TEST £40 remains the simpler alternative if one newsletter placement can answer the useful question on its own.',
        package: 'temp_grow',
        cta: 'Request a GROW fit check'
      };
    }

    if (v.value === 'under20') {
      base.why.push('Because the typical value is under £20, keep the test small and judge it against real business outcomes rather than clicks alone.');
    } else if (v.value === 'unknown') {
      base.why.push('Customer value is unknown, so keep the first spend small rather than pretending the economics are proven.');
    } else {
      base.why.push(`A typical customer value of ${base.value} makes a small first experiment commercially plausible, without implying guaranteed ROI.`);
    }

    return base;
  }

  function buildAdvertiseUrl(rec) {
    const params = new URLSearchParams();
    if (rec.package) params.set('finder_package', rec.package);
    if (rec.goal) params.set('finder_goal', rec.goal);
    params.set('finder_source', 'campaign_finder');
    return `/advertise.html?${params.toString()}#campaign-enquiry`;
  }

  function render(rec) {
    result.dataset.state = rec.state;
    const reasons = rec.why.map(reason => `<li>${reason}</li>`).join('');
    const alternative = rec.alternative ? `<div><dt>Simpler alternative</dt><dd>${rec.alternative}</dd></div>` : '';
    const action = rec.cta ? `<a class="button" href="${buildAdvertiseUrl(rec)}">${rec.cta}</a>` : '';
    const secondary = `<a class="button secondary" href="/advertise.html">See current advertising options</a>`;

    result.innerHTML = `
      <div class="eyebrow">YOUR RESULT</div>
      <div class="finder-badge">${rec.badge}</div>
      <h2>${rec.title}</h2>
      ${rec.price ? `<div class="finder-price">${rec.price}</div>` : ''}
      <dl>
        <div><dt>Your goal</dt><dd>${rec.goal}</dd></div>
        <div><dt>Do this first</dt><dd>${rec.doFirst}</dd></div>
        <div><dt>What I would promote</dt><dd>${rec.promote}</dd></div>
        <div><dt>Why</dt><dd><ul>${reasons}</ul></dd></div>
        ${alternative}
        <div><dt>Timing</dt><dd>Your stated need is ${rec.timing}. Actual publication remains subject to availability and approval.</dd></div>
        <div><dt>What SK8 Scoop does</dt><dd>Shapes the reader-facing paid placement, labels it clearly as commercial and sends it for factual approval.</dd></div>
        <div><dt>What gets measured</dt><dd>SK8-measured response is kept separate from any enquiries, bookings or sales you can confirm afterwards.</dd></div>
      </dl>
      <p class="fine">Advertising does not guarantee results or favourable editorial treatment.</p>
      <div class="finder-result-actions">${action}${secondary}</div>`;
  }

  form.addEventListener('change', event => {
    const target = event.target;
    if (target && target.name === 'none' && target.checked) {
      ['specific', 'route', 'freecheap'].forEach(name => {
        const field = form.elements[name];
        if (field) field.checked = false;
      });
    } else if (target && ['specific', 'route', 'freecheap'].includes(target.name) && target.checked) {
      const noneField = form.elements.none;
      if (noneField) noneField.checked = false;
    }
    progress();
  });

  form.addEventListener('reset', () => {
    window.setTimeout(() => {
      progress();
      result.dataset.state = '';
      result.innerHTML = '<div class="eyebrow">YOUR RESULT</div><h2>Complete the four steps.</h2><p>The finder will recommend the smallest current route that can answer a useful business question. It can also tell you not to buy yet.</p>';
      if (errorBox) errorBox.hidden = true;
    }, 0);
  });

  form.addEventListener('submit', event => {
    event.preventDefault();
    const v = inputs();
    if (!requiredComplete(v)) {
      if (errorBox) errorBox.hidden = false;
      form.querySelector(':invalid')?.focus();
      return;
    }
    if (errorBox) errorBox.hidden = true;
    const rec = recommendation(v);
    render(rec);
    result.scrollIntoView({ behavior: 'smooth', block: 'start' });

    if (typeof window.sk8Track === 'function') {
      window.sk8Track('advertiser_campaign_finder_result', {
        recommendation: rec.state,
        goal: v.goal,
        category: v.category,
        timing: v.timing,
        value_band: v.value,
        guide_candidate: v.freecheap ? 'yes' : 'no'
      });
    }
  });

  progress();
})();
