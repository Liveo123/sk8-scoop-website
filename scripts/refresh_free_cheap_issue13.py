from pathlib import Path

path = Path("free-cheap-guide/guide/index.html")
text = path.read_text(encoding="utf-8")

def replace_once(old, new, label):
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected once, found {count}")
    return text.replace(old, new, 1)

text = replace_once(
    "SK8 Scoop Free &amp; Cheap Guide — Fully Updated 12 September 2026",
    "SK8 Scoop Free &amp; Cheap Guide — Fully Updated 18 September 2026",
    "title",
)
text = replace_once(
    "<strong>Fully checked 12 September 2026.</strong> Prices, opening patterns, recurring sessions and dated-event information have been rechecked against current organiser and council pages. Always use the official link before a special journey, because schedules can still change.",
    "<strong>Fully checked 18 September 2026.</strong> Permanent listings remain the stable core; the disposable What’s On Now layer has been refreshed after Issue 13. Always use the official link before a special journey, because schedules and availability can still change.",
    "freshness note",
)
text = replace_once(
    "Gatley Carrs for the most nature; Seasons of Stories when younger children need a reason to keep walking.",
    "Heald Green North History Walk for local history; Gatley Carrs for the most nature; Seasons of Stories when younger children need a reason to keep walking.",
    "walks chooser",
)

walk_marker = '<p><a id="gatley-carrs-local-nature-reserve"></a></p>'
walk_entry = """<p><a id="heald-green-north-history-walk"></a></p>
<article class="guide-entry place-card"><h3 class="entry-title">HEALD GREEN NORTH HISTORY WALK</h3>
<div class="entry-price-row"><span class="entry-price-chip">FREE</span></div>
<p class="entry-narrative">A roughly four-mile, two-hour local-history route linking 22 stops, including Heald Green station, the old telephone exchange, former farms, pubs, Cheadle Royal, war memorials, churches, St Ann’s Hospice and the library.</p>
<div class="entry-facts-grid"><div class="entry-fact entry-fact-good"><span class="entry-fact-label">GOOD FOR</span><span class="entry-fact-value">adults, older children, local-history fans and a half-day walk close to home.</span></div><div class="entry-fact entry-fact-note"><span class="entry-fact-label">PRACTICAL</span><span class="entry-fact-value">use Heald Green Heritage’s route for navigation and follow current signed diversions. SK8 Scoop has not physically audited the full route for step-free, wheelchair or pushchair suitability.</span></div></div>
<div class="entry-actions"><a class="internal-link" href="/local-history/heald-green-north-history-walk/">Open the SK8 Scoop maps and 22-stop guide →</a></div>
<aside class="callout callout-nue"><div class="callout-visual"><svg aria-hidden="true" viewbox="0 0 64 64"><circle cx="13" cy="48" fill="currentColor" r="6"></circle><circle cx="51" cy="15" fill="currentColor" r="6"></circle><path d="M18 45c10-4 4-17 14-19s10 8 15-5" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="5"></path></svg></div><div class="callout-body"><span class="callout-label">NEXT USEFUL EXPERIENCE</span><strong class="nue-title">Want something much smaller?</strong><p>Try the One Stop Away challenge: one local stop, one walk back, three discoveries.</p><a class="nue-link" href="/outdoors/one-stop-away/">Open One Stop Away<span aria-hidden="true"> →</span></a></div></aside>
</article>"""
if text.count(walk_marker) != 1:
    raise SystemExit("walk insertion marker not unique")
text = text.replace(walk_marker, walk_entry + walk_marker, 1)

one_marker = '<p><a id="whats-on-now"></a></p>'
one_entry = """<h3 class="subsection-title" id="one-stop-away">One Stop Away — tiny local adventure</h3>
<article class="guide-entry place-card"><div class="entry-price-row"><span class="entry-price-chip">FARE ONLY / POSSIBLY £0</span></div><p class="entry-narrative">Ride one local bus or train stop, get off and walk back on public pavements and paths. Find one old thing, one useful thing and one thing you want to know more about.</p><div class="entry-facts-grid"><div class="entry-fact entry-fact-good"><span class="entry-fact-label">GOOD FOR</span><span class="entry-fact-value">a 30–60 minute mini outing and seeing a familiar patch differently.</span></div><div class="entry-fact entry-fact-note"><span class="entry-fact-label">SAFETY</span><span class="entry-fact-value">check the walk-back route first, use daylight and avoid private or uncertain paths.</span></div></div><div class="entry-actions"><a class="internal-link" href="/outdoors/one-stop-away/">Open the full One Stop Away field guide →</a></div></article>
"""
if text.count(one_marker) != 1:
    raise SystemExit("One Stop insertion marker not unique")
text = text.replace(one_marker, one_entry + one_marker, 1)

events = [
    ("SATURDAY 19 SEPTEMBER", "HATTING BITES, HERITAGE OPEN DAYS", "OUTSIDE SK8 · RAINY DAY", "FREE", "Short, fast-paced pieces of hatting history at Hat Works. Sessions are listed for 10am and 1.30pm and last about 20 minutes; booking is recommended.", "https://www.stockport.gov.uk/landing/hat-works-museum", "Check Hat Works details"),
    ("SATURDAY 19 SEPTEMBER", "CHEADLE CODERDOJO 60", "SK8 · FAMILY PICK · TEEN PICK", "FREE", "A hands-on under-18 coding session for beginners and young people who already code. Runs 11am–2pm at Moseley Hall, The Upper Room, 11 Wilmslow Road, Cheadle SK8 1DW. Bring a laptop or MacBook if possible.", "https://www.eventbrite.co.uk/e/cheadle-coderdojo-60-tickets-1999851420433", "Check current booking details"),
    ("SATURDAY 19 SEPTEMBER", "VISIT MY MOSQUE, CHEADLE MASJID", "SK8 · FREE LOCAL PICK", "FREE", "Cheadle Masjid opens its doors from 11am–3pm at 377 Wilmslow Road, Heald Green. The organiser is currently taking RSVPs.", "https://cheadlemasjid.org/events-activities/week/", "Check current details and RSVP"),
    ("SATURDAY 19 + SUNDAY 20 SEPTEMBER", "MANCHESTER MID-AUTUMN FESTIVAL", "OUTSIDE SK8 · WORTH THE TRIP · FAMILY PICK", "FREE ENTRY", "A two-day Chinatown Garden Event with food, performances, heritage activities and family-friendly things to do. Runs 12pm–8pm both days in Manchester Chinatown.", "https://www.moonchester.uk/", "See the current festival programme"),
    ("SATURDAY 19 SEPTEMBER", "MANCHESTER CAMERATA AT STOCKROOM", "OUTSIDE SK8 · JUST FOR FUN · FAMILY PICK", "FREE", "Manchester Camerata brings a free adventure-inspired performance to Stockroom as part of the Here We Are programme.", "https://manchestercamerata.co.uk/performances/here-we-are-stockroom-x-manchester-camerata/", "Check current details"),
    ("SUNDAY 20 SEPTEMBER", "SHARING A SHELL WITH MANCHESTER CAMERATA", "OUTSIDE SK8 · FAMILY PICK · WORTH THE TRIP", "FREE", "A family-friendly live performance of Julia Donaldson’s Sharing a Shell at Manchester Museum, with storytelling and a wind quintet. Current programme material also lists free shell-handling and rock-pool puppet making.", "https://www.museum.manchester.ac.uk/event/sharing-a-shell-with-manchester-camerata", "Check Manchester Museum details"),
    ("SUNDAY 20 SEPTEMBER", "AVRO HERITAGE MUSEUM", "OUTSIDE SK8 · WORTH THE TRIP · HERITAGE PICK", "FREE", "Free Heritage Open Days admission from 10am–4pm at Woodford Aerodrome. The listing says pre-booking is not required.", "https://www.heritageopendays.org.uk/submission-event/avro-heritage-museum-1.html", "Check current Heritage Open Days details"),
    ("FRIDAY 25 SEPTEMBER", "FRIDAY CLUB DISCO", "OUTSIDE SK8 · ACCESS INFO · JUST FOR FUN", "£6", "An evening disco for adults with disabilities. Carers, parents and support workers attend free where currently confirmed.", "https://www.stockport.gov.uk/events", "View current Stockport Council details"),
    ("SATURDAY 26 SEPTEMBER", "LIFESAVERS BASIC LIFE-SUPPORT COURSE, HEALD GREEN", "SK8 · USEFUL FREE PICK", "FREE · CURRENTLY FULL", "Cheadle Masjid’s course covers CPR, the recovery position and choking response for ages 10+. The organiser currently shows the course as full, so use the link only to check for cancellations or reopened places.", "https://cheadlemasjid.org/events-activities/lifesavers-course-3/", "Check current status"),
    ("SATURDAY 26 SEPTEMBER", "ARC SATURDAY ART CLUB", "OUTSIDE SK8 · FAMILY PICK", "SUGGESTED £3 DONATION", "Drop in for family-friendly arts and crafts at Hat Works from 11am–3pm. The £3 is a suggested donation per artist, not compulsory admission.", "https://arc-centre.org/saturday-art-clubs", "View Arc details"),
    ("SATURDAY 3 OCTOBER", "STOCKROOM SOUNDSYSTEM: FITTINGS, DRIVERS &amp; AMPLIFIERS", "OUTSIDE SK8 · TEEN PICK · JUST FOR FUN", "FREE", "The next Stockroom Soundsystem Saturday moves into the practical build. The project is aimed at ages 16–25; check the current page because some sessions have limited space.", "https://www.stockrm.org/Soundsystem", "Check the current Soundsystem programme"),
]

def event_card(item):
    date, title, badges, price, narrative, url, label = item
    badge_html = " ".join(f'<span class="badge">{b}</span>' for b in badges.split(" · "))
    return f'''<article class="guide-entry event-card"><h4 class="entry-title event-entry-title"><span class="event-date-kicker">{date}</span><span class="event-title-text">{title}</span></h4><div class="entry-badge-row">{badge_html}</div><div class="entry-price-row"><span class="entry-price-chip">{price}</span></div><p class="entry-narrative">{narrative}</p><div class="entry-actions"><a class="official-link" href="{url}" rel="noopener" target="_blank">{label}</a></div></article>'''

start_marker = '<section class="guide-section guide-section-refined"><h2 class="section-title">What’s On Now</h2>'
end_marker = '</section><footer class="experience-footer">'
start = text.find(start_marker)
end = text.find(end_marker, start)
if start < 0 or end < 0:
    raise SystemExit("What’s On section boundaries not found")

new_section = f'''<section class="guide-section guide-section-refined"><h2 class="section-title">What’s On Now</h2>
<p><a class="back-link internal-link" href="#contents">↑ Back to contents</a><br/>Current window: 19 September to 12 October 2026</p>
<p><strong>REFRESHED 18 SEPTEMBER 2026:</strong> expired entries have been removed and Issue 13’s strongest free/cheap dates have been folded into the current layer.<br/><strong>THIS SECTION EXPIRES ON PURPOSE:</strong> permanent places stay above; dated events get refreshed here. Always check the official page before setting off.</p>
{"".join(event_card(e) for e in events)}
<a id="how-guide-works"></a>
</section>'''
text = text[:start] + new_section + text[end + len("</section>"):]

text = replace_once(
    '<span class="module-kicker">KEEP GOING</span><h2>Useful now, useful next week</h2><p>This is a permanent guide, while <a href="#whats-on-now">What’s On Now</a> handles dated events. For the wider SK8 Scoop picture, head to the main site.</p>',
    '<span class="module-kicker">KEEP GOING</span><h2>Useful now, useful next week</h2><p>This is a permanent guide, while <a href="#whats-on-now">What’s On Now</a> handles dated events. Continue with the <a href="/local-history/heald-green-north-history-walk/">Heald Green History Walk</a>, the <a href="/outdoors/one-stop-away/">One Stop Away challenge</a>, or the filterable <a href="/whats-on/">SK8 Scoop What’s On</a>.</p>',
    "footer",
)

checks = {
    "title": "Fully Updated 18 September 2026" in text,
    "freshness": "Fully checked 18 September 2026" in text,
    "heald_green_walk": 'id="heald-green-north-history-walk"' in text,
    "one_stop": 'id="one-stop-away"' in text,
    "window": "Current window: 19 September to 12 October 2026" in text,
    "expired_removed": "PAPER PULP CLAY WORKSHOP" not in text,
    "coderdojo": "CHEADLE CODERDOJO 60" in text,
    "lifesavers_full": "FREE · CURRENTLY FULL" in text,
    "whatson_once": text.count('<h2 class="section-title">What’s On Now</h2>') == 1,
}
failed = [key for key, value in checks.items() if not value]
if failed:
    raise SystemExit("Guide validation failed: " + ", ".join(failed))

path.write_text(text, encoding="utf-8")
print("Issue 13 guide refresh complete:", len(text), checks)
