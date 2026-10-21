/* SK8 Scoop Guide Factory: reusable dated-event expiry, v1. UK event days are inclusive. */
(function (root, make) {
  const api = make();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.SK8GuideExpiry = api;
})(typeof window === 'object' ? window : undefined, function () {
  'use strict';
  const DAY = 86400000;
  const isoRE = /^\d{4}-\d{2}-\d{2}$/;
  const validDay = x => typeof x === 'string' && isoRE.test(x) && !Number.isNaN(Date.parse(x + 'T12:00:00Z')) && new Date(x + 'T12:00:00Z').toISOString().slice(0, 10) === x;
  const toDay = x => Date.parse(x + 'T12:00:00Z');
  const shiftDay = (iso, days) => new Date(toDay(iso) + days * DAY).toISOString().slice(0, 10);
  const ukToday = (date = new Date()) => {
    const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
    const part = key => parts.find(p => p.type === key).value;
    return part('year') + '-' + part('month') + '-' + part('day');
  };
  const kindOf = schedule => (schedule && schedule.kind) || 'dated';
  const futureSlots = (schedule, today) => {
    if (!validDay(today)) throw new Error('Invalid UK date: ' + today);
    if (!schedule || kindOf(schedule) !== 'dated') return [];
    const excluded = new Set(schedule.excluded_dates || []);
    const result = [];
    for (const date of (schedule.dates || [])) {
      if (!validDay(date)) continue;
      if (date >= today && !excluded.has(date)) result.push({ start: date, end: date, isSingle: true });
    }
    for (const span of (schedule.ranges || [])) {
      if (!Array.isArray(span) || span.length !== 2) continue;
      const [start, end] = span;
      if (!validDay(start) || !validDay(end) || start > end || end < today) continue;
      let next = start < today ? today : start;
      while (next <= end && excluded.has(next)) next = shiftDay(next, 1);
      if (next <= end) result.push({ start: next, end, isSingle: next === end, isRange: true });
    }
    return result.sort((a, b) => a.start.localeCompare(b.start));
  };
  const status = (schedule, today) => {
    const kind = kindOf(schedule);
    if (kind === 'evergreen') return 'evergreen';
    if (kind === 'open-ended') return 'needs-review';
    if (kind !== 'dated' || (!schedule.dates?.length && !schedule.ranges?.length)) return 'needs-review';
    return futureSlots(schedule, today).length ? 'current' : 'expired';
  };
  const formatDay = iso => new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(iso + 'T12:00:00Z'));
  const labelSpan = (start, end) => start === end ? formatDay(start) : formatDay(start) + '–' + formatDay(end);
  const gcal = (title, start, end, where, guideUrl) => {
    const query = new URL('https://calendar.google.com/calendar/render');
    query.searchParams.set('action', 'TEMPLATE');
    query.searchParams.set('text', title);
    query.searchParams.set('dates', start.replace(/-/g, '') + '/' + shiftDay(end, 1).replace(/-/g, ''));
    if (where) query.searchParams.set('location', where);
    query.searchParams.set('details', 'Check organiser times and booking before travelling. ' + guideUrl);
    return query.href;
  };
  const hasPassedSlot = (schedule, today) => {
    if (!schedule || kindOf(schedule) !== 'dated') return false;
    return (schedule.dates || []).some(d => validDay(d) && d < today) ||
      (schedule.ranges || []).some(pair => validDay(pair[0]) && pair[0] < today);
  };
  const setNextDateNote = (card, schedule, today) => {
    const old = card.querySelector('.sk8-remaining-dates');
    if (old) old.remove();
    if (!hasPassedSlot(schedule, today) || status(schedule, today) !== 'current') return;
    const slots = futureSlots(schedule, today);
    if (!slots.length) return;
    const note = document.createElement('p');
    note.className = 'sk8-remaining-dates';
    note.textContent = 'Still to come: ' + slots.map(s => labelSpan(s.start, s.end)).join(', ') + '. Check organiser availability.';
    const facts = card.querySelector('.facts');
    if (facts) facts.parentNode.insertBefore(note, facts);
  };
  const renderCalendarAction = (card, entry, today) => {
    const wrap = card.querySelector('.nue-utility-actions');
    if (!wrap) return;
    wrap.querySelectorAll('.nue-calendar,.nue-date-choices').forEach(node => node.remove());
    const schedule = entry.schedule;
    if (status(schedule, today) !== 'current' || schedule.selected_dates) return;
    const slots = futureSlots(schedule, today);
    if (!slots.length) return;
    const title = (card.querySelector('h3')?.textContent || entry.n || 'Event').trim();
    const where = [...card.querySelectorAll('.facts>div')].find(div => div.querySelector('dt')?.textContent.trim().toLowerCase() === 'where')?.querySelector('dd')?.textContent.trim() || '';
    const linkUrl = new URL('#event-' + card.dataset.eventIndex, location.href).href;
    const icon = () => { const span = document.createElement('span'); span.className = 'nue-icon';span.setAttribute('aria-hidden', 'true');span.textContent = '+';return span; };
    const place = wrap.querySelector('.nue-share') || wrap.querySelector('.nue-save-note');
    const attach = node => wrap.insertBefore(node, place);
    if (slots.length === 1) {
      const slot = slots[0];
      const link = document.createElement('a');
      link.className = 'nue-calendar';link.target = '_blank';link.rel = 'noopener';
      link.href = gcal(title, slot.start, slot.end, where, linkUrl);
      link.append(icon(), document.createTextNode(slot.isSingle ? 'Add to calendar' : 'Add date range'));
      attach(link);return;
    }
    const toggle = document.createElement('button');toggle.type = 'button';toggle.className = 'nue-calendar';toggle.setAttribute('aria-expanded', 'false');toggle.append(icon(), document.createTextNode('Choose a date'));
    const choices = document.createElement('div');choices.className = 'nue-date-choices';choices.hidden = true;
    for (const slot of slots) {
      const a = document.createElement('a');a.href = gcal(title, slot.start, slot.end, where, linkUrl);a.target = '_blank';a.rel = 'noopener';a.textContent = labelSpan(slot.start, slot.end);choices.append(a);
    }
    toggle.addEventListener('click', () => {choices.hidden = !choices.hidden;toggle.setAttribute('aria-expanded', String(!choices.hidden));});
    attach(toggle);attach(choices);
  };
  const mount = ({ entries, today: overrideToday, onReviewNeeded } = {}) => {
    if (!Array.isArray(entries)) throw new Error('Guide Factory expiry requires an entries array');
    const cards = [...document.querySelectorAll('.card[data-event-index]')];
    const filterButtons = [...document.querySelectorAll('.filter[data-filter]')];
    const calendar = document.querySelector('.calendar-grid');
    const heroCount = document.querySelector('#guide-current-count');
    const resultCount = document.querySelector('#result-count');
    const empty = document.querySelector('#no-results');
    const review = new Set();
    let lastDay = null;
    function render() {
      const today = typeof overrideToday === 'function' ? overrideToday() : overrideToday || ukToday();
      const active = filterButtons.find(b => b.classList.contains('active'))?.dataset.filter || 'all';
      let remaining = 0, showing = 0, dated = 0;
      const events = [];
      review.clear();
      for (const card of cards) {
        const number = Number(card.dataset.eventIndex);
        const entry = entries[number - 1];
        const state = entry?.retired ? 'expired' : entry ? status(entry.schedule, today) : 'needs-review';
        if (state === 'needs-review') review.add(number);
        if (state !== 'expired') remaining++;
        const match = active === 'all' || card.dataset.tags?.split(/\s+/).includes(active);
        card.hidden = state === 'expired' || !match;
        card.dataset.dateStatus = state;
        if (!card.hidden) showing++;
        if (state === 'current') {
          const next = futureSlots(entry.schedule, today)[0];
          if (next) {dated++;if (!entry.schedule.selected_dates) events.push({ next, number, entry });}
        }
        if (today !== lastDay && entry) {
          setNextDateNote(card, entry.schedule, today);
          renderCalendarAction(card, entry, today);
        }
      }
      if (resultCount) resultCount.textContent = showing + ' shown';
      if (heroCount) heroCount.textContent = String(remaining);
      if (empty) {
        empty.classList.toggle('show', showing === 0);
        empty.textContent = remaining === 0 ? 'The dated events have finished. Try our year-round Free & Cheap Guide for more ideas.' : 'No current activity matches that filter. Try another option.';
      }
      if (calendar && today !== lastDay) buildCalendar(calendar, events, today);
      const note = document.getElementById('sk8-guide-expiry-note');
      if (note) {
        if (dated === 0) {
          const a = document.createElement('a');a.href='/free-cheap-guide/guide/';a.textContent='Free & Cheap Guide';
          note.replaceChildren(document.createTextNode('The dated Halloween activities have finished for this year. Explore our '),a,document.createTextNode(' for year-round ideas.'));
        } else note.textContent = 'Past event dates are hidden automatically using the UK calendar. Always check the organiser before travelling.';
        if (/^#event-\d+$/.test(location.hash)) {
          const target = document.getElementById(location.hash.slice(1))?.closest('.card');
          if (target?.dataset.dateStatus === 'expired') {
            note.textContent = 'The event in that link has finished. Browse the current activities below.';
            note.scrollIntoView({ block: 'start', behavior: 'auto' });
          }
        }
      }
      lastDay = today;
      if (typeof onReviewNeeded === 'function' && review.size) onReviewNeeded([...review]);
      return { today, remaining, showing, dated, needsReview: [...review] };
    }
    function buildCalendar(host, events, today) {
      host.replaceChildren();
      if (!events.length) {
        const p = document.createElement('p');p.className = 'calendar-note';p.textContent = 'No dated activities remain in this guide. Explore the Free & Cheap Guide for year-round ideas.';host.append(p);return;
      }
      events.sort((a, b) => a.next.start.localeCompare(b.next.start) || a.number - b.number);
      const groups = new Map();
      for (const event of events) {
        const week = Math.min(3, Math.floor((toDay(event.next.start) - toDay(today)) / (7 * DAY)));
        if (!groups.has(week)) groups.set(week, []);
        groups.get(week).push(event);
      }
      for (const [week, items] of [...groups.entries()].sort((a, b) => a[0] - b[0])) {
        const first = shiftDay(today, week * 7), last = shiftDay(first, week === 3 ? 27 : 6);
        const day = document.createElement('article');day.className = 'day';
        const head = document.createElement('h3');head.textContent = labelSpan(first, last);day.append(head);
        const ul = document.createElement('ul');
        for (const { next, number, entry } of items.slice(0, 8)) {
          const li = document.createElement('li');
          const link = document.createElement('a');link.href = '#event-' + number;
          const doc = document.createElement('span');doc.textContent = ' · ' + (entry.schedule.selected_dates ? 'selected days, check organiser' : labelSpan(next.start, next.end));
          link.textContent = entry.n.replace(/&amp;/g, '&');li.append(link, doc);ul.append(li);
        }
        if (items.length > 8) { const more = document.createElement('li'); const a = document.createElement('a'); a.href = '#filters'; a.textContent = 'See all ' + items.length + ' activities in this period below'; more.append(a); ul.append(more); } day.append(ul);host.append(day);
      }
    }
    filterButtons.forEach(button => button.addEventListener('click', () => render()));
    if (calendar) calendar.addEventListener('click', ev => {
      const a = ev.target.closest?.('a[href^="#event-"]');if (!a) return;
      const all = filterButtons.find(b => b.dataset.filter === 'all');
      if (all && !all.classList.contains('active')) all.click();
      requestAnimationFrame(() => document.getElementById(a.hash.slice(1))?.closest('.card')?.focus({ preventScroll: true }));
    });
    document.addEventListener('visibilitychange', () => { if (!document.hidden) render(); });
    const interval = setInterval(() => { if (ukToday() !== lastDay || typeof overrideToday !== 'undefined') render(); }, 60000);
    const initial = render();
    return { refresh: render, stop: () => clearInterval(interval), initial };
  };
  return { validDay, ukToday, shiftDay, futureSlots, status, mount };
});
