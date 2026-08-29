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
    ['/assets/secondary-pages.css','/assets/secondary-extras.css'].forEach((href) => {
      if (!document.querySelector(`link[href="${href}"]`)) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        link.dataset.sk8SecondaryDesign = 'preview';
        document.head.appendChild(link);
      }
    });
    const nav = document.querySelector('#main-nav');
    if (nav) {
      const active = pageIdentity[path] || '';
      const links = [
        ['home','/','Home'],
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
  formsparkContactEndpoint: "",
  publicStats: {
    subscriberCount: 453,
    subscriberProof: "453",
    issuesPublished: 10,
    checkedDate: "28 August 2026",
    latestMainSendRecipients: null,
    latestMainOpenRate: null,
    latestClickRate: null,
    latestCTOR: null,
    latestIssueDate: "28 August 2026",
    latestMetricsCheckedDate: null
  },
  currentIssue: {
    number: 10,
    dateIso: "2026-08-28",
    dateDisplay: "Friday 28 August 2026",
    title: "Issue 10 is out",
    headline: "Made in Manchester, the Gatley Shouter and N’Estival",
    summary: "Made in Manchester, the Gatley Shouter, N’Estival and the Bank Holiday weekend’s strongest useful local picks.",
    url: "https://preview.mailerlite.io/preview/2462354/emails/197061170615551369"
  },
  stripeLinks: {
    local_spotlight: "",
    monthly_partner: "",
    category_partner: ""
  }
};
