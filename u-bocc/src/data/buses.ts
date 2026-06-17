import { ROUTE_DEFINITIONS } from './routes';
import { DEPOTS } from './compiledData';
import { Bus } from '../types';

export type RouteCategory = 'feeder' | 'circular' | 'express' | 'suburban';

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function computeHeading(from: [number, number], to: [number, number]): number {
  const dLng = to[0] - from[0];
  const dLat = to[1] - from[1];
  return (Math.atan2(dLng, dLat) * 180) / Math.PI;
}

export function classifyRoute(
  routeNo: string,
  startPoint: string,
  endPoint: string,
  stops: string[],
  serviceType: string
): RouteCategory {
  const start = startPoint.toUpperCase();
  const end = endPoint.toUpperCase();
  const allPoints = [start, end, ...stops.map((s) => s.toUpperCase())];

  // 1. Metro Feeder (Green)
  const isMetroFeeder =
    (allPoints.some((p) => p.includes('VELACHERY')) && allPoints.some((p) => p.includes('GUINDY'))) ||
    (allPoints.some((p) => p.includes('MEDAVAKKAM')) && allPoints.some((p) => p.includes('AIRPORT'))) ||
    (allPoints.some((p) => p.includes('AMBATTUR')) && allPoints.some((p) => p.includes('KOYAMBEDU'))) ||
    (allPoints.some((p) => p.includes('TAMBARAM')) && allPoints.some((p) => p.includes('METRO'))) ||
    (allPoints.some((p) => p.includes('SHOLINGANALLUR')) && allPoints.some((p) => p.includes('OMR')));

  if (isMetroFeeder) return 'feeder';

  // 2. Circular Ring (Blue)
  const ringPoints = [
    'ENNORE',
    'TIRUVOTRIYUR',
    'MADHAVARAM',
    'RED HILLS',
    'REDHILLS',
    'PUZHAL',
    'ANNA NAGAR',
    'KOYAMBEDU',
    'VADAPALANI',
    'ASHOK NAGAR',
    'GUINDY',
    'VELACHERY',
    'PALLIKARANAI',
    'MEDAVAKKAM',
    'TAMBARAM',
    'PERUNGALATHUR',
  ];
  const matchedRingCount = ringPoints.filter((rp) => allPoints.some((p) => p.includes(rp))).length;
  if (matchedRingCount >= 3) return 'circular';

  // 3. Express BRT (Red)
  const isExpress =
    serviceType.toUpperCase() === 'EXPRESS' ||
    routeNo.endsWith('X') ||
    allPoints.some(
      (p) =>
        p.includes('TAMBARAM') ||
        p.includes('OMR') ||
        p.includes('CENTRAL') ||
        p.includes('GUINDY') ||
        p.includes('ANNA NAGAR') ||
        p.includes('BROADWAY')
    );
  if (isExpress) return 'express';

  // 4. Suburban Connectors (Yellow)
  const outerAreas = ['POONAMALLEE', 'RED HILLS', 'REDHILLS', 'MINJUR', 'KELAMBAKKAM', 'NAVALUR', 'PERUNGALATHUR'];
  if (allPoints.some((p) => outerAreas.some((oa) => p.includes(oa)))) {
    return 'suburban';
  }

  // Fallbacks based on charCode
  const charCode = routeNo.charCodeAt(0) + (routeNo.charCodeAt(1) || 0);
  if (charCode % 4 === 0) return 'feeder';
  if (charCode % 4 === 1) return 'circular';
  if (charCode % 4 === 2) return 'express';
  return 'suburban';
}

export function getCategoryColor(category: RouteCategory): string {
  switch (category) {
    case 'feeder':
      return '#06d6a0'; // GREEN
    case 'circular':
      return '#4a9eff'; // BLUE
    case 'express':
      return '#ef476f'; // RED
    case 'suburban':
      return '#ffd166'; // YELLOW
  }
}

export function getHomeDepot(routeNo: string): string {
  const depot = DEPOTS.find((d) => d.routes.includes(routeNo));
  return depot ? depot.name : 'BROADWAY';
}

export function generateBuses(count: number): Bus[] {
  const buses: Bus[] = [];
  const definedRoutes = ROUTE_DEFINITIONS;
  const busesPerRoute = Math.floor(count / definedRoutes.length);

  for (const route of definedRoutes) {
    const stopNames = route.stops.map(s => s.name);
    const category = classifyRoute(route.routeNumber, route.name.split(' → ')[0], route.name.split(' → ')[1], stopNames, route.busType);
    const depot = getHomeDepot(route.routeNumber);

    for (let i = 0; i < busesPerRoute; i++) {
      const wpIndex = Math.floor(Math.random() * (route.waypoints.length - 1));
      const progress = Math.random();
      const dir: 1 | -1 = Math.random() > 0.5 ? 1 : -1;

      const wp = route.waypoints[wpIndex];
      const wpNext = route.waypoints[Math.min(wpIndex + 1, route.waypoints.length - 1)];
      const lat = lerp(wp[1], wpNext[1], progress);
      const lng = lerp(wp[0], wpNext[0], progress);

      const currentStop = route.stops[Math.min(wpIndex, route.stops.length - 1)]?.name || 'Stop';
      const nextStop = route.stops[Math.min(wpIndex + 1, route.stops.length - 1)]?.name || 'Next Stop';

      const BUS_TYPES: Bus['type'][] = ['Ordinary', 'Deluxe', 'AC', 'Express'];
      const type = category === 'express' ? 'Express' : BUS_TYPES[i % BUS_TYPES.length];

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
