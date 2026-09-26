(() => {
  const page = document.body.dataset.page || 'unknown';
  const missingPageEvents = {
    join: 'join_page_visit',
    start: 'where_to_start_page_visit',
    submit: 'reader_submission_page_visit',
    contact: 'contact_page_visit',
    guides: 'guides_page_visit',
    'food-drink': 'food_drink_page_visit',
    'kids-family': 'kids_family_page_visit',
    outdoors: 'outdoors_page_visit',
    'local-history': 'local_history_page_visit',
    planning: 'planning_page_visit',
    updates: 'useful_updates_page_visit',
    'around-sk8': 'around_sk8_page_visit'
  };

  const track = (name, params = {}) => {
    if (typeof window.sk8Track === 'function') window.sk8Track(name, params);
  };

  const attachInteractionTracking = () => {
    if (document.documentElement.dataset.sk8NueTrackingAttached === 'true') return;
    document.documentElement.dataset.sk8NueTrackingAttached = 'true';

    document.addEventListener('click', event => {
      const link = event.target.closest('a[data-nue-link]');
      if (!link) return;
      let destinationPath = '';
      let destinationHost = '';
      try {
        const url = new URL(link.href, window.location.href);
        destinationPath = url.pathname;
        destinationHost = url.hostname;
      } catch (_) {}
      track('nue_continuation', {
        source_page: page,
        nue_type: link.dataset.nueType || 'contextual',
        destination_path: destinationPath,
        destination_host: destinationHost,
        link_label: (link.textContent || '').trim().slice(0, 100)
      });
    });

    document.addEventListener('click', event => {
      const control = event.target.closest('[data-event-filter], [data-event-area]');
      if (!control || page !== 'whats-on') return;
      track('whats_on_filter_used', {
        filter_type: control.dataset.eventArea ? 'area' : 'need',
        filter_value: control.dataset.eventArea || control.dataset.eventFilter || 'unknown'
      });
    });
  };

  const recordInitialEvents = () => {
    if (document.documentElement.dataset.sk8NueInitialTracked === 'true') return;
    if (typeof window.sk8Track !== 'function') return false;
    document.documentElement.dataset.sk8NueInitialTracked = 'true';

    if (missingPageEvents[page]) {
      track(missingPageEvents[page], { measurement_version: 'nue_v2' });
    }
    document.querySelectorAll('[data-experiment]').forEach(node => {
      const experimentId = String(node.dataset.experiment || '').trim();
      if (experimentId) track('experiment_exposure', { experiment_id: experimentId, variant: 'post_launch_v2' });
    });
    return true;
  };

  attachInteractionTracking();
  let attempts = 0;
  const waitForTracker = () => {
    if (recordInitialEvents() || attempts >= 20) return;
    attempts += 1;
    setTimeout(waitForTracker, 100);
  };
  waitForTracker();
})();
