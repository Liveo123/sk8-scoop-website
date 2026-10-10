import { renderPreferenceConfirmation, finishPreferenceVerification } from '../../preference-verification.js';

export async function onRequestGet({request}) {
  return renderPreferenceConfirmation(request);
}
export async function onRequestPost({request,env}) {
  return finishPreferenceVerification(request,env);
}
