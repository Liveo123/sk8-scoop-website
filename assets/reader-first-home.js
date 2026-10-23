/* Reader-first homepage. Uses the same checked event feed and date rules as What's On.
   No external feed, personal location, inferred opening status or automatic publishing. */
(() => {
  'use strict';
  const list = document.querySelector('[data-reader-first-events]');
  const status = document.querySelector('[data-reader-first-status]');
  if (!list) return;
  // Track only broad actions, never the visitor's search text or identity.
  const finder = document.querySelector('.reader-first-discovery');
  finder?.querySelectorAll('nav a, .reader-first-local a, .reader-first-all, .reader-first-after a').forEach(link => {
    link.dataset.trackEvent = 'homepage_finder_route_click';
    link.dataset.linkLocation = 'home-reader-first-discovery';
    link.dataset.nueLink = '';
    link.dataset.nueType = 'reader-discovery';
  });
  finder?.querySelector('form.reader-first-search')?.addEventListener('submit', () => {
    if (typeof window.sk8Track === 'function') {
      window.sk8Track('homepage_finder_search_submit', { link_location: 'home-reader-first-discovery' });
    }
  });
  const core = window.SK8CalendarCore;
  const fallback = (message) => {
    list.replaceChildren();
    const note = document.createElement('p');
    note.className = 'reader-first-fallback';
    note.textContent = message;
    const links = document.createElement('p');
    const calendar = document.createElement('a');
    calendar.href = '/whats-on/';
    calendar.textContent = "Check What's On";
    const guide = document.createElement('a');
    // A working guide is a more useful fallback than another view of the same failed event feed.
    guide.href = '/free-cheap-guide/guide/';
    guide.textContent = 'Browse free and cheap local ideas';
    guide.dataset.nueLink = '';
    guide.dataset.nueType = 'direct-guide';
    guide.dataset.trackEvent = 'homepage_finder_fallback_guide_click';
    guide.dataset.linkLocation = 'home-reader-first-empty';
    calendar.dataset.trackEvent = 'homepage_finder_fallback_calendar_click';
    calendar.dataset.linkLocation = 'home-reader-first-empty';
    links.append(guide, document.createTextNode(' · '), calendar);
    list.append(note, links);
    if (status) status.textContent = 'Useful alternatives are available below.';
  };
  if (!core) {
    fallback('The calendar is temporarily unavailable.');
    return;
  }
  const today = core.localToday();
  const coreAreas = new Set(['Cheadle', 'Cheadle Hulme', 'Gatley', 'Heald Green']);
  const nextDate = event => {
    const kind = core.mode(event);
    if (kind === 'specific_dates') return core.confirmedDates(event).find(date => date >= today) || '';
    if (kind === 'daily' && core.validDate(event.end_date) && event.end_date >= today)
      return event.date > today ? event.date : today;
    // Date ranges without confirmed sessions must not be shown as daily events.
    return event.date >= today ? event.date : '';
  };
  const prettyDate = value => new Intl.DateTimeFormat('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC'
  }).format(new Date(value + 'T00:00:00Z'));
  const eventPrice = event => {
    const type = String(event.cost_type || '');
    if (type === 'free') return 'Free';
    if (type === 'free_optional_extras') return 'Free entry; extras may cost';
    if (type === 'optional_donation') return 'Optional donation';
    if (type === 'admission_required') return 'Admission required';
    if (type === 'members_only_free') return 'Member conditions apply';
    return String(event.cost || 'Check organiser for cost').trim();
  };
  const renderCard = ({ event, session }) => {
    const item = document.createElement('li');
    item.className = 'reader-first-event';
    const date = document.createElement('time');
    date.className = 'reader-first-date';
    date.dateTime = session;
    date.textContent = prettyDate(session);
    const body = document.createElement('div');
    body.className = 'reader-first-event-body';
    const title = document.createElement('h3');
    const link = document.createElement('a');
    link.href = '/whats-on/?event=' + encodeURIComponent(event.id);
    link.textContent = String(event.title || '');
    link.dataset.nueLink = '';
    link.dataset.nueType = 'verified-event-detail';
    link.dataset.trackEvent = 'homepage_finder_event_detail_click';
    link.dataset.linkLocation = 'home-reader-first-event-card';
    title.appendChild(link);
    const details = document.createElement('p');
    details.className = 'reader-first-event-details';
    const place = String(event.area || 'Nearby').trim();
    const venue = String(event.venue || '').trim();
    details.textContent = [place, venue && venue !== place ? venue : ''].filter(Boolean).join(' · ');
    const price = document.createElement('p');
    price.className = 'reader-first-event-price';
    price.textContent = eventPrice(event);
    const checked = document.createElement('span');
    checked.className = 'reader-first-event-checked';
    checked.textContent = 'Details checked · confirm with organiser';
    body.append(title, details, price, checked);
    item.append(date, body);
    return item;
  };
  fetch('/data/events.json', { cache: 'no-cache' })
    .then(response => {
      if (!response.ok) throw new Error('Event feed not available');
      return response.json();
    })
    .then(data => {
      if (!Array.isArray(data)) throw new Error('Unexpected event format');
      const eligible = data.filter(event =>
        event && event.status === 'verified' &&
        core.validDate(event.date) &&
        !['cancelled', 'sold_out', 'example'].includes(String(event.status).toLowerCase())
      ).map(event => ({ event, session: nextDate(event) }))
        .filter(item => core.withinHorizon(item.session, today))
        .sort((a, b) => a.session.localeCompare(b.session) ||
          Number(coreAreas.has(b.event.area)) - Number(coreAreas.has(a.event.area)) ||
          String(a.event.title).localeCompare(String(b.event.title)));
      const picks = eligible.slice(0, 4);
      if (!picks.length) {
        fallback('No upcoming events have enough confirmed information to show here yet.');
        return;
      }
      const grid = document.createElement('ul');
      grid.className = 'reader-first-event-grid';
      picks.forEach(item => grid.appendChild(renderCard(item)));
      list.replaceChildren(grid);
      if (status) status.textContent = 'Showing ' + picks.length +
        ' checked upcoming ' + (picks.length === 1 ? 'listing' : 'listings') +
        '. Times, costs and availability can change.';
    })
    .catch(() => fallback('We cannot load the checked events list at the moment.'));
})();
