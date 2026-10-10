import { startPreferenceVerification } from '../../preference-verification.js';

export async function onRequestPost({request,env}) {
  return startPreferenceVerification(request,env);
}
