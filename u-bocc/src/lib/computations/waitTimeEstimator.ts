import { Bus, Route, StopWaitEstimate } from '../../types';
import { getHistoricalDemand, getDemandLevel } from '../data/historicalDemand';

export function computeWaitTimes(activeBuses: Bus[], routes: Route[]): StopWaitEstimate[] {
  const estimates: StopWaitEstimate[] = [];
  const currentHour = new Date().getHours();

  // For this hackathon version, we iterate through routes to find next buses for stops.
  for (const route of routes) {
    const routeBuses = activeBuses.filter(b => b.route === route.busNo);
    
    // Sort buses by progress
    routeBuses.sort((a, b) => {
      return (a.waypointIndex + a.waypointProgress) - (b.waypointIndex + b.waypointProgress);
    });

    // In a real system, we'd map waypoints to actual stops.
    // Here we will mock stops based on route coordinates to demonstrate the UI.
    const stopsOnRoute = route.stops || [];
    
    stopsOnRoute.forEach((stopName, index) => {
      // Find the next bus that hasn't passed this stop index yet.
      // We assume waypointIndex correlates roughly with stops for simplicity.
      // In a real app, distance to stop is calculated strictly using lat/lng.
      const stopIndexApproximation = (index / stopsOnRoute.length) * route.coordinates.length;
      
      const nextBus = routeBuses.find(b => (b.waypointIndex + b.waypointProgress) < stopIndexApproximation);
      
      if (nextBus) {
        // Calculate ETA
        const distanceIndex = Math.max(0, stopIndexApproximation - (nextBus.waypointIndex + nextBus.waypointProgress));
        const speed = nextBus.speed || 20; // fallback speed
        const timeUntilNextBusMin = (distanceIndex * 0.5) / speed * 60; // 0.5km per index approx
        
        const stopIdStr = `${route.busNo}-${stopName.replace(/\s+/g, '-')}`;
        const demand = getHistoricalDemand(stopIdStr, currentHour);
        
        // 3 seconds per boarding passenger approx
        const dwellTimeMin = (demand.avgBoardingPax * 3) / 60;
        
        // Estimated Wait Time = Travel Time + Dwell Time at upstream stops
        // For simplicity, we add a fraction of dwell time based on distance.
        const estimatedWaitMin = timeUntilNextBusMin + (dwellTimeMin * 0.5);

        // Find stop coordinates (mocking from route path)
        const coordIdx = Math.floor(Math.min(stopIndexApproximation, route.coordinates.length - 1));
        const [lat, lng] = route.coordinates[coordIdx] || [0, 0];

        estimates.push({
          stopId: stopIdStr,
          stopName: stopName,
          routeId: route.busNo,
          lat,
          lng,
          nextBusId: nextBus.id,
          nextBusEtaMin: parseFloat(timeUntilNextBusMin.toFixed(1)),
          estimatedWaitMin: parseFloat(estimatedWaitMin.toFixed(1)),
          demandLevel: getDemandLevel(demand.avgBoardingPax),
          confidence: 'medium'
        });
      }
    });
  }

  return estimates;
}
