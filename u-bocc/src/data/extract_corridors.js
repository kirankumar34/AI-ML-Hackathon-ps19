const fs = require('fs');
const content = fs.readFileSync('c:/Projects/Hackathon/hack/u-bocc/src/data/routes.ts', 'utf8');

const startIdx = content.indexOf('"routeNumber": "18"');
const nextIdx = content.indexOf('"routeNumber":', startIdx + 1);
const r18Chunk = nextIdx !== -1 ? content.slice(startIdx, nextIdx) : content.slice(startIdx);

const coordRegex = /\[\s*(-?\d+\.\d+),\s*(-?\d+\.\d+)\s*\]/g;
let match;
const pts = [];
while ((match = coordRegex.exec(r18Chunk)) !== null) {
  pts.push([parseFloat(match[1]), parseFloat(match[2])]); // [lng, lat]
}

const annaSalai = pts.slice(0, 589).map(p => [p[1], p[0]]); // [lat, lng]
const gstRoad = pts.slice(588, 866).map(p => [p[1], p[0]]); // [lat, lng]

fs.writeFileSync('anna_salai.json', JSON.stringify(annaSalai, null, 2));
fs.writeFileSync('gst_road.json', JSON.stringify(gstRoad, null, 2));

console.log('Anna Salai points:', annaSalai.length);
console.log('GST Road points:', gstRoad.length);
