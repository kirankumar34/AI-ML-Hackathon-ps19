import { Bus, Route, SegmentHeadway, BunchingCluster } from '../../types';

export function computeSegmentHeadways(
  activeBuses: Bus[],
  routes: Route[]
): { headways: SegmentHeadway[]; clusters: BunchingCluster[] } {
  const headways: SegmentHeadway[] = [];
  const clusters: BunchingCluster[] = [];

  // Group buses by route
  const busesByRoute: Record<string, Bus[]> = {};
  for (const bus of activeBuses) {
    if (!busesByRoute[bus.route]) {
      busesByRoute[bus.route] = [];
    }
    busesByRoute[bus.route].push(bus);
  }

  for (const routeId in busesByRoute) {
    const route = routes.find((r) => r.busNo === routeId);
    if (!route) continue;

    // Scheduled headway in minutes (mock logic: parse frequency string or default to 15)
    let scheduledHeadway = 15;
    if (route.frequency) {
      const match = route.frequency.match(/every\s+(\d+)/i);
      if (match && match[1]) {
        scheduledHeadway = parseInt(match[1], 10);
      }
    }

    const buses = busesByRoute[routeId];
    
    // Sort buses by progress along the route (highest waypointIndex + progress first)
    buses.sort((a, b) => {
      const progA = a.waypointIndex + a.waypointProgress;
      const progB = b.waypointIndex + b.waypointProgress;
      return progB - progA;
    });

    for (let i = 0; i < buses.length - 1; i++) {
      const bus1 = buses[i];
      const bus2 = buses[i + 1];

      // Distance estimation between the two buses.
      // Here we use a simplified approach based on index differences and average speed.
      const distIndex = (bus1.waypointIndex + bus1.waypointProgress) - (bus2.waypointIndex + bus2.waypointProgress);
      // Assuming each waypoint is roughly a certain distance/time apart. 
      // For a more accurate headway, we'd need timestamps of when buses pass waypoints.
      // In this simulation, we estimate actual headway based on position gap and speed.
      
      const avgSpeedKmh = (bus1.speed + bus2.speed) / 2 || 20; // fallback to 20km/h
      const distKm = distIndex * 0.5; // assume each waypoint is 0.5km apart on average
      const actualHeadwayMin = Math.abs((distKm / avgSpeedKmh) * 60);

      const deviationPct = ((actualHeadwayMin - scheduledHeadway) / scheduledHeadway) * 100;
      
      let severity: 'green' | 'amber' | 'red' = 'green';
      if (Math.abs(deviationPct) > 50 || actualHeadwayMin > 15) {
        severity = 'red';
      } else if (Math.abs(deviationPct) > 20) {
        severity = 'amber';
      }

      headways.push({
        routeId,
        segmentId: `${bus1.id}->${bus2.id}`,
        lat1: bus1.lat,
        lng1: bus1.lng,
        lat2: bus2.lat,
        lng2: bus2.lng,
        actualHeadway: parseFloat(actualHeadwayMin.toFixed(1)),
        scheduledHeadway,
        deviationPct: parseFloat(deviationPct.toFixed(1)),
        severity,
      });

      // Simple Bunching Cluster logic: if headway is very small (< 2 mins), they are bunched.
      if (actualHeadwayMin < 2) {
        clusters.push({
          center: [bus2.lat, bus2.lng],
          busIds: [bus1.id, bus2.id],
          stopId: bus2.currentStop,
          radius: 200,
        });
      }
    }
  }

  return { headways, clusters };
}
