(() => {
  const STORAGE_KEY = 'sk8_saved_items_v1';
  const REMINDER_KEY = 'sk8_reminders_v1';
  const MAX_SHARE_ITEMS = 20;
  const PAGE_CATALOG = [
    {
      id: 'page:local-history/gatley-shouter',
      kind: 'page',
      title: 'The Gatley Shouter',
      url: '/local-history/gatley-shouter/',
      area: 'Gatley',
      category: 'Local history',
      description: 'The evidence behind one of Gatley’s oddest local legends: the Shouter, Fletcher Moss and the missing stone.'
    },
    {
      id: 'page:planning/heald-green-east',
      kind: 'page',
      title: 'Heald Green East: what the 675-home application actually proposes',
      url: '/planning/heald-green-east/',
      area: 'Heald Green',
      category: 'Planning',
      description: 'A plain-English guide to planning application DC/095134 and its current status.'
    },
    {
      id: 'page:kids-family/secondary-school-applications-2027',
      kind: 'page',
      title: 'Secondary-school applications for September 2027',
      url: '/kids-family/secondary-school-applications-2027/',
      area: 'SK8',
      category: 'Kids & family',
      description: 'The useful Stockport secondary-school application dates and checklist for SK8 parents.'
    },
    {
      id: 'page:outdoors/marple-locks-aqueduct',
      kind: 'page',
      title: 'Climb 16 locks, then find the aqueduct',
      url: '/outdoors/marple-locks-aqueduct/',
      area: 'Marple',
      category: 'Outdoors',
      description: 'A practical walk guide to Marple’s lock flight and aqueduct.'
    }
  ];
  const pageByPath = new Map(PAGE_CATALOG.map(item => [item.url.replace(/\/+$/, ''), item]));
  const state = { events: [], byId: new Map(PAGE_CATALOG.map(item => [item.id, item])) };
  let weekendPlanTracked = false;

  const track = (name, params = {}) => {
    if (typeof window.sk8Track === 'function') window.sk8Track(name, params);
  };

  const readSaved = () => {
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      return Array.isArray(value) ? value.filter(item => item && item.id) : [];
    } catch (_) {
      return [];
    }
  };

  const readReminders = () => {
    try {
      const value = JSON.parse(localStorage.getItem(REMINDER_KEY) || '[]');
      return Array.isArray(value) ? value.filter(Boolean) : [];
    } catch (_) {
      return [];
    }
  };

  const writeReminders = ids => {
    try { localStorage.setItem(REMINDER_KEY, JSON.stringify([...new Set(ids)])); } catch (_) {}
  };

  const hasReminder = id => readReminders().includes(id);

  const toggleReminder = event => {
    const ids = readReminders();
    const on = ids.includes(event.id);
    const next = on ? ids.filter(id => id !== event.id) : [...ids, event.id];
    writeReminders(next);
    if (!on && !isSaved(event.id)) saveEvent(event, 'reminder');
    track(on ? 'my_sk8_reminder_removed' : 'my_sk8_reminder_set', { event_id: event.id, event_area: event.area });
    return !on;
  };

  const writeSaved = items => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (_) {}
    window.dispatchEvent(new CustomEvent('sk8:saved-items-changed', { detail: { count: items.length } }));
  };

  const normalisePage = page => ({
    id: String(page.id || '').trim(),
    kind: 'page',
    title: String(page.title || '').trim(),
    url: String(page.url || '').trim(),
    area: String(page.area || '').trim(),
    category: String(page.category || 'Saved page').trim(),
    description: String(page.description || '').trim(),
    saved_at: new Date().toISOString()
  });

  const normaliseEvent = event => ({
    id: String(event.id || '').trim(),
    kind: 'event',
    title: String(event.title || '').trim(),
    date: String(event.date || '').trim(),
    end_date: String(event.end_date || event.date || '').trim(),
    date_range: String(event.date_range || '').trim(),
    time: String(event.time || '').trim(),
    area: String(event.area || '').trim(),
    venue: String(event.venue || '').trim(),
    cost: String(event.cost || '').trim(),
    category: String(event.category || '').trim(),
    description: String(event.description || '').trim(),
    booking_url: String(event.booking_url || '').trim(),
    source_url: String(event.source_url || '').trim(),
    checked: String(event.checked || '').trim(),
    saved_at: new Date().toISOString()
  });

  const savePage = (page, source = 'article_page') => {
    const item = normalisePage(page);
    if (!item.id || !item.url) return false;
    const saved = readSaved();
    const existing = saved.findIndex(entry => entry.id === item.id);
    const isNew = existing < 0;
    if (existing >= 0) saved[existing] = { ...saved[existing], ...item, saved_at: saved[existing].saved_at || item.saved_at };
    else saved.unshift(item);
    writeSaved(saved);
    if (isNew) track('my_sk8_save', { item_id: item.id, item_kind: 'page', item_area: item.area, save_source: source });
    return true;
  };

  const saveEvent = (event, source = 'website') => {
    const item = normaliseEvent(event);
    if (!item.id) return false;
    const saved = readSaved();
    const existing = saved.findIndex(entry => entry.id === item.id);
    const isNew = existing < 0;
    if (existing >= 0) saved[existing] = { ...saved[existing], ...item, saved_at: saved[existing].saved_at || item.saved_at };
    else saved.unshift(item);
    writeSaved(saved);
    if (isNew) track('my_sk8_save', { item_id: item.id, item_kind: 'event', event_id: item.id, event_area: item.area, save_source: source });
    return true;
  };

  const unsaveEvent = id => {
    const saved = readSaved();
    const next = saved.filter(item => item.id !== id);
    if (next.length === saved.length) return false;
    if (hasReminder(id)) {
      writeReminders(readReminders().filter(reminderId => reminderId !== id));
      track('my_sk8_reminder_removed', { event_id: id, removal_source: 'unsave' });
    }
    writeSaved(next);
    track('my_sk8_unsave', { event_id: id });
    return true;
  };

  const isSaved = id => readSaved().some(item => item.id === id);

  const escapeHtml = value => String(value || '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[char]);

  const parseDate = value => /^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))
    ? new Date(String(value) + 'T00:00:00Z')
    : null;

  const localToday = () => {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit'
    }).formatToParts(new Date());
    const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
    return `${values.year}-${values.month}-${values.day}`;
  };

  const eventEnd = event => String(event.end_date || event.date || '');
  const expired = event => event.kind === 'page' ? false : Boolean(eventEnd(event) && eventEnd(event) < localToday());

  const prettyDate = value => {
    const date = parseDate(value);
    if (!date) return '';
    return new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }).format(date);
  };

  const calendarHref = event => {
    const title = String(event.title || 'SK8 Scoop event');
    const venue = String(event.venue || '');
    const description = String(event.description || '');
    const source = String(event.booking_url || event.source_url || '');
    const date = String(event.date || '');
    const time = String(event.time || '');
    const icsEscape = value => String(value || '')
      .replace(/\\/g, '\\\\')
      .replace(/\r?\n/g, '\\n')
      .replace(/,/g, '\\,')
      .replace(/;/g, '\\;');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return '';

    const stamp = value => value.replace(/[-:]/g, '');
    let dtstart = stamp(date);
    if (/^\d{2}:\d{2}$/.test(time)) dtstart += 'T' + stamp(time) + '00';
    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//SK8 Scoop//My SK8//EN',
      'BEGIN:VEVENT',
      'UID:' + String(event.id || 'event') + '@sk8scoop.com',
      'DTSTAMP:' + new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z'),
      (/^\d{2}:\d{2}$/.test(time) ? 'DTSTART;TZID=Europe/London:' : 'DTSTART;VALUE=DATE:') + dtstart,
      'SUMMARY:' + icsEscape(title),
      'LOCATION:' + icsEscape(venue),
      'DESCRIPTION:' + icsEscape(description),
      ...(source ? ['URL:' + source] : []),
      'END:VEVENT',
      'END:VCALENDAR'
    ];
    return 'data:text/calendar;charset=utf-8,' + encodeURIComponent(lines.join('\r\n'));
  };

  const directionsHref = event => {
    const venue = String(event.venue || event.area || '').trim();
    return venue ? 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(venue) : '';
  };

  const routeHref = events => {
    const venues = events.map(event => String(event.venue || '').trim()).filter(Boolean).slice(0, 8);
    if (!venues.length) return '';
    if (venues.length === 1) return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(venues[0]);
    const destination = venues[venues.length - 1];
    const waypoints = venues.slice(0, -1);
    return 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(destination) +
      '&waypoints=' + encodeURIComponent(waypoints.join('|'));
  };

  const showToast = message => {
    let toast = document.querySelector('[data-my-sk8-toast]');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'my-sk8-toast';
      toast.dataset.mySk8Toast = '';
      toast.setAttribute('role', 'status');
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove('show'), 2600);
  };

  const button = (label, className, handler) => {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = className;
    el.textContent = label;
    el.addEventListener('click', handler);
    return el;
  };

  const linkButton = (label, href, className, eventName, event) => {
    const el = document.createElement('a');
    el.className = className;
    el.href = href;
    el.textContent = label;
    if (href.startsWith('data:text/calendar')) el.download = 'sk8-scoop-' + String(event.id || 'event') + '.ics';
    el.addEventListener('click', () => track(eventName, { event_id: event.id, event_area: event.area }));
    return el;
  };

  const seenActionRows = new WeakSet();
  const actionObserver = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting || seenActionRows.has(entry.target)) return;
      seenActionRows.add(entry.target);
      const id = entry.target.dataset.sk8EventActions || '';
      const event = state.byId.get(id);
      track('my_sk8_action_view', {
        event_id: id.slice(0, 120),
        event_area: String(event && event.area || '').slice(0, 80)
      });
      actionObserver.unobserve(entry.target);
    });
  }, { threshold: 0.5 }) : null;

  const renderEventActions = () => {
    document.querySelectorAll('[data-sk8-event-actions]').forEach(holder => {
      const id = holder.dataset.sk8EventActions;
      const event = state.byId.get(id);
      if (!event) return;
      holder.replaceChildren();

      const save = button(isSaved(id) ? 'Saved ✓' : '♡ Save', 'my-sk8-action my-sk8-save', () => {
        if (isSaved(id)) {
          unsaveEvent(id);
          save.textContent = '♡ Save';
          showToast('Removed from My SK8');
        } else {
          saveEvent(event, 'whats_on_card');
          save.textContent = 'Saved ✓';
          showToast('Saved to My SK8');
        }
        updateSavedBadges();
      });
      holder.appendChild(save);

      const reminder = button(hasReminder(id) ? 'Reminder set ✓' : 'Remind me here', 'my-sk8-action', () => {
        const enabled = toggleReminder(event);
        reminder.textContent = enabled ? 'Reminder set ✓' : 'Remind me here';
        showToast(enabled ? 'Reminder set for your next SK8 visit' : 'Reminder removed');
        if (document.body.dataset.page === 'my-sk8') renderMySk8();
      });
      holder.appendChild(reminder);

      const cal = calendarHref(event);
      if (cal) holder.appendChild(linkButton('Add to calendar', cal, 'my-sk8-action', 'my_sk8_calendar', event));

      const directions = directionsHref(event);
      if (directions) {
        const link = linkButton('Directions', directions, 'my-sk8-action', 'my_sk8_directions', event);
        link.target = '_blank';
        link.rel = 'noopener';
        holder.appendChild(link);
      }

      const nearby = document.createElement('a');
      nearby.className = 'my-sk8-action';
      nearby.href = '/whats-on/?area=' + encodeURIComponent(event.area || 'all');
      nearby.textContent = event.area ? 'More in ' + event.area : 'More nearby';
      nearby.addEventListener('click', () => track('my_sk8_nearby', { event_id: event.id, event_area: event.area }));
      holder.appendChild(nearby);

      if (actionObserver && !seenActionRows.has(holder)) actionObserver.observe(holder);
    });
  };

  const updateSavedBadges = () => {
    const count = readSaved().filter(item => !expired(item)).length;
    document.querySelectorAll('[data-my-sk8-count]').forEach(el => {
      el.textContent = String(count);
      el.hidden = count === 0;
    });
  };

  const processSaveParam = () => {
    const params = new URLSearchParams(location.search);
    const id = params.get('save');
    if (!id) return;
    const event = state.byId.get(id);
    if (!event) return;
    if (event.kind === 'page') savePage(event, 'newsletter_link');
    else saveEvent(event, 'newsletter_link');
    showToast('Saved to My SK8');
    updateSavedBadges();
    params.delete('save');
    const next = location.pathname + (params.toString() ? '?' + params.toString() : '') + location.hash;
    history.replaceState({}, '', next);
  };

  const syncEvents = events => {
    state.events = (Array.isArray(events) ? events : []).map(event => ({ ...event, kind: 'event' }));
    state.byId = new Map([
      ...PAGE_CATALOG.map(item => [item.id, item]),
      ...state.events.map(event => [String(event.id || ''), event])
    ]);
    renderEventActions();
    processSaveParam();
    if (document.body.dataset.page === 'my-sk8') renderMySk8();
  };

  const currentWeekend = () => {
    const today = parseDate(localToday());
    const day = today.getUTCDay();
    let saturday;
    if (day === 6) saturday = new Date(today);
    else if (day === 0) {
      saturday = new Date(today);
      saturday.setUTCDate(today.getUTCDate() - 1);
    } else {
      saturday = new Date(today);
      saturday.setUTCDate(today.getUTCDate() + (6 - day));
    }
    const sunday = new Date(saturday);
    sunday.setUTCDate(saturday.getUTCDate() + 1);
    const iso = date => date.toISOString().slice(0, 10);
    return [iso(saturday), iso(sunday)];
  };

  const pageCardHtml = page => {
    const live = state.byId.get(page.id) || page;
    return `
      <article class="my-sk8-saved-card my-sk8-page-card" data-saved-id="${escapeHtml(live.id)}">
        <div class="my-sk8-saved-date my-sk8-page-type"><strong>SAVED</strong><span>${escapeHtml(live.category || 'Page')}</span></div>
        <div class="my-sk8-saved-copy">
          <div class="eyebrow">${escapeHtml(live.area || live.category || 'Saved page')}</div>
          <h3>${escapeHtml(live.title)}</h3>
          <p class="my-sk8-meta">${escapeHtml(live.description || '')}</p>
          <div class="my-sk8-inline-actions">
            <a href="${escapeHtml(live.url)}" data-my-sk8-open-page="${escapeHtml(live.id)}">Open page</a>
            <button type="button" data-my-sk8-remove="${escapeHtml(live.id)}">Remove</button>
          </div>
        </div>
      </article>`;
  };

  const eventCardHtml = (event, extra = '') => {
    const live = state.byId.get(event.id) || event;
    if (live.kind === 'page') return pageCardHtml(live);
    const source = live.booking_url || live.source_url || '';
    const cal = calendarHref(live);
    const directions = directionsHref(live);
    const isPast = expired(live);
    return `
      <article class="my-sk8-saved-card" data-saved-id="${escapeHtml(live.id)}">
        <div class="my-sk8-saved-date"><strong>${escapeHtml(prettyDate(live.date))}</strong>${live.time ? '<span>' + escapeHtml(live.time) + '</span>' : ''}</div>
        <div class="my-sk8-saved-copy">
          <div class="eyebrow">${escapeHtml(live.area || live.category || 'Saved')}</div>
          <h3>${escapeHtml(live.title)}</h3>
          <p class="my-sk8-meta">${escapeHtml(live.venue)}${live.cost ? ' · ' + escapeHtml(live.cost) : ''}</p>
          ${extra}
          <div class="my-sk8-inline-actions">
            ${source ? '<a href="' + escapeHtml(source) + '" target="_blank" rel="noopener" data-my-sk8-details="' + escapeHtml(live.id) + '">Check details</a>' : ''}
            ${directions ? '<a href="' + escapeHtml(directions) + '" target="_blank" rel="noopener" data-my-sk8-directions="' + escapeHtml(live.id) + '">Directions</a>' : ''}
            ${cal ? '<a href="' + cal + '" download="sk8-scoop-' + escapeHtml(live.id) + '.ics" data-my-sk8-calendar="' + escapeHtml(live.id) + '">Calendar</a>' : ''}
            ${isPast ? '' : '<button type="button" data-my-sk8-reminder="' + escapeHtml(live.id) + '">' + (hasReminder(live.id) ? 'Reminder set ✓' : 'Remind me here') + '</button>'}
            <button type="button" data-my-sk8-remove="${escapeHtml(live.id)}">Remove</button>
          </div>
        </div>
      </article>`;
  };

  const nearbyHtml = event => {
    if (!event.area) return '';
    const candidates = state.events
      .filter(candidate => candidate.id !== event.id && candidate.area === event.area && !expired(candidate))
      .filter(candidate => candidate.date >= localToday() && !isSaved(candidate.id))
      .slice(0, 2);
    if (!candidates.length) return '';
    return '<div class="my-sk8-nearby"><strong>Also in ' + escapeHtml(event.area) + '</strong>' +
      candidates.map(candidate => '<a href="/whats-on/?save=' + encodeURIComponent(candidate.id) + '">' + escapeHtml(candidate.title) + '</a>').join('') +
      '<small>Area-based for this test, not distance-sorted.</small></div>';
  };

  const bindMySk8PageActions = () => {
    document.querySelectorAll('[data-my-sk8-reminder]').forEach(el => el.addEventListener('click', () => {
      const id = el.dataset.mySk8Reminder;
      const event = state.byId.get(id) || readSaved().find(item => item.id === id);
      if (!event) return;
      const enabled = toggleReminder(event);
      el.textContent = enabled ? 'Reminder set ✓' : 'Remind me here';
      showToast(enabled ? 'Reminder set for your next SK8 visit' : 'Reminder removed');
      renderMySk8();
    }));
    document.querySelectorAll('[data-my-sk8-remove]').forEach(el => el.addEventListener('click', () => {
      unsaveEvent(el.dataset.mySk8Remove);
      renderMySk8();
      showToast('Removed from My SK8');
    }));
    document.querySelectorAll('[data-my-sk8-open-page]').forEach(el => el.addEventListener('click', () => {
      const page = state.byId.get(el.dataset.mySk8OpenPage);
      if (page) track('my_sk8_open_saved_page', { item_id: page.id, item_kind: 'page', item_area: page.area });
    }));
    document.querySelectorAll('[data-my-sk8-details]').forEach(el => el.addEventListener('click', () => {
      const event = state.byId.get(el.dataset.mySk8Details) || readSaved().find(item => item.id === el.dataset.mySk8Details);
      if (event) track('my_sk8_check_details', { event_id: event.id, event_area: event.area });
    }));
    document.querySelectorAll('[data-my-sk8-calendar]').forEach(el => el.addEventListener('click', () => {
      const event = state.byId.get(el.dataset.mySk8Calendar) || readSaved().find(item => item.id === el.dataset.mySk8Calendar);
      if (event) track('my_sk8_calendar', { event_id: event.id, event_area: event.area });
    }));
    document.querySelectorAll('[data-my-sk8-directions]').forEach(el => el.addEventListener('click', () => {
      const event = state.byId.get(el.dataset.mySk8Directions) || readSaved().find(item => item.id === el.dataset.mySk8Directions);
      if (event) track('my_sk8_directions', { event_id: event.id, event_area: event.area });
    }));
  };

  const sharedIds = () => {
    const raw = new URLSearchParams(location.search).get('list') || '';
    return raw.split(',').map(item => item.trim()).filter(Boolean).slice(0, MAX_SHARE_ITEMS);
  };

  const renderSharedList = () => {
    const section = document.querySelector('[data-shared-shortlist]');
    const ids = sharedIds();
    if (!section || !ids.length) {
      if (section) section.hidden = true;
      return;
    }
    const items = ids.map(id => state.byId.get(id)).filter(Boolean);
    if (!items.length) {
      section.hidden = true;
      return;
    }
    section.hidden = false;
    section.querySelector('[data-shared-count]').textContent = String(items.length);
    section.querySelector('[data-shared-items]').innerHTML = items.map(event => eventCardHtml(event)).join('');
    const saveAll = section.querySelector('[data-save-shared]');
    saveAll.onclick = () => {
      items.forEach(item => item.kind === 'page' ? savePage(item, 'shared_shortlist') : saveEvent(item, 'shared_shortlist'));
      track('my_sk8_shared_save_all', { shared_items: items.length });
      renderMySk8();
      showToast('Shortlist saved to My SK8');
    };
    track('my_sk8_shared_list_view', { shared_items: items.length });
  };

  const renderMySk8 = () => {
    if (document.body.dataset.page !== 'my-sk8') return;
    const saved = readSaved().map(item => state.byId.get(item.id) ? { ...item, ...state.byId.get(item.id) } : item);
    const savedPages = saved.filter(item => item.kind === 'page');
    const active = saved.filter(item => item.kind !== 'page' && !expired(item)).sort((a, b) => ((a.date || '') + ' ' + (a.time || '')).localeCompare((b.date || '') + ' ' + (b.time || '')));
    const past = saved.filter(item => item.kind !== 'page' && expired(item)).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    const activeIds = new Set(active.map(item => item.id));
    const reminderIds = readReminders();
    const validReminderIds = reminderIds.filter(id => activeIds.has(id));
    if (validReminderIds.length !== reminderIds.length) writeReminders(validReminderIds);

    const activeHost = document.querySelector('[data-my-sk8-active]');
    const pageHost = document.querySelector('[data-my-sk8-pages]');
    const pastHost = document.querySelector('[data-my-sk8-past]');
    const empty = document.querySelector('[data-my-sk8-empty]');
    const total = document.querySelector('[data-my-sk8-total]');
    if (total) total.textContent = String(active.length + savedPages.length);
    if (empty) empty.hidden = active.length > 0 || savedPages.length > 0 || sharedIds().length > 0;

    if (activeHost) activeHost.innerHTML = active.map(event => eventCardHtml(event, nearbyHtml(event))).join('');
    if (pageHost) {
      pageHost.innerHTML = savedPages.map(page => pageCardHtml(page)).join('');
      const wrapper = pageHost.closest('[data-my-sk8-pages-section]');
      if (wrapper) wrapper.hidden = savedPages.length === 0;
    }
    if (pastHost) {
      pastHost.innerHTML = past.map(event => eventCardHtml(event)).join('');
      const wrapper = pastHost.closest('[data-my-sk8-past-section]');
      if (wrapper) wrapper.hidden = past.length === 0;
    }

    const reminderHost = document.querySelector('[data-my-sk8-reminders]');
    if (reminderHost) {
      const tomorrow = parseDate(localToday());
      tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
      const tomorrowIso = tomorrow.toISOString().slice(0, 10);
      const reminderItems = active.filter(event => hasReminder(event.id));
      const dueSoon = reminderItems.filter(event => event.date <= tomorrowIso);
      reminderHost.innerHTML = reminderItems.length
        ? (dueSoon.length
          ? dueSoon.map(event => '<div class="my-sk8-reminder-alert"><strong>' + escapeHtml(event.title) + '</strong><span>' + escapeHtml(prettyDate(event.date)) + (event.time ? ' · ' + escapeHtml(event.time) : '') + '</span></div>').join('')
          : '<p class="my-sk8-empty-copy">You have ' + reminderItems.length + ' reminder' + (reminderItems.length === 1 ? '' : 's') + ' set. We will flag them here when they get close.</p>')
        : '<p class="my-sk8-empty-copy">No reminders set yet.</p>';
    }

    const [sat, sun] = currentWeekend();
    const weekend = active.filter(event => {
      const start = event.date;
      const end = event.end_date || event.date;
      return start <= sun && end >= sat;
    });
    const weekendHost = document.querySelector('[data-weekend-plan]');
    if (weekendHost) {
      weekendHost.innerHTML = weekend.length
        ? weekend.map(event => eventCardHtml(event)).join('')
        : '<p class="my-sk8-empty-copy">None of your saved items fall this weekend yet.</p>';
      if (!weekendPlanTracked) {
        weekendPlanTracked = true;
        track('my_sk8_weekend_plan_view', { saved_weekend_items: weekend.length });
      }
    }

    const route = routeHref(active);
    const routeButton = document.querySelector('[data-map-saved]');
    if (routeButton) {
      routeButton.hidden = !route;
      routeButton.href = route || '#';
      routeButton.onclick = () => track('my_sk8_map_saved', { saved_places: active.length });
    }

    const share = document.querySelector('[data-share-saved]');
    if (share) {
      share.disabled = active.length === 0;
      share.onclick = async () => {
        const ids = [...active, ...savedPages].slice(0, MAX_SHARE_ITEMS).map(item => item.id);
        const url = new URL('/my-sk8/', location.origin);
        url.searchParams.set('list', ids.join(','));
        const shareData = { title: 'My SK8 shortlist', text: 'A few local ideas saved from SK8 Scoop', url: url.href };
        try {
          if (navigator.share) await navigator.share(shareData);
          else if (navigator.clipboard) {
            await navigator.clipboard.writeText(url.href);
            showToast('Shortlist link copied');
          } else {
            prompt('Copy this shortlist link:', url.href);
          }
          track('my_sk8_share', { shared_items: ids.length });
        } catch (_) {}
      };
    }

    renderSharedList();
    bindMySk8PageActions();
    updateSavedBadges();
  };

  const renderPageSaveBar = () => {
    const page = pageByPath.get(location.pathname.replace(/\/+$/, ''));
    if (!page || document.querySelector('[data-my-sk8-page-save-bar]')) return;
    const hero = document.querySelector('.page-hero');
    if (!hero) return;

    const section = document.createElement('section');
    section.className = 'my-sk8-page-save-section';
    section.dataset.mySk8PageSaveBar = '';
    const wrap = document.createElement('div');
    wrap.className = 'wrap my-sk8-page-save-bar';

    const copy = document.createElement('div');
    const eyebrow = document.createElement('div');
    eyebrow.className = 'eyebrow';
    eyebrow.textContent = 'Save for later';
    const strong = document.createElement('strong');
    strong.textContent = 'Keep this in My SK8';
    const note = document.createElement('span');
    note.textContent = 'Stored in this browser for the experiment.';
    copy.append(eyebrow, strong, note);

    const actions = document.createElement('div');
    actions.className = 'my-sk8-page-save-actions';
    const save = button(isSaved(page.id) ? 'Saved ✓' : '♡ Save this page', 'button secondary', () => {
      if (isSaved(page.id)) {
        unsaveEvent(page.id);
        save.textContent = '♡ Save this page';
        showToast('Removed from My SK8');
      } else {
        savePage(page, 'article_page');
        save.textContent = 'Saved ✓';
        showToast('Saved to My SK8');
      }
      updateSavedBadges();
    });
    const open = document.createElement('a');
    open.className = 'reader-link';
    open.href = '/my-sk8/';
    open.textContent = 'Open My SK8 →';
    actions.append(save, open);
    wrap.append(copy, actions);
    section.appendChild(wrap);
    hero.insertAdjacentElement('afterend', section);
    track('my_sk8_page_save_view', { item_id: page.id, item_kind: 'page', item_area: page.area });
  };

  window.SK8MySaved = { readSaved, saveEvent, savePage, unsaveEvent, renderMySk8 };

  window.addEventListener('sk8:events-loaded', event => syncEvents(event.detail && event.detail.events));
  window.addEventListener('sk8:saved-items-changed', () => {
    renderEventActions();
    if (document.body.dataset.page === 'my-sk8') renderMySk8();
    updateSavedBadges();
  });

  if (Array.isArray(window.SK8_EVENT_DATA)) syncEvents(window.SK8_EVENT_DATA);
  renderPageSaveBar();

  if (document.body.dataset.page === 'my-sk8') {
    fetch('/data/events.json', { cache: 'no-store' })
      .then(response => response.ok ? response.json() : Promise.reject(new Error('events unavailable')))
      .then(events => syncEvents(events))
      .catch(() => {
        state.events = [];
        state.byId = new Map();
        renderMySk8();
      });
  }

  updateSavedBadges();
})();