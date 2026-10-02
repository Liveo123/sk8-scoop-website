(() => {
  const body = document.body;
  if (!body) return;

  const guideKey = String(body.dataset.guideKey || '').trim() || (() => {
    const path = location.pathname;
    if (path.startsWith('/halloween-half-term-guide')) return 'halloween-half-term';
    if (path.startsWith('/free-cheap-guide')) return 'free-cheap';
    if (path.startsWith('/52-adventures')) return '52-adventures';
    if (path.includes('treasure')) return 'treasure-hunt';
    return 'unknown';
  })();

  const track = (name, params = {}) => {
    if (typeof window.sk8Track !== 'function') return false;
    window.sk8Track(name, {
      guide_name: guideKey,
      guide_path: location.pathname,
      measurement_version: 'guide_v1',
      ...params
    });
    return true;
  };

  const once = new Set();
  const trackOnce = (key, name, params) => {
    if (once.has(key)) return;
    if (track(name, params)) once.add(key);
  };

  const listingContext = node => {
    const card = node && node.closest ? node.closest('.card, [data-guide-listing]') : null;
    if (!card) return {};
    const heading = card.querySelector('h2,h3,[data-listing-title]');
    const section = card.closest('[data-section], section[id]');
    return {
      listing_name: heading ? heading.textContent.trim().slice(0, 120) : 'unknown',
      listing_id: card.id || card.dataset.guideListing || '',
      section: section ? (section.dataset.section || section.id || '') : ''
    };
  };

  const attach = () => {
    trackOnce('guide-view', 'guide_view', {
      page_title: document.title
    });

    document.addEventListener('click', event => {
      const filter = event.target.closest('[data-filter]');
      if (filter) {
        track('guide_filter_use', {
          filter_value: filter.dataset.filter || filter.textContent.trim().slice(0, 80)
        });
      }

      const category = event.target.closest('[data-guide-category], .quick-nav a, .calendar-grid a[href^="#event-"]');
      if (category) {
        track('guide_category_click', {
          category: category.dataset.guideCategory || category.textContent.trim().slice(0, 100),
          destination: category.getAttribute('href') || ''
        });
      }

      const link = event.target.closest('a');
      if (link) {
        const ctx = listingContext(link);
        if (ctx.listing_name) {
          let destinationHost = '';
          try { destinationHost = new URL(link.href, location.href).hostname; } catch (_) {}
          track('guide_listing_click', {
            ...ctx,
            link_label: link.textContent.trim().slice(0, 100),
            destination_host: destinationHost
          });
        }
      }

      const share = event.target.closest('[data-guide-share]');
      if (share) {
        track('guide_share', { share_method: share.dataset.guideShare || 'unknown' });
      }

      const copy = event.target.closest('[data-guide-copy-link]');
      if (copy) track('guide_copy_link');
    }, true);

    const thresholds = [25, 50, 75, 90];
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        const doc = document.documentElement;
        const max = Math.max(1, doc.scrollHeight - innerHeight);
        const pct = Math.min(100, Math.round((scrollY / max) * 100));
        thresholds.forEach(value => {
          if (pct >= value) trackOnce(`scroll-${value}`, 'guide_scroll', { scroll_percent: value });
        });
      });
    };
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    if ('IntersectionObserver' in window) {
      const seen = new WeakSet();
      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting || seen.has(entry.target)) return;
          seen.add(entry.target);
          const heading = entry.target.querySelector('h2,h3');
          track('guide_section_view', {
            section: entry.target.dataset.guideSection || entry.target.id || (heading ? heading.textContent.trim().slice(0, 100) : 'unknown')
          });
        });
      }, { threshold: 0.35 });

      document.querySelectorAll('[data-guide-section], main section[id], .section[id]').forEach(section => observer.observe(section));
    }
  };

  let attempts = 0;
  const wait = () => {
    if (typeof window.sk8Track === 'function') return attach();
    attempts += 1;
    if (attempts < 30) setTimeout(wait, 100);
  };
  wait();
})();