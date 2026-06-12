import { ROUTE_DEFINITIONS, ROUTE_MAP } from './routes';
import { Bus } from '../types';

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function computeHeading(from: [number, number], to: [number, number]): number {
  const dLng = to[0] - from[0];
  const dLat = to[1] - from[1];
  return (Math.atan2(dLng, dLat) * 180) / Math.PI;
}

function getNextStopName(route: typeof ROUTE_DEFINITIONS[0], wpIndex: number, dir: 1 | -1): string {
  const stops = route.stops;
  if (dir === 1) {
    const upcoming = stops.find(s => s.waypointIndex > wpIndex);
    if (upcoming) return upcoming.name;
    return route.stops[route.stops.length - 1].name;
  } else {
    const upcoming = [...stops].reverse().find(s => s.waypointIndex < wpIndex);
    if (upcoming) return upcoming.name;
    return route.stops[0].name;
  }
}

function getCurrentStopName(route: typeof ROUTE_DEFINITIONS[0], wpIndex: number, dir: 1 | -1): string {
  const stops = route.stops;
  if (dir === 1) {
    const passed = [...stops].reverse().find(s => s.waypointIndex <= wpIndex);
    if (passed) return passed.name;
    return route.stops[0].name;
  } else {
    const passed = stops.find(s => s.waypointIndex >= wpIndex);
    if (passed) return passed.name;
    return route.stops[route.stops.length - 1].name;
  }
}

const ROUTE_DEPOTS: Record<string, string[]> = {
  '29C': ['Adyar', 'Perambur'],
  '23C': ['Adyar', 'Perambur'],
  '18': ['Broadway', 'Tambaram'],
  '216': ['Broadway', 'Tambaram'],
  '47B': ['CMBT', 'Broadway'],
  '70': ['Avadi', 'CMBT'],
  '87': ['Tambaram', 'Adyar'],
  '21G': ['Tambaram', 'Broadway'],
};

const getHomeDepot = (routeNo: string, index: number): string => {
  const depots = ROUTE_DEPOTS[routeNo] || ['Broadway'];
  return depots[index % depots.length];
};

const BUS_TYPES: Bus['type'][] = ['Ordinary', 'Deluxe', 'AC', 'Express'];

export function generateBuses(count: number): Bus[] {
  const buses: Bus[] = [];

  const definedRoutes = ROUTE_DEFINITIONS;
  const busesPerRoute = Math.floor(count / definedRoutes.length);

  for (const route of definedRoutes) {
    for (let i = 0; i < busesPerRoute; i++) {
      const wpIndex = Math.floor(Math.random() * (route.waypoints.length - 1));
      const progress = Math.random();
      const dir: 1 | -1 = Math.random() > 0.5 ? 1 : -1;

      const wp = route.waypoints[wpIndex];
      const wpNext = route.waypoints[Math.min(wpIndex + 1, route.waypoints.length - 1)];
      const lat = lerp(wp[1], wpNext[1], progress);
      const lng = lerp(wp[0], wpNext[0], progress);

      const nextStop = getNextStopName(route, wpIndex, dir);
      const currentStop = getCurrentStopName(route, wpIndex, dir);
      const depot = getHomeDepot(route.routeNumber, i);

      // Distribute bus types slightly for variety, but keep route base speed
      const type = BUS_TYPES[i % BUS_TYPES.length];

      buses.push({
        id: `MTC-${route.routeNumber}-${String(i + 1).padStart(3, '0')}`,
        route: route.routeNumber,
        type,
        status: Math.random() < 0.08 ? 'stopped' : Math.random() < 0.02 ? 'stuck' : 'running',
        waypointIndex: wpIndex,
        waypointProgress: progress,
        direction: dir,
        lat,
        lng,
        heading: computeHeading(wp, wpNext),
        occupancy: Math.floor(Math.random() * 60) + 30,
        speed: route.baseSpeedKmh * (0.85 + Math.random() * 0.3),
        currentStop,
        nextStop,
        eta: Math.floor(Math.random() * 12) + 1,
        directionLabel: dir === 1 ? 'Outbound' : 'Inbound',
        depot,
        dispatchStatus: 'active',
      });
    }
  }

  return buses;
}
