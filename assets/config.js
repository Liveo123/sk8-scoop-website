(() => {
  const path = window.location.pathname.replace(/\/+$/,'') || '/';
  const publicPaths = new Set([
    '/','/latest','/about.html','/archive.html','/summer-guide.html','/advertise.html',
    '/join','/start','/submit','/contact','/business-submissions','/submit-event',
    '/preferences','/privacy.html','/terms.html','/editorial-policy.html','/sitemap.html'
  ]);
  const pageIdentity = {
    '/':'home','/latest':'latest-issue','/about.html':'about','/archive.html':'archive',
    '/summer-guide.html':'summer-guide','/advertise.html':'advertise','/join':'join',
    '/start':'start','/submit':'submit','/contact':'contact','/business-submissions':'business-submissions',
    '/submit-event':'submit-event','/preferences':'preferences','/privacy.html':'privacy',
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
        ['summer-guide','/summer-guide.html','Guides'],
        ['start','/start/','Where to start'],
        ['join','/join/','Join'],
        ['submit','/submit/','Submit'],
        ['contact','/contact/','Contact']
      ];
      nav.innerHTML = links.map(([key,href,label]) => `<a${active===key?' class="active" aria-current="page"':''} href="${href}">${label}</a>`).join('') + `<a class="button nav-join reader-nav-join${active==='join'?' active':''}" href="/join/">Join free</a>`;
    }
  }
})();

window.SK8_CONFIG = {
  ga4MeasurementId: "G-8L0ER92Y7L",
  metaPixelId: "4649116095416763",
  publicStats: {
    subscriberCount: 411,
    subscriberProof: "411",
    issuesPublished: 8,
    checkedDate: "16 August 2026",
    latestMainSendRecipients: 404,
    latestMainOpenRate: "63.86%",
    latestClickRate: "6.93%",
    latestCTOR: "10.85%",
    latestIssueDate: "14 August 2026",
    latestMetricsCheckedDate: "16 August 2026"
  },
  currentIssue: {
    number: 8,
    dateIso: "2026-08-14",
    dateDisplay: "Friday 14 August 2026",
    title: "Issue 8 is out",
    headline: "Free Sunday festival, a £3 duck trail and Tuesday’s 20mph deadline",
    summary: "Stopford House Party, a £3 duck trail, Tuesday’s 20mph consultation deadline, Heald Green’s giant frog story and useful local plans for the week ahead.",
    url: "https://preview.mailerlite.io/preview/2462354/emails/195857688022747045"
  },
  stripeLinks: {
    local_spotlight: "",
    monthly_partner: "",
    category_partner: ""
  }
};
