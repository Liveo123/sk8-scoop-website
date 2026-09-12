(() => {
  const path = window.location.pathname.replace(/\/+$/,'') || '/';
  const publicPaths = new Set([
    '/','/latest','/about.html','/archive.html','/summer-guide.html','/guides','/advertise.html',
    '/join','/start','/submit','/contact','/business-submissions','/submit-event','/whats-on',
    '/preferences','/privacy.html','/terms.html','/editorial-policy.html','/sitemap.html'
  ]);
  const pageIdentity = {
    '/':'home','/latest':'latest-issue','/about.html':'about','/archive.html':'archive',
    '/summer-guide.html':'summer-guide','/guides':'guides','/advertise.html':'advertise','/join':'join',
    '/start':'start','/submit':'submit','/contact':'contact','/business-submissions':'business-submissions',
    '/submit-event':'submit-event','/whats-on':'whats-on','/preferences':'preferences','/privacy.html':'privacy',
    '/terms.html':'terms','/editorial-policy.html':'editorial-policy','/sitemap.html':'sitemap'
  };
  if (publicPaths.has(path)) {
    if (!document.body.dataset.page && pageIdentity[path]) document.body.dataset.page = pageIdentity[path];
    ['/assets/secondary-pages.css','/assets/secondary-extras.css','/assets/nue.css'].forEach((href) => {
      if (!document.querySelector(`link[href="${href}"]`)) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        link.dataset.sk8SecondaryDesign = 'production';
        document.head.appendChild(link);
      }
    });
    const nav = document.querySelector('#main-nav');
    if (nav) {
      const active = pageIdentity[path] || '';
      const links = [
        ['home','/','Home'],
        ['whats-on','/whats-on/','What’s On'],
        ['guides','/guides/','Guides'],
        ['start','/start/','Where to start'],
        ['join','/join/','Join'],
        ['submit','/submit/','Submit'],
        ['contact','/contact/','Contact'],
        ['advertise','/advertise.html','Advertise']
      ];
      nav.innerHTML = links.map(([key,href,label]) => `<a${active===key?' class="active" aria-current="page"':''} href="${href}">${label}</a>`).join('') + `<a class="button nav-join reader-nav-join${active==='join'?' active':''}" href="/join/">Join free</a>`;
    }
  }
})();

window.SK8_CONFIG = {
  ga4MeasurementId: "G-8L0ER92Y7L",
  metaPixelId: "4649116095416763",
  formsparkContactEndpoint: "https://submit-form.com/X3MWnWHXI",
  publicStats: {
    subscriberCount: "500+",
    subscriberProof: "500+",
    issuesPublished: 12,
    checkedDate: "11 September 2026",
    latestMainSendRecipients: 507,
    latestMainOpenRate: null,
    latestClickRate: null,
    latestCTOR: null,
    latestIssueDate: "11 September 2026",
    latestMetricsCheckedDate: null
  },
  currentIssue: {
    number: 12,
    dateIso: "2026-09-11",
    dateDisplay: "Friday 11 September 2026",
    title: "Issue 12 is out",
    headline: "Black pudding, Gatley Carrs & the secrets of Ladybrook",
    summary: "Black pudding throwing, dragon boats, Gatley Carrs, a Cheadle Hulme pub, Abney Hall and the Ladybrook corridor.",
    url: "https://preview.mailerlite.io/preview/2462354/emails/198102169520440619"
  },
  stripeLinks: {
    local_spotlight: "",
    monthly_partner: "",
    category_partner: ""
  }
};

(() => {
  const config = window.SK8_CONFIG;
  const issue = config.currentIssue;
  const stats = config.publicStats;
  const page = document.body.dataset.page || '';

  document.querySelectorAll('[data-stat="subscriberCount"]').forEach(el => { el.textContent = stats.subscriberCount; });
  document.querySelectorAll('[data-stat="issuesPublished"]').forEach(el => { el.textContent = stats.issuesPublished; });
  document.querySelectorAll('[data-current-issue-number]').forEach(el => { el.textContent = issue.number; });
  document.querySelectorAll('[data-current-issue-date]').forEach(el => { el.textContent = issue.dateDisplay; });
  document.querySelectorAll('[data-current-issue-title]').forEach(el => { el.textContent = issue.title; });
  document.querySelectorAll('[data-current-issue-summary]').forEach(el => { el.textContent = issue.summary; });
  document.querySelectorAll('[data-current-issue-url]').forEach(el => {
    el.href = issue.url;
    el.textContent = `Read Issue ${issue.number}`;
  });

  if (page === 'home') {
    const latest = document.querySelector('.reader-latest-panel');
    if (latest) {
      const cover = latest.querySelector('.reader-latest-cover span');
      const heading = latest.querySelector('.reader-latest-copy h2');
      const text = latest.querySelector('.reader-latest-copy p');
      const button = latest.querySelector('.reader-latest-copy .button');
      if (cover) cover.textContent = `ISSUE ${issue.number}`;
      if (heading) heading.textContent = `Issue ${issue.number}`;
      if (text) text.textContent = issue.summary;
      if (button) button.textContent = `Read Issue ${issue.number} →`;
    }
  }

  if (page === 'join') {
    const joinEyebrow = document.querySelector('.join-conversion-copy .eyebrow');
    if (joinEyebrow) joinEyebrow.textContent = `Join ${stats.subscriberCount} local readers`;
    const tryPanel = document.querySelector('.reader-two .reader-panel:first-child');
    if (tryPanel) {
      const heading = tryPanel.querySelector('h2');
      const button = tryPanel.querySelector('.button');
      if (heading) heading.textContent = `Read Issue ${issue.number} first`;
      if (button) { button.href = issue.url; button.textContent = `Read Issue ${issue.number}`; }
    }
  }

  if (page === 'latest-issue') {
    document.title = `Latest SK8 Scoop Newsletter | Issue ${issue.number}`;
    const description = `Read Issue ${issue.number} of SK8 Scoop: ${issue.summary}`;
    const metaDescription = document.querySelector('meta[name="description"]');
    const ogTitle = document.querySelector('meta[property="og:title"]');
    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (metaDescription) metaDescription.content = description;
    if (ogTitle) ogTitle.content = document.title;
    if (ogDescription) ogDescription.content = description;
    const schema = document.querySelector('script[type="application/ld+json"]');
    if (schema) schema.textContent = JSON.stringify({
      '@context':'https://schema.org','@type':'PublicationIssue',name:`SK8 Scoop Issue ${issue.number}`,
      issueNumber:String(issue.number),datePublished:issue.dateIso,url:'https://www.sk8scoop.com/latest',
      isPartOf:{'@type':'Periodical',name:'SK8 Scoop',url:'https://www.sk8scoop.com/'}
    });
    const snapshot = document.querySelector('.issue-proof-split h2');
    const snapshotText = document.querySelector('.issue-proof-split > div > p');
    const factStrong = document.querySelector('.issue-facts div:first-child strong');
    const factSmall = document.querySelector('.issue-facts small');
    if (snapshot) snapshot.textContent = `${stats.issuesPublished} issues in, with ${stats.subscriberCount} active subscribers.`;
    if (snapshotText) snapshotText.textContent = `SK8 Scoop passed 500 subscribers by ${stats.checkedDate}. The public figure is deliberately rounded because the live count changes as people join and leave.`;
    if (factStrong) factStrong.textContent = stats.issuesPublished;
    if (factSmall) factSmall.textContent = `Subscriber milestone checked on ${stats.checkedDate}. Campaign-performance figures are deliberately omitted here until the latest issue has enough data to be meaningful.`;
  }

  if (page === 'archive') {
    document.title = 'Newsletter archive | SK8 Scoop';
    const desc = `Browse all ${stats.issuesPublished} published SK8 Scoop issues for useful local events, updates and discoveries across SK8.`;
    const metaDescription = document.querySelector('meta[name="description"]');
    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (metaDescription) metaDescription.content = desc;
    if (ogDescription) ogDescription.content = desc;
    const heroEyebrow = document.querySelector('.archive-v7 .eyebrow');
    const figcaption = document.querySelector('.archive-hero-art figcaption');
    if (heroEyebrow) heroEyebrow.textContent = `${stats.issuesPublished} issues and counting`;
    if (figcaption) figcaption.textContent = `${stats.issuesPublished} useful Friday emails — and counting.`;
    const grid = document.querySelector('.v7-archive');
    const featured = grid && grid.querySelector('.featured-issue');
    if (grid && featured && !grid.querySelector(`[data-issue="${issue.number}"]`)) {
      const latestIssue = featured.cloneNode(true);
      latestIssue.dataset.issue = String(issue.number);
      latestIssue.querySelector('.tag').textContent = `Issue ${issue.number} · ${issue.dateDisplay}`;
      latestIssue.querySelector('h2').textContent = issue.headline;
      latestIssue.querySelector('p').textContent = issue.summary;
      const link = latestIssue.querySelector('a');
      link.href = issue.url;
      link.textContent = `Read Issue ${issue.number}`;
      featured.classList.remove('featured-issue');
      featured.querySelector('.button')?.classList.replace('button','text-link');
      featured.querySelector('a')?.classList.add('arrow-link');
      grid.insertBefore(latestIssue, featured);
    }
  }
})();

(() => {
  const script = document.createElement('script');
  script.src = '/assets/signup-protection.js';
  script.defer = true;
  script.dataset.sk8SignupProtection = 'true';
  document.head.appendChild(script);
})();

(() => {
  ['nue-analytics.js','nue-links.js'].forEach(file => {
    if (document.querySelector(`script[data-sk8-nue-layer="${file}"]`)) return;
    const script = document.createElement('script');
    script.src = `/assets/${file}`;
    script.defer = true;
    script.dataset.sk8NueLayer = file;
    document.head.appendChild(script);
  });
})();
