(() => {
  const DATA_URL = '/data/events.json';
  const list = document.querySelector('[data-events-list]');
  const empty = document.querySelector('[data-events-empty]');
  const status = document.querySelector('[data-events-status]');
  const filters = [...document.querySelectorAll('[data-event-filter]')];
  if (!list) return;

  const iconSvg = key => {
    const icons = {
      calendar: '<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="8" y="11" width="32" height="28" rx="4"/><path d="M15 7v8M33 7v8M8 19h32M16 27l5 5 11-11"/></svg>',
      submit: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M8 14h24l8 8-8 8H8V14Z"/><path d="M16 22h13M14 36h22"/></svg>',
      compass: '<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="17"/><path d="m30 18-4 9-9 4 4-9 9-4Z"/></svg>',
      family: '<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="17" cy="15" r="5"/><circle cx="32" cy="17" r="4"/><path d="M8 39c1-9 5-14 10-14s9 5 10 14M25 39c1-7 4-11 8-11 4 0 7 4 8 11"/></svg>',
      food: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M14 7v14M20 7v14M14 14h6M17 21v20M31 7v34M31 7c5 5 6 12 2 17h-2"/></svg>',
      music: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M19 34V13l20-4v21"/><circle cx="14" cy="35" r="5"/><circle cx="34" cy="31" r="5"/></svg>',
      outdoors: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M6 38 19 17l7 10 5-7 11 18H6Z"/><path d="M19 17 23 9l5 8"/></svg>',
      market: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M8 19h32l-4-10H12L8 19Z"/><path d="M11 19v20h26V19M17 39V27h14v12"/></svg>',
      history: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M8 14h23v23H8zM12 10h23v23"/><path d="M14 21h11M14 27h8"/><circle cx="34" cy="34" r="7"/><path d="m39 39 5 5"/></svg>',
      community: '<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="17" cy="16" r="5"/><circle cx="32" cy="16" r="5"/><circle cx="24" cy="27" r="4"/><path d="M7 38c1-7 5-11 10-11M41 38c-1-7-5-11-10-11M15 41c1-6 4-9 9-9s8 3 9 9"/></svg>',
      wellness: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 40C13 33 8 26 8 18c0-6 4-10 9-10 4 0 6 2 7 5 2-3 4-5 8-5 5 0 8 4 8 9 0 9-7 16-16 23Z"/><path d="M24 35V20M24 27c-5 0-8-3-9-7M24 24c4 0 7-2 9-6"/></svg>',
      default: '<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="9" y="10" width="30" height="29" rx="4"/><path d="M15 7v7M33 7v7M9 19h30M16 27h7M27 27h5M16 33h10"/></svg>'
    };
    return icons[key] || icons.default;
  };

  const eventSceneSvg = key => {
    const commonStart = '<svg class="event-scene-svg" viewBox="0 0 320 150" aria-hidden="true" focusable="false"><rect width="320" height="150" rx="16" fill="#fff9ed"/>';
    const commonEnd = '</svg>';
    const scenes = {
      family: `${commonStart}<circle cx="282" cy="24" r="38" fill="#f8791b" opacity=".12"/><path d="M0 119C54 96 94 107 141 87s94-30 179-6v69H0Z" fill="#dcefd9"/><g fill="#2f6f48"><circle cx="49" cy="73" r="26"/><circle cx="78" cy="79" r="19"/><circle cx="264" cy="81" r="27"/></g><path d="M100 111V70h47v41M110 70l14-18 14 18M148 80h38l-15 25h-23" fill="none" stroke="#073f48" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="205" cy="85" r="31" fill="#073f48"/><g stroke="#fff" stroke-width="3.3" fill="none" stroke-linecap="round"><circle cx="196" cy="79" r="5"/><circle cx="214" cy="81" r="4"/><path d="M186 101c1-10 5-15 11-15s10 5 11 15M207 101c1-8 4-12 8-12s7 4 8 12"/></g><path d="M20 30h52M20 38h38" stroke="#f8791b" stroke-width="5" stroke-linecap="round"/></svg>`,
      food: `${commonStart}<circle cx="273" cy="26" r="42" fill="#d6ea00" opacity=".18"/><rect x="24" y="24" width="74" height="69" rx="7" fill="#073f48"/><path d="M37 44h47M37 57h35M37 70h42" stroke="#fff9ed" stroke-width="4" stroke-linecap="round"/><ellipse cx="159" cy="92" rx="57" ry="24" fill="#e8d7bb"/><path d="M126 66h72v28c0 22-16 34-36 34s-36-12-36-34V66Z" fill="#0f6470"/><path d="M198 74h14c18 0 18 28 0 28h-14" fill="none" stroke="#073f48" stroke-width="6"/><path d="M137 67c12-13 38-13 50 0" fill="none" stroke="#fff" stroke-width="5"/><path d="M238 54v56M249 54v56M238 72h11M266 54v56M266 54c12 11 13 26 4 36h-4" stroke="#073f48" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M106 33l10-13M116 38l18-5" stroke="#f8791b" stroke-width="5" stroke-linecap="round"/>${commonEnd}`,
      music: `${commonStart}<path d="M0 121C56 91 103 108 151 88s97-34 169-6v68H0Z" fill="#edf3df"/><path d="M45 36h229v68H45Z" fill="#073f48"/><path d="M65 104V55l33-18h124l33 18v49" fill="#164f59"/><g fill="#f8791b"><circle cx="101" cy="58" r="7"/><circle cx="160" cy="58" r="7"/><circle cx="219" cy="58" r="7"/></g><path d="M101 65l-12 25M160 65v26M219 65l12 25" stroke="#fff9ed" stroke-width="3"/><g stroke="#fff" stroke-width="4" fill="none"><path d="M144 103V76l30-7v27"/><circle cx="138" cy="106" r="6"/><circle cx="168" cy="99" r="6"/></g><path d="M22 31h47M22 39h30" stroke="#f8791b" stroke-width="5" stroke-linecap="round"/>${commonEnd}`,
      outdoors: `${commonStart}<circle cx="276" cy="26" r="40" fill="#f8791b" opacity=".13"/><path d="M0 123C63 92 112 109 158 78s93-29 162-2v74H0Z" fill="#dcefd9"/><path d="M36 124C84 105 104 108 136 92s64-36 111-24" fill="none" stroke="#9ed8e2" stroke-width="16"/><g fill="#2f6f48"><circle cx="67" cy="73" r="27"/><circle cx="94" cy="82" r="19"/><circle cx="251" cy="79" r="25"/></g><path d="M192 103h58M204 103V63M239 103V63M199 63h47M210 63l10-15M237 63l-10-15" stroke="#073f48" stroke-width="4" fill="none" stroke-linecap="round"/><circle cx="141" cy="86" r="28" fill="#073f48"/><path d="M141 66v39M122 85h38M129 102l12-20 12 20" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M20 30h55M20 38h38" stroke="#f8791b" stroke-width="5" stroke-linecap="round"/>${commonEnd}`,
      market: `${commonStart}<circle cx="282" cy="24" r="37" fill="#f8791b" opacity=".12"/><path d="M0 124C53 104 101 109 151 93s91-30 169-13v70H0Z" fill="#e8efdc"/><path d="M52 61h104l-13-30H65L52 61Z" fill="#f8791b"/><path d="M58 61v54h92V61M76 115V86h55v29" fill="#fff" stroke="#073f48" stroke-width="4"/><path d="M65 31h78" stroke="#073f48" stroke-width="4"/><circle cx="219" cy="85" r="31" fill="#073f48"/><path d="M202 84h34l-5-17h-24l-5 17ZM207 84v20h24V84M214 104V92h10v12" stroke="#fff" stroke-width="3" fill="none" stroke-linejoin="round"/><path d="M179 35h52M179 43h35" stroke="#f8791b" stroke-width="5" stroke-linecap="round"/>${commonEnd}`,
      history: `${commonStart}<rect x="22" y="28" width="116" height="82" rx="7" fill="#e5d4b8" transform="rotate(-3 80 69)"/><rect x="37" y="42" width="85" height="50" fill="#fff9ed"/><path d="M47 88V61l17-14 18 12 22-20 12 11v38" fill="#9a876a"/><path d="M47 88h69" stroke="#6f604a" stroke-width="4"/><rect x="137" y="23" width="80" height="70" rx="6" fill="#d9c8b1" transform="rotate(5 177 58)"/><path d="M151 44h49M151 56h37M151 68h43" stroke="#846f56" stroke-width="4"/><circle cx="241" cy="86" r="32" fill="#073f48"/><circle cx="241" cy="86" r="15" fill="none" stroke="#fff" stroke-width="4"/><path d="m252 97 16 16" stroke="#fff" stroke-width="6" stroke-linecap="round"/><g stroke="#f8791b" stroke-width="3" fill="none"><path d="M122 61c25-10 42-8 57 1"/><path d="M204 74c14 0 23 2 31 7"/></g><path d="M21 126h73M21 134h48" stroke="#f8791b" stroke-width="5" stroke-linecap="round"/>${commonEnd}`,
      wellness: `${commonStart}<circle cx="279" cy="25" r="40" fill="#d6ea00" opacity=".18"/><path d="M0 124C59 100 111 108 155 88s94-33 165-4v66H0Z" fill="#deeedc"/><g fill="#2f6f48"><circle cx="57" cy="76" r="24"/><circle cx="87" cy="84" r="18"/><circle cx="256" cy="82" r="23"/></g><circle cx="164" cy="83" r="34" fill="#073f48"/><path d="M164 105C145 94 135 81 135 67c0-11 7-18 16-18 7 0 11 4 13 10 3-6 7-10 14-10 9 0 16 7 16 17 0 15-12 28-30 39Z" fill="none" stroke="#fff" stroke-width="3.5"/><path d="M164 99V66M164 83c-9 0-14-5-16-12M164 78c8 0 13-4 17-11" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M21 31h52M21 39h35" stroke="#f8791b" stroke-width="5" stroke-linecap="round"/>${commonEnd}`,
      community: `${commonStart}<circle cx="279" cy="24" r="39" fill="#f8791b" opacity=".12"/><path d="M0 124C57 100 99 108 148 87s101-32 172-4v67H0Z" fill="#dfeeda"/><path d="M42 110V68h52v42M53 68l15-20 15 20M111 110V59h48v51M122 59l13-17 13 17" fill="#fff9ed" stroke="#073f48" stroke-width="4"/><circle cx="219" cy="84" r="32" fill="#073f48"/><g stroke="#fff" fill="none" stroke-width="3.2"><circle cx="210" cy="78" r="5"/><circle cx="228" cy="78" r="5"/><circle cx="219" cy="91" r="4"/><path d="M200 104c1-9 5-14 10-14M238 104c-1-9-5-14-10-14M210 107c1-7 4-10 9-10s8 3 9 10"/></g><path d="M20 30h55M20 38h37" stroke="#f8791b" stroke-width="5" stroke-linecap="round"/>${commonEnd}`,
      default: `${commonStart}<circle cx="279" cy="24" r="40" fill="#f8791b" opacity=".12"/><path d="M0 124C58 101 100 108 149 88s97-31 171-4v66H0Z" fill="#dfeddd"/><path d="M50 49h82v67H50V49Z" fill="#fff" stroke="#073f48" stroke-width="4"/><path d="M67 40v20M115 40v20M50 67h82" stroke="#073f48" stroke-width="4"/><g fill="#d6ea00"><rect x="64" y="79" width="13" height="13" rx="2"/><rect x="86" y="79" width="13" height="13" rx="2"/><rect x="108" y="79" width="13" height="13" rx="2"/></g><circle cx="218" cy="85" r="31" fill="#073f48"/><path d="M218 64c13 0 21 9 21 20 0 16-21 31-21 31s-21-15-21-31c0-11 8-20 21-20Z" fill="none" stroke="#fff" stroke-width="3.5"/><circle cx="218" cy="84" r="6" fill="none" stroke="#fff" stroke-width="3.5"/><path d="M21 30h54M21 38h36" stroke="#f8791b" stroke-width="5" stroke-linecap="round"/>${commonEnd}`
    };
    return scenes[key] || scenes.default;
  };

  const safeUrl = value => {
    const raw = String(value || '').trim();
    if (!raw) return '';
    try {
      const url = new URL(raw, window.location.origin);
      return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
    } catch (_) {
      return '';
    }
  };

  const categoryIconKey = event => {
    const haystack = `${event.category || ''} ${event.title || ''} ${event.description || ''}`.toLowerCase();
    if (/family|kids|children|storytime/.test(haystack)) return 'family';
    if (/food|drink|cafe|restaurant|snack/.test(haystack)) return 'food';
    if (/music|concert|gig|disco/.test(haystack)) return 'music';
    if (/walk|park|outdoor|nature/.test(haystack)) return 'outdoors';
    if (/market|fair|makers/.test(haystack)) return 'market';
    if (/history|heritage|museum|hatting/.test(haystack)) return 'history';
    if (/wellness|yoga|health/.test(haystack)) return 'wellness';
    if (/community|brew|biscuit|social/.test(haystack)) return 'community';
    return 'default';
  };

  const addPageVisuals = () => {
    const heroWrap = document.querySelector('.page-hero > .wrap');
    if (heroWrap && !heroWrap.classList.contains('whats-on-hero-grid')) {
      const copy = document.createElement('div');
      copy.className = 'whats-on-hero-copy';
      [...heroWrap.childNodes].forEach(node => copy.appendChild(node));

      const visual = document.createElement('figure');
      visual.className = 'whats-on-hero-visual';
      const image = document.createElement('img');
      image.src = '/assets/images/nue/whats-on-hero.webp';
      image.alt = 'Editorial collage of a local events map, tickets, calendar and stage lights';
      const caption = document.createElement('figcaption');
      caption.className = 'whats-on-hero-caption';
      const badge = document.createElement('span');
      badge.textContent = 'What’s On';
      const strong = document.createElement('strong');
      strong.textContent = 'Local events, useful filters and things actually worth leaving the house for.';
      caption.append(badge, strong);
      visual.append(image, caption);

      heroWrap.classList.add('whats-on-hero-grid');
      heroWrap.append(copy, visual);
    }

    const filterGrid = document.querySelector('button[data-event-filter="weekend"]')?.closest('.reader-card-grid');
    if (filterGrid && !filterGrid.classList.contains('whats-on-filter-grid')) {
      filterGrid.classList.add('whats-on-filter-grid');
      const images = {
        weekend: '/assets/images/nue/whats-on-weekend.webp',
        free: '/assets/images/free-cheap-guide-logo.webp',
        family: '/assets/images/nue/whats-on-family.webp'
      };
      const labels = { weekend: 'THIS WEEKEND', free: 'FREE IDEAS', family: 'FAMILY' };
      ['weekend','free','family'].forEach(key => {
        const button = filterGrid.querySelector(`[data-event-filter="${key}"]`);
        const card = button && button.closest('.reader-story');
        if (!card || card.querySelector('.reader-story-image')) return;
        const image = document.createElement('div');
        image.className = 'reader-story-image';
        image.style.backgroundImage = `url("${images[key]}")`;
        if (key === 'free') {
          image.style.backgroundSize = 'contain';
          image.style.backgroundRepeat = 'no-repeat';
          image.style.backgroundColor = '#fff';
        }
        const label = document.createElement('span');
        label.textContent = labels[key];
        image.appendChild(label);
        card.prepend(image);
      });
    }

    if (empty && !empty.classList.contains('whats-on-empty')) {
      const copy = document.createElement('div');
      copy.className = 'whats-on-empty-copy';
      [...empty.childNodes].forEach(node => copy.appendChild(node));
      const art = document.createElement('div');
      art.className = 'whats-on-empty-art whats-on-empty-illustration';
      art.setAttribute('aria-hidden', 'true');
      art.innerHTML = `${iconSvg('calendar')}<span class="empty-map-dot dot-one"></span><span class="empty-map-dot dot-two"></span><span class="empty-route"></span>`;
      empty.classList.add('whats-on-empty');
      empty.append(art, copy);
    }

    const panels = [...document.querySelectorAll('.reader-panel')];
    panels.forEach(panel => {
      const heading = panel.querySelector('h2');
      if (!heading || panel.querySelector('.whats-on-panel-icon')) return;
      const text = heading.textContent.trim();
      let icon = '';
      if (text.startsWith('Curated first')) icon = 'calendar';
      if (text.startsWith('Send in a local event')) icon = 'submit';
      if (text.startsWith('Still looking')) {
        icon = 'compass';
        panel.classList.add('whats-on-next-panel');
      }
      if (!icon) return;
      const iconWrap = document.createElement('div');
      iconWrap.className = 'whats-on-panel-icon';
      iconWrap.setAttribute('aria-hidden', 'true');
      iconWrap.innerHTML = iconSvg(icon);
      panel.prepend(iconWrap);
    });
  };

  addPageVisuals();

  let events = [];
  let activeFilter = 'all';

  const localToday = () => {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit'
    }).formatToParts(new Date());
    const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
    return `${values.year}-${values.month}-${values.day}`;
  };

  const parseDate = value => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) return null;
    const [year, month, day] = String(value).split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day));
  };

  const prettyDate = value => {
    const date = parseDate(value);
    if (!date) return '';
    return new Intl.DateTimeFormat('en-GB', {
      weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC'
    }).format(date);
  };

  const weekendBounds = () => {
    const now = new Date(`${localToday()}T12:00:00Z`);
    const day = now.getUTCDay();
    if (day === 0) return [now, now];
    const untilSaturday = (6 - day + 7) % 7;
    const saturday = new Date(now);
    saturday.setUTCDate(now.getUTCDate() + untilSaturday);
    const sunday = new Date(saturday);
    sunday.setUTCDate(saturday.getUTCDate() + 1);
    return [saturday, sunday];
  };

  const isFree = event => /(^|\b)free(\b|$)/i.test(String(event.cost || ''));
  const isFamily = event => /family|kids|children|storytime/i.test(`${event.category || ''} ${event.title || ''} ${event.description || ''}`);
  const isWeekend = event => {
    const date = parseDate(event.date);
    if (!date) return false;
    const [start, end] = weekendBounds();
    return date >= start && date <= end;
  };

  const matches = event => {
    if (activeFilter === 'free') return isFree(event);
    if (activeFilter === 'family') return isFamily(event);
    if (activeFilter === 'weekend') return isWeekend(event);
    return true;
  };

  const eventCard = event => {
    const article = document.createElement('article');
    article.className = 'reader-story event-listing-card';

    const imageUrl = safeUrl(event.image);
    if (imageUrl) {
      const visual = document.createElement('div');
      visual.className = 'reader-story-image';
      visual.style.backgroundImage = `url("${imageUrl}")`;
      const label = document.createElement('span');
      label.textContent = String(event.category || 'LOCAL EVENT');
      visual.appendChild(label);
      article.appendChild(visual);
    } else {
      const iconKey = categoryIconKey(event);
      const visual = document.createElement('div');
      visual.className = `event-scene event-scene-${iconKey}`;
      visual.setAttribute('aria-hidden', 'true');
      visual.innerHTML = eventSceneSvg(iconKey);
      article.appendChild(visual);
    }

    const body = document.createElement('div');
    body.className = 'reader-story-body';
    const eyebrow = document.createElement('div');
    eyebrow.className = 'eyebrow';
    eyebrow.textContent = String(event.category || 'LOCAL EVENT');
    const heading = document.createElement('h3');
    heading.textContent = String(event.title || '');
    const when = [prettyDate(event.date), String(event.time || '').trim()].filter(Boolean).join(' · ');
    const metaText = [when, String(event.area || '').trim(), String(event.cost || '').trim()].filter(Boolean).join(' · ');
    const meta = document.createElement('p');
    meta.className = 'reader-meta';
    meta.textContent = metaText;
    const venue = document.createElement('p');
    venue.className = 'event-venue';
    venue.textContent = String(event.venue || '').trim();
    const description = document.createElement('p');
    description.textContent = String(event.description || '');
    body.append(eyebrow, heading, meta);
    if (venue.textContent) body.appendChild(venue);
    body.appendChild(description);

    const source = safeUrl(event.booking_url || event.source_url);
    if (source) {
      const link = document.createElement('a');
      link.className = 'reader-link';
      link.href = source;
      link.rel = 'noopener';
      link.textContent = 'Check current details →';
      body.appendChild(link);
    }

    article.appendChild(body);
    return article;
  };

  const render = () => {
    list.replaceChildren();
    const visible = events.filter(matches);
    visible.forEach(event => list.appendChild(eventCard(event)));
    if (empty) empty.hidden = visible.length > 0;
    if (status) status.textContent = visible.length
      ? `${visible.length} checked ${visible.length === 1 ? 'listing' : 'listings'} shown`
      : 'No checked listings match this view yet.';
    filters.forEach(button => {
      const selected = button.dataset.eventFilter === activeFilter;
      button.setAttribute('aria-pressed', String(selected));
    });
  };

  filters.forEach(button => button.addEventListener('click', () => {
    activeFilter = button.dataset.eventFilter || 'all';
    render();
  }));

  fetch(DATA_URL, { cache: 'no-store' })
    .then(response => {
      if (!response.ok) throw new Error(`Events data returned ${response.status}`);
      return response.json();
    })
    .then(data => {
      const today = localToday();
      events = (Array.isArray(data) ? data : [])
        .filter(event => event && event.status !== 'example')
        .filter(event => /^\d{4}-\d{2}-\d{2}$/.test(String(event.date || '')) && event.date >= today)
        .sort((a, b) => `${a.date || ''} ${a.time || ''}`.localeCompare(`${b.date || ''} ${b.time || ''}`));
      render();
    })
    .catch(error => {
      console.error('SK8 What’s On data failed to load', error);
      if (status) status.textContent = 'Current listings could not be loaded.';
      if (empty) empty.hidden = false;
    });
})();
