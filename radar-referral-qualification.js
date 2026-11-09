// Pure one-referral eligibility check for South Manchester Radar.
// IMPORTANT: only pass AUTHORITATIVE server-side records here, never raw browser fields.
// This does not call MailerLite, award credits or send messages.
const VALID_CODE = /^R[A-HJ-NP-Z2-9]{12}$/;
export function qualifyRadarReferral({referrer,referee,claim,ledger=[]}) {
  if (!referrer || !referee || !claim) return {ok:false,reason:'missing_record'};
  const code=String(referrer.referral_code||'');
  if (!VALID_CODE.test(code) || claim.code!==code) return {ok:false,reason:'invalid_code'};
  if (!referrer.radar_member || referrer.status!=='active') return {ok:false,reason:'referrer_not_active'};
  if (String(referrer.id)===String(referee.id)) return {ok:false,reason:'self_referral'};
  if (!referee.radar_member || referee.status!=='active') return {ok:false,reason:'referee_not_active'};
  // The draft signup handler's active status is NOT proof of independent confirmation.
  if (referee.independently_confirmed!==true) return {ok:false,reason:'confirmation_missing'};
  if (!referee.first_radar_join_at || !claim.recorded_at) return {ok:false,reason:'timestamps_missing'};
  if (referee.was_radar_member_before_pilot || referee.previous_radar_membership) return {ok:false,reason:'existing_radar_reader'};
  if (new Date(claim.recorded_at).getTime()>new Date(referee.first_radar_join_at).getTime()) return {ok:false,reason:'claim_not_at_signup'};
  if (ledger.some(x=>x.referee_id===referee.id && x.status==='approved')) return {ok:false,reason:'duplicate_referee'};
  if (ledger.some(x=>x.referrer_id===referrer.id && ['approved','reward_sent'].includes(x.status))) return {ok:false,reason:'already_qualified'};
  return {ok:true,reason:'one_verified_referral',decision_key:`${referrer.id}:${referee.id}`};
}
