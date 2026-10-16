/* Optional paid gallery for 52 Adventures. All gates are deliberately off by default.
   Paid module is separate from 52 editorial adventures and their recommendations. */
(() => {
  'use strict';
  const slot = document.getElementById('sk8-52-premium-slot');
  const cfg = window.SK8_52_PREMIUM;
  if (!slot || !cfg || cfg.enabled !== true || cfg.ownerApproved !== true ||
      cfg.advertiserArtworkApproved !== true || cfg.imageRightsCleared !== true) return;
  // Campaign days use UK civil dates, not UTC, so expiry follows the local calendar.
  const ukToday = () => {
    const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
    const value = name => (parts.find(part => part.type === name) || {}).value || '';
    return [value('year'), value('month'), value('day')].join('-');
  };
  const dateOK = value => {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const stamp = Date.parse(value + 'T00:00:00Z');
    return Number.isFinite(stamp) && new Date(stamp).toISOString().slice(0, 10) === value;
  };
  // A 30-day campaign lasts from startDate through endDate inclusive.
  if (!dateOK(cfg.startDate) || !dateOK(cfg.endDate) ||
      (Date.parse(cfg.endDate + 'T00:00:00Z') - Date.parse(cfg.startDate + 'T00:00:00Z')) !== 29 * 86400000) return;
  if (ukToday() < cfg.startDate || ukToday() > cfg.endDate) return;
  const clean = v => typeof v === 'string' ? v.trim().slice(0, 400) : '';
  const text = (tag, cls, value) => { const el = document.createElement(tag); if (cls) el.className = cls; el.textContent = clean(value); return el; };
  const safeUrl = value => {
    if (!value || typeof value !== 'string') return null;
    try {
      const u = new URL(value, location.href);
      if (u.protocol !== 'https:') return null;
      return u.href;
    } catch { return null; }
  };
  if (!Array.isArray(cfg.photos) || cfg.photos.length < 2 || cfg.photos.length > 5) return;
  const allowedRights = new Set(['PAUL', 'PERMISSION', 'LICENCE']);
  const images = cfg.photos.map(p => ({
    src: safeUrl(p && p.src), alt: clean(p && p.alt), credit: clean(p && p.credit),
    rightsBasis: clean(p && p.rightsBasis)
  }));
  // Every image must be cleared. Never silently skip a photo with missing rights.
  if (images.some(p => !p.src || !p.alt || !allowedRights.has(p.rightsBasis))) return;
  const actionUrl = safeUrl(cfg.actionUrl);
  if (!actionUrl || !clean(cfg.businessName) || !clean(cfg.headline) || !clean(cfg.description) ||
      !clean(cfg.placementId) || !clean(cfg.actionLabel) || images.length < 2) return;

  const card = document.createElement('article');
  card.className = 'sk8-premium';
  card.dataset.advertiser = clean(cfg.businessName);
  card.dataset.commercial = 'true';
  card.dataset.premiumPlacement = clean(cfg.placementId);
  card.setAttribute('aria-label', 'Advertisement: ' + clean(cfg.businessName));

  const bar = text('div', 'sk8-premium-labelbar', '');
  bar.append(text('strong', 'sk8-premium-label', 'ADVERTISEMENT'), text('span', 'sk8-premium-separator', 'Paid placement, separate from our independent recommendations'));
  card.append(bar);

  const layout = text('div', 'sk8-premium-layout', '');
  const photos = text('div', 'sk8-premium-photos', '');
  const stage = text('div', 'sk8-premium-stage', '');
  const img = document.createElement('img');
  img.alt = images[0].alt; img.src = images[0].src; img.loading = 'lazy'; img.decoding = 'async';
  const prev = text('button', 'sk8-premium-arrow previous', '‹'); prev.type = 'button'; prev.setAttribute('aria-label','Previous photograph');
  const next = text('button', 'sk8-premium-arrow next', '›'); next.type = 'button'; next.setAttribute('aria-label','Next photograph');
  const count = text('span', 'sk8-premium-photo-count', '1 / ' + images.length); count.setAttribute('aria-live', 'polite');
  const label = text('span', 'sk8-premium-image-label', images[0].credit ? 'Image: ' + images[0].credit : 'Advertiser-supplied photograph');
  stage.append(img, prev, next, label, count);
  const thumbs = text('div', 'sk8-premium-thumbs', ''); thumbs.setAttribute('role', 'group'); thumbs.setAttribute('aria-label', 'Choose a photograph');
  let active = 0;
  function track(event, data={}) {
    if (typeof window.sk8Track === 'function') window.sk8Track(event, { guide_name:'52-adventures', placement_id: clean(cfg.placementId), advertiser:clean(cfg.businessName), paid_placement:true, ...data });
  }
  const buttons = images.map((p, i) => {
    const b = document.createElement('button'); b.type='button';
    b.setAttribute('aria-label', 'Show photograph ' + (i+1) + ' of ' + images.length + ': ' + p.alt);
    b.setAttribute('aria-pressed', String(i === 0));
    const pic = document.createElement('img'); pic.src=p.src; pic.alt=''; pic.loading='lazy'; b.append(pic);
    b.addEventListener('click',()=>show(i)); thumbs.append(b);
    return b;
  });
  function show(i) {
    const idx = (i + images.length) % images.length;
    if (idx === active) return;
    active = idx;
    img.src = images[idx].src; img.alt = images[idx].alt;
    label.textContent = images[idx].credit ? 'Image: ' + images[idx].credit : 'Advertiser-supplied photograph';
    count.textContent = (idx+1) + ' / ' + images.length;
    buttons.forEach((b,j)=> b.setAttribute('aria-pressed',String(j===idx)));
    track('guide_advertiser_gallery', {image_index:idx+1});
  }
  prev.addEventListener('click',()=>show(active-1));
  next.addEventListener('click',()=>show(active+1));
  stage.addEventListener('keydown',e => {
    if (e.key === 'ArrowRight') {e.preventDefault();show(active+1);}
    if (e.key === 'ArrowLeft') {e.preventDefault();show(active-1);}
  });
  stage.tabIndex=0;
  photos.append(stage, thumbs);
  const info = text('div','sk8-premium-details','');
  const title = text('h2','',cfg.headline); title.id = 'sk8-premium-title';
  info.append(text('p','sk8-premium-eyebrow',cfg.businessName + ' · Sponsored adventure'),title,text('p','sk8-premium-description',cfg.description));
  const facts = text('dl','sk8-premium-facts','');
  const fields = [['Where',cfg.location],['Allow',cfg.duration],['Suitable for',cfg.suitableFor],['Price',cfg.priceFrom]];
  fields.forEach(([k,v])=>{if (!clean(v)) return;const d=document.createElement('div');d.append(text('dt','',k),text('dd','',v));facts.append(d)});
  info.append(facts);
  const link = text('a','sk8-premium-action',cfg.actionLabel + ' →');
  link.href=actionUrl; link.target='_blank'; link.rel='noopener noreferrer sponsored';
  link.dataset.advertiser = clean(cfg.businessName);
  link.addEventListener('click',()=>track('guide_advertiser_click',{link_label:clean(cfg.actionLabel),destination_host:new URL(actionUrl).hostname}));
  info.append(link,text('p','sk8-premium-disclosure','Advertisement. The operator supplies the activity information and approved photographs. SK8 Scoop retains independent editorial control.'));
  layout.append(photos,info);card.append(layout);
  slot.append(card);slot.hidden=false;
  track('guide_advertiser_render'); // DOM insertion only, NOT a measured view.
  // View events require at least 50% visible for one continuous second.
  // No supported observer means no claimed view, rather than a guessed impression.
  if ('IntersectionObserver' in window) {
    let viewTimer = null;
    let viewed = false;
    let sufficientlyVisible = false;
    const cancelPendingView = () => {
      if (viewTimer) clearTimeout(viewTimer);
      viewTimer = null;
    };
    const queueView = () => {
      if (!sufficientlyVisible || document.visibilityState === 'hidden' || slot.hidden || viewed || viewTimer) return;
      viewTimer = setTimeout(() => {
        viewTimer = null;
        if (document.visibilityState === 'hidden' || slot.hidden || !sufficientlyVisible || viewed) return;
        viewed = true;
        track('guide_advertiser_view');
        observer.disconnect();
      }, 1000);
    };
    const observer = new IntersectionObserver(entries => {
      if (viewed) return;
      const entry = entries.find(item => item.target === card);
      if (!entry) return;
      sufficientlyVisible = entry.isIntersecting && entry.intersectionRatio >= 0.5;
      if (sufficientlyVisible) queueView();
      else cancelPendingView();
    }, { threshold: [0, 0.5] });
    observer.observe(card);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') cancelPendingView();
      else queueView(); // Restore counting after someone returns to a visible tab.
    });
  }
  const expireIfNeeded = () => {
    if (ukToday() > cfg.endDate) slot.hidden = true;
  };
  // Long-open browser tabs should not keep showing an expired placement.
  document.addEventListener('visibilitychange', expireIfNeeded);
  window.setInterval(expireIfNeeded, 60000);
})();
