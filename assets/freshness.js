/* Central freshness bindings for issue-specific text not covered by site.js publicStats. */
(function renderFreshness(){
  const cfg = window.SK8_CONFIG || {};
  const stats = cfg.publicStats || {};
  const issue = cfg.currentIssue || {};
  const text = (selector, value) => {
    if (value === undefined || value === null || value === '') return;
    document.querySelectorAll(selector).forEach(el => { el.textContent = String(value); });
  };
  const href = (selector, value) => {
    if (!value) return;
    document.querySelectorAll(selector).forEach(el => { el.setAttribute('href', value); });
  };

  text('[data-stat="subscriberProof"]', stats.subscriberProof || stats.subscriberCount);
  text('[data-stat="latestCTOR"]', stats.latestCTOR);
  text('[data-current-issue-number]', issue.number);
  text('[data-current-issue-title]', issue.title);
  text('[data-current-issue-date]', issue.dateDisplay);
  text('[data-current-issue-summary]', issue.summary);
  href('[data-current-issue-url]', issue.url);
})();
