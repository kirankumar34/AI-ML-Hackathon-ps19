const fs = require('fs');
const content = fs.readFileSync('c:/Projects/Hackathon/hack/u-bocc/src/data/routes.ts', 'utf8');

const startIdx = content.indexOf('"routeNumber": "21G"');
const nextIdx = content.indexOf('"routeNumber":', startIdx + 1);
const chunk = nextIdx !== -1 ? content.slice(startIdx, nextIdx) : content.slice(startIdx);

console.log(chunk.slice(0, 500));
const stopsStart = chunk.indexOf('"stops":');
console.log(chunk.slice(stopsStart, stopsStart + 1000));
