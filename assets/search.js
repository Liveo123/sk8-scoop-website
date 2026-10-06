(() => {
  const form = document.querySelector('[data-search-form]');
  const input = document.querySelector('[data-search-input]');
  const resultsRoot = document.querySelector('[data-search-results]');
  const status = document.querySelector('[data-search-status]');
  const freshness = document.querySelector('[data-search-freshness]');
  const empty = document.querySelector('[data-search-empty]');
  const typeButtons = [...document.querySelectorAll('[data-search-type]')];
  const areaButtons = [...document.querySelectorAll('[data-search-area]')];
  const exampleButtons = [...document.querySelectorAll('[data-search-example]')];
  if (!form || !input || !resultsRoot) return;

  let records = [];
  let activeType = 'all';
  let activeArea = 'all';
  let lastZeroKey = '';

  const params = new URLSearchParams(window.location.search);
  input.value = (params.get('q') || '').trim();

  const localToday = () => {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit'
    }).formatToParts(new Date());
    const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
    return `${values.year}-${values.month}-${values.day}`;
  };

  const normalise = value => String(value || '')
    .normalize('NFKD')
    .replace(/[’‘]/g, "'")
    .replace(/[^a-zA-Z0-9£]+/g, ' ')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

  const synonymGroups = [
    ['kids', 'children', 'child', 'family'],
    ['cheap', 'free', 'budget', 'low cost', 'money saving'],
    ['walk', 'walks', 'walking', 'outdoors', 'park', 'parks', 'nature', 'route'],
    ['road', 'roads', 'roadworks', 'traffic', 'travel', 'transport'],
    ['planning', 'development', 'consultation', 'proposal'],
    ['food', 'cafe', 'café', 'restaurant', 'pub', 'drink'],
    ['history', 'heritage', 'historic', 'old']
  ];

  const expandTerms = query => {
    const base = normalise(query).split(' ').filter(Boolean);
    const out = new Set(base);
    synonymGroups.forEach(group => {
      const normal = group.map(normalise);
      if (normal.some(term => base.includes(term))) normal.forEach(term => term.split(' ').forEach(word => out.add(word)));
    });
    return [...out];
  };

  const inferArea = text => {
    const hay = normalise(text);
    if (hay.includes('cheadle hulme')) return 'Cheadle Hulme';
    if (hay.includes('heald green')) return 'Heald Green';
    if (hay.includes('gatley')) return 'Gatley';
    if (hay.includes('cheadle')) return 'Cheadle';
    if (/stockport|bramhall|wythenshawe|manchester/.test(hay)) return 'Nearby';
    return 'All areas';
  };

  const internalHref = href => {
    try { return new URL(href, window.location.origin).origin === window.location.origin; }
    catch (_) { return false; }
  };

  const transformDiscovery = data => (data && Array.isArray(data.records) ? data.records : []).map(item => ({
    ...item,
    source: 'discovery',
    areas: Array.isArray(item.areas) ? item.areas : [],
    tags: Array.isArray(item.tags) ? item.tags : []
  }));

  const transformHomepage = data => {
    const updated = String(data && data.updated || '');
    return (data && Array.isArray(data.stories) ? data.stories : []).map((story, index) => {
      const combined = `${story.title || ''} ${story.meta || ''} ${story.summary || ''}`;
      return {
        id: `homepage-${index}`,
        type: 'Stories',
        category: story.label || story.mode || 'Current story',
        title: story.title || '',
        summary: story.summary || '',
        href: story.href || '/latest',
        area: inferArea(combined),
        areas: [],
        tags: [story.mode || '', story.label || '', story.meta || ''].filter(Boolean),
        freshness: 'current',
        checked: updated,
        source: 'homepage'
      };
    });
  };

  const transformEvents = data => {
    const today = localToday();
    return (Array.isArray(data) ? data : [])
      .filter(event => event && event.status !== 'example')
      .filter(event => /^\d{4}-\d{2}-\d{2}$/.test(String(event.date || '')) && String(event.end_date || event.date) >= today)
      .map(event => ({
        id: `event-${event.id || event.title}`,
        type: 'Events',
        category: event.category || 'Local event',
        title: event.title || '',
        summary: event.description || '',
        href: event.booking_url || event.source_url || '/whats-on/',
        area: ['Cheadle', 'Cheadle Hulme', 'Gatley', 'Heald Green'].includes(event.area) ? event.area : 'Nearby',
        areas: [],
        tags: [event.category || '', event.venue || '', event.cost || '', 'event', 'things to do'],
        freshness: 'dated',
        checked: event.checked || '',
        date: event.date || '',
        cost: event.cost || '',
        source: 'events'
      }));
  };

  const isCurrent = record => !record.expires || String(record.expires) >= localToday();

  const areaMatches = record => {
    if (activeArea === 'all') return true;
    if (record.area === activeArea) return true;
    if (Array.isArray(record.areas) && record.areas.includes(activeArea)) return true;
    return false;
  };

  const typeMatches = record => activeType === 'all' || normalise(record.type) === normalise(activeType);

  const searchable = record => normalise([
    record.title, record.category, record.area, ...(record.areas || []), ...(record.tags || []), record.summary
  ].join(' '));

  const queryStopTerms = new Set([
    'a', 'an', 'and', 'around', 'at', 'do', 'find', 'for', 'from', 'in', 'is', 'local', 'me', 'my',
    'near', 'of', 'on', 'or', 'our', 'please', 's', 'show', 'sk8', 'something', 'that', 'the', 'thing',
    'things', 'this', 'to', 'what', 'whats', 'with'
  ]);

  const meaningfulQueryTerms = query => normalise(query).split(' ').filter(term => term && !queryStopTerms.has(term));

  const termMatchesRecord = (term, all) => {
    if (all.includes(term)) return true;
    const relatedGroup = synonymGroups.find(group => group.some(value => normalise(value).split(' ').includes(term)));
    if (!relatedGroup) return false;
    return relatedGroup.some(value => all.includes(normalise(value)));
  };

  const hasEnoughQueryCoverage = (record, query) => {
    const terms = meaningfulQueryTerms(query);
    if (!terms.length) return true;
    const all = searchable(record);
    const matched = terms.filter(term => termMatchesRecord(term, all)).length;
    const minimumMatches = terms.length === 1 ? 1 : Math.ceil(terms.length * 0.6);
    return matched >= minimumMatches;
  };

  const scoreRecord = (record, query) => {
    const q = normalise(query);
    const terms = expandTerms(query);
    const title = normalise(record.title);
    const category = normalise(record.category);
    const areas = normalise([record.area, ...(record.areas || [])].join(' '));
    const tags = normalise((record.tags || []).join(' '));
    const summary = normalise(record.summary);
    const all = searchable(record);
    let score = 0;
    if (title === q) score += 90;
    if (q && title.includes(q)) score += 48;
    if (q && category.includes(q)) score += 24;
    if (q && areas.includes(q)) score += 22;
    if (q && tags.includes(q)) score += 18;
    if (q && summary.includes(q)) score += 10;
    terms.forEach(term => {
      if (!term) return;
      if (title.split(' ').includes(term)) score += 14;
      else if (title.includes(term)) score += 9;
      if (areas.split(' ').includes(term)) score += 7;
      if (category.includes(term)) score += 6;
      if (tags.includes(term)) score += 5;
      if (summary.includes(term)) score += 2;
    });
    const baseTerms = normalise(query).split(' ').filter(Boolean);
    if (baseTerms.length && baseTerms.every(term => all.includes(term))) score += 16;
    return score;
  };

  const prettyDate = value => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) return '';
    const [year, month, day] = String(value).split('-').map(Number);
    return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
      .format(new Date(Date.UTC(year, month - 1, day)));
  };

  const resultCard = (record, rank, query) => {
    const article = document.createElement('article');
    article.className = 'search-result-card';

    const top = document.createElement('div');
    top.className = 'search-result-top';
    const type = document.createElement('span');
    type.className = 'search-result-type';
    type.textContent = record.category || record.type;
    top.appendChild(type);
    if (record.area && record.area !== 'All areas') {
      const area = document.createElement('span');
      area.className = 'search-result-area';
      area.textContent = record.area;
      top.appendChild(area);
    }

    const heading = document.createElement('h2');
    heading.textContent = record.title;
    const summary = document.createElement('p');
    summary.textContent = record.summary;
    article.append(top, heading, summary);

    const metaParts = [];
    if (record.type === 'Events' && record.date) metaParts.push(prettyDate(record.date));
    if (record.cost) metaParts.push(record.cost);
    if (record.checked && record.source !== 'homepage') metaParts.push(`checked ${prettyDate(record.checked)}`);
    if (metaParts.length) {
      const meta = document.createElement('div');
      meta.className = 'search-result-meta';
      meta.textContent = metaParts.join(' · ');
      article.appendChild(meta);
    }

    const link = document.createElement('a');
    link.className = 'reader-link';
    link.href = record.href;
    link.textContent = record.type === 'Events' && !internalHref(record.href) ? 'Check current details →' : 'Open →';
    link.addEventListener('click', () => {
      if (typeof window.sk8Track === 'function') {
        window.sk8Track('search_result_click', {
          query_length: normalise(query).length,
          result_rank: rank,
          result_type: record.type,
          result_area: record.area || 'unknown',
          destination_kind: internalHref(record.href) ? 'internal' : 'external'
        });
      }
    });
    article.appendChild(link);
    return article;
  };

  const visibleRecords = query => {
    const clean = normalise(query);
    const eligible = records.filter(isCurrent).filter(typeMatches).filter(areaMatches);
    if (clean.length < 2) {
      return eligible.filter(record => record.source === 'discovery').slice(0, 10).map(record => ({ record, score: 0 }));
    }
    return eligible
      .filter(record => hasEnoughQueryCoverage(record, query))
      .map(record => ({ record, score: scoreRecord(record, query) }))
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score || String(a.record.title).localeCompare(String(b.record.title)))
      .slice(0, 30);
  };

  const render = () => {
    const query = input.value.trim();
    const found = visibleRecords(query);
    resultsRoot.replaceChildren();
    found.forEach((item, index) => resultsRoot.appendChild(resultCard(item.record, index + 1, query)));

    const isQuery = normalise(query).length >= 2;
    if (status) {
      if (!isQuery) status.textContent = 'Useful places to start';
      else status.textContent = `${found.length} ${found.length === 1 ? 'result' : 'results'} for your search`;
    }
    if (freshness) freshness.textContent = 'Current events hide automatically after their date. Dated updates can expire from search.';
    if (empty) empty.hidden = found.length > 0 || !isQuery;

    typeButtons.forEach(button => button.setAttribute('aria-pressed', String((button.dataset.searchType || 'all') === activeType)));
    areaButtons.forEach(button => button.setAttribute('aria-pressed', String((button.dataset.searchArea || 'all') === activeArea)));

    if (isQuery && found.length === 0) {
      const zeroKey = `${normalise(query)}|${activeType}|${activeArea}`;
      if (zeroKey !== lastZeroKey && typeof window.sk8Track === 'function') {
        lastZeroKey = zeroKey;
        window.sk8Track('search_zero_results', {
          query_length: normalise(query).length,
          search_type: activeType,
          search_area: activeArea
        });
      }
    }
  };

  const syncUrl = () => {
    const url = new URL(window.location.href);
    const query = input.value.trim();
    if (query) url.searchParams.set('q', query); else url.searchParams.delete('q');
    window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
  };

  form.addEventListener('submit', event => {
    event.preventDefault();
    syncUrl();
    render();
    if (typeof window.sk8Track === 'function') {
      window.sk8Track('search_submit', {
        query_length: normalise(input.value).length,
        search_type: activeType,
        search_area: activeArea
      });
    }
  });

  exampleButtons.forEach(button => button.addEventListener('click', () => {
    input.value = button.dataset.searchExample || button.textContent.trim();
    form.requestSubmit();
  }));

  typeButtons.forEach(button => button.addEventListener('click', () => {
    activeType = button.dataset.searchType || 'all';
    render();
    if (typeof window.sk8Track === 'function') window.sk8Track('search_filter_change', { filter_kind: 'type', filter_value: activeType });
  }));

  areaButtons.forEach(button => button.addEventListener('click', () => {
    activeArea = button.dataset.searchArea || 'all';
    render();
    if (typeof window.sk8Track === 'function') window.sk8Track('search_filter_change', { filter_kind: 'area', filter_value: activeArea });
  }));

  Promise.all([
    fetch('/data/discovery.json', { cache: 'no-store' }).then(response => response.ok ? response.json() : Promise.reject(new Error('Discovery data failed'))),
    fetch('/data/homepage.json', { cache: 'no-store' }).then(response => response.ok ? response.json() : Promise.reject(new Error('Homepage data failed'))),
    fetch('/data/events.json', { cache: 'no-store' }).then(response => response.ok ? response.json() : Promise.reject(new Error('Events data failed')))
  ]).then(([discovery, homepage, events]) => {
    records = [...transformDiscovery(discovery), ...transformHomepage(homepage), ...transformEvents(events)];
    render();
    if (typeof window.sk8Track === 'function') {
      window.sk8Track('search_view', {
        has_query: normalise(input.value).length >= 2 ? 'yes' : 'no',
        query_length: normalise(input.value).length
      });
    }
  }).catch(() => {
    if (status) status.textContent = 'Search could not load just now.';
    if (freshness) freshness.textContent = 'You can still use the direct routes below.';
    if (empty) empty.hidden = false;
  });
})();
