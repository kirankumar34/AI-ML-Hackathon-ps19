import { Bus, Route, FleetAlert, AnomalyCode } from '../../types';

export function detectAnomalies(
  activeBuses: Bus[],
  routes: Route[]
): FleetAlert[] {
  const alerts: FleetAlert[] = [];
  const now = new Date();

  // Group buses by route for route-level anomalies
  const busesByRoute: Record<string, Bus[]> = {};
  for (const bus of activeBuses) {
    if (!busesByRoute[bus.route]) {
      busesByRoute[bus.route] = [];
    }
    busesByRoute[bus.route].push(bus);
  }

  // 1. Bus-Level Anomalies
  for (const bus of activeBuses) {
    // BREAKDOWN_SUSPECTED: Speed very low, maybe stuck for a long time
    if (bus.speed < 2 && bus.status === 'stuck') {
      alerts.push({
        id: `alert-breakdown-${bus.id}`,
        code: 'BREAKDOWN_SUSPECTED',
        busId: bus.id,
        routeId: bus.route,
        stopId: bus.currentStop,
        detectedAt: now,
        description: `Bus #${bus.id} on Route ${bus.route} appears to be stalled or stuck.`,
        severity: 'critical',
        status: 'active',
        location: [bus.lat, bus.lng],
      });
    }

    // SEVERE_DELAY: ETA to the next stop is unusually high
    if (bus.eta > 20) {
      alerts.push({
        id: `alert-delay-${bus.id}`,
        code: 'SEVERE_DELAY',
        busId: bus.id,
        routeId: bus.route,
        detectedAt: now,
        description: `Bus #${bus.id} is facing a severe delay (ETA ${bus.eta}m to next stop).`,
        severity: 'high',
        status: 'active',
        location: [bus.lat, bus.lng],
      });
    }

    // GHOST_BUS: Status running but speed is 0
    if (bus.status === 'running' && bus.speed === 0) {
      alerts.push({
        id: `alert-ghost-${bus.id}`,
        code: 'GHOST_BUS',
        busId: bus.id,
        routeId: bus.route,
        detectedAt: now,
        description: `Bus #${bus.id} is scheduled but GPS shows no movement.`,
        severity: 'medium',
        status: 'active',
        location: [bus.lat, bus.lng],
      });
    }
  }

  // 2. Route-Level Anomalies
  for (const routeId in busesByRoute) {
    const routeBuses = busesByRoute[routeId];
    
    // Sort buses by progress along route
    routeBuses.sort((a, b) => {
      return (b.waypointIndex + b.waypointProgress) - (a.waypointIndex + a.waypointProgress);
    });

    // BUNCHING_SEVERE: 3+ buses within a short distance
    for (let i = 0; i < routeBuses.length - 2; i++) {
      const b1 = routeBuses[i];
      const b3 = routeBuses[i + 2];
      
      const distIndex = (b1.waypointIndex + b1.waypointProgress) - (b3.waypointIndex + b3.waypointProgress);
      if (distIndex < 2) { // rough proxy for ~1km
        alerts.push({
          id: `alert-bunching-${routeId}`,
          code: 'BUNCHING_SEVERE',
          routeId: routeId,
          detectedAt: now,
          description: `Convoy forming on Route ${routeId}: 3+ buses are extremely close.`,
          severity: 'high',
          status: 'active',
          location: [b1.lat, b1.lng],
        });
        break; // Only one bunching alert per route per tick to avoid spam
      }
    }

    // FREQUENCY_COLLAPSE
    const route = routes.find(r => r.busNo === routeId);
    if (route) {
      let scheduledHeadway = 15;
      if (route.frequency) {
        const match = route.frequency.match(/every\s+(\d+)/i);
        if (match && match[1]) scheduledHeadway = parseInt(match[1], 10);
      }

      // Check max gap between consecutive buses
      let maxGapIndex = 0;
      let collapseLocation: [number, number] = [0, 0];
      for (let i = 0; i < routeBuses.length - 1; i++) {
        const gap = (routeBuses[i].waypointIndex + routeBuses[i].waypointProgress) - 
                    (routeBuses[i+1].waypointIndex + routeBuses[i+1].waypointProgress);
        if (gap > maxGapIndex) {
          maxGapIndex = gap;
          collapseLocation = [routeBuses[i].lat, routeBuses[i].lng];
        }
      }

      const estimatedGapMin = (maxGapIndex * 0.5 / 20) * 60; // rough time gap
      if (estimatedGapMin > scheduledHeadway * 2) {
        alerts.push({
          id: `alert-collapse-${routeId}`,
          code: 'FREQUENCY_COLLAPSE',
          routeId: routeId,
          detectedAt: now,
          description: `Route Blackout on ${routeId}. Gap > 2x scheduled headway.`,
          severity: 'critical',
          status: 'active',
          location: collapseLocation,
        });
      }
    }
  }

  return alerts;
}
