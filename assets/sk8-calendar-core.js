(function (root) {
  'use strict';
  const DATE = /^\d{4}-\d{2}-\d{2}$/;
  const COST_TYPES = new Set(['free','paid','admission_required','members_only_free','free_optional_extras','optional_donation','mixed','unknown']);
  const DATE_MODES = new Set(['single','daily','specific_dates','range_unspecified']);

  function validDate(value) {
    if (!DATE.test(String(value || ''))) return false;
    const test = new Date(value + 'T00:00:00Z');
    return !Number.isNaN(test.getTime()) && test.toISOString().slice(0, 10) === value;
  }
  function localToday(date = new Date()) {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit'
    }).formatToParts(date);
    const p = Object.fromEntries(parts.map(part => [part.type, part.value]));
    return p.year + '-' + p.month + '-' + p.day;
  }
  function dayAfter(value) {
    const date = new Date(value + 'T00:00:00Z');
    date.setUTCDate(date.getUTCDate() + 1);
    return date.toISOString().slice(0, 10);
  }
  function anniversaryExclusive(today) {
    const date = new Date(today + 'T00:00:00Z');
    const month = date.getUTCMonth();
    const day = date.getUTCDate();
    const next = new Date(Date.UTC(date.getUTCFullYear() + 1, month, day));
    return next.toISOString().slice(0, 10);
  }
  function mode(event) {
    if (DATE_MODES.has(event.date_mode)) return event.date_mode;
    return event.end_date ? 'range_unspecified' : 'single';
  }
  function confirmedDates(event) {
    if (!Array.isArray(event.occurrences)) return [];
    return [...new Set(event.occurrences
      .filter(item => typeof item === 'string' || (item && item.status !== 'cancelled' && item.status !== 'unverified'))
      .map(item => typeof item === 'string' ? item : item.date)
      .filter(validDate))].sort();
  }
  function onDate(event, date) {
    if (!validDate(date)) return false;
    const kind = mode(event);
    if (kind === 'specific_dates') return confirmedDates(event).includes(date);
    if (kind === 'daily') return validDate(event.date) && validDate(event.end_date) && date >= event.date && date <= event.end_date;
    return date === event.date;
  }
  function withinRange(event, start, end) {
    if (!validDate(start) || !validDate(end) || end < start) return false;
    const kind = mode(event);
    if (kind === 'specific_dates') return confirmedDates(event).some(date => date >= start && date <= end);
    if (kind === 'daily') return validDate(event.date) && validDate(event.end_date) && event.date <= end && event.end_date >= start;
    // An overall event run does not prove any particular intermediate session.
    // Only the verified first date is eligible for interval filters until
    // organisers confirm individual dates or a genuinely daily activity.
    return validDate(event.date) && event.date >= start && event.date <= end;
  }
  function isFree(event) {
    if (event.cost_type) return event.cost_type === 'free' ||
      event.cost_type === 'free_optional_extras' || event.cost_type === 'optional_donation';
    const cost = String(event.cost || '').trim().toLowerCase();
    // Legacy fallback is deliberately conservative. Unknown is not free.
    if (/members?|normal admission|general admission|ticket|booking fee|\b£\b|\d\s*£|\bfrom\b/.test(cost)) return false;
    return /^(free|free entry|free admission|no charge|no admission fee)(?:\s*[.;!])?$/.test(cost);
  }
  function isFamily(event) {
    if (Array.isArray(event.audience_tags)) return event.audience_tags.includes('family');
    return /family|children|kids|storytime/i.test(String(event.category || ''));
  }
  function withinHorizon(date, today = localToday()) {
    return validDate(date) && date >= today && date < anniversaryExclusive(today);
  }
  const api = Object.freeze({ COST_TYPES, DATE_MODES, validDate, localToday, dayAfter,
    anniversaryExclusive, mode, confirmedDates, onDate, withinRange, isFree, isFamily, withinHorizon });
  if (root) root.SK8CalendarCore = api;
  if (typeof module === 'object' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : undefined);
