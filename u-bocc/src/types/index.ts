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
  layerCategory?: 'Feeder' | 'Ring' | 'BRT' | 'Suburban';
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

// ═══════════════════════════════════════════════════════════
// PHASE 2 — New Type Definitions
// ═══════════════════════════════════════════════════════════

// ── Feature 1: Live Bunching Heatmap ──────────────────────

/** Computed per route segment, per refresh cycle */
export interface SegmentHeadway {
  routeId: string;
  segmentId: string;          // "stop_A→stop_B"
  lat1: number; lng1: number;
  lat2: number; lng2: number;
  actualHeadway: number;      // minutes between last two buses
  scheduledHeadway: number;   // from timetable
  deviationPct: number;       // ((actual - scheduled) / scheduled) * 100
  severity: 'green' | 'amber' | 'red';
}

export interface BunchingCluster {
  center: [number, number];
  busIds: string[];
  stopId: string;
  radius: number;             // meters
}

// ── Feature 2: Predictive Dispatch Recommender ────────────

export interface DispatchRecommendation {
  id: string;
  priority: 'critical' | 'high' | 'medium';
  busId: string;
  routeId: string;
  action: 'dispatch' | 'hold' | 'reroute' | 'short_turn';
  dispatchFrom: string;       // depot or stop name
  timeToAct: number;          // seconds remaining before optimal window closes
  predictedGapMin: number;    // gap forming if no action taken
  expectedHeadwayAfter: number;
  reasons: ReasonItem[];
  confidence: number;         // 0–1
  createdAt: number;          // timestamp
  
  // prompt.md required fields
  problemDetected?: string;
  affectedRoutesList?: string[];
  predictedImpact?: string;
  suggestedAction?: string;
  confidenceScore?: number;
  expectedImprovement?: string;
}

export interface ReasonItem {
  type: 'gap_prediction' | 'delay_propagation' | 'demand_spike' | 'breakdown';
  description: string;
  weight: number;             // contribution to recommendation score
}

export interface DispatchLogEntry {
  id: string;
  timestamp: number;
  busId: string;
  routeId: string;
  action: string;
  commander: string;
}

// ── Feature 3: Passenger Wait Time Estimator ──────────────

export interface StopWaitEstimate {
  stopId: string;
  stopName: string;
  lat: number; lng: number;
  nextBusId: string;
  nextBusEtaMin: number;        // ETA of next bus
  estimatedWaitMin: number;     // includes dwell at upstream stops
  demandLevel: 'low' | 'medium' | 'high';
  confidence: 'high' | 'medium' | 'low';
  routeId: string;
}

export interface HistoricalDemand {
  stopId: string;
  hourOfDay: number;            // 0–23
  dayType: 'weekday' | 'weekend';
  avgBoardingPax: number;
  avgAlightingPax: number;
}

// ── Feature 4: Anomaly Alert Engine ───────────────────────

export type AnomalyCode =
  | 'BREAKDOWN_SUSPECTED'
  | 'FREQUENCY_COLLAPSE'
  | 'SEVERE_DELAY'
  | 'BUNCHING_SEVERE'
  | 'OFF_ROUTE'
  | 'GHOST_BUS';

export interface FleetAlert {
  id: string;
  code: AnomalyCode;
  busId?: string;
  routeId: string;
  stopId?: string;
  detectedAt: Date;
  description: string;
  severity: 'critical' | 'high' | 'medium';
  status: 'active' | 'acknowledged' | 'resolved';
  acknowledgedBy?: string;
  resolvedAt?: Date;
  location: [number, number];
}

// ── Feature 5: Simulation Replay Mode ─────────────────────

export interface ReplaySession {
  id: string;
  date: string;                // "YYYY-MM-DD"
  windowStart: string;         // "HH:MM"
  windowEnd: string;
  routeId: string;
  historicalFrames: ReplayFrame[];
  counterfactuals: Counterfactual[];
}

export interface ReplayFrame {
  timestamp: number;           // Unix ms
  buses: { busId: string; lat: number; lng: number; speed: number }[];
}

export interface Counterfactual {
  id: string;
  type: 'add_bus' | 'remove_bus' | 'speed_change';
  activateAt: string;          // "HH:MM"
  busId: string;               // synthetic ID e.g. "CF-1"
  startStopId: string;
  routeId: string;
}

export interface SimulationResult {
  realHeadways: HeadwayTimeSeries[];
  projectedHeadways: HeadwayTimeSeries[];
  improvementPct: number;
  peakGapReduction: number;
}

export interface HeadwayTimeSeries {
  timestamp: number;
  stopId: string;
  headwayMin: number;
}
