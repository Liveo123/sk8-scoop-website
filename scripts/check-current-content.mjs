import fs from 'node:fs';

const read = path => fs.readFileSync(path, 'utf8');
const configText = read('assets/config.js');
const indexText = read('index.html');
const archiveText = read('archive.html');
const latestText = read('latest/index.html');
const homepage = JSON.parse(read('data/homepage.json'));

const failures = [];
const assert = (condition, message) => {
  if (!condition) failures.push(message);
};

const block = (name, until) => {
  const pattern = new RegExp(`${name}:\\s*\\{([\\s\\S]*?)\\n\\s*\\},\\n\\s*${until}`);
  const match = configText.match(pattern);
  if (!match) throw new Error(`Could not parse ${name} from assets/config.js`);
  return match[1];
};

const stringProp = (source, name) => {
  const match = source.match(new RegExp(`${name}:\\s*"([^"]*)"`));
  if (!match) throw new Error(`Could not parse ${name}`);
  return match[1];
};

const numberProp = (source, name) => {
  const match = source.match(new RegExp(`${name}:\\s*(\\d+)`));
  if (!match) throw new Error(`Could not parse ${name}`);
  return Number(match[1]);
};

const publicStats = block('publicStats', 'currentIssue:');
const currentIssue = block('currentIssue', 'stripeLinks:');
const issue = {
  number: numberProp(currentIssue, 'number'),
  dateIso: stringProp(currentIssue, 'dateIso'),
  dateDisplay: stringProp(currentIssue, 'dateDisplay'),
  headline: stringProp(currentIssue, 'headline'),
  summary: stringProp(currentIssue, 'summary'),
  url: stringProp(currentIssue, 'url'),
  issuesPublished: numberProp(publicStats, 'issuesPublished')
};

const comparable = text => text
  .replaceAll('&amp;', '&')
  .replaceAll('&pound;', '£')
  .replaceAll('&#39;', "'")
  .replaceAll('&quot;', '"');

const indexComparable = comparable(indexText);
const archiveComparable = comparable(archiveText);
const latestComparable = comparable(latestText);

assert(!configText.includes('homeStories:'), 'assets/config.js must not contain the obsolete homeStories dataset.');
assert(homepage.updated === issue.dateIso, `data/homepage.json updated date (${homepage.updated}) must match current issue date (${issue.dateIso}).`);
assert(Array.isArray(homepage.stories) && homepage.stories.length === 3, 'Homepage must contain exactly three current attention stories.');

for (const story of homepage.stories || []) {
  assert(indexComparable.includes(story.title), `index.html fallback is missing homepage story title: ${story.title}`);
  assert(indexComparable.includes(story.summary), `index.html fallback is missing homepage story summary: ${story.title}`);
  assert(indexComparable.includes(story.href), `index.html fallback is missing homepage story link: ${story.href}`);
  assert(indexComparable.includes(story.linkLabel), `index.html fallback is missing homepage story link label: ${story.linkLabel}`);
}

assert(indexComparable.includes(`ISSUE ${issue.number}`), `Homepage latest panel must show ISSUE ${issue.number}.`);
assert(indexComparable.includes(`<h2>Issue ${issue.number}</h2>`), `Homepage latest panel heading must show Issue ${issue.number}.`);
assert(indexComparable.includes(issue.summary), 'Homepage latest panel must contain the current issue summary.');
assert(indexComparable.includes(issue.url), 'Homepage latest panel must link directly to the current issue.');

assert(archiveComparable.includes(`${issue.issuesPublished} issues and counting`), `Archive hero must show ${issue.issuesPublished} issues and counting.`);
assert(archiveComparable.includes(`data-issue="${issue.number}"`), `Archive must contain a static card for Issue ${issue.number}.`);
assert(archiveComparable.includes(issue.headline), 'Archive current issue card must contain the current issue headline.');
assert(archiveComparable.includes(issue.summary), 'Archive current issue card must contain the current issue summary.');
assert(archiveComparable.includes(issue.url), 'Archive current issue card must link to the current issue.');

assert(latestComparable.includes(`Issue ${issue.number}`), `Latest page must reference Issue ${issue.number}.`);
assert(latestComparable.includes(issue.dateDisplay), 'Latest page must contain the current issue date.');
assert(latestComparable.includes(issue.summary), 'Latest page must contain the current issue summary.');
assert(latestComparable.includes(issue.url), 'Latest page must link to the current issue.');

if (failures.length) {
  console.error('Current-content freshness check failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Current-content freshness check passed for Issue ${issue.number}.`);
