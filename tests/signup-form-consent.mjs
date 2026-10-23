import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const site=readFileSync(new URL('../assets/site.js',import.meta.url),'utf8');
const begin=site.indexOf('(function pageEvents(){');
const end=site.indexOf('\n})();',begin);
assert.ok(begin>=0&&end>begin,'Signup tracking block exists');
const block=site.slice(begin,end+6);

function fixture(consent=null,withObserver=true){
  const events=[],listeners=new Map();
  const form={dataset:{formPosition:'guide-top'},addEventListener(){}};
  let observer;
  class FakeObserver{
    constructor(callback){this.callback=callback;this.targets=new Set();observer=this;}
    observe(target){this.targets.add(target);}
    unobserve(target){this.targets.delete(target);}
    emit(ratio){if(this.targets.has(form))this.callback([{target:form,isIntersecting:ratio>0,intersectionRatio:ratio}]);}
  }
  const doc={querySelectorAll:s=>s==='[data-signup-form]'?[form]:[],addEventListener:(n,cb)=>listeners.set(n,cb)};
  const win=consent?.analytics?{gtag(){}}:{};
  if(withObserver)win.IntersectionObserver=FakeObserver;
  const ctx={document:doc,window:win,sk8Consent:consent,sk8TrackCurrentPage(){},sk8Track:(name,params)=>events.push({name,params}),...(withObserver?{IntersectionObserver:FakeObserver}:{})};
  runInNewContext(block,ctx);
  return {events,observer,grant(){ctx.sk8Consent={analytics:true};win.gtag=()=>{};listeners.get('sk8:analytics-consent-enabled')();},again(){listeners.get('sk8:analytics-consent-enabled')();}};
}
const first=fixture();
first.observer.emit(.8);
assert.equal(first.events.length,0,'Pre-consent impressions are not recorded');
first.grant();first.observer.emit(.3);
assert.equal(first.events.length,0,'Less than 45% visible is not a view');
first.observer.emit(.8);
assert.deepEqual(first.events.map(e=>e.name),['signup_form_view']);
assert.equal(first.events[0].params.form_position,'guide-top');
first.again();first.observer.emit(.8);
assert.equal(first.events.length,1,'Reconsent does not duplicate the view');
const returning=fixture({analytics:true});
returning.observer.emit(.7);
assert.equal(returning.events.length,1,'Already-consented visitor is tracked once');
returning.again();returning.observer.emit(.7);
assert.equal(returning.events.length,1,'No duplicate tracking on recheck');
const rejected=fixture({analytics:false});
rejected.observer.emit(.8);
assert.equal(rejected.events.length,0,'Rejected consent remains private');
const fallback=fixture(null,false);
assert.equal(fallback.events.length,0,'No-observer fallback does not bypass consent');
fallback.grant();fallback.again();
assert.equal(fallback.events.length,1,'No-observer fallback is recorded exactly once after consent');

assert.match(site,/if\(!previousAnalytics&&sk8Consent\.analytics\)document\.dispatchEvent\(new Event\('sk8:analytics-consent-enabled'\)\)/,'Consent save signals the observer');
console.log('PASS: signup form view consent timing, threshold, dedupe, fallback and consent dispatch');
