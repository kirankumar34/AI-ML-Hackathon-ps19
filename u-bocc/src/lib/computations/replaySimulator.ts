import { Counterfactual, ReplayFrame, Route, SimulationResult, HeadwayTimeSeries } from '../../types';

export function runSimulation(
  frames: ReplayFrame[],
  counterfactuals: Counterfactual[],
  route: Route
): SimulationResult {
  // Deep copy frames to avoid mutating original history
  const projectedFrames: ReplayFrame[] = JSON.parse(JSON.stringify(frames));

  // Process counterfactuals
  for (const cf of counterfactuals) {
    if (cf.type === 'add_bus') {
      const activateTime = new Date(`1970-01-01T${cf.activateAt}:00`).getTime() % (24 * 3600 * 1000);
      
      // For simplicity in this mock, we inject it halfway through the frames if activateAt is hard to map
      const startIndex = Math.floor(projectedFrames.length / 2);
      
      let progress = 0; // Starts at beginning of route
      
      for (let i = startIndex; i < projectedFrames.length; i++) {
        const coordIdx = Math.floor(progress);
        const [lat, lng] = route.coordinates[coordIdx] || route.coordinates[0];
        
        projectedFrames[i].buses.push({
          busId: cf.busId,
          lat,
          lng,
          speed: 20
        });

        // advance progress
        progress = Math.min(progress + 0.1, route.coordinates.length - 1);
      }
    }
  }

  // Calculate headways
  // Mock logic to show the charts. In a real system, we'd compute headways at key stops over time.
  const realHeadways: HeadwayTimeSeries[] = [];
  const projectedHeadways: HeadwayTimeSeries[] = [];
  
  const mockStop = "Central Station";

  frames.forEach((frame, idx) => {
    // Generate some fluctuating data
    const base = 12 + Math.sin(idx / 10) * 5; 
    realHeadways.push({
      timestamp: frame.timestamp,
      stopId: mockStop,
      headwayMin: Math.max(2, base)
    });

    if (idx < frames.length / 2) {
      projectedHeadways.push({
        timestamp: frame.timestamp,
        stopId: mockStop,
        headwayMin: Math.max(2, base)
      });
    } else {
      // After intervention, headway decreases
      projectedHeadways.push({
        timestamp: frame.timestamp,
        stopId: mockStop,
        headwayMin: Math.max(2, base * 0.6)
      });
    }
  });

  return {
    realHeadways,
    projectedHeadways,
    improvementPct: 35,
    peakGapReduction: 8
  };
}
