import { useState, useEffect, useRef, useCallback } from 'react';

// ─── Interfaces ─────────────────────────────────────────────────────────────

export interface Stop {
  stop_id: string;
  stop_name: string;
  lat: number;
  lng: number;
  stop_sequence: number;
}

export interface StopETA {
  stop_id: string;
  stop_name: string;
  lat: number;
  lng: number;
  stop_sequence: number;
  eta_sec: number;
  arrived: boolean;
}

export interface BusState {
  lat: number;
  lng: number;
  heading: number;
  speed: number;
  segmentIdx: number;
  nearestStopIdx: number;
  nearestStopName: string;
  nextStopName: string;
  distToNextStop: number;
  etaNextStop: number;
  etaTerminus: number;
  atStop: boolean;
  occupancy: number;
  stopEtas: StopETA[];
  progressRatio: number;
  waypointIdx: number;
}

// ─── Hardcoded stops ─────────────────────────────────────────────────────────

export const ROUTE_STOPS: Stop[] = [
  { stop_id: 'S1', stop_name: 'Perambur Bus Terminus', lat: 13.1171,  lng: 80.2494,  stop_sequence: 1 },
  { stop_id: 'S2', stop_name: 'Jamalaya',              lat: 13.10456, lng: 80.2529,  stop_sequence: 2 },
  { stop_id: 'S3', stop_name: 'Otteri',                lat: 13.09508, lng: 80.24777, stop_sequence: 3 },
  { stop_id: 'S4', stop_name: 'Pursaiwalkam',          lat: 13.08612, lng: 80.26168, stop_sequence: 4 },
  { stop_id: 'S5', stop_name: 'Egmore',                lat: 13.07751, lng: 80.26139, stop_sequence: 5 },
  { stop_id: 'S6', stop_name: 'Pudupet',               lat: 13.07000, lng: 80.26500, stop_sequence: 6 },
  { stop_id: 'S7', stop_name: 'Bells Road',            lat: 13.06500, lng: 80.27600, stop_sequence: 7 },
  { stop_id: 'S8', stop_name: 'Anna Square',           lat: 13.06426, lng: 80.28337, stop_sequence: 8 },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toRad(d: number) { return (d * Math.PI) / 180; }

function haversineM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(a));
}

function calcBearing(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const y = Math.sin(toRad(lng2 - lng1)) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(toRad(lng2 - lng1));
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

function lerpAngle(a: number, b: number, t: number): number {
  let diff = b - a;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  return a + diff * t;
}

// ─── OSRM road-geometry fetcher ──────────────────────────────────────────────

/**
 * Fetch actual road geometry between two points from OSRM public API.
 * Returns array of [lat, lng] coordinates following real roads.
 * Falls back to linear interpolation if OSRM is unavailable.
 */
async function fetchRoadSegment(
  fromLat: number, fromLng: number,
  toLat: number, toLng: number
): Promise<[number, number][]> {
  try {
    // OSRM uses lng,lat order in URL
    const url =
      `https://router.project-osrm.org/route/v1/driving/` +
      `${fromLng},${fromLat};${toLng},${toLat}` +
      `?overview=full&geometries=geojson&steps=false`;

    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`OSRM ${res.status}`);
    const data = await res.json();

    if (!data.routes?.[0]?.geometry?.coordinates) {
      throw new Error('no geometry');
    }

    // OSRM returns [lng, lat], flip to [lat, lng] for Leaflet
    const coords: [number, number][] = data.routes[0].geometry.coordinates.map(
      ([lng, lat]: [number, number]) => [lat, lng] as [number, number]
    );

    return coords;
  } catch (e) {
    console.warn('OSRM unavailable, using linear fallback:', e);
    // Linear fallback — 20 m spacing
    const dist  = haversineM(fromLat, fromLng, toLat, toLng);
    const steps = Math.max(4, Math.ceil(dist / 20));
    return Array.from({ length: steps + 1 }, (_, i) => {
      const t = i / steps;
      return [fromLat + (toLat - fromLat) * t, fromLng + (toLng - fromLng) * t] as [number, number];
    });
  }
}

/**
 * Resamples the given coordinate path to have equally spaced waypoints.
 * This ensures the bus moves at a constant speed regardless of OSRM node density.
 */
function resamplePath(path: [number, number][], spacingMeters: number): [number, number][] {
  if (path.length < 2) return path;
  const resampled: [number, number][] = [path[0]];
  let currentLat = path[0][0];
  let currentLng = path[0][1];
  
  let i = 1;
  let carryDist = 0;
  
  while (i < path.length) {
    const nextLat = path[i][0];
    const nextLng = path[i][1];
    const d = haversineM(currentLat, currentLng, nextLat, nextLng);
    
    if (d === 0) {
      i++;
      continue;
    }
    
    if (carryDist + d >= spacingMeters) {
      const needed = spacingMeters - carryDist;
      const t = needed / d;
      
      const interpLat = currentLat + (nextLat - currentLat) * t;
      const interpLng = currentLng + (nextLng - currentLng) * t;
      
      resampled.push([interpLat, interpLng]);
      currentLat = interpLat;
      currentLng = interpLng;
      carryDist = 0;
    } else {
      carryDist += d;
      currentLat = nextLat;
      currentLng = nextLng;
      i++;
    }
  }
  
  const lastPoint = path[path.length - 1];
  const lastResampled = resampled[resampled.length - 1];
  if (haversineM(lastResampled[0], lastResampled[1], lastPoint[0], lastPoint[1]) > 0.5) {
    resampled.push(lastPoint);
  }
  
  return resampled;
}

/**
 * Build the full road-following path across all stop pairs.
 * Fetches OSRM segments in parallel and resamples them for constant speed.
 */
async function buildRoadPath(stops: Stop[]): Promise<[number, number][]> {
  const segmentPromises = stops.slice(0, -1).map((s, i) =>
    fetchRoadSegment(s.lat, s.lng, stops[i + 1].lat, stops[i + 1].lng)
  );

  const segments = await Promise.all(segmentPromises);

  // Stitch segments — skip duplicate junction points
  const full: [number, number][] = [];
  segments.forEach((seg, i) => {
    if (i === 0) full.push(...seg);
    else full.push(...seg.slice(1));
  });

  // Resample path to 10-meter spacing for perfectly smooth constant speed movement
  return resamplePath(full, 10);
}

// ─── Constants ───────────────────────────────────────────────────────────────

const WAYPOINT_SPACING_M = 10;    // m spacing between waypoints
const SPEED_MS           = 8.5;   // ~30 km/h
const DWELL_MS           = 2500;  // ms dwell at each stop
const SLOW_RADIUS        = 60;    // m — decelerate zone before stop

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useBusTracking() {
  const [stops, setStops]               = useState<Stop[]>(ROUTE_STOPS);
  const [busState, setBusState]         = useState<BusState | null>(null);
  const [allWaypoints, setAllWaypoints] = useState<[number, number][]>([]);
  const [routeReady, setRouteReady]     = useState(false);
  const [isPlaying, setIsPlaying]       = useState(true);
  const [cameraFollow, setCameraFollow] = useState(true);
  const [isDemoMode, setIsDemoMode]     = useState(true);

  // RAF-internal refs
  const rafRef       = useRef<number | null>(null);
  const wIdxRef      = useRef(0);
  const headingRef   = useRef(180);
  const dwellRef     = useRef(0);
  const lastTsRef    = useRef<number | null>(null);
  const pathRef      = useRef<[number, number][]>([]);
  const stopsRef     = useRef<Stop[]>(ROUTE_STOPS);
  const playRef      = useRef(true);
  const occupancyRef = useRef(58);

  useEffect(() => { playRef.current = isPlaying; }, [isPlaying]);

  // ── Step 1: Load stops from API (or fallback) ────────────────────────────
  useEffect(() => {
    fetch('http://localhost:8000/route/29A/stops')
      .then(r => r.json())
      .then((data: Stop[]) => {
        if (Array.isArray(data) && data.length >= 2) {
          setStops(data);
          stopsRef.current = data;
          setIsDemoMode(false);
        }
      })
      .catch(() => {
        stopsRef.current = ROUTE_STOPS;
        setIsDemoMode(true);
      });
  }, []);

  // ── Step 2: Build road-following path once stops are available ───────────
  useEffect(() => {
    if (stops.length < 2) return;
    setRouteReady(false);

    buildRoadPath(stops).then(path => {
      pathRef.current  = path;
      setAllWaypoints(path);
      wIdxRef.current  = 0;
      setRouteReady(true);
    });
  }, [stops]);

  // ── Step 3: RAF animation loop ───────────────────────────────────────────
  const tick = useCallback((ts: number) => {
    const path  = pathRef.current;
    const stops = stopsRef.current;

    if (path.length < 2 || stops.length < 2) {
      rafRef.current = requestAnimationFrame(tick);
      return;
    }

    const dt = lastTsRef.current !== null
      ? Math.min((ts - lastTsRef.current) / 1000, 0.1)
      : 0.016;
    lastTsRef.current = ts;

    if (!playRef.current) {
      rafRef.current = requestAnimationFrame(tick);
      return;
    }

    // Handle dwell pause at stop
    if (dwellRef.current > 0) {
      dwellRef.current -= dt * 1000;
      rafRef.current = requestAnimationFrame(tick);
      return;
    }

    const totalPts = path.length;
    const wIdx     = Math.min(Math.floor(wIdxRef.current), totalPts - 1);
    const [lat, lng] = path[wIdx];

    // Find nearest stop
    let nearestStopIdx = 0;
    let minDist = Infinity;
    stops.forEach((s, i) => {
      const d = haversineM(lat, lng, s.lat, s.lng);
      if (d < minDist) { minDist = d; nearestStopIdx = i; }
    });

    // Slow near stops
    const speedFactor = minDist < SLOW_RADIUS
      ? 0.25 + 0.75 * (minDist / SLOW_RADIUS)
      : 1.0;

    // Trigger dwell
    const atStop = minDist < 22;
    if (atStop && dwellRef.current <= 0) {
      dwellRef.current  = DWELL_MS;
      occupancyRef.current = Math.min(92, Math.max(28,
        occupancyRef.current + (Math.random() - 0.45) * 12
      ));
    }

    // Advance position: waypoints are exactly WAYPOINT_SPACING_M apart
    const pointsPerSec = SPEED_MS / WAYPOINT_SPACING_M;
    wIdxRef.current += pointsPerSec * speedFactor * dt;

    // Loop back
    if (wIdxRef.current >= totalPts - 1) wIdxRef.current = 0;

    // Smooth heading from road direction
    const nIdx = Math.min(wIdx + 2, totalPts - 1);
    const [nlat, nlng] = path[nIdx];
    if (haversineM(lat, lng, nlat, nlng) > 1) {
      const target = calcBearing(lat, lng, nlat, nlng);
      headingRef.current = lerpAngle(headingRef.current, target, 0.10);
    }

    const segIdx      = Math.min(nearestStopIdx, stops.length - 2);
    const nextStopIdx = Math.min(nearestStopIdx + 1, stops.length - 1);
    const nextStop    = stops[nextStopIdx];
    const distToNext  = haversineM(lat, lng, nextStop.lat, nextStop.lng);
    const etaNext     = Math.round(distToNext / SPEED_MS);
    const terminus    = stops[stops.length - 1];
    const etaTerm     = Math.round(haversineM(lat, lng, terminus.lat, terminus.lng) / SPEED_MS);

    const stopEtas: StopETA[] = stops.map((s, i) => ({
      stop_id:       s.stop_id,
      stop_name:     s.stop_name,
      lat:           s.lat,
      lng:           s.lng,
      stop_sequence: s.stop_sequence,
      eta_sec:       i <= nearestStopIdx ? 0 : Math.round(haversineM(lat, lng, s.lat, s.lng) / SPEED_MS),
      arrived:       i < nearestStopIdx,
    }));

    const progressRatio = wIdxRef.current / Math.max(1, totalPts - 1);

    setBusState({
      lat, lng,
      heading:         headingRef.current,
      speed:           Math.round(SPEED_MS * speedFactor * 3.6),
      segmentIdx:      segIdx,
      nearestStopIdx,
      nearestStopName: stops[nearestStopIdx].stop_name,
      nextStopName:    nextStop.stop_name,
      distToNextStop:  Math.round(distToNext),
      etaNextStop:     etaNext,
      etaTerminus:     etaTerm,
      atStop,
      occupancy:       Math.round(occupancyRef.current),
      stopEtas,
      progressRatio,
      waypointIdx:     wIdx,
    });

    rafRef.current = requestAnimationFrame(tick);
  }, []);

  // Start RAF only after road path is built
  useEffect(() => {
    if (!routeReady || allWaypoints.length < 2) return;
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [routeReady, allWaypoints, tick]);

  return {
    stops,
    busState,
    allWaypoints,
    routeReady,
    isPlaying,    setIsPlaying,
    cameraFollow, setCameraFollow,
    isDemoMode,
  };
}
