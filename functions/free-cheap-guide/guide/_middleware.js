import { GUIDE_SPONSOR } from '../../_shared/guide-sponsor-config.js';

const esc = value => String(value || '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const activeSponsor = sponsor => {
  if (!sponsor || sponsor.enabled !== true) return false;
  const start = Date.parse(sponsor.start_at || '');
  const end = Date.parse(sponsor.end_at || '');
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return false;
  const now = Date.now();
  return now >= start && now < end;
};

const trackedUrl = sponsor => {
  try {
    const url = new URL(String(sponsor.cta_url || ''));
    if (!/^https?:$/.test(url.protocol)) return '';
    url.searchParams.set('utm_source', 'sk8_scoop');
    url.searchParams.set('utm_medium', 'guide_sponsor');
    if (sponsor.campaign_id) url.searchParams.set('utm_campaign', sponsor.campaign_id);
    url.searchParams.set('utm_content', sponsor.slot_id || 'free-cheap-guide-primary');
    return url.toString();
  } catch {
    return '';
  }
};

const sponsorMarkup = sponsor => {
  const href = trackedUrl(sponsor);
  if (!href || !sponsor.business_name || !sponsor.headline || !sponsor.copy || !sponsor.cta_text) return '';
  const image = sponsor.image_url
    ? `<div style="flex:0 0 116px"><img src="${esc(sponsor.image_url)}" alt="" loading="lazy" decoding="async" style="display:block;width:116px;height:92px;object-fit:cover;border-radius:13px"></div>`
    : '';
  return `<aside data-sk8-sponsored-slot="${esc(sponsor.slot_id)}" data-campaign-id="${esc(sponsor.campaign_id)}" aria-label="Sponsored message from ${esc(sponsor.business_name)}" style="max-width:1080px;margin:18px auto 24px;padding:0 18px;font-family:Inter,Arial,sans-serif;color:#263238"><div style="display:flex;gap:16px;align-items:center;background:#fffdf8;border:2px solid #0f6470;border-radius:18px;padding:16px 17px;box-shadow:0 8px 24px rgba(38,50,56,.08)">${image}<div style="min-width:0;flex:1"><div style="font-size:.68rem;letter-spacing:.14em;text-transform:uppercase;font-weight:950;color:#0f6470;margin-bottom:5px">SPONSORED · ${esc(sponsor.business_name)}</div><div style="font-family:Georgia,'Times New Roman',serif;font-size:clamp(1.18rem,2.4vw,1.55rem);font-weight:700;line-height:1.12;margin-bottom:6px">${esc(sponsor.headline)}</div><p style="margin:0 0 10px;line-height:1.45;font-size:.92rem">${esc(sponsor.copy)}</p><a href="${esc(href)}" rel="sponsored noopener" target="_blank" style="display:inline-block;background:#0f6470;color:#fff;text-decoration:none;font-weight:900;border-radius:9px;padding:10px 13px">${esc(sponsor.cta_text)}</a><div style="margin-top:8px;font-size:.68rem;line-height:1.35;color:#66736f">Paid placement. SK8 Scoop editorial remains independent.</div></div></div></aside>`;
};

export async function onRequest(context) {
  const response = await context.next();
  if (!activeSponsor(GUIDE_SPONSOR)) return response;
  const markup = sponsorMarkup(GUIDE_SPONSOR);
  if (!markup) return response;
  const type = response.headers.get('content-type') || '';
  if (!type.includes('text/html')) return response;
  return new HTMLRewriter()
    .on('body', {
      element(element) {
        element.prepend(markup, { html: true });
      }
    })
    .transform(response);
}
