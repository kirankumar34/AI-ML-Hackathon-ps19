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
  currentStop: string;      // name of the last passed stop
  nextStop: string;         // name of the upcoming named stop
  eta: number;              // minutes to next stop
  directionLabel: 'Inbound' | 'Outbound';
  depot: string;            // home depot name
  dispatchStatus?: 'dispatching' | 'active'; // status for depot dispatching
  dwellTimeRemaining?: number; // remaining stop wait time in seconds
}

export interface Depot {
  name: string;
  location: string;
  routes: string[];
  lat: number;
  lng: number;
  busesAvailable: number;
  busesDeployed: number;
}

export interface Stop {
  name: string;
  busNumbers: string[];
  lat: number;
  lng: number;
}

export interface Route {
  busNo: string;
  startPoint: string;
  endPoint: string;
  stops: string[];
  coordinates: [number, number][]; // [lat, lng]
  serviceType: string;
  frequency: string;
  firstTrip: string;
  lastTrip: string;
}

export interface Action {
  id: string;
  route: string;
  priority: 'CRITICAL' | 'MEDIUM';
  actionType: 'ADD_BUSES' | 'REROUTE';
  description: string;
  routeDescription: string;
  depot: string | null;
  busesRequired: number | null;
  waitBefore: number;
  waitAfter: number;
  impact: string;
}

export interface Alert {
  id: string;
  type: 'WEATHER' | 'EVENT' | 'INFRASTRUCTURE' | 'CROWD';
  title: string;
  description: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  timestamp: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  route: string;
  actionType: 'ADD_BUSES' | 'REROUTE';
  details: string;
  status: 'APPROVED' | 'REJECTED';
}
