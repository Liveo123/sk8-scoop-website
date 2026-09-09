(() => {
  const GA_ID = 'G-8L0ER92Y7L';
  const CONSENT_KEY = 'sk8_privacy_choices_v1';
  const CONSENT_DAYS = 90;
  const pageContext = {
    page_name: 'free-cheap-guide',
    page_title: document.title,
    page_location: location.href,
    page_path: location.pathname,
    content_group: 'SK8 Scoop guides'
  };
  let loaded = false;

  function readConsent() {
    try {
      const c = JSON.parse(localStorage.getItem(CONSENT_KEY) || 'null');
      if (!c || c.version !== 1 || !c.expiresAt || Date.now() > c.expiresAt) return null;
      return c;
    } catch (_) { return null; }
  }

  function saveConsent(analytics) {
    const existing = readConsent();
    const c = {
      version: 1,
      analytics: Boolean(analytics),
      marketing: existing ? Boolean(existing.marketing) : false,
      savedAt: new Date().toISOString(),
      expiresAt: Date.now() + CONSENT_DAYS * 24 * 60 * 60 * 1000
    };
    try { localStorage.setItem(CONSENT_KEY, JSON.stringify(c)); } catch (_) {}
    return c;
  }

  function loadGa() {
    if (loaded) return;
    const c = readConsent();
    if (!c || !c.analytics) return;
    loaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function(){ window.dataLayer.push(arguments); };
    window.gtag('consent', 'default', {
      analytics_storage: 'granted',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied'
    });
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA_ID);
    document.head.appendChild(s);
    window.gtag('js', new Date());
    window.gtag('config', GA_ID, {
      send_page_view: true,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      content_group: pageContext.content_group,
      transport_type: 'beacon'
    });
    window.gtag('event', 'free_cheap_guide_visit', pageContext);
  }

  function showConsent() {
    if (readConsent()) return;
    const wrap = document.createElement('div');
    wrap.id = 'sk8-guide-consent';
    wrap.setAttribute('role', 'dialog');
    wrap.setAttribute('aria-label', 'Privacy choices');
    wrap.innerHTML = '<div><strong>Help SK8 Scoop measure guide visits?</strong><span> Optional Google Analytics helps improve the guide. </span><a href="/privacy.html">Privacy details</a>.</div><div><button data-allow>Allow analytics</button><button data-reject>No thanks</button></div>';
    const style = document.createElement('style');
    style.textContent = '#sk8-guide-consent{position:fixed;z-index:2147483647;left:12px;right:12px;bottom:12px;max-width:760px;margin:auto;padding:14px 16px;background:#fff;color:#173b42;border:1px solid #cfd8d6;border-radius:10px;box-shadow:0 6px 28px rgba(0,0,0,.18);font:14px/1.45 Arial,sans-serif;display:flex;gap:14px;align-items:center;justify-content:space-between}#sk8-guide-consent a{color:#0f6470}#sk8-guide-consent button{border:0;border-radius:6px;padding:9px 12px;font-weight:700;cursor:pointer;margin-left:6px}#sk8-guide-consent [data-allow]{background:#0f6470;color:#fff}#sk8-guide-consent [data-reject]{background:#eef3f1;color:#173b42}@media(max-width:640px){#sk8-guide-consent{display:block}#sk8-guide-consent>div+div{margin-top:10px}#sk8-guide-consent button{margin:0 6px 0 0}}';
    document.head.appendChild(style);
    document.body.appendChild(wrap);
    wrap.querySelector('[data-allow]').addEventListener('click', () => { saveConsent(true); wrap.remove(); loadGa(); });
    wrap.querySelector('[data-reject]').addEventListener('click', () => { saveConsent(false); wrap.remove(); });
  }

  function boot() {
    if (readConsent()) loadGa();
    else showConsent();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();