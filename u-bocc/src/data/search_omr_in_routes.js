const fs = require('fs');
const content = fs.readFileSync('c:/Projects/Hackathon/hack/u-bocc/src/data/routes.ts', 'utf8');

// Parse route definitions
const routeRegex = /"routeNumber":\s*"([^"]+)"/g;
let match;
const routes = [];
while ((match = routeRegex.exec(content)) !== null) {
  const routeNum = match[1];
  const startIndex = match.index;
  const nextMatch = content.indexOf('"routeNumber":', startIndex + 1);
  const chunk = nextMatch !== -1 ? content.slice(startIndex, nextIdx = nextMatch) : content.slice(startIndex);
  
  // Extract coordinate pairs: [lng, lat]
  const coordRegex = /\[\s*(-?\d+\.\d+),\s*(-?\d+\.\d+)\s*\]/g;
  let coordMatch;
  const pts = [];
  while ((coordMatch = coordRegex.exec(chunk)) !== null) {
    pts.push([parseFloat(coordMatch[1]), parseFloat(coordMatch[2])]);
  }
  
  // Check if any point is close to Sholinganallur (12.9010, 80.2279)
  let closeToOMR = false;
  pts.forEach(p => {
    // p[0] is lng, p[1] is lat
    const d = Math.sqrt(Math.pow(p[1] - 12.9010, 2) + Math.pow(p[0] - 80.2279, 2));
    if (d < 0.01) {
      closeToOMR = true;
    }
  });
  
  routes.push({ routeNum, closeToOMR, points: pts.length });
}

console.log('OMR check results:', routes);
