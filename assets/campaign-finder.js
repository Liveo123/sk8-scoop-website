(() => {
  const form = document.getElementById('campaign-finder');
  const result = document.querySelector('[data-finder-result]');
  const errorBox = document.querySelector('[data-finder-error]');
  const contextBox = document.querySelector('[data-finder-context]');
  const finderParams = new URLSearchParams(window.location.search);
  const opportunity = finderParams.get('opportunity') || '';
  if (!form || !result) return;

  const goalLabels = {
    book: 'Get bookings',
    enquire: 'Generate enquiries',
    visit: 'Get more people to visit',
    register: 'Get registrations',
    buy: 'Generate purchases or offer use',
    awareness: 'Build useful local awareness'
  };

  const timingLabels = {
    under7: 'within 7 days',
    weeks: 'within 1–4 weeks',
    months: 'within 1–3 months',
    ongoing: 'on an ongoing basis'
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

  function applyOpportunityPreset() {
    if (opportunity !== 'christmas-eating-out') return;
    const goal = form.querySelector('input[name="goal"][value="book"]');
    const category = form.elements.category;
    if (goal) goal.checked = true;
    if (category) category.value = 'hospitality';
    if (contextBox) {
      contextBox.hidden = false;
      contextBox.innerHTML = '<strong>Christmas Eating Out loaded.</strong> “Book” and “Restaurant, pub, café or venue” are preselected. Complete the remaining questions for the recommendation.';
    }
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
    return {
      book: 'A specific booking opportunity, such as a class, appointment, table, course place or event. Keep the advert focused on that booking reason, not the whole business.',
      enquire: 'One specific service or problem you solve that gives local readers a clear reason to enquire.',
      visit: 'One timely reason to visit, such as an event, opening, special menu, launch or genuine offer.',
      register: 'The specific class, course, event or other opportunity readers can register for.',
      buy: 'One specific product, bundle or genuine offer with a clear reason to buy now.',
      awareness: 'One memorable fact, service or reason you want local people to associate with the business.'
    }[v.goal] || 'One clear proposition that gives local readers a useful reason to care.';
  }

  function recommendation(v) {
    const base = {
      goal: goalLabels[v.goal],
      promote: genericPromotion(v),
      timing: timingLabels[v.timing],
      value: valueLabels[v.value],
      state: 'test',
      badge: 'TEST',
      title: 'Start with TEST.',
      price: '£40',
      doFirst: v.goal === 'awareness'
        ? 'You have a specific message worth testing. SK8 Scoop just needs to confirm suitability and newsletter availability before payment.'
        : 'Your answers include a clear proposition and a practical way for readers to act. SK8 Scoop just needs to confirm suitability and newsletter availability before payment.',
      why: [
        v.goal === 'awareness'
          ? 'TEST gives you one sponsored newsletter placement focused on one specific message.'
          : 'TEST gives you one sponsored newsletter placement focused on one clear reader action.',
        'It keeps the first spend small while giving you a defined campaign to learn from.'
      ],
      alternative: '',
      package: 'temp_test',
      cta: 'Ask about TEST £40'
    };

    if (v.area === 'outside') {
      return {
        ...base,
        state: 'notfit',
        badge: 'NOT A FIT',
        title: 'SK8 Scoop is unlikely to be the right paid channel for this campaign.',
        price: '',
        doFirst: 'Use a channel whose audience is concentrated where most of your customers are. If the business has an unusually strong SK8 connection, ask SK8 Scoop to review the fit instead.',
        why: ['You said most of your customers are outside SK8 Scoop’s normal reader area.'],
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
        doFirst: 'Ask SK8 Scoop to confirm that the offer is genuinely relevant to core SK8 readers before choosing a paid package.',
        why: ['Your main customer area is nearby rather than inside the core SK8 area.'],
        alternative: '',
        package: 'human_review',
        cta: 'Request a local-fit check'
      };
    }

    if (v.none) {
      if (v.goal === 'awareness') {
        return {
          ...base,
          state: 'fix',
          badge: 'FIX FIRST',
          title: 'Decide what you want local people to remember first.',
          price: '',
          doFirst: 'Choose one memorable proposition, service, opening, event, difference or local reason to care. Then the campaign can test something more specific than general awareness.',
          why: ['You selected “None of these yet”, so there is not yet a specific message to test.'],
          alternative: '',
          package: '',
          cta: ''
        };
      }
      return {
        ...base,
        state: 'fix',
        badge: 'FIX FIRST',
        title: 'Build the offer and the next step before paying for attention.',
        price: '',
        doFirst: 'Choose one concrete reason for readers to act, then give them one clear way to complete that action, such as a booking page, enquiry form, registration page, checkout or normal contact route.',
        why: ['You selected “None of these yet”, so the campaign does not yet have a specific proposition or a working next step.'],
        alternative: '',
        package: '',
        cta: ''
      };
    }

    if (transactionalGoals.has(v.goal) && !v.route) {
      return {
        ...base,
        state: 'fix',
        badge: 'FIX FIRST',
        title: 'Make it easy for readers to take the next step first.',
        price: '',
        doFirst: 'Set up one working booking page, enquiry form, registration page, checkout, phone number or other normal contact route that can complete the action.',
        why: ['You want readers to act, but your answers do not yet show a clear way for them to complete that action.'],
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
        title: 'Give readers a specific reason to act first.',
        price: '',
        doFirst: 'Choose one bookable service, dated event, genuine offer, launch, menu, course, limited-place opportunity or similarly clear proposition.',
        why: ['You want readers to take action, but the message is still too general to make a useful £40 test.'],
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
        title: 'Decide what you want local people to remember first.',
        price: '',
        doFirst: 'Choose one memorable proposition, service, opening, event, difference or local reason to care. Then the campaign can test something more specific than general awareness.',
        why: ['“More awareness” is too broad on its own to tell you what worked.'],
        alternative: '',
        package: '',
        cta: ''
      };
    }

    if (v.timing === 'under7') {
      return {
        ...base,
        state: 'wait',
        badge: 'WAIT / CHECK TIMING',
        title: 'Check timing before spending anything.',
        price: '',
        doFirst: 'Ask SK8 Scoop whether there is a suitable newsletter slot before your deadline. If not, wait for the next useful opportunity rather than running the campaign too late.',
        why: ['You need the campaign to work within 7 days, so there may not be enough time to prepare, approve and publish it usefully.'],
        alternative: '',
        package: '',
        cta: 'Check urgent availability'
      };
    }

    if (v.timing === 'ongoing' && v.goal === 'awareness') {
      base.why = [
        'SK8 Scoop does not currently offer automatic recurring awareness placements.',
        'A one-off TEST can still show whether one specific message earns useful local attention.'
      ];
      base.doFirst = 'Define one message and one thing you want to learn from a single TEST. Treat it as a one-off experiment rather than an open-ended awareness campaign.';
    }

    if (v.freecheap) {
      return {
        ...base,
        state: 'grow',
        badge: 'GROW CANDIDATE',
        title: 'GROW looks like the right route, subject to a Guide fit check.',
        price: '£90',
        doFirst: 'Before booking, SK8 Scoop will check that the free or low-cost proposition genuinely belongs in the Free & Cheap Guide.',
        why: [
          'Your campaign has a specific proposition rather than a general awareness message.',
          'The free or low-cost element could add a genuinely useful second context in the Free & Cheap Guide.'
        ],
        alternative: 'If the Guide is not a genuine fit, TEST £40 is the simpler option: one sponsored newsletter placement.',
        package: 'temp_grow',
        cta: 'Ask about GROW £90'
      };
    }

    if (v.value === 'under20') {
      base.why.push('Because the typical customer value is under £20, keep the first test small and judge it against real business outcomes, not clicks alone.');
    } else if (v.value === 'unknown') {
      base.why.push('Customer value is unknown, so keeping the first spend small reduces risk while you learn whether the campaign produces useful business outcomes.');
    } else {
      base.why.push(`A typical customer value of ${base.value} makes a £40 first experiment proportionate, while results still remain uncertain.`);
    }

    return base;
  }

  function buildAdvertiseUrl(rec) {
    const params = new URLSearchParams();
    if (rec.package) params.set('finder_package', rec.package);
    if (rec.goal) params.set('finder_goal', rec.goal);
    params.set('finder_source', 'campaign_finder');
    if (opportunity) params.set('finder_opportunity', opportunity);
    return `/advertise.html?${params.toString()}#campaign-enquiry`;
  }

  function render(rec) {
    result.dataset.state = rec.state;
    const reasons = rec.why.map(reason => `<li>${reason}</li>`).join('');
    const alternative = rec.alternative ? `<div><dt>Simpler alternative</dt><dd>${rec.alternative}</dd></div>` : '';
    const action = rec.cta ? `<a class="button" href="${buildAdvertiseUrl(rec)}">${rec.cta}</a>` : '';
    const secondary = ['test', 'grow', 'wait', 'review'].includes(rec.state)
      ? `<a class="button secondary" href="/advertise.html">See current advertising options</a>`
      : '';

    result.innerHTML = `
      <div class="eyebrow">YOUR RESULT</div>
      <div class="finder-badge">${rec.badge}</div>
      <h2>${rec.title}</h2>
      ${rec.price ? `<div class="finder-price">${rec.price}</div>` : ''}
      <dl>
        <div><dt>Your goal</dt><dd>${rec.goal}</dd></div>
        <div><dt>Next step</dt><dd>${rec.doFirst}</dd></div>
        <div><dt>What to promote</dt><dd>${rec.promote}</dd></div>
        <div><dt>Why this recommendation</dt><dd><ul>${reasons}</ul></dd></div>
        ${alternative}
        <div><dt>Timing</dt><dd>You said this matters ${rec.timing}. Publication still depends on suitability, availability and approval.</dd></div>
        <div><dt>What SK8 Scoop prepares</dt><dd>If the campaign goes ahead, SK8 Scoop prepares the reader-facing paid placement, clearly labels it as advertising and sends the wording to you for factual approval before publication.</dd></div>
        <div><dt>How success is measured</dt><dd>If it runs, SK8 Scoop can measure response to the advert link. Keep that separate from enquiries, bookings or sales that only your business can confirm.</dd></div>
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

    // On desktop the result sits beside the form and is sticky, so forcing
    // scrollIntoView jumps the page back to the top of the form. On stacked
    // layouts, the result is below the form and should be brought into view.
    if (window.matchMedia('(max-width: 850px)').matches) {
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      result.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    }

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

  applyOpportunityPreset();
  progress();
})();
