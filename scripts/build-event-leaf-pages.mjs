import fs from 'node:fs';
import path from 'node:path';
// Deterministic source-first generator for the two checked SK8 event leaf pilot pages.
// Run: node scripts/build-event-leaf-pages.mjs --write
// CI:  node scripts/build-event-leaf-pages.mjs --check
function htmlEsc(value) {
  const values={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"};
  return String(value??"").replace(/[&<>"']/g,ch=>values[ch]);
}

function safeJson(value) {return JSON.stringify(value).replace(/</g,"\\u003c").replace(/>/g,"\\u003e").replace(/&/g,"\\u0026");}

function route(event) {return "/whats-on/events/"+event.seo.slug+"/";}

function prettyDate(date) {return new Intl.DateTimeFormat("en-GB",{weekday:"long",day:"numeric",month:"long",year:"numeric",timeZone:"UTC"}).format(new Date(date+"T12:00:00Z"));}

function ukOffset(date,time) {
 const parts=new Intl.DateTimeFormat("en-GB",{timeZone:"Europe/London",timeZoneName:"shortOffset"}).formatToParts(new Date(date+"T"+time+":00Z"));
 const name=parts.find(p=>p.type==="timeZoneName")?.value;
 if(name==="GMT" || name==="GMT+0")return "+00:00";
 if(name==="GMT+1")return "+01:00";
 throw Error("Unrecognised UK event offset: "+name);
}

function validate(event) {
 if(event.status!=="verified"||!event.seo?.slug||!/^[a-z0-9-]+$/.test(event.seo.slug))throw Error("SEO event is unverified or has unsafe slug");
 if(!/^\d{4}-\d{2}-\d{2}$/.test(event.date)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(event.time)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(event.end_time))throw Error("SEO event requires confirmed single-day start/end times");
 if(event.end_time<=event.time || event.date_mode==="daily" || event.date_mode==="specific_dates" || event.end_date)throw Error("SEO pilot supports real single-day events only");
 if(!event.seo.venue_name||!event.seo.address||!event.seo.address.streetAddress||!event.seo.address.addressLocality||!/^SK\d\s?\d[A-Z]{2}$/i.test(event.seo.address.postalCode)||event.seo.address.addressCountry!=="GB")throw Error("Missing independently checked postal address");
 if(!event.seo.organizer?.name||!/^https:\/\//.test(event.seo.organizer.url)||!/^https:\/\//.test(event.booking_url||event.source_url))throw Error("Unverified organizer or real booking source");
 if(event.seo.image_basis!=="TEXT-ONLY")throw Error("No photograph may be embedded without registered rights");
 const raw=event.seo.slug;
 if(raw.includes("..")||raw.includes("/"))throw Error("Invalid canonical route");
 return true;
}

function renderPage(event) {
 validate(event);
 const canonical="https://www.sk8scoop.com"+route(event);
 const start=event.date+"T"+event.time+":00"+ukOffset(event.date,event.time);
 const end=event.date+"T"+event.end_time+":00"+ukOffset(event.date,event.end_time);
 const address=event.seo.address;
 const organizer=event.seo.organizer;
 const siteName="SK8 Scoop";
 const source=event.source_url;
 const official=event.booking_url||source;
 const when=prettyDate(event.date)+", "+event.time+"–"+event.end_time;
 const mapWords=event.seo.venue_name+", "+address.streetAddress+", "+address.addressLocality+", "+address.postalCode;
 const meta=event.seo.meta_description || (event.description.length>155?event.description.slice(0,154).replace(/\s+\S*$/,"").trim()+"…":event.description);
 const schema={
   "@context":"https://schema.org","@type":"Event",
   name:event.title,url:canonical,description:event.description,
   startDate:start,endDate:end,eventStatus:"https://schema.org/EventScheduled",
   eventAttendanceMode:"https://schema.org/OfflineEventAttendanceMode",
   location:{"@type":"Place",name:event.seo.venue_name,address:{"@type":"PostalAddress",
     streetAddress:address.streetAddress,addressLocality:address.addressLocality,
     postalCode:address.postalCode,addressRegion:"Greater Manchester",addressCountry:"GB"}},
   organizer:{"@type":"Organization",name:organizer.name,url:organizer.url},
   ...(event.cost_type==="free"?{offers:{"@type":"Offer",price:0,priceCurrency:"GBP",url:official}}:{})
 };
 const title=event.title+" | "+prettyDate(event.date).replace(/^[A-Za-z]+,\s*/,"")+" | SK8 Scoop";
 const sourceDate=prettyDate(event.checked).replace(/^[A-Za-z]+,\s*/,"");
 const words=event.seo.access||"Check current details with the organiser before travelling.";
 const eventJson={id:event.id,title:event.title,date:event.date,time:event.time,end_time:event.end_time,area:event.area,venue:event.venue,cost:event.cost,category:event.category,description:event.description,booking_url:event.booking_url,source_url:event.source_url,checked:event.checked};
 const eventDateLiteral=safeJson(event.date);
 return `<!doctype html>
<html lang="en-GB">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${htmlEsc(title)}</title>
  <meta name="description" content="${htmlEsc(meta)}">
  <link rel="canonical" href="${htmlEsc(canonical)}">
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="${siteName}">
  <meta property="og:title" content="${htmlEsc(event.title)} | SK8 Scoop">
  <meta property="og:description" content="${htmlEsc(meta)}">
  <meta property="og:url" content="${htmlEsc(canonical)}">
  <meta name="twitter:card" content="summary">
  <meta name="theme-color" content="#0f6470">
  <link rel="stylesheet" href="/assets/styles.css">
  <link rel="stylesheet" href="/assets/reader-pages.css">
  <link rel="stylesheet" href="/assets/reader-page-polish.css">
  <link rel="stylesheet" href="/assets/my-sk8.css">
  <link rel="stylesheet" href="/assets/event-leaf.css">
  <link rel="icon" href="/favicon.ico" sizes="any">
  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
  <script type="application/ld+json" id="sk8-single-event-schema">${safeJson(schema)}</script>
</head>
<body class="reader-page event-leaf-page" data-page="event-detail" data-sk8-event-id="${htmlEsc(event.id)}">
<a class="skip-link" href="#main-content">Skip to content</a>
<header class="site-header reader-header">
  <div class="wrap header-row">
    <a class="brand" href="/" aria-label="SK8 Scoop home"><img src="/assets/sk8-scoop-logo.webp" alt="SK8 Scoop"></a>
    <button class="menu-btn" type="button" aria-expanded="false" aria-controls="main-nav"><span class="menu-icon" aria-hidden="true"></span><span>Menu</span></button>
    <nav class="nav" id="main-nav" aria-label="Main navigation"></nav>
  </div>
</header>
<main id="main-content">
  <div class="wrap event-leaf-container">
    <nav class="event-leaf-crumb" aria-label="Breadcrumb">
      <a href="/">Home</a><span aria-hidden="true">/</span>
      <a href="/whats-on/">What’s On</a><span aria-hidden="true">/</span><span aria-current="page">${htmlEsc(event.title)}</span>
    </nav>
    <article class="event-leaf-article">
      <header class="event-leaf-heading">
        <p class="event-leaf-eyebrow">Checked local event · ${htmlEsc(event.area)}</p>
        <h1>${htmlEsc(event.title)}</h1>
        <p class="event-leaf-opening">${htmlEsc(event.description)}</p>
      </header>
      <div class="event-leaf-grid">
        <div class="event-leaf-primary">
          <section class="event-leaf-facts" aria-labelledby="event-leaf-facts-heading">
            <h2 id="event-leaf-facts-heading">At a glance</h2>
            <dl>
              <div><dt>When</dt><dd><time datetime="${htmlEsc(start)}">${htmlEsc(when)}</time></dd></div>
              <div><dt>Where</dt><dd>${htmlEsc(event.seo.venue_name)}<span class="event-leaf-address">${htmlEsc(address.streetAddress)}, ${htmlEsc(address.addressLocality)} ${htmlEsc(address.postalCode)}</span></dd></div>
              <div><dt>Cost and booking</dt><dd>${htmlEsc(event.cost)}</dd></div>
            </dl>
          </section>
          <section class="event-leaf-before" aria-labelledby="event-leaf-before-heading">
            <h2 id="event-leaf-before-heading">Before you go</h2>
            <p>${htmlEsc(words)}</p>
            <p class="event-leaf-checked" data-event-status role="status">Source details checked ${htmlEsc(sourceDate)}. Dates, prices and availability can change, so confirm with the organiser.</p>
            <a class="event-leaf-primary-link" data-event-primary href="${htmlEsc(official)}" rel="noopener" data-track-event="seo_event_official_check" data-link-location="event-detail">Check details with the organiser →</a>
            <p class="event-leaf-source">Source: <a href="${htmlEsc(source)}" rel="noopener">${htmlEsc(organizer.name)} / official listing</a>. SK8 Scoop is an independent local publication, not the event organiser.</p>
          </section>
        </div>
        <aside class="event-leaf-actions" aria-label="Plan your visit">
          <h2>Save and plan</h2>
          <div class="my-sk8-card-actions" data-sk8-event-actions="${htmlEsc(event.id)}"></div>
          <p class="event-leaf-action-note">Saved ideas stay in My SK8 on this browser. No account is required to browse this event.</p>
        </aside>
      </div>
    </article>
    <nav class="event-leaf-next" aria-label="More useful local ideas">
      <a href="/whats-on/?area=${encodeURIComponent(event.area)}" data-nue-link data-nue-type="area-events">See other checked events in ${htmlEsc(event.area)} →</a>
      <a href="/whats-on/" data-nue-link data-nue-type="all-events">Browse all upcoming events →</a>
    </nav>
  </div>
</main>
<footer class="site-footer">
  <div class="wrap footer-grid footer-grid-wide">
    <div class="footer-brand-block"><img class="footer-logo" src="/assets/sk8-scoop-logo.webp" alt="SK8 Scoop"><p>The useful, the local and the mildly nosy.</p><p class="footer-small">A free Friday newsletter for Cheadle, Cheadle Hulme, Gatley, Heald Green and nearby SK8.</p></div>
    <div class="footer-links"><strong>Read</strong><a href="/latest">Latest Scoop</a><a href="/archive.html">Archive</a><a href="/guides/">Guides</a></div>
    <div class="footer-links"><strong>Take part</strong><a href="/start/">Where to start</a><a href="/submit/">Submit</a><a href="/contact/">Contact</a></div>
    <div class="footer-links"><strong>Trust</strong><a href="/editorial-policy.html">Editorial policy</a><a href="/privacy.html">Privacy</a><a href="/terms.html">Terms</a><span>© <span data-year></span> SK8 Scoop</span></div>
  </div>
</footer>
<script>window.SK8_EVENT_DATA = [${safeJson(eventJson)}];</script>
<script src="/assets/config.js"></script>
<script src="/assets/site.js"></script>
<script src="/assets/my-sk8.js"></script>
<script>
(() => {
  const date=${eventDateLiteral};
  const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
  const pick=Object.fromEntries(parts.map(p=>[p.type,p.value]));
  const today=pick.year+'-'+pick.month+'-'+pick.day;
  if(today>date){
    const notice=document.querySelector('[data-event-status]');
    if(notice)notice.textContent='This dated event has passed. Please check the organiser for any new dates rather than travelling based on this listing.';
    const action=document.querySelector('[data-event-primary]');
    if(action)action.textContent='Check organiser for future dates →';
    const controls=document.querySelector('[data-sk8-event-actions]');
    if(controls)controls.hidden=true;
    document.querySelector('#sk8-single-event-schema')?.remove();
    const robots=document.createElement('meta');
    robots.name='robots';
    robots.content='noindex,follow';
    document.head.appendChild(robots);
  }
})();
</script>
</body>
</html>
`;
}
const all=JSON.parse(fs.readFileSync('data/events.json','utf8'));
const selected=all.filter(e=>e.seo);
const check=process.argv.includes('--check');
const write=process.argv.includes('--write');
if(check===write)throw Error('Pass exactly one of --check or --write');
if(!selected.length)throw Error('No checked event leaf pages configured');
const todayParts=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
const fields=Object.fromEntries(todayParts.map(part=>[part.type,part.value]));
const today=fields.year+'-'+fields.month+'-'+fields.day;
const seen=new Set();
for(const e of selected) {
 validate(e);
 const routePath=route(e);
 if(seen.has(routePath))throw Error('Duplicate event page slug: '+routePath);
 seen.add(routePath);
 if(check && e.date<today)throw Error('Expired event leaf still in approved source: '+e.id+'. Retire or replace before release.');
 const rel=routePath.slice(1)+'index.html';
 const expected=renderPage(e);
 if(write){fs.mkdirSync(path.dirname(rel),{recursive:true});fs.writeFileSync(rel,expected,'utf8');}
 else if(!fs.existsSync(rel)||fs.readFileSync(rel,'utf8')!==expected)throw Error('Event HTML has drifted from verified data: '+rel+'. Run generator and review changed facts.');
 console.log((write?'WROTE ':'PASS ')+rel+' → '+e.date+' / '+e.seo.venue_name);
}
