import { ReplayFrame, Route } from '../../types';

// Deterministic random
function seededRandom(seed: number) {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

export function generateHistoricalFrames(
  route: Route,
  windowStart: Date,
  durationMin: number,
  numBuses: number,
  seed: number
): ReplayFrame[] {
  const frames: ReplayFrame[] = [];
  const startTs = windowStart.getTime();
  const tickMs = 10000; // 10s per frame

  const totalFrames = (durationMin * 60 * 1000) / tickMs;

  // Initialize buses along the route with staggering
  let buses = Array.from({ length: numBuses }).map((_, i) => {
    // Initial progress spaced evenly
    const initialProgress = (i / numBuses) * route.coordinates.length;
    return {
      id: `MTC-H${100 + i}`,
      progress: initialProgress,
      baseSpeed: 15 + seededRandom(seed + i) * 10, // 15-25 km/h
    };
  });

  for (let f = 0; f < totalFrames; f++) {
    const ts = startTs + (f * tickMs);
    
    const frameBuses = buses.map((b, idx) => {
      // Add noise to speed
      const noise = (seededRandom(seed + f + idx) - 0.5) * 5; 
      const currentSpeed = b.baseSpeed + noise;
      
      // Advance progress (approximate index conversion)
      // speed km/h -> km/s -> index/s
      const distancePerTick = (currentSpeed / 3.6) * (tickMs / 1000) / 1000; // km per tick
      const indexPerTick = distancePerTick * 2; // Assuming 0.5km per index
      
      b.progress = (b.progress + indexPerTick) % route.coordinates.length;
      
      const coordIdx = Math.floor(b.progress);
      const [lat, lng] = route.coordinates[coordIdx] || route.coordinates[0];

      return {
        busId: b.id,
        lat,
        lng,
        speed: currentSpeed,
      };
    });

    frames.push({
      timestamp: ts,
      buses: frameBuses
    });
  }

  return frames;
}
