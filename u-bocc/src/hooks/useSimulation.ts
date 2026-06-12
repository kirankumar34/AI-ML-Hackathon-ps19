import { useState, useEffect, useCallback, useRef } from 'react';
import { Bus, Action, LogEntry, Depot } from '../types';
import { ROUTE_MAP, ROUTE_DEFINITIONS } from '../data/routes';
import { generateBuses } from '../data/buses';
import { INITIAL_ACTIONS } from '../data/actions';
import { INITIAL_ALERTS } from '../data/alerts';
import { DEPOTS } from '../data/compiledData';

const TICK_MS = 1000; // 1s simulation ticks

// Depot Coordinates map for dispatching
const DEPOT_COORDINATES: Record<string, [number, number]> = {
  'Adyar': [80.2574, 13.0049],
  'Broadway': [80.2785, 13.0878],
  'Tambaram': [80.1988, 12.9858],
  'Perambur': [80.2901, 13.1212],
  'Avadi': [80.1148, 13.1148],
  'CMBT': [80.2057, 13.0673],
  'Madhavaram': [80.2354, 13.1548],
  'Villivakkam': [80.2088, 13.1148],
};

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function computeHeading(from: [number, number], to: [number, number]): number {
  const dLng = to[0] - from[0];
  const dLat = to[1] - from[1];
  return (Math.atan2(dLng, dLat) * 180) / Math.PI;
}

function waypointDistance(a: [number, number], b: [number, number]): number {
  const dLng = (b[0] - a[0]) * Math.cos(((a[1] + b[1]) / 2) * (Math.PI / 180));
  const dLat = b[1] - a[1];
  return Math.sqrt(dLng * dLng + dLat * dLat) * 111; // rough km
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

export function useSimulation() {
  const [buses, setBuses] = useState<Bus[]>(() => generateBuses(160)); // Spawn 160 initial buses (20 per main route)
  const [actions, setActions] = useState<Action[]>([]);
  const [alerts] = useState(INITIAL_ALERTS);
  const [depots, setDepots] = useState<Depot[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  
  const [activeKpi, setActiveKpi] = useState({
    activeBuses: 160,
    overloaded: 0,
    avgWait: 18.0, // Before approval wait time is high
    avgOcc: 62,
    reserveFleet: 284,
    pendingActions: 8,
    busesLive: 160,
  });
  const [kpiUpdateTrigger, setKpiUpdateTrigger] = useState<Record<string, boolean>>({});

  const busesRef = useRef<Bus[]>(buses);
  useEffect(() => {
    busesRef.current = buses;
  }, [buses]);

  // Initialize actions and depots on mount
  useEffect(() => {
    setActions(INITIAL_ACTIONS);
    setDepots(DEPOTS);
    
    // Initial KPI setup
    const initialOverloadedCount = buses.filter(b => b.status === 'overloaded').length;
    setActiveKpi(prev => ({
      ...prev,
      overloaded: initialOverloadedCount,
      pendingActions: INITIAL_ACTIONS.length
    }));
  }, []);

  // Approve action
  const approveAction = useCallback((actionId: string, dispatchCount: number | null) => {
    setActions((prevActions) => {
      const actionToApprove = prevActions.find(a => a.id === actionId);
      if (!actionToApprove) return prevActions;

      const count = dispatchCount || actionToApprove.busesRequired || 0;
      const routeNo = actionToApprove.route;
      const depot = actionToApprove.depot || 'Broadway';

      // Add to logs
      const timestamp = new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' });
      const newLog: LogEntry = {
        id: `log-${Date.now()}-${Math.random()}`,
        timestamp,
        route: routeNo,
        actionType: actionToApprove.actionType,
        details: actionToApprove.actionType === 'ADD_BUSES' 
          ? `Dispatched ${count} buses from ${depot} depot to Route ${routeNo}.`
          : `Approved rerouting for Route ${routeNo} (${actionToApprove.routeDescription}).`,
        status: 'APPROVED',
      };
      setLogs(prev => [newLog, ...prev]);

      // Spawn dispatched buses at depot
      if (actionToApprove.actionType === 'ADD_BUSES') {
        const routeDef = ROUTE_MAP[routeNo];
        if (routeDef) {
          const depotCoord = DEPOT_COORDINATES[depot] || [80.2785, 13.0878];
          
          setBuses(prevBuses => {
            const newBuses: Bus[] = [];
            for (let i = 0; i < count; i++) {
              newBuses.push({
                id: `MTC-${routeNo}-DISP-${Date.now().toString().slice(-4)}-${i + 1}`,
                route: routeNo,
                type: routeDef.busType,
                status: 'running',
                waypointIndex: 0,
                waypointProgress: 0,
                direction: 1,
                lat: depotCoord[1],
                lng: depotCoord[0],
                heading: computeHeading(depotCoord, routeDef.waypoints[0]),
                occupancy: Math.floor(Math.random() * 30) + 10,
                speed: 40,
                currentStop: `Depot: ${depot}`,
                nextStop: routeDef.stops[0].name,
                eta: 5,
                directionLabel: 'Outbound',
                depot,
                dispatchStatus: 'dispatching',
              });
            }
            return [...prevBuses, ...newBuses];
          });
        }
      }

      // Update depot capacity if ADD_BUSES
      if (actionToApprove.actionType === 'ADD_BUSES' && actionToApprove.depot) {
        setDepots(prevDepots => prevDepots.map(depotObj => {
          if (depotObj.name.toUpperCase() === depot.toUpperCase()) {
            return {
              ...depotObj,
              busesAvailable: Math.max(0, depotObj.busesAvailable - count),
              busesDeployed: depotObj.busesDeployed + count
            };
          }
          return depotObj;
        }));
      }

      return prevActions.filter(a => a.id !== actionId);
    });
  }, []);

  // Reject action
  const rejectAction = useCallback((actionId: string) => {
    setActions((prevActions) => {
      const actionToReject = prevActions.find(a => a.id === actionId);
      if (!actionToReject) return prevActions;

      // Add to logs
      const timestamp = new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' });
      const newLog: LogEntry = {
        id: `log-${Date.now()}-${Math.random()}`,
        timestamp,
        route: actionToReject.route,
        actionType: actionToReject.actionType,
        details: actionToReject.actionType === 'ADD_BUSES'
          ? `Rejected bus dispatch request from ${actionToReject.depot} depot on Route ${actionToReject.route}.`
          : `Rejected rerouting request for Route ${actionToReject.route}.`,
        status: 'REJECTED',
      };
      setLogs(prev => [newLog, ...prev]);

      return prevActions.filter(a => a.id !== actionId);
    });
  }, []);

  // Run simulation updates at 1s intervals
  useEffect(() => {
    if (buses.length === 0) return;

    const interval = setInterval(() => {
      setBuses((prevBuses) => {
        // Build map of active buses on each route to manage headways
        const activeBusesOnRoute: Record<string, Bus[]> = {};
        prevBuses.forEach(b => {
          if (b.dispatchStatus === 'active') {
            if (!activeBusesOnRoute[b.route]) activeBusesOnRoute[b.route] = [];
            activeBusesOnRoute[b.route].push(b);
          }
        });

        return prevBuses.map((bus) => {
          const route = ROUTE_MAP[bus.route];

          // If no geometry (filler), do small random walk
          if (!route) {
            return {
              ...bus,
              lat: bus.lat + (Math.random() - 0.5) * 0.0001,
              lng: bus.lng + (Math.random() - 0.5) * 0.0001,
              occupancy: Math.min(100, Math.max(10, bus.occupancy + (Math.random() - 0.5) * 3)),
            };
          }

          // ── A. Dispatching bus: driving from depot to first waypoint ──
          if (bus.dispatchStatus === 'dispatching') {
            const targetCoord = route.waypoints[0];
            const distDeg = Math.sqrt(
              Math.pow(targetCoord[0] - bus.lng, 2) +
              Math.pow(targetCoord[1] - bus.lat, 2)
            );
            
            // Move directly towards first stop at 50 km/h
            const hoursPerTick = TICK_MS / 3600000;
            const kmPerTick = 50 * hoursPerTick;
            const degreesPerTick = kmPerTick / 111;
            
            if (distDeg <= degreesPerTick) {
              // Arrived at route start! Join the route
              return {
                ...bus,
                lat: targetCoord[1],
                lng: targetCoord[0],
                heading: computeHeading([bus.lng, bus.lat], route.waypoints[1] || targetCoord),
                waypointIndex: 0,
                waypointProgress: 0,
                direction: 1,
                dispatchStatus: 'active',
                speed: route.baseSpeedKmh,
                status: 'running',
                currentStop: route.stops[0].name,
                nextStop: route.stops[Math.min(1, route.stops.length - 1)].name,
              };
            } else {
              // Move towards the target coordinate
              const ratio = degreesPerTick / distDeg;
              const nextLng = lerp(bus.lng, targetCoord[0], ratio);
              const nextLat = lerp(bus.lat, targetCoord[1], ratio);
              const heading = computeHeading([bus.lng, bus.lat], targetCoord);
              return {
                ...bus,
                lat: nextLat,
                lng: nextLng,
                heading,
                speed: 50,
              };
            }
          }

          // ── B. Stopped / Stuck buses: don't move ──
          if (bus.status === 'stuck') return bus;
          
          // Stop dwell timer behavior
          if (bus.status === 'stopped' && bus.dwellTimeRemaining && bus.dwellTimeRemaining > 0) {
            const nextDwell = bus.dwellTimeRemaining - 1;
            if (nextDwell <= 0) {
              return {
                ...bus,
                status: 'running',
                dwellTimeRemaining: 0,
                speed: route.baseSpeedKmh,
              };
            }
            return {
              ...bus,
              dwellTimeRemaining: nextDwell,
              speed: 0,
            };
          }

          // ── C. Route-following movement ──
          const wps = route.waypoints;
          const totalWaypoints = wps.length;

          // Determine speed based on traffic zone proximity
          let baseSpeed = route.baseSpeedKmh;

          const isNearCoord = (center: [number, number], lat: number, lng: number, radiusKm: number) => {
            return waypointDistance([lng, lat], center) <= radiusKm;
          };

          let speedKmh = baseSpeed;
          // Red zones (Anna Salai Center / T.Nagar / Saidapet) -> 10 km/h
          if (
            isNearCoord([80.2500, 13.0500], bus.lat, bus.lng, 2.0) || 
            isNearCoord([80.2399, 13.0421], bus.lat, bus.lng, 1.2)
          ) {
            speedKmh = 10;
          } 
          // Orange zones (OMR Perungudi / GST Road / CMBT) -> 20 km/h
          else if (
            isNearCoord([80.2461, 12.9654], bus.lat, bus.lng, 2.5) || 
            isNearCoord([80.1492, 12.9675], bus.lat, bus.lng, 2.0) || 
            isNearCoord([80.2057, 13.0673], bus.lat, bus.lng, 1.2)
          ) {
            speedKmh = 20;
          } else {
            speedKmh = 35; // Green zone
          }

          // Spacing / Headway Management (avoid bus bunching)
          let headwaySpeedAdjustment = 1.0;
          const sameRouteBuses = activeBusesOnRoute[bus.route] || [];
          const myPos = bus.waypointIndex + bus.waypointProgress;

          const aheadBus = sameRouteBuses
            .filter(b => b.id !== bus.id && b.direction === bus.direction)
            .reduce((prev, curr) => {
              const currPos = curr.waypointIndex + curr.waypointProgress;
              if (bus.direction === 1) {
                if (currPos > myPos && (!prev || currPos < prev.waypointIndex + prev.waypointProgress)) {
                  return curr;
                }
              } else {
                if (currPos < myPos && (!prev || currPos > prev.waypointIndex + prev.waypointProgress)) {
                  return curr;
                }
              }
              return prev;
            }, null as Bus | null);

          if (aheadBus) {
            const spacing = Math.abs((aheadBus.waypointIndex + aheadBus.waypointProgress) - myPos);
            const minSpacing = totalWaypoints * 0.06; // 6% headway spacing
            if (spacing < minSpacing) {
              headwaySpeedAdjustment = 0.65; // slow trailing bus by 35%
            }
          }

          let finalSpeed = speedKmh * headwaySpeedAdjustment;

          // Slow down approaching intermediate stops
          let approachSlowdown = 1.0;
          const upcomingStops = route.stops.filter(s => 
            bus.direction === 1 ? s.waypointIndex > bus.waypointIndex : s.waypointIndex < bus.waypointIndex
          );
          if (upcomingStops.length > 0) {
            const nextStopObj = bus.direction === 1 ? upcomingStops[0] : upcomingStops[upcomingStops.length - 1];
            const wpsToStop = Math.abs(nextStopObj.waypointIndex - bus.waypointIndex);
            if (wpsToStop <= 4 && wpsToStop > 0) {
              approachSlowdown = Math.max(0.4, wpsToStop / 4.0);
            }
          }
          finalSpeed *= approachSlowdown;

          // Convert speed to degrees-per-tick
          const hoursPerTick = TICK_MS / 3600000;
          const kmPerTick = finalSpeed * hoursPerTick;
          const degreesPerTick = kmPerTick / 111;

          // Distance of current segment
          const fromWp = wps[bus.waypointIndex];
          const toWpIdx = Math.min(Math.max(bus.waypointIndex + bus.direction, 0), totalWaypoints - 1);
          const toWp = wps[toWpIdx];
          const segmentDistDeg = Math.sqrt(
            Math.pow(toWp[0] - fromWp[0], 2) +
            Math.pow(toWp[1] - fromWp[1], 2)
          );

          // Progress delta
          const progressDelta = segmentDistDeg > 0 ? degreesPerTick / segmentDistDeg : 0.2;

          let newProgress = bus.waypointProgress + progressDelta;
          let newWpIndex = bus.waypointIndex;
          let newDirection = bus.direction;

          // Advance
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

          // Check stop arrival
          let hitStop = false;
          let isTerminus = false;
          const passedStop = route.stops.find(s => s.waypointIndex === newWpIndex);
          if (passedStop && bus.waypointIndex !== newWpIndex) {
            hitStop = true;
            const stopIdx = route.stops.indexOf(passedStop);
            isTerminus = stopIdx === 0 || stopIdx === route.stops.length - 1;
          }

          // Interpolated coordinate
          const fromWpNew = wps[newWpIndex];
          const toWpNew = wps[Math.min(Math.max(newWpIndex + newDirection, 0), totalWaypoints - 1)];

          const lat = lerp(fromWpNew[1], toWpNew[1], newProgress);
          const lng = fromWpNew[0] + (toWpNew[0] - fromWpNew[0]) * newProgress;
          const heading = computeHeading(fromWpNew, toWpNew);

          const nextStop = getNextStopName(route, newWpIndex, newDirection);
          const currentStop = getCurrentStopName(route, newWpIndex, newDirection);

          // Dynamic ETA based on actual speed and road distance
          const nextStopObj = route.stops.find(s => s.name === nextStop);
          let eta = 5;
          if (nextStopObj) {
            let distDeg = 0;
            const startWp = Math.min(newWpIndex, nextStopObj.waypointIndex);
            const endWp = Math.max(newWpIndex, nextStopObj.waypointIndex);
            for (let idx = startWp; idx < endWp; idx++) {
              distDeg += Math.sqrt(
                Math.pow(wps[idx+1][0] - wps[idx][0], 2) +
                Math.pow(wps[idx+1][1] - wps[idx][1], 2)
              );
            }
            const distKm = distDeg * 111;
            eta = Math.max(1, Math.round((distKm / Math.max(8, finalSpeed)) * 60));
          }

          // Status & dwell setup
          let newStatus: Bus['status'] = bus.status;
          let dwellTime = 0;
          if (hitStop) {
            newStatus = 'stopped';
            dwellTime = isTerminus ? 30 : 15; // 30s for terminal, 15s for intermediate stops
          } else {
            // Very rare random status chance
            if (Math.random() < 0.001) {
              const rand = Math.random();
              if (rand < 0.85) newStatus = 'running';
              else if (rand < 0.95) newStatus = 'overloaded';
              else newStatus = 'stuck';
            }
          }

          return {
            ...bus,
            waypointIndex: newWpIndex,
            waypointProgress: newProgress,
            direction: newDirection,
            lat,
            lng,
            heading,
            speed: hitStop ? 0 : Math.round(finalSpeed),
            currentStop,
            nextStop,
            eta,
            directionLabel: newDirection === 1 ? 'Outbound' : 'Inbound',
            status: newStatus,
            dwellTimeRemaining: dwellTime,
            occupancy: Math.min(100, Math.max(10, bus.occupancy + Math.round((Math.random() - 0.5) * 2))),
          };
        });
      });
    }, TICK_MS);

    return () => clearInterval(interval);
  }, [buses.length]);

  // Update KPI metrics every 5 seconds (reading from ref)
  useEffect(() => {
    const interval = setInterval(() => {
      const currentBuses = busesRef.current;
      const activeCount = currentBuses.filter(b => b.status === 'running' && b.dispatchStatus === 'active').length;
      const overloadedCount = currentBuses.filter(b => b.status === 'overloaded').length;
      
      const totalOccupancy = currentBuses.reduce((acc, b) => acc + b.occupancy, 0);
      const avgOcc = currentBuses.length > 0 ? Math.round(totalOccupancy / currentBuses.length) : 62;

      setActiveKpi((prev) => {
        const updates: Record<string, boolean> = {};
        
        // Spawning buses visibly reduces wait time (frequency optimization impact)
        // More buses = lower wait times!
        // We'll calculate wait time dynamically: base 18.0 mins, reduced proportionally by how many active buses we have
        const waitReduction = Math.max(0, (currentBuses.length - 160) * 0.45);
        const newAvgWait = parseFloat(Math.max(6.0, 18.0 - waitReduction).toFixed(1));

        const newReserve = Math.max(0, 284 - (currentBuses.length - 160));
        
        if (activeCount !== prev.activeBuses) updates.activeBuses = true;
        if (overloadedCount !== prev.overloaded) updates.overloaded = true;
        if (newAvgWait !== prev.avgWait) updates.avgWait = true;
        if (avgOcc !== prev.avgOcc) updates.avgOcc = true;
        if (newReserve !== prev.reserveFleet) updates.reserveFleet = true;
        if (actions.length !== prev.pendingActions) updates.pendingActions = true;

        if (Object.keys(updates).length > 0) {
          setKpiUpdateTrigger(updates);
          setTimeout(() => setKpiUpdateTrigger({}), 1500);
        }

        return {
          activeBuses: activeCount,
          overloaded: overloadedCount,
          avgWait: newAvgWait,
          avgOcc: avgOcc,
          reserveFleet: newReserve,
          pendingActions: actions.length,
          busesLive: currentBuses.length,
        };
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [actions.length]);

  return {
    buses,
    actions,
    alerts,
    depots,
    logs,
    activeKpi,
    kpiUpdateTrigger,
    approveAction,
    rejectAction,
  };
}
