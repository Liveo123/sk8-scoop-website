// SK8 Scoop editorial exclusions. Keep in server-side review/promotion/QA only.
// These rules reflect the current owner's explicit do-not-feature instruction.
// Do not expose this list as public event metadata or use it to infer other exclusions.
export const exclusionReason = candidate => {
  const evidence = [
    candidate?.id, candidate?.title, candidate?.name, candidate?.organiser,
    candidate?.organizer, candidate?.venue, candidate?.source_url,
    candidate?.booking_url, candidate?.url
  ].filter(Boolean).join(' ').toLowerCase();
  if (/cheadle[\s_-]*masjid|cheadlemasjid\.org/i.test(evidence)) {
    return 'Excluded organiser/source under current SK8 Scoop editorial policy';
  }
  return '';
};
