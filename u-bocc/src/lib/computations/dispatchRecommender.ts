import { Bus, Route, DispatchRecommendation, ReasonItem } from '../../types';

export function generateRecommendations(activeBuses: Bus[], routes: Route[]): DispatchRecommendation[] {
  const recommendations: DispatchRecommendation[] = [];
  const now = Date.now();

  // Simple Predictive Model (Linear Extrapolation)
  for (const route of routes) {
    const routeBuses = activeBuses.filter(b => b.route === route.busNo);
    
    // Sort buses by progress
    routeBuses.sort((a, b) => {
      return (b.waypointIndex + b.waypointProgress) - (a.waypointIndex + a.waypointProgress);
    });

    // Check for large gaps that might form
    for (let i = 0; i < routeBuses.length - 1; i++) {
      const b1 = routeBuses[i];
      const b2 = routeBuses[i + 1];

      // Estimate current gap in index units
      const gapIndex = (b1.waypointIndex + b1.waypointProgress) - (b2.waypointIndex + b2.waypointProgress);
      
      // Assume speed of 20km/h (approx 1 index / min)
      const gapMin = gapIndex; 

      let scheduledHeadway = 15;
      if (route.frequency) {
        const match = route.frequency.match(/every\s+(\d+)/i);
        if (match && match[1]) scheduledHeadway = parseInt(match[1], 10);
      }

      // If gap is projecting to be much larger than scheduled headway
      if (gapMin > scheduledHeadway * 1.8) {
        // We have a large gap. Generate a dispatch recommendation.
        // Identify a depot near the gap. Mocking depot logic.
        const reasons: ReasonItem[] = [
          { type: 'gap_prediction', description: `${Math.round(gapMin)}-min gap predicted between #${b1.id} and #${b2.id}`, weight: 0.6 },
        ];
        
        // Add artificial delay or demand spike reason if applicable
        if (b2.speed < 10) {
          reasons.push({ type: 'delay_propagation', description: `Bus #${b2.id} is moving slowly`, weight: 0.2 });
        } else {
          reasons.push({ type: 'demand_spike', description: `Historical demand peak expected shortly`, weight: 0.2 });
        }

        const confidence = reasons.reduce((acc, r) => acc + r.weight, 0);

        if (confidence >= 0.6) {
          recommendations.push({
            id: `rec-${route.busNo}-${now}-${i}`,
            priority: gapMin > scheduledHeadway * 2.5 ? 'critical' : 'high',
            busId: `MTC-${Math.floor(Math.random() * 100) + 100}`, // Synthetic idle bus
            routeId: route.busNo,
            action: 'dispatch',
            dispatchFrom: 'Nearest Depot',
            timeToAct: 300, // 5 minutes
            predictedGapMin: Math.round(gapMin),
            expectedHeadwayAfter: scheduledHeadway,
            reasons,
            confidence: Math.min(0.99, confidence),
            createdAt: now,
          });
          
          break; // Max 1 recommendation per route per cycle for simplicity
        }
      }
    }
  }

  return recommendations;
}
