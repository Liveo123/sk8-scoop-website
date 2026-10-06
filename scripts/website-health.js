#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
let errors = 0;
let warnings = 0;
let passes = 0;

const out = (level, area, message) => {
  if (level === 'ERROR') errors += 1;
  else if (level === 'WARNING') warnings += 1;
  else passes += 1;
  console.log(`[${level}] ${area}: ${message}`);
};

const londonToday = () => {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(new Date());
  const v = Object.fromEntries(parts.map(p => [p.type, p.value]));
  return `${v.year}-${v.month}-${v.day}`;
};

const today = londonToday();
const readText = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const readJson = rel => {
  try { return JSON.parse(readText(rel)); }
  catch (error) {
    out('ERROR', rel, `invalid JSON: ${error.message}`);
    return null;
  }
};
const validDate = value => /^\d{4}-\d{2}-\d{2}$/.test(String(value || ''));
const daysBetween = (a, b) => Math.floor((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 86400000);
const normalise = value => String(value || '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ').trim();
const tokens = value => new Set(normalise(value).split(' ').filter(x => x.length > 2 && !['the','and','at','for','with'].includes(x)));
const similarity = (a, b) => {
  const A = tokens(a), B = tokens(b);
  if (!A.size || !B.size) return 0;
  let shared = 0;
  A.forEach(x => { if (B.has(x)) shared += 1; });
  return shared / Math.max(A.size, B.size);
};

const events = readJson('data/events.json');
if (Array.isArray(events)) {
  const ids = new Set();
  let expired = 0;
  let stale = 0;
  let duplicateCandidates = 0;
  events.forEach((event, i) => {
    const label = event.title || event.id || `row ${i + 1}`;
    if (!String(event.title || '').trim()) out('ERROR', 'events', `${label}: missing title`);
    if (!validDate(event.date)) out('ERROR', 'events', `${label}: invalid or missing date`);
    const id = String(event.id || '').trim();
    if (id) {
      if (ids.has(id)) out('ERROR', 'events', `${label}: duplicate id ${id}`);
      ids.add(id);
    }
    const end = String(event.end_date || event.date || '');
    if (validDate(end) && end < today) expired += 1;
    if (validDate(event.checked) && validDate(end) && end >= today && daysBetween(event.checked, today) > 21) stale += 1;
    if (validDate(end) && end >= today && event.status === 'verified' && !String(event.source_url || event.booking_url || '').trim()) {
      out('WARNING', 'events', `${label}: current verified listing has no source/booking URL`);
    }
    if (['cancelled','sold_out'].includes(String(event.status || '').toLowerCase()) && validDate(end) && end >= today) {
      out('WARNING', 'events', `${label}: status is ${event.status} but remains within the current date window`);
    }
  });
  for (let i = 0; i < events.length; i += 1) {
    for (let j = i + 1; j < events.length; j += 1) {
      const a = events[i], b = events[j];
      const sameArea = normalise(a.area) && normalise(a.area) === normalise(b.area);
      const overlaps = validDate(a.date) && validDate(b.date) && String(a.date) === String(b.date);
      const titleSim = similarity(a.title, b.title);
      const venueSim = similarity(a.venue, b.venue);
      if (sameArea && overlaps && (titleSim >= 0.6 || venueSim >= 0.75)) {
        duplicateCandidates += 1;
        out('WARNING', 'events', `probable duplicate: "${a.title}" <> "${b.title}" on ${a.date} in ${a.area}`);
      }
    }
  }
  if (expired) out('WARNING', 'events', `${expired} expired event record(s) remain in the dataset; client filtering hides them, but cleanup is due`);
  else out('PASS', 'events', 'no expired records remain in the dataset');
  if (stale) out('WARNING', 'events', `${stale} current/future event(s) were checked more than 21 days ago`);
  else out('PASS', 'events', 'no current/future event exceeds the 21-day checked-date warning threshold');
  if (!duplicateCandidates) out('PASS', 'events', 'no probable duplicate event pairs found');
}

const homepage = readJson('data/homepage.json');
if (homepage && Array.isArray(homepage.stories)) {
  if (!validDate(homepage.updated)) out('WARNING', 'homepage', 'updated date is missing or malformed');
  else if (daysBetween(homepage.updated, today) > 10) out('WARNING', 'homepage', `homepage data was last updated ${homepage.updated}`);
  else out('PASS', 'homepage', `homepage data updated ${homepage.updated}`);
  const hrefs = new Set();
  homepage.stories.forEach((story, i) => {
    const label = story.title || `story ${i + 1}`;
    if (!String(story.title || '').trim() || !String(story.href || '').trim()) out('ERROR', 'homepage', `${label}: missing title or href`);
    if (story.expires && !validDate(story.expires)) out('ERROR', 'homepage', `${label}: malformed expires date`);
    if (validDate(story.expires) && story.expires < today) out('WARNING', 'homepage', `${label}: expired on ${story.expires}`);
    if (story.href) {
      if (hrefs.has(story.href)) out('WARNING', 'homepage', `${label}: duplicate current-story destination ${story.href}`);
      hrefs.add(story.href);
    }
  });
}

const discovery = readJson('data/discovery.json');
if (discovery && Array.isArray(discovery.records)) {
  const ids = new Set();
  const hrefs = new Map();
  discovery.records.forEach((record, i) => {
    const label = record.title || record.id || `record ${i + 1}`;
    if (!String(record.id || '').trim()) out('WARNING', 'discovery', `${label}: missing id`);
    else if (ids.has(record.id)) out('ERROR', 'discovery', `${label}: duplicate id ${record.id}`);
    else ids.add(record.id);
    if (!String(record.title || '').trim() || !String(record.href || '').trim()) out('WARNING', 'discovery', `${label}: missing useful title/href`);
    if (record.expires && !validDate(record.expires)) out('ERROR', 'discovery', `${label}: malformed expires date`);
    if (validDate(record.expires) && record.expires < today) out('WARNING', 'discovery', `${label}: expired on ${record.expires}`);
    if (/^\/admin(?:\/|$)/.test(String(record.href || ''))) out('WARNING', 'discovery', `${label}: points at an admin route`);
    if (record.href) {
      if (hrefs.has(record.href)) out('WARNING', 'discovery', `${label}: duplicate destination ${record.href} also used by ${hrefs.get(record.href)}`);
      else hrefs.set(record.href, label);
    }
  });
  out('PASS', 'discovery', `${discovery.records.length} discovery records parsed`);
}

const walkHtml = dir => {
  const found = [];
  fs.readdirSync(dir, { withFileTypes: true }).forEach(entry => {
    const full = path.join(dir, entry.name);
    const rel = path.relative(root, full).replace(/\\/g, '/');
    if (entry.isDirectory()) {
      if (['.git', 'node_modules'].includes(entry.name)) return;
      walkHtml(full).forEach(item => found.push(item));
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      found.push({ full, rel });
    }
  });
  return found;
};

let expiredHtmlBlocks = 0;
walkHtml(root).forEach(({ full, rel }) => {
  const html = fs.readFileSync(full, 'utf8');
  const re = /data-expire-after=["'](\d{4}-\d{2}-\d{2})["']/g;
  let match;
  while ((match = re.exec(html))) {
    if (match[1] < today) {
      expiredHtmlBlocks += 1;
      out('WARNING', 'html-expiry', `${rel}: data-expire-after ${match[1]} has passed`);
    }
  }
});
if (!expiredHtmlBlocks) out('PASS', 'html-expiry', 'no expired data-expire-after markers found');

try {
  const config = readText('assets/config.js');
  const issueDate = config.match(/dateIso:\s*["'](\d{4}-\d{2}-\d{2})["']/);
  const issueNumber = config.match(/number:\s*(\d+)/);
  const checkedDate = config.match(/checkedDate:\s*["']([^"']+)["']/);
  if (!issueDate || !issueNumber) out('WARNING', 'config', 'current issue number/date could not be found conservatively in source text');
  else {
    if (daysBetween(issueDate[1], today) > 10) out('WARNING', 'config', `current issue appears old: Issue ${issueNumber[1]} dated ${issueDate[1]}`);
    else out('PASS', 'config', `current issue source date is ${issueDate[1]}`);
  }
  if (!checkedDate) out('WARNING', 'config', 'public checkedDate could not be found in source text');
} catch (error) {
  out('ERROR', 'config', `could not read assets/config.js: ${error.message}`);
}

console.log('');
console.log(`Website Health summary: ${errors} error(s), ${warnings} warning(s), ${passes} pass(es). Date: ${today} Europe/London.`);
if (errors > 0) process.exitCode = 1;
