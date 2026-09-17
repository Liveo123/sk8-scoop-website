(() => {
  const header = document.querySelector('.site-header');
  const row = header && header.querySelector('.header-row');
  if (!header || !row || location.pathname.startsWith('/admin/') || row.querySelector('[data-global-search-root]')) return;

  const menu = row.querySelector('.menu-btn');
  const nav = row.querySelector('.nav');
  const currentQuery = location.pathname.replace(/\/+$/,'') === '/search'
    ? (new URLSearchParams(location.search).get('q') || '').trim()
    : '';
  const normalise = value => String(value || '')
    .normalize('NFKD')
    .replace(/[’‘]/g, "'")
    .replace(/[^a-zA-Z0-9£]+/g, ' ')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
  const track = (name, params = {}) => {
    if (typeof window.sk8Track === 'function') window.sk8Track(name, params);
  };
  const iconMarkup = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="11" cy="11" r="6.5"></circle><path d="m16 16 4.2 4.2"></path></svg>';

  const makeForm = (surface, inputId, compact = false) => {
    const form = document.createElement('form');
    form.className = `global-search-form global-search-form-${surface}`;
    form.action = '/search/';
    form.method = 'get';
    form.setAttribute('role', 'search');
    form.dataset.globalSearchForm = surface;

    const label = document.createElement('label');
    label.className = 'sr-only';
    label.htmlFor = inputId;
    label.textContent = 'Search SK8 Scoop';

    const input = document.createElement('input');
    input.id = inputId;
    input.name = 'q';
    input.type = 'search';
    input.autocomplete = 'off';
    input.enterKeyHint = 'search';
    input.placeholder = compact ? 'Search SK8 Scoop…' : 'Search SK8…';
    input.value = currentQuery;
    input.dataset.globalSearchInput = surface;

    const button = document.createElement('button');
    button.type = 'submit';
    button.className = 'global-search-submit';
    button.setAttribute('aria-label', 'Search SK8 Scoop');
    button.innerHTML = iconMarkup;

    form.append(label, input, button);
    return form;
  };

  const utility = document.createElement('div');
  utility.className = 'global-search-utility';
  utility.dataset.globalSearchRoot = 'true';

  const desktopForm = makeForm('desktop', 'global-search-desktop');
  const desktopInput = desktopForm.querySelector('[data-global-search-input]');
  utility.appendChild(desktopForm);

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'global-search-toggle';
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-controls', 'global-search-panel');
  toggle.setAttribute('aria-label', 'Search SK8 Scoop');
  toggle.innerHTML = iconMarkup;
  utility.appendChild(toggle);

  if (menu) row.insertBefore(utility, menu);
  else row.appendChild(utility);

  const panel = document.createElement('div');
  panel.id = 'global-search-panel';
  panel.className = 'global-search-panel';
  panel.hidden = true;
  const panelInner = document.createElement('div');
  panelInner.className = 'wrap global-search-panel-inner';
  const panelForm = makeForm('panel', 'global-search-panel-input', true);
  const panelInput = panelForm.querySelector('[data-global-search-input]');
  panelInner.appendChild(panelForm);
  panel.appendChild(panelInner);
  header.appendChild(panel);

  const closeMenu = () => {
    if (!nav || !menu) return;
    nav.classList.remove('open');
    menu.setAttribute('aria-expanded', 'false');
    const label = menu.querySelector('span:last-child');
    if (label) label.textContent = 'Menu';
  };

  const closePanel = ({ restoreFocus = false } = {}) => {
    if (panel.hidden) return;
    panel.hidden = true;
    header.classList.remove('global-search-open');
    toggle.setAttribute('aria-expanded', 'false');
    if (restoreFocus) toggle.focus();
  };

  const openPanel = (trigger = 'button') => {
    closeMenu();
    panel.hidden = false;
    header.classList.add('global-search-open');
    toggle.setAttribute('aria-expanded', 'true');
    panelInput.value = currentQuery || panelInput.value;
    panelInput.focus();
    panelInput.select();
    track('header_search_open', { search_surface: 'compact', open_trigger: trigger });
  };

  let desktopFocusTracked = false;
  desktopInput.addEventListener('focus', () => {
    if (desktopFocusTracked) return;
    desktopFocusTracked = true;
    track('header_search_open', { search_surface: 'desktop', open_trigger: 'focus' });
  });

  toggle.addEventListener('click', () => {
    if (panel.hidden) openPanel('button');
    else closePanel({ restoreFocus: true });
  });

  if (menu) menu.addEventListener('click', () => closePanel());

  [desktopForm, panelForm].forEach(form => {
    form.addEventListener('submit', event => {
      const input = form.querySelector('input[name="q"]');
      const queryLength = normalise(input && input.value).length;
      if (queryLength < 2) {
        event.preventDefault();
        if (input) input.focus();
        return;
      }
      track('header_search_submit', {
        search_surface: form.dataset.globalSearchForm,
        query_length: queryLength,
        origin_page_path: location.pathname
      });
    });
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !panel.hidden) {
      event.preventDefault();
      closePanel({ restoreFocus: true });
      return;
    }
    if (event.key !== '/' || event.ctrlKey || event.metaKey || event.altKey) return;
    const target = event.target;
    if (target && (target.matches('input,textarea,select,button,a') || target.isContentEditable)) return;
    event.preventDefault();
    if (window.matchMedia('(min-width: 1280px)').matches) {
      desktopInput.focus();
      desktopInput.select();
    } else {
      openPanel('keyboard');
    }
  });

  document.addEventListener('pointerdown', event => {
    if (panel.hidden || panel.contains(event.target) || toggle.contains(event.target)) return;
    closePanel();
  });

  const desktopQuery = window.matchMedia('(min-width: 1280px)');
  const handleDesktopChange = event => { if (event.matches) closePanel(); };
  if (typeof desktopQuery.addEventListener === 'function') desktopQuery.addEventListener('change', handleDesktopChange);
  else if (typeof desktopQuery.addListener === 'function') desktopQuery.addListener(handleDesktopChange);
})();