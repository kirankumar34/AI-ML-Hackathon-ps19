# U-BOCC — Upgrade Patch Prompt
**Fix 1: Swiggy-style Route-Constrained Bus Tracking**
**Fix 2: Post-Decision Route Traffic & Criticality Overlay**

> Apply these changes on top of the existing U-BOCC codebase.

---

## Problem 1 — Random Bus Drift (Current Behaviour)

Buses currently move with random `lat += random * 0.002` drift, so they scatter randomly across the map like noise. This looks wrong.

**Target behaviour:** Every bus must move strictly along its named route polyline — forward to the terminal, then reverse back — exactly like a Swiggy / Zomato / Blinkit delivery marker slides along a road path. The "Next Stop" field in the popup should update to the actual upcoming named stop as the bus approaches it.

---

## Problem 2 — No Feedback After Approve / Reject (Current Behaviour)

When an officer presses APPROVE or REJECT, the card just disappears. There is no visual feedback on the map about what was changed or how critical that route is.

**Target behaviour:** After every decision, the affected route polyline on the map gets highlighted with its current traffic/congestion level, and a compact route-status panel appears (like a Zomato delivery update toast), staying visible for 8 seconds before fading out.

---

## Core Architecture Change: Route Waypoint System

### Step 1 — Define `ROUTE_DEFINITIONS` in `src/data/routes.ts`

Each route is an ordered array of `[lng, lat]` waypoints traced along the actual roads of Chennai. Buses move forward through the array, then reverse.

Also define the named stops along each route. The nearest upcoming waypoint with a name becomes the bus's "Next Stop".

```typescript
// src/data/routes.ts

export interface RouteStop {
  name: string;
  lat: number;
  lng: number;
  waypointIndex: number; // which waypoint index this stop corresponds to
}

export interface RouteDefinition {
  routeNumber: string;
  name: string;           // "Besant Nagar → Perambur"
  busType: 'Ordinary' | 'Deluxe' | 'AC' | 'Express';
  color: string;          // polyline color
  waypoints: [number, number][]; // [lng, lat] ordered
  stops: RouteStop[];
  congestionZones: number[]; // waypoint indices where buses slow down
  baseSpeedKmh: number;
}

// ─────────────────────────────────────────────
// ROUTE DEFINITIONS — real Chennai road traces
// ─────────────────────────────────────────────

export const ROUTE_DEFINITIONS: RouteDefinition[] = [

  // ── Route 29C: Besant Nagar → Adyar → Saidapet → T.Nagar → Egmore → Perambur ──
  {
    routeNumber: '29C',
    name: 'Besant Nagar → Perambur',
    busType: 'Ordinary',
    color: '#4a9eff',
    baseSpeedKmh: 28,
    congestionZones: [4, 5, 9, 10, 14, 15],
    waypoints: [
      [80.2685, 13.0006], // Besant Nagar
      [80.2602, 13.0078], // Adyar Signal
      [80.2541, 13.0124], // Lattice Bridge
      [80.2507, 13.0228], // Saidapet
      [80.2481, 13.0335], // Mambalam
      [80.2399, 13.0421], // T.Nagar
      [80.2345, 13.0503], // Kodambakkam
      [80.2401, 13.0588], // Nungambakkam
      [80.2468, 13.0674], // Chetpet
      [80.2543, 13.0741], // Egmore
      [80.2618, 13.0812], // Park Town
      [80.2703, 13.0885], // Broadway
      [80.2775, 13.0948], // Washermanpet
      [80.2831, 13.1023], // Tondiarpet
      [80.2886, 13.1112], // Tiruvottiyur
      [80.2901, 13.1212], // Perambur
    ],
    stops: [
      { name: 'Besant Nagar', lat: 13.0006, lng: 80.2685, waypointIndex: 0 },
      { name: 'Adyar Signal', lat: 13.0078, lng: 80.2602, waypointIndex: 1 },
      { name: 'Saidapet', lat: 13.0228, lng: 80.2507, waypointIndex: 3 },
      { name: 'T. Nagar', lat: 13.0421, lng: 80.2399, waypointIndex: 5 },
      { name: 'Egmore', lat: 13.0741, lng: 80.2543, waypointIndex: 9 },
      { name: 'Park Town', lat: 13.0812, lng: 80.2618, waypointIndex: 10 },
      { name: 'Broadway', lat: 13.0885, lng: 80.2703, waypointIndex: 11 },
      { name: 'Perambur', lat: 13.1212, lng: 80.2901, waypointIndex: 15 },
    ],
  },

  // ── Route 23C: Adyar → T.Nagar → Egmore → Perambur → Ayanavaram ──
  {
    routeNumber: '23C',
    name: 'Adyar → Ayanavaram',
    busType: 'Ordinary',
    color: '#06d6a0',
    baseSpeedKmh: 25,
    congestionZones: [3, 4, 7, 8],
    waypoints: [
      [80.2574, 13.0049], // Adyar
      [80.2510, 13.0148], // Shastri Nagar
      [80.2450, 13.0258], // Chamiers Road
      [80.2360, 13.0380], // T.Nagar Bus Stand
      [80.2315, 13.0460], // Panagal Park
      [80.2388, 13.0545], // Nungambakkam
      [80.2490, 13.0655], // Chetpet
      [80.2558, 13.0728], // Egmore
      [80.2640, 13.0801], // Park Town
      [80.2741, 13.0874], // Broadway
      [80.2820, 13.0941], // Mannadi
      [80.2785, 13.1018], // Ayanavaram
    ],
    stops: [
      { name: 'Adyar', lat: 13.0049, lng: 80.2574, waypointIndex: 0 },
      { name: 'T. Nagar Bus Stand', lat: 13.0380, lng: 80.2360, waypointIndex: 3 },
      { name: 'Egmore', lat: 13.0728, lng: 80.2558, waypointIndex: 7 },
      { name: 'Broadway', lat: 13.0874, lng: 80.2741, waypointIndex: 9 },
      { name: 'Ayanavaram', lat: 13.1018, lng: 80.2785, waypointIndex: 11 },
    ],
  },

  // ── Route 18: Broadway → Guindy → Tambaram → Thandar Nagar ──
  {
    routeNumber: '18',
    name: 'Broadway → Thandar Nagar',
    busType: 'Ordinary',
    color: '#ffd166',
    baseSpeedKmh: 30,
    congestionZones: [2, 3, 6, 7],
    waypoints: [
      [80.2785, 13.0878], // Broadway
      [80.2710, 13.0805], // Park Town
      [80.2623, 13.0738], // Egmore
      [80.2545, 13.0668], // Thousand Lights
      [80.2488, 13.0584], // Nungambakkam
      [80.2401, 13.0498], // T. Nagar
      [80.2318, 13.0401], // Mambalam
      [80.2274, 13.0288], // Saidapet
      [80.2201, 13.0188], // Guindy
      [80.2148, 13.0088], // St. Thomas Mount
      [80.2081, 12.9968], // Chrompet
      [80.1988, 12.9858], // Tambaram
      [80.1912, 12.9748], // Vandaloor
      [80.1848, 12.9638], // Thandar Nagar
    ],
    stops: [
      { name: 'Broadway', lat: 13.0878, lng: 80.2785, waypointIndex: 0 },
      { name: 'T. Nagar', lat: 13.0498, lng: 80.2401, waypointIndex: 5 },
      { name: 'Guindy', lat: 13.0188, lng: 80.2201, waypointIndex: 8 },
      { name: 'St. Thomas Mount', lat: 13.0088, lng: 80.2148, waypointIndex: 9 },
      { name: 'Tambaram', lat: 12.9858, lng: 80.1988, waypointIndex: 11 },
      { name: 'Thandar Nagar', lat: 12.9638, lng: 80.1848, waypointIndex: 13 },
    ],
  },

  // ── Route 216: Broadway → Koyambedu → Porur → Kilambakkam ──
  {
    routeNumber: '216',
    name: 'Broadway → Kilambakkam',
    busType: 'Ordinary',
    color: '#b388ff',
    baseSpeedKmh: 32,
    congestionZones: [3, 4, 5],
    waypoints: [
      [80.2785, 13.0875], // Broadway
      [80.2701, 13.0801], // Park Town
      [80.2605, 13.0728], // Egmore
      [80.2450, 13.0680], // Kilpauk
      [80.2301, 13.0741], // Anna Nagar East
      [80.2141, 13.0808], // Anna Nagar West
      [80.1978, 13.0775], // Koyambedu
      [80.1878, 13.0688], // Porur
      [80.1748, 13.0548], // Valasaravakkam
      [80.1648, 13.0408], // Gerugambakkam
      [80.1588, 13.0248], // Medavakkam junction
      [80.1728, 13.0081], // Kilambakkam
    ],
    stops: [
      { name: 'Broadway', lat: 13.0875, lng: 80.2785, waypointIndex: 0 },
      { name: 'Anna Nagar', lat: 13.0808, lng: 80.2141, waypointIndex: 5 },
      { name: 'Koyambedu', lat: 13.0775, lng: 80.1978, waypointIndex: 6 },
      { name: 'Porur', lat: 13.0688, lng: 80.1878, waypointIndex: 7 },
      { name: 'Kilambakkam', lat: 13.0081, lng: 80.1728, waypointIndex: 11 },
    ],
  },

  // ── Route 47B: Madhavaram → Broadway → Koyambedu ──
  {
    routeNumber: '47B',
    name: 'Madhavaram → Koyambedu',
    busType: 'Ordinary',
    color: '#ff8c42',
    baseSpeedKmh: 26,
    congestionZones: [4, 5, 8],
    waypoints: [
      [80.2354, 13.1548], // Madhavaram
      [80.2410, 13.1401], // Mathur
      [80.2481, 13.1278], // Perambur
      [80.2598, 13.1141], // Tondiarpet
      [80.2718, 13.1008], // Washermanpet
      [80.2785, 13.0878], // Broadway
      [80.2701, 13.0801], // Park Town
      [80.2481, 13.0668], // Kilpauk
      [80.2141, 13.0741], // Anna Nagar West
      [80.1978, 13.0775], // Koyambedu
    ],
    stops: [
      { name: 'Madhavaram', lat: 13.1548, lng: 80.2354, waypointIndex: 0 },
      { name: 'Perambur', lat: 13.1278, lng: 80.2481, waypointIndex: 2 },
      { name: 'Broadway', lat: 13.0878, lng: 80.2785, waypointIndex: 5 },
      { name: 'Anna Nagar', lat: 13.0741, lng: 80.2141, waypointIndex: 8 },
      { name: 'Koyambedu', lat: 13.0775, lng: 80.1978, waypointIndex: 9 },
    ],
  },

  // ── Route 70: Villivakkam → Anna Nagar ──
  {
    routeNumber: '70',
    name: 'Villivakkam → Anna Nagar',
    busType: 'Ordinary',
    color: '#00e5ff',
    baseSpeedKmh: 22,
    congestionZones: [2, 3],
    waypoints: [
      [80.2088, 13.1148], // Villivakkam
      [80.2141, 13.1048], // Ayanambakkam
      [80.2201, 13.0948], // Ambattur
      [80.2141, 13.0808], // Anna Nagar West
      [80.2241, 13.0738], // Anna Nagar
      [80.2301, 13.0671], // Anna Nagar East
    ],
    stops: [
      { name: 'Villivakkam', lat: 13.1148, lng: 80.2088, waypointIndex: 0 },
      { name: 'Ambattur', lat: 13.0948, lng: 80.2201, waypointIndex: 2 },
      { name: 'Anna Nagar', lat: 13.0738, lng: 80.2241, waypointIndex: 4 },
    ],
  },

  // ── Route 87: Tambaram → Guindy ──
  {
    routeNumber: '87',
    name: 'Tambaram → Guindy',
    busType: 'Ordinary',
    color: '#ef476f',
    baseSpeedKmh: 35,
    congestionZones: [3, 4],
    waypoints: [
      [80.1988, 12.9858], // Tambaram
      [80.2008, 12.9988], // Chrompet
      [80.2048, 13.0108], // Pallavaram
      [80.2148, 13.0218], // St. Thomas Mount
      [80.2208, 13.0318], // Guindy Industrial Estate
      [80.2228, 13.0418], // Guindy
    ],
    stops: [
      { name: 'Tambaram', lat: 12.9858, lng: 80.1988, waypointIndex: 0 },
      { name: 'Pallavaram', lat: 13.0108, lng: 80.2048, waypointIndex: 2 },
      { name: 'St. Thomas Mount', lat: 13.0218, lng: 80.2148, waypointIndex: 3 },
      { name: 'Guindy', lat: 13.0418, lng: 80.2228, waypointIndex: 5 },
    ],
  },

  // ── Route 21G: Kilambakkam → T.Nagar ──
  {
    routeNumber: '21G',
    name: 'Kilambakkam → T.Nagar',
    busType: 'Ordinary',
    color: '#4a9eff',
    baseSpeedKmh: 28,
    congestionZones: [5, 6],
    waypoints: [
      [80.1728, 13.0081], // Kilambakkam
      [80.1878, 13.0248], // Medavakkam
      [80.2028, 13.0348], // Velachery
      [80.2148, 13.0398], // Guindy
      [80.2278, 13.0418], // Saidapet
      [80.2368, 13.0418], // T.Nagar South
      [80.2401, 13.0498], // T.Nagar
    ],
    stops: [
      { name: 'Kilambakkam', lat: 13.0081, lng: 80.1728, waypointIndex: 0 },
      { name: 'Velachery', lat: 13.0348, lng: 80.2028, waypointIndex: 2 },
      { name: 'Guindy', lat: 13.0398, lng: 80.2148, waypointIndex: 3 },
      { name: 'Saidapet', lat: 13.0418, lng: 80.2278, waypointIndex: 4 },
      { name: 'T. Nagar', lat: 13.0498, lng: 80.2401, waypointIndex: 6 },
    ],
  },
];

// Quick lookup map
export const ROUTE_MAP = Object.fromEntries(
  ROUTE_DEFINITIONS.map(r => [r.routeNumber, r])
);

// Congestion levels for routes — simulated
export const ROUTE_CONGESTION: Record<string, 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL'> = {
  '29C': 'CRITICAL',
  '23C': 'HIGH',
  '18': 'HIGH',
  '216': 'MODERATE',
  '47B': 'CRITICAL',
  '70': 'LOW',
  '87': 'MODERATE',
  '21G': 'HIGH',
};
```

---

## Step 2 — Update the Bus Type in `src/types/index.ts`

Replace the old random-position Bus type with a route-aware one:

```typescript
export interface Bus {
  id: string;
  route: string;
  type: 'Ordinary' | 'Deluxe' | 'AC' | 'Express';
  status: 'running' | 'stopped' | 'overloaded' | 'stuck';

  // ── Route position ──────────────────────────────────
  waypointIndex: number;    // which waypoint the bus is at/just passed
  waypointProgress: number; // 0.0 → 1.0 interpolation to NEXT waypoint
  direction: 1 | -1;        // +1 = forward along route, -1 = reverse

  // ── Derived position (computed each frame) ──────────
  lat: number;
  lng: number;
  heading: number;          // degrees, computed from direction vector

  // ── Live telemetry ──────────────────────────────────
  occupancy: number;        // 0–100
  speed: number;            // km/h (actual speed this tick)
  nextStop: string;         // name of the upcoming named stop
  eta: number;              // minutes to next stop
  directionLabel: 'Inbound' | 'Outbound';
}
```

---

## Step 3 — Rewrite `src/data/buses.ts` — Route-Aware Bus Generation

```typescript
import { ROUTE_DEFINITIONS, ROUTE_MAP } from './routes';
import { Bus } from '../types';

// Real Chennai stops for "filler" routes not in ROUTE_DEFINITIONS
const FALLBACK_STOPS = [
  'Adyar', 'T. Nagar', 'Egmore', 'Broadway', 'Perambur',
  'Guindy', 'Tambaram', 'Koyambedu', 'Saidapet', 'Anna Nagar',
  'Porur', 'Velachery', 'Kilpauk', 'Chetpet', 'Pallavaram',
];

const EXTRA_ROUTES = ['1A', '5C', '15G', '27B', '35', '47C', '52A', '57',
  '70B', 'M9', 'M11', '218', '29H', '101', '104K', '104P', '114A', '119'];

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function computeHeading(from: [number, number], to: [number, number]): number {
  const dLng = to[0] - from[0];
  const dLat = to[1] - from[1];
  return (Math.atan2(dLng, dLat) * 180) / Math.PI;
}

export function generateBuses(count: number): Bus[] {
  const buses: Bus[] = [];

  // ── 1. For each defined route, spawn multiple buses distributed along it ──
  for (const route of ROUTE_DEFINITIONS) {
    const busCount = Math.floor(count / (ROUTE_DEFINITIONS.length + EXTRA_ROUTES.length));
    for (let i = 0; i < busCount; i++) {
      const wpIndex = Math.floor(Math.random() * (route.waypoints.length - 1));
      const progress = Math.random();
      const dir: 1 | -1 = Math.random() > 0.5 ? 1 : -1;

      const wp = route.waypoints[wpIndex];
      const wpNext = route.waypoints[Math.min(wpIndex + 1, route.waypoints.length - 1)];
      const lat = lerp(wp[1], wpNext[1], progress);
      const lng = lerp(wp[0], wpNext[0], progress);

      // find next stop name
      const nextStop = getNextStopName(route, wpIndex, dir);

      buses.push({
        id: `${route.routeNumber}-${String(i + 1).padStart(3, '0')}`,
        route: route.routeNumber,
        type: route.busType,
        status: Math.random() < 0.15 ? 'stopped' : Math.random() < 0.05 ? 'stuck' : 'running',
        waypointIndex: wpIndex,
        waypointProgress: progress,
        direction: dir,
        lat,
        lng,
        heading: computeHeading(wp, wpNext),
        occupancy: Math.floor(Math.random() * 60) + 30,
        speed: route.baseSpeedKmh * (0.7 + Math.random() * 0.5),
        nextStop,
        eta: Math.floor(Math.random() * 15) + 1,
        directionLabel: dir === 1 ? 'Outbound' : 'Inbound',
      });
    }
  }

  // ── 2. Fill remaining count with "extra" routes at random positions ──
  const remaining = count - buses.length;
  for (let i = 0; i < remaining; i++) {
    const routeNum = EXTRA_ROUTES[i % EXTRA_ROUTES.length];
    // Place these along the Chennai bounding box using a weighted corridor
    const corridors = [
      { lat: 13.05 + (Math.random() - 0.5) * 0.08, lng: 80.25 + (Math.random() - 0.5) * 0.08 },
      { lat: 13.08 + (Math.random() - 0.5) * 0.05, lng: 80.27 + (Math.random() - 0.5) * 0.05 },
      { lat: 13.00 + (Math.random() - 0.5) * 0.06, lng: 80.20 + (Math.random() - 0.5) * 0.06 },
    ];
    const pos = corridors[i % corridors.length];

    buses.push({
      id: `${routeNum}-${String(i).padStart(3, '0')}`,
      route: routeNum,
      type: 'Ordinary',
      status: Math.random() < 0.1 ? 'stopped' : 'running',
      waypointIndex: 0,
      waypointProgress: Math.random(),
      direction: 1,
      lat: pos.lat,
      lng: pos.lng,
      heading: Math.random() * 360,
      occupancy: Math.floor(Math.random() * 50) + 20,
      speed: 20 + Math.random() * 20,
      nextStop: FALLBACK_STOPS[Math.floor(Math.random() * FALLBACK_STOPS.length)],
      eta: Math.floor(Math.random() * 12) + 1,
      directionLabel: 'Inbound',
    });
  }

  return buses;
}

function getNextStopName(route: ReturnType<typeof ROUTE_DEFINITIONS[0]>['stops'] extends infer T ? never : never, wpIndex: number, dir: 1 | -1): string {
  return 'Stop'; // placeholder — see hook below for real implementation
}
```

---

## Step 4 — Rewrite `src/hooks/useSimulation.ts` — Smooth Route-Following Logic

This is the most important change. Replace the random-drift loop with a **waypoint interpolation engine**.

```typescript
// src/hooks/useSimulation.ts
import { useEffect, useRef, useState } from 'react';
import { Bus } from '../types';
import { ROUTE_MAP, ROUTE_DEFINITIONS } from '../data/routes';
import { generateBuses } from '../data/buses';

const TICK_MS = 50; // 20 fps simulation
const CONGESTION_ZONE_SPEED_FACTOR = 0.35; // slow to 35% speed in congested zones

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function computeHeading(from: [number, number], to: [number, number]): number {
  const dLng = to[0] - from[0];
  const dLat = to[1] - from[1];
  return (Math.atan2(dLng, dLat) * 180) / Math.PI;
}

function getNextStopForBus(
  route: (typeof ROUTE_DEFINITIONS)[0],
  wpIndex: number,
  direction: 1 | -1
): { name: string; eta: number } {
  const stops = route.stops;
  if (direction === 1) {
    const upcoming = stops.find(s => s.waypointIndex > wpIndex);
    if (upcoming) {
      const stopsAway = upcoming.waypointIndex - wpIndex;
      return { name: upcoming.name, eta: Math.max(1, stopsAway * 2) };
    }
    return { name: route.stops[route.stops.length - 1].name, eta: 1 };
  } else {
    const upcoming = [...stops].reverse().find(s => s.waypointIndex < wpIndex);
    if (upcoming) {
      const stopsAway = wpIndex - upcoming.waypointIndex;
      return { name: upcoming.name, eta: Math.max(1, stopsAway * 2) };
    }
    return { name: route.stops[0].name, eta: 1 };
  }
}

/**
 * Distance between two [lng, lat] waypoints in degrees
 * (approximate, good enough for Chennai scale)
 */
function waypointDistance(a: [number, number], b: [number, number]): number {
  const dLng = (b[0] - a[0]) * Math.cos(((a[1] + b[1]) / 2) * (Math.PI / 180));
  const dLat = b[1] - a[1];
  return Math.sqrt(dLng * dLng + dLat * dLat) * 111; // rough km
}

export function useSimulation() {
  const [buses, setBuses] = useState<Bus[]>(() => generateBuses(650));
  const [kpis, setKpis] = useState({
    activeBuses: 5,
    overloaded: 0,
    avgWait: 4.5,
    avgOcc: 62,
    reserveFleet: 284,
    pendingActions: 8,
    busesLive: 666,
  });

  const busesRef = useRef(buses);
  busesRef.current = buses;

  useEffect(() => {
    const interval = setInterval(() => {
      setBuses(prev => prev.map(bus => {
        const route = ROUTE_MAP[bus.route];

        // ── "Extra" routes without definitions: small random walk ──
        if (!route) {
          return {
            ...bus,
            lat: bus.lat + (Math.random() - 0.5) * 0.0005,
            lng: bus.lng + (Math.random() - 0.5) * 0.0005,
            occupancy: Math.min(100, Math.max(10,
              bus.occupancy + (Math.random() - 0.5) * 3)),
          };
        }

        // ── Stopped / Stuck buses: don't move ──
        if (bus.status === 'stuck') return bus;
        if (bus.status === 'stopped') {
          // 5% chance to resume each tick
          if (Math.random() < 0.05) {
            return { ...bus, status: 'running' };
          }
          return bus;
        }

        // ── Route-following movement ──
        const wps = route.waypoints;
        const totalWaypoints = wps.length;

        // Determine speed
        const isInCongestion = route.congestionZones.includes(bus.waypointIndex);
        const speedKmh = isInCongestion
          ? route.baseSpeedKmh * CONGESTION_ZONE_SPEED_FACTOR
          : route.baseSpeedKmh * (0.85 + Math.random() * 0.3);

        // Convert km/h to degrees-per-tick
        // 1 degree ≈ 111 km; TICK_MS / 3600000 hours per tick
        const hoursPerTick = TICK_MS / 3600000;
        const kmPerTick = speedKmh * hoursPerTick;
        const degreesPerTick = kmPerTick / 111;

        // Distance of current segment
        const fromWp = wps[bus.waypointIndex];
        const toWpIdx = Math.min(
          Math.max(bus.waypointIndex + bus.direction, 0),
          totalWaypoints - 1
        );
        const toWp = wps[toWpIdx];
        const segmentDistDeg = Math.sqrt(
          Math.pow(toWp[0] - fromWp[0], 2) +
          Math.pow(toWp[1] - fromWp[1], 2)
        );

        // Progress increment (normalised to segment length)
        const progressDelta = segmentDistDeg > 0
          ? degreesPerTick / segmentDistDeg
          : 0;

        let newProgress = bus.waypointProgress + progressDelta;
        let newWpIndex = bus.waypointIndex;
        let newDirection = bus.direction;

        // Advance to next waypoint if progress >= 1
        while (newProgress >= 1) {
          newProgress -= 1;
          newWpIndex += newDirection;

          // Bounce at terminals
          if (newWpIndex >= totalWaypoints - 1) {
            newWpIndex = totalWaypoints - 2;
            newDirection = -1;
          } else if (newWpIndex < 0) {
            newWpIndex = 1;
            newDirection = 1;
          }
        }

        // Interpolate position
        const fromWpNew = wps[newWpIndex];
        const toWpNew = wps[
          Math.min(Math.max(newWpIndex + newDirection, 0), totalWaypoints - 1)
        ];

        const lat = lerp(fromWpNew[1], toWpNew[1], newProgress);
        const lng = lerp(fromWpNew[0], toWpNew[0], newProgress);
        const heading = computeHeading(fromWpNew, toWpNew);

        // Next stop
        const { name: nextStop, eta } = getNextStopForBus(route, newWpIndex, newDirection);

        // Occasional random status change
        let newStatus = bus.status;
        if (Math.random() < 0.002) newStatus = 'stopped';
        else if (Math.random() < 0.001) newStatus = 'stuck';

        return {
          ...bus,
          waypointIndex: newWpIndex,
          waypointProgress: newProgress,
          direction: newDirection,
          lat,
          lng,
          heading,
          speed: Math.round(speedKmh),
          nextStop,
          eta,
          directionLabel: newDirection === 1 ? 'Outbound' : 'Inbound',
          occupancy: Math.min(100, Math.max(10,
            bus.occupancy + (Math.random() - 0.5) * 2)),
          status: newStatus,
        };
      }));

      // KPI update every ~5 seconds (every 100 ticks)
    }, TICK_MS);

    // Separate slower interval for KPIs
    const kpiInterval = setInterval(() => {
      setKpis(prev => ({
        ...prev,
        activeBuses: Math.floor(Math.random() * 7) + 1,
        avgWait: parseFloat((4.0 + Math.random() * 1.5).toFixed(1)),
        avgOcc: Math.floor(Math.random() * 10) + 58,
        busesLive: Math.floor(Math.random() * 60) + 640,
      }));
    }, 5000);

    return () => {
      clearInterval(interval);
      clearInterval(kpiInterval);
    };
  }, []);

  return { buses, kpis };
}
```

---

## Step 5 — Heading-Aware Bus Markers

The bus marker chip should visually rotate to face its direction of travel (like a Swiggy delivery bike rotating on the map).

```tsx
// In BusMarker.tsx — add heading rotation

<div
  className="bus-marker"
  style={{
    transform: `rotate(${bus.heading}deg)`,
    transition: 'transform 0.3s ease, left 0.05s linear, top 0.05s linear',
  }}
>
  {/* Arrow tip to show direction */}
  <div className="bus-direction-arrow" />
  <span className="bus-route-number">{bus.route}</span>
</div>
```

**CSS for the direction arrow (shows on top of chip):**
```css
.bus-direction-arrow {
  position: absolute;
  top: -5px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-bottom: 6px solid var(--accent-blue);
}
```

---

## Feature 2 — Post-Decision Route Traffic & Criticality Overlay

### Step 6 — Route Congestion State (`src/hooks/useRouteOverlay.ts`)

```typescript
// src/hooks/useRouteOverlay.ts
import { useState, useCallback } from 'react';
import { ROUTE_MAP, ROUTE_CONGESTION } from '../data/routes';

export type CongestionLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

export interface RouteOverlay {
  routeNumber: string;
  routeName: string;
  decision: 'APPROVED' | 'REJECTED';
  actionType: 'ADD_BUSES' | 'REROUTE';
  congestion: CongestionLevel;
  busesOnRoute: number;
  waitBefore: number;
  waitAfter: number;
  busesAdded?: number;
  depot?: string;
  visibleUntil: number; // Date.now() + 8000
}

export function useRouteOverlay() {
  const [overlay, setOverlay] = useState<RouteOverlay | null>(null);

  const showOverlay = useCallback((
    action: {
      route: string;
      actionType: 'ADD_BUSES' | 'REROUTE';
      waitBefore: number;
      waitAfter: number;
      busesRequired?: number;
      depot?: string;
      routeDescription: string;
    },
    decision: 'APPROVED' | 'REJECTED'
  ) => {
    const route = ROUTE_MAP[action.route];
    const congestion = ROUTE_CONGESTION[action.route] ?? 'MODERATE';

    setOverlay({
      routeNumber: action.route,
      routeName: route?.name ?? action.routeDescription,
      decision,
      actionType: action.actionType,
      congestion,
      busesOnRoute: Math.floor(Math.random() * 20) + 8, // simulated current count
      waitBefore: action.waitBefore,
      waitAfter: action.waitAfter,
      busesAdded: action.busesRequired,
      depot: action.depot,
      visibleUntil: Date.now() + 8000,
    });

    // Auto-dismiss after 8 seconds
    setTimeout(() => setOverlay(null), 8000);
  }, []);

  const dismissOverlay = useCallback(() => setOverlay(null), []);

  return { overlay, showOverlay, dismissOverlay };
}
```

---

### Step 7 — `RouteDecisionOverlay` Component

This is the panel that appears on the map after a decision. Style it like a Zomato-style "Order accepted" toast — but richer with route data.

```tsx
// src/components/RouteDecisionOverlay.tsx
import { RouteOverlay, CongestionLevel } from '../hooks/useRouteOverlay';

const CONGESTION_CONFIG: Record<CongestionLevel, {
  label: string;
  color: string;
  bg: string;
  barSegments: number; // 1–4 filled bars out of 4
}> = {
  LOW:      { label: 'LOW',      color: '#06d6a0', bg: '#06d6a022', barSegments: 1 },
  MODERATE: { label: 'MODERATE', color: '#ffd166', bg: '#ffd16622', barSegments: 2 },
  HIGH:     { label: 'HIGH',     color: '#ff8c42', bg: '#ff8c4222', barSegments: 3 },
  CRITICAL: { label: 'CRITICAL', color: '#ef476f', bg: '#ef476f22', barSegments: 4 },
};

interface Props {
  overlay: RouteOverlay;
  onDismiss: () => void;
}

export default function RouteDecisionOverlay({ overlay, onDismiss }: Props) {
  const cfg = CONGESTION_CONFIG[overlay.congestion];
  const isApproved = overlay.decision === 'APPROVED';

  return (
    <div
      className="route-decision-overlay"
      style={{
        position: 'absolute',
        bottom: '52px',         /* sits just above the ticker */
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        width: '420px',
        background: 'var(--bg-card)',
        border: `1px solid ${isApproved ? '#06d6a040' : '#ef476f40'}`,
        borderLeft: `3px solid ${isApproved ? '#06d6a0' : '#ef476f'}`,
        borderRadius: '8px',
        padding: '14px 16px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
        animation: 'slideUpFade 0.3s ease-out',
        fontFamily: 'var(--font-mono)',
      }}
    >
      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
            <span style={{
              fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em',
              padding: '2px 7px', borderRadius: '3px',
              background: isApproved ? '#06d6a022' : '#ef476f22',
              color: isApproved ? '#06d6a0' : '#ef476f',
              border: `1px solid ${isApproved ? '#06d6a040' : '#ef476f40'}`,
            }}>
              {isApproved ? '✓ APPROVED' : '✗ REJECTED'}
            </span>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.06em' }}>
              {overlay.actionType === 'ADD_BUSES' ? 'BUS DISPATCH' : 'ROUTE DIVERSION'}
            </span>
          </div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
            Route {overlay.routeNumber}
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '8px', fontWeight: 400 }}>
              {overlay.routeName}
            </span>
          </div>
        </div>
        <button onClick={onDismiss} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '16px', padding: '0 4px' }}>×</button>
      </div>

      {/* ── Traffic / Congestion Level ── */}
      <div style={{
        background: cfg.bg,
        border: `1px solid ${cfg.color}30`,
        borderRadius: '6px',
        padding: '10px 12px',
        marginBottom: '12px',
      }}>
        <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: '6px' }}>
          ROUTE TRAFFIC LEVEL
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: cfg.color }}>
            {cfg.label}
          </span>
          {/* 4-bar congestion indicator */}
          <div style={{ display: 'flex', gap: '3px', alignItems: 'flex-end', height: '18px' }}>
            {[1,2,3,4].map(i => (
              <div key={i} style={{
                width: '7px',
                height: `${6 + i * 3}px`,
                borderRadius: '2px',
                background: i <= cfg.barSegments ? cfg.color : '#2a2a3a',
                transition: 'background 0.3s',
              }} />
            ))}
          </div>
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
          {overlay.busesOnRoute} buses currently on this route
        </div>
      </div>

      {/* ── Impact Grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '10px' }}>
        {/* Wait time change */}
        <div style={{ background: '#1a1a26', borderRadius: '5px', padding: '8px 10px', textAlign: 'center' }}>
          <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginBottom: '4px', letterSpacing: '0.08em' }}>WAIT BEFORE</div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: '#ef476f' }}>{overlay.waitBefore}m</div>
        </div>
        <div style={{ background: '#1a1a26', borderRadius: '5px', padding: '8px 10px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '18px', color: isApproved ? '#06d6a0' : 'var(--text-muted)' }}>→</span>
        </div>
        <div style={{ background: '#1a1a26', borderRadius: '5px', padding: '8px 10px', textAlign: 'center' }}>
          <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginBottom: '4px', letterSpacing: '0.08em' }}>WAIT AFTER</div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: isApproved ? '#06d6a0' : 'var(--text-muted)' }}>
            {isApproved ? overlay.waitAfter : overlay.waitBefore}m
          </div>
        </div>
      </div>

      {/* ── Footer note ── */}
      {overlay.actionType === 'ADD_BUSES' && overlay.busesAdded && (
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: '8px' }}>
          {isApproved
            ? `✓ ${overlay.busesAdded} buses dispatched from ${overlay.depot} depot`
            : `✗ Dispatch request from ${overlay.depot} depot rejected`
          }
        </div>
      )}
      {overlay.actionType === 'REROUTE' && (
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: '8px' }}>
          {isApproved
            ? `✓ Rerouting active — ${overlay.routeName}`
            : `✗ Route diversion rejected — original path maintained`
          }
        </div>
      )}

      {/* Auto-dismiss progress bar */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px',
        borderRadius: '0 0 8px 8px', overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          background: isApproved ? '#06d6a0' : '#ef476f',
          animation: 'shrinkBar 8s linear forwards',
        }} />
      </div>
    </div>
  );
}
```

**Add these keyframes to global CSS:**
```css
@keyframes slideUpFade {
  from { opacity: 0; transform: translateX(-50%) translateY(16px); }
  to   { opacity: 1; transform: translateX(-50%) translateY(0); }
}

@keyframes shrinkBar {
  from { width: 100%; }
  to   { width: 0%; }
}
```

---

### Step 8 — Highlight Route Polyline on Map After Decision

When a decision is made, the affected route polyline flashes and stays highlighted in the decision colour for 8 seconds.

In `MapView.tsx`, maintain a `highlightedRoute` state:

```typescript
// MapView.tsx additions
interface HighlightedRoute {
  routeNumber: string;
  color: string;       // green for approved, red for rejected
  expiresAt: number;   // Date.now() + 8000
}

const [highlightedRoute, setHighlightedRoute] = useState<HighlightedRoute | null>(null);

// Called from ActionCard's onApprove/onReject:
const handleDecision = (action: Action, decision: 'APPROVED' | 'REJECTED') => {
  setHighlightedRoute({
    routeNumber: action.route,
    color: decision === 'APPROVED' ? '#06d6a0' : '#ef476f',
    expiresAt: Date.now() + 8000,
  });
  setTimeout(() => setHighlightedRoute(null), 8000);
  showOverlay(action, decision);  // also trigger the toast panel
};
```

In the map layer rendering, draw the highlighted route on top of the regular route polylines:

```typescript
// If using react-map-gl:
{highlightedRoute && (() => {
  const routeDef = ROUTE_MAP[highlightedRoute.routeNumber];
  if (!routeDef) return null;
  return (
    <Source
      id="highlighted-route"
      type="geojson"
      data={{
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: routeDef.waypoints,
        },
        properties: {},
      }}
    >
      {/* Glow layer */}
      <Layer
        id="highlighted-route-glow"
        type="line"
        paint={{
          'line-color': highlightedRoute.color,
          'line-width': 12,
          'line-opacity': 0.25,
          'line-blur': 4,
        }}
      />
      {/* Core line */}
      <Layer
        id="highlighted-route-core"
        type="line"
        paint={{
          'line-color': highlightedRoute.color,
          'line-width': 4,
          'line-opacity': 0.9,
          'line-dasharray': [6, 2], // dashed = decision route
        }}
      />
    </Source>
  );
})()}

// If using Leaflet:
// Use L.polyline(routeDef.waypoints.map(([lng, lat]) => [lat, lng]), {
//   color: highlightedRoute.color,
//   weight: 5,
//   dashArray: '10, 6',
//   opacity: 0.9
// }).addTo(map);
```

---

### Step 9 — Wire Everything Together in `ActionCard.tsx`

Pass `onApprove` and `onReject` callbacks that trigger both the overlay and the map highlight:

```tsx
// ActionCard.tsx
interface Props {
  action: Action;
  onApprove: (action: Action) => void;
  onReject: (action: Action) => void;
}

// In the APPROVE button onClick:
<button
  className="approve-btn"
  onClick={() => {
    setExiting('approved');
    setTimeout(() => onApprove(action), 300);
  }}
>
  ✓ APPROVE
</button>

// In the REJECT button onClick:
<button
  className="reject-btn"
  onClick={() => {
    setExiting('rejected');
    setTimeout(() => onReject(action), 300);
  }}
>
  ✗ REJECT
</button>
```

In `page.tsx` (root), wire it all together:

```tsx
const { overlay, showOverlay, dismissOverlay } = useRouteOverlay();

const handleApprove = (action: Action) => {
  setActions(prev => prev.filter(a => a.id !== action.id));
  addToLog({ ...action, decision: 'APPROVED', timestamp: new Date() });
  showOverlay(action, 'APPROVED');         // triggers toast
  highlightRouteOnMap(action.route, 'APPROVED'); // triggers map glow
};

const handleReject = (action: Action) => {
  setActions(prev => prev.filter(a => a.id !== action.id));
  addToLog({ ...action, decision: 'REJECTED', timestamp: new Date() });
  showOverlay(action, 'REJECTED');
  highlightRouteOnMap(action.route, 'REJECTED');
};

// In JSX, render the overlay above the ticker:
{overlay && (
  <RouteDecisionOverlay overlay={overlay} onDismiss={dismissOverlay} />
)}
```

---

## Summary of All Changes

| File | Change |
|------|--------|
| `src/data/routes.ts` | Add `ROUTE_DEFINITIONS` with real Chennai waypoints, `ROUTE_MAP`, `ROUTE_CONGESTION` |
| `src/types/index.ts` | Replace `lat/lng` random fields with `waypointIndex`, `waypointProgress`, `direction` |
| `src/data/buses.ts` | Spawn buses distributed along route waypoints, not random coords |
| `src/hooks/useSimulation.ts` | Replace random drift with waypoint interpolation engine at 20fps |
| `src/components/BusMarker.tsx` | Add `transform: rotate(heading)` + direction arrow |
| `src/hooks/useRouteOverlay.ts` | New hook — manages decision overlay state + auto-dismiss |
| `src/components/RouteDecisionOverlay.tsx` | New component — Zomato-style decision toast with congestion bar |
| `src/components/MapView.tsx` | Add `highlightedRoute` state + conditional Source/Layer for glow |
| `src/components/ActionCard.tsx` | Wire `onApprove`/`onReject` with exit animation |
| `src/app/page.tsx` | Connect overlay hook + pass handlers down to ActionCard |
| `src/app/globals.css` | Add `slideUpFade`, `shrinkBar` keyframes |

---

## Visual Result After These Changes

1. **Every bus with a defined route** (29C, 23C, 18, 216, 47B, 70, 87, 21G) moves smoothly along its actual road path — forward to the terminal, then back. The chip rotates to face its heading like a Swiggy delivery icon.

2. **"Next Stop"** in the bus popup updates correctly as the bus passes named stops along its route.

3. **Speed varies** — buses slow down significantly in congestion zones (Saidapet, T.Nagar, Guindy) and move normally on clear stretches.

4. **After APPROVE/REJECT**, a compact overlay panel appears at the bottom-centre of the map showing:
   - The decision (APPROVED ✓ / REJECTED ✗)
   - The route's current traffic level with a 4-bar indicator
   - Wait time before → after
   - Buses dispatched / rejected
   - The affected route polyline highlights in green (approved) or red (rejected) with a glow + dashed line on the map
   - Both auto-dismiss after 8 seconds with a shrinking progress bar
