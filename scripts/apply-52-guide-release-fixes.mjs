import fs from 'node:fs';
import assert from 'node:assert/strict';

const path='52-adventures/guide/index.html';
let html=fs.readFileSync(path,'utf8');
const fixes=[
 ["7:'Stockport Market Hall'","7:'Stockport Market Place, Stockport'",1],
 ["10:'Vernon Park Stockport'","10:'Avro Heritage Museum, Woodford, Stockport'",1],
 ["11:'Marple Locks'","11:'Runway Visitor Park, Sunbank Lane, Altrincham WA15 8XQ'",1],
 ["21:'Jodrell Bank'","21:'Little Moreton Hall, Congleton'",1],
 ["22:'Anderton Boat Lift'","22:'Jodrell Bank Discovery Centre, Cheshire'",1],
 ["37:'People’s History Museum Manchester'","37:'John Rylands Library, Manchester'",1],
 ["Park entry free on foot/public transport; car parking charged. Concorde Classic tour currently £18 per person","Free park entry on foot/public transport; casual car parking charged. Concorde Classic tour £18 per person, currently including free parking.",2],
 ["If you drive, parking is the hidden cost, so compare that with arriving by public transport.","Parking is normally charged for casual visits, but the currently advertised Concorde Classic tour includes free parking. Check the booking conditions before travelling.",1],
 ["--chapter-accent:#e56e12","--chapter-accent:#a84200",2],
 ["--muted:#64706d","--muted:#55605c",1]
];
for(const [oldText,newText,expected] of fixes){
 const count=html.split(oldText).length-1;
 assert.equal(count,expected,'Expected '+expected+' occurrences of '+oldText+'; found '+count);
 html=html.split(oldText).join(newText);
}
const css=[
 '/* Release-critique contrast corrections. Brand orange remains decorative; interactive colours meet AA. */',
 ':root{--orange-ink:#963b00;--orange-action:#a84200}',
 '.hero-stamp,.finder-controls .surprise,.save-inline.saved{background:var(--orange-action);border-color:var(--orange-action);color:#fff}',
 '.chapter-popover span,.hero h1 span,.section-index,.chapter-rail button span,.story-kicker b,.dialog-no,.passport-row button span{color:var(--orange-ink)}',
 '.pick-type-art span{color:#ffb46c}'
].join('\n');
assert.equal(html.split('</style>').length-1,7,'Unexpected style tag count');
assert(!html.includes('Release-critique contrast corrections'),'Release rules already present');
html=html.replace('</style>',css+'</style>');
const data=JSON.parse(html.match(/<script id="adventure-data" type="application\/json">([\s\S]*?)<\/script>/)[1]);
assert.equal(Object.keys(data).length,52,'Guide must retain 52 entries');
for(const n of [7,10,11,21,22,37])assert(data[n]?.title,'Required adventure data missing '+n);
fs.writeFileSync(path,html);
console.log('Applied 52 Adventures release fixes: 6 map destinations, Concorde parking, and AA contrast. All 52 data records preserved.');
