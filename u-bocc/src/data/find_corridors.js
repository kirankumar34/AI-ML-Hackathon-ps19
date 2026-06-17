const fs = require('fs');
const content = fs.readFileSync('c:/Projects/Hackathon/hack/u-bocc/src/data/routes.ts', 'utf8');

// Find Route 18 definition
const startIdx = content.indexOf('"routeNumber": "18"');
const nextIdx = content.indexOf('"routeNumber":', startIdx + 1);
const r18Chunk = nextIdx !== -1 ? content.slice(startIdx, nextIdx) : content.slice(startIdx);

const coordRegex = /\[\s*(-?\d+\.\d+),\s*(-?\d+\.\d+)\s*\]/g;
let match;
const pts = [];
while ((match = coordRegex.exec(r18Chunk)) !== null) {
  pts.push([parseFloat(match[1]), parseFloat(match[2])]); // [lng, lat]
}

console.log('Route 18 total waypoints:', pts.length);

// Find closest index to Broadway (13.0878, 80.2785)
// Find closest index to Guindy (13.0067, 80.2206)
// Find closest index to Tambaram (12.9230, 80.1171)

const findClosest = (lat, lng) => {
  let minDistance = Infinity;
  let closestIdx = -1;
  pts.forEach((p, idx) => {
    const d = Math.sqrt(Math.pow(p[1] - lat, 2) + Math.pow(p[0] - lng, 2));
    if (d < minDistance) {
      minDistance = d;
      closestIdx = idx;
    }
  });
  return { closestIdx, distance: minDistance };
};

console.log('Broadway closest:', findClosest(13.0878, 80.2785));
console.log('Guindy closest:', findClosest(13.0067, 80.2206));
console.log('Tambaram closest:', findClosest(12.9230, 80.1171));
