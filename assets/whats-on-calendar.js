(() => {
  'use strict';
  const core = window.SK8CalendarCore;
  const root = document.querySelector('[data-calendar-controls]');
  if (!core || !root) return;

  const listToggle = root.querySelector('[data-calendar-view="agenda"]');
  const monthToggle = root.querySelector('[data-calendar-view="month"]');
  const monthPanel = document.querySelector('[data-calendar-month-panel]');
  const monthHeading = document.querySelector('[data-calendar-month-heading]');
  const monthGrid = document.querySelector('[data-calendar-month-grid]');
  const monthStatus = document.querySelector('[data-calendar-month-status]');
  const prevMonth = document.querySelector('[data-calendar-prev]');
  const nextMonth = document.querySelector('[data-calendar-next]');
  const chosenInput = root.querySelector('[data-calendar-choose-date]');
  const clearButton = root.querySelector('[data-calendar-clear-date]');
  if (!listToggle || !monthToggle || !monthPanel || !monthGrid || !prevMonth || !nextMonth) return;

  const now = core.localToday();
  const horizon = core.anniversaryExclusive(now);
  const [year, month] = now.split('-').map(Number);
  const beginning = Date.UTC(year, month - 1, 1);
  const finalMonth = Date.UTC(year + 1, month - 1, 1);
  const params = new URLSearchParams(location.search);
  const initialMonth = String(params.get('month') || '');
  const requestedMonth = /^\d{4}-\d{2}$/.test(initialMonth) ? Date.parse(initialMonth + '-01T00:00:00Z') : NaN;
  let shownMonth = Number.isFinite(requestedMonth) && requestedMonth >= beginning && requestedMonth <= finalMonth ?
    requestedMonth : beginning;
  let view = params.get('view') === 'month' && !params.get('event') && !params.get('my_action') ? 'month' : 'agenda';
  let selectedDate = core.withinHorizon(params.get('date'), now) ? params.get('date') : '';
  let activeFilter = 'all';
  let activeArea = 'all';
  let events = [];
  const datePretty = date => new Intl.DateTimeFormat('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC'
  }).format(new Date(date + 'T00:00:00Z'));
  const monthPretty = timestamp => new Intl.DateTimeFormat('en-GB', {
    month: 'long', year: 'numeric', timeZone: 'UTC'
  }).format(new Date(timestamp));
  const pad = n => String(n).padStart(2, '0');
  const isoDate = (y, m, d) => y + '-' + pad(m + 1) + '-' + pad(d);

  function syncUrl() {
    const url = new URL(location.href);
    if (view === 'month') url.searchParams.set('view', 'month');
    else url.searchParams.delete('view');
    if (view === 'month' && shownMonth !== beginning) {
      const d = new Date(shownMonth);
      url.searchParams.set('month', d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1));
    } else url.searchParams.delete('month');
    if (selectedDate) url.searchParams.set('date', selectedDate);
    else url.searchParams.delete('date');
    history.replaceState({}, '', url);
  }

  function matchingForCalendar(event) {
    if (activeArea !== 'all' && String(event.area || '').toLowerCase() !== activeArea.toLowerCase()) return false;
    if (activeFilter === 'free' && !core.isFree(event)) return false;
    if (activeFilter === 'family' && !core.isFamily(event)) return false;
    return true;
  }

  function track(action, extra = {}) {
    if (typeof window.sk8Track !== 'function') return;
    window.sk8Track(action, Object.assign({ view: view, area: activeArea }, extra));
  }

  function renderMonth() {
    const first = new Date(shownMonth);
    const y = first.getUTCFullYear();
    const m = first.getUTCMonth();
    const days = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
    const startPadding = (first.getUTCDay() + 6) % 7;
    monthHeading.textContent = monthPretty(shownMonth);
    prevMonth.disabled = shownMonth <= beginning;
    nextMonth.disabled = shownMonth >= finalMonth;
    monthGrid.replaceChildren();

    for (const day of ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']) {
      const label = document.createElement('span');
      label.className = 'sk8-calendar-weekday';
      label.textContent = day;
      label.setAttribute('aria-hidden', 'true');
      monthGrid.appendChild(label);
    }
    for (let n = 0; n < startPadding; n++) {
      const spacer = document.createElement('span');
      spacer.className = 'sk8-calendar-blank';
      spacer.setAttribute('aria-hidden', 'true');
      monthGrid.appendChild(spacer);
    }

    let totalDays = 0;
    for (let d = 1; d <= days; d++) {
      const date = isoDate(y, m, d);
      const available = core.withinHorizon(date, now);
      const matches = available ? events.filter(event => matchingForCalendar(event) && core.onDate(event, date)) : [];
      if (matches.length) totalDays++;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'sk8-calendar-day';
      button.dataset.calendarDay = date;
      button.disabled = !available;
      button.setAttribute('aria-label', datePretty(date) + ': ' +
        (matches.length ? matches.length + (matches.length === 1 ? ' confirmed event' : ' confirmed events') : 'no confirmed events'));
      if (date === now) button.classList.add('is-today');
      if (date === selectedDate) button.classList.add('is-selected');
      if (matches.length) button.classList.add('has-events');

      const dayNum = document.createElement('strong');
      dayNum.textContent = String(d);
      const indicator = document.createElement('small');
      indicator.textContent = matches.length ? String(matches.length) + (matches.length === 1 ? ' event' : ' events') : '';
      button.append(dayNum, indicator);
      button.addEventListener('click', () => selectDate(date));
      monthGrid.appendChild(button);
    }

    if (monthStatus) monthStatus.textContent = totalDays ?
      totalDays + (totalDays === 1 ? ' day with confirmed listings. ' : ' days with confirmed listings. ') +
        'Choose a day to see the details and My SK8 actions.' :
      'No confirmed events in this month yet. We only add dates supported by organiser information.';
  }

  function render() {
    document.body.dataset.calendarView = view;
    listToggle.setAttribute('aria-pressed', String(view === 'agenda'));
    monthToggle.setAttribute('aria-pressed', String(view === 'month'));
    monthPanel.hidden = view !== 'month';
    if (chosenInput) {
      chosenInput.min = now;
      chosenInput.max = core.dayAfter(horizon) === horizon ? horizon : new Date(Date.parse(horizon + 'T00:00:00Z') - 86400000).toISOString().slice(0, 10);
      chosenInput.value = selectedDate;
    }
    if (clearButton) clearButton.hidden = !selectedDate;
    if (view === 'month') renderMonth();
  }

  function chooseView(next) {
    view = next;
    if (next === 'month' && selectedDate) {
      selectedDate = '';
      window.dispatchEvent(new CustomEvent('sk8:calendar-day-selected', { detail: { date: '' } }));
    }
    if (next === 'month' && ['today', 'week', 'weekend'].includes(activeFilter)) {
      window.dispatchEvent(new CustomEvent('sk8:calendar-clear-date-shortcut'));
      activeFilter = 'all';
    }
    syncUrl();
    render();
    track('whats_on_calendar_view', { calendar_view: view });
  }

  function selectDate(date) {
    if (date && !core.withinHorizon(date, now)) return;
    selectedDate = date;
    view = 'agenda';
    window.dispatchEvent(new CustomEvent('sk8:calendar-day-selected', { detail: { date: date } }));
    syncUrl();
    render();
    if (date) track('whats_on_calendar_date', { selected_month: date.slice(0, 7) });
    document.getElementById('current-listings')?.scrollIntoView({ behavior: 'auto', block: 'start' });
  }

  listToggle.addEventListener('click', () => chooseView('agenda'));
  monthToggle.addEventListener('click', () => chooseView('month'));
  prevMonth.addEventListener('click', () => {
    shownMonth = Date.UTC(new Date(shownMonth).getUTCFullYear(), new Date(shownMonth).getUTCMonth() - 1, 1);
    syncUrl(); render(); track('whats_on_calendar_month');
  });
  nextMonth.addEventListener('click', () => {
    shownMonth = Date.UTC(new Date(shownMonth).getUTCFullYear(), new Date(shownMonth).getUTCMonth() + 1, 1);
    syncUrl(); render(); track('whats_on_calendar_month');
  });
  chosenInput?.addEventListener('change', () => {
    if (core.withinHorizon(chosenInput.value, now)) selectDate(chosenInput.value);
    else { chosenInput.value = selectedDate; }
  });
  clearButton?.addEventListener('click', () => selectDate(''));
  window.addEventListener('sk8:events-loaded', event => {
    events = Array.isArray(event.detail?.events) ? event.detail.events : [];
    render();
  });
  window.addEventListener('sk8:whatson-state', event => {
    activeArea = event.detail?.area || 'all';
    activeFilter = event.detail?.filter || 'all';
    selectedDate = event.detail?.date || '';
    if (view === 'month') renderMonth();
    if (chosenInput) chosenInput.value = selectedDate;
    if (clearButton) clearButton.hidden = !selectedDate;
  });
  if (Array.isArray(window.SK8_EVENT_DATA)) events = window.SK8_EVENT_DATA;
  render();
})();