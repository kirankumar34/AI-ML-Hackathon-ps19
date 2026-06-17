'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Bus, Action, LogEntry, Depot, FleetAlert } from '../types';
import { DEPOTS } from '../data/compiledData';
import { ROUTE_MAP, ROUTE_DEFINITIONS } from '../data/routes';
import { generateBuses, classifyRoute, getCategoryColor, getHomeDepot } from '../data/buses';
import { useUBOCCStore } from '../store/ubocc-store';

const TICK_MS = 1000; // 1s simulation ticks

// Dynamic Route Map generated from routes.ts to strictly follow road geometry
const DYNAMIC_ROUTE_MAP = Object.values(ROUTE_MAP).reduce((acc, r: any) => {
  const category = classifyRoute(
    r.routeNumber,
    r.name.split(' → ')[0] || 'Origin',
    r.name.split(' → ')[1] || 'Destination',
    r.stops.map((s: any) => s.name),
    r.busType
  );
  const color = getCategoryColor(category);
  acc[r.routeNumber] = {
    ...r,
    color,
  };
  return acc;
}, {} as Record<string, any>);

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

export function useSimulation() {
  const [buses, setBuses] = useState<Bus[]>(() => generateBuses(560));
  const [actions, setActions] = useState<Action[]>([]);
  const [depots, setDepots] = useState<Depot[]>(() =>
    DEPOTS.map((d) => ({
      ...d,
      busesAvailable: Math.floor(Math.random() * 20) + 10,
      busesDeployed: d.routes.length * 2,
    }))
  );
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [divertedRoutes, setDivertedRoutes] = useState<Record<string, boolean>>({});

  // We read current view and active events from the Zustand store
  const {
    currentView,
    activeEvents,
    setActiveEvents,
    recommendations,
    setRecommendations,
    addAlert,
    alerts,
    setTrafficScores,
  } = useUBOCCStore();

  const [activeKpi, setActiveKpi] = useState({
    activeBuses: 560,
    overloaded: 0,
    avgWait: 18.0,
    avgOcc: 62,
    reserveFleet: 140,
    pendingActions: 0,
    busesLive: 560,
  });
  const [kpiUpdateTrigger, setKpiUpdateTrigger] = useState<Record<string, boolean>>({});

  const busesRef = useRef<Bus[]>(buses);
  const divertedRoutesRef = useRef<Record<string, boolean>>(divertedRoutes);
  const actionsRef = useRef<Action[]>(actions);

  useEffect(() => {
    busesRef.current = buses;
  }, [buses]);

  useEffect(() => {
    divertedRoutesRef.current = divertedRoutes;
  }, [divertedRoutes]);

  useEffect(() => {
    actionsRef.current = actions;
  }, [actions]);

  // Shared bus spawning function
  const spawnBus = useCallback((routeNo: string, depot: string, count: number) => {
    const routeDef = DYNAMIC_ROUTE_MAP[routeNo];
    if (!routeDef) return;

    const depotObj = DEPOTS.find((d) => d.name.toUpperCase() === depot.toUpperCase());
    const depotCoord: [number, number] = depotObj ? [depotObj.lng, depotObj.lat] : [80.2785, 13.0878];

    // Add to logs
    const timestamp = new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' });
    const newLog: LogEntry = {
      id: `log-${Date.now()}-${Math.random()}`,
      timestamp,
      route: routeNo,
      actionType: 'ADD_BUSES',
      details: `Dispatched ${count} reserve bus${count > 1 ? 'es' : ''} from ${depot} depot to Route ${routeNo}.`,
      status: 'APPROVED',
    };
    setLogs((prev) => [newLog, ...prev]);

    setBuses((prevBuses) => {
      const newBuses: Bus[] = [];
      for (let i = 0; i < count; i++) {
        newBuses.push({
          id: `MTC-${routeNo}-DISP-${Date.now().toString().slice(-4)}-${i + 1}`,
          route: routeNo,
          type: routeDef.busType === 'Express' ? 'Express' : 'Ordinary',
          status: 'running',
          waypointIndex: 0,
          waypointProgress: 0,
          direction: 1,
          lat: depotCoord[1],
          lng: depotCoord[0],
          heading: computeHeading(depotCoord, routeDef.waypoints[0]),
          occupancy: Math.floor(Math.random() * 30) + 15,
          speed: 40,
          currentStop: `Depot: ${depot}`,
          nextStop: routeDef.stops[0]?.name || 'Origin',
          eta: 5,
          directionLabel: 'Outbound',
          depot,
          dispatchStatus: 'dispatching',
        });
      }
      return [...prevBuses, ...newBuses];
    });

    // Update depot capacity
    setDepots((prevDepots) =>
      prevDepots.map((d) => {
        if (d.name.toUpperCase() === depot.toUpperCase()) {
          return {
            ...d,
            busesAvailable: Math.max(0, d.busesAvailable - count),
            busesDeployed: d.busesDeployed + count,
          };
        }
        return d;
      })
    );
  }, []);

  // Register spawnBus callback in Zustand store
  const setSpawnBusCallback = useUBOCCStore((state) => state.setSpawnBusCallback);
  useEffect(() => {
    setSpawnBusCallback(spawnBus);
    return () => {
      setSpawnBusCallback(null);
    };
  }, [spawnBus, setSpawnBusCallback]);

  // Approve action
  const approveAction = useCallback(
    (actionId: string, dispatchCount: number | null) => {
      setActions((prevActions) => {
        const actionToApprove = prevActions.find((a) => a.id === actionId);
        if (!actionToApprove) return prevActions;

        const count = dispatchCount || actionToApprove.busesRequired || 0;
        const routeNo = actionToApprove.route;
        const depot = actionToApprove.depot || 'ADYAR';

        if (actionToApprove.actionType === 'ADD_BUSES') {
          spawnBus(routeNo, depot, count);
        } else if (actionToApprove.actionType === 'REROUTE') {
          // Set route as diverted!
          setDivertedRoutes((prev) => ({ ...prev, [routeNo]: true }));

          const timestamp = new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' });
          const newLog: LogEntry = {
            id: `log-${Date.now()}-${Math.random()}`,
            timestamp,
            route: routeNo,
            actionType: 'REROUTE',
            details: `Approved rerouting/diversion for Route ${routeNo} via alternate bypass corridors.`,
            status: 'APPROVED',
          };
          setLogs((prev) => [newLog, ...prev]);
        }

        return prevActions.filter((a) => a.id !== actionId);
      });
    },
    [spawnBus]
  );

  // Reject action
  const rejectAction = useCallback((actionId: string) => {
    setActions((prevActions) => {
      const actionToReject = prevActions.find((a) => a.id === actionId);
      if (!actionToReject) return prevActions;

      const timestamp = new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' });
      const newLog: LogEntry = {
        id: `log-${Date.now()}-${Math.random()}`,
        timestamp,
        route: actionToReject.route,
        actionType: actionToReject.actionType,
        details:
          actionToReject.actionType === 'ADD_BUSES'
            ? `Rejected additional bus dispatch request for Route ${actionToReject.route}.`
            : `Rejected diversion proposal for Route ${actionToReject.route}.`,
        status: 'REJECTED',
      };
      setLogs((prev) => [newLog, ...prev]);

      return prevActions.filter((a) => a.id !== actionId);
    });
  }, []);

  // ── Mock City Event Scheduler ──
  // Cycles through typical Chennai scenarios every 15-20 ticks
  useEffect(() => {
    let tickCount = 0;

    const interval = setInterval(() => {
      tickCount++;

      // Every 5 ticks (~5s for demo, matches calculated traffic interval of 5 mins)
      // Recalculate Traffic scores dynamically
      if (tickCount % 5 === 0) {
        const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min)) + min;
        
        const store = useUBOCCStore.getState();
        const activeEventsList = store.activeEvents;

        // TrafficScore = TrafficDensity + PassengerDemand + WeatherImpact + EventImpact + RoadworkImpact
        const scoreTNagar = rand(30, 50) + (activeEventsList.some((e: any) => e.location.includes('Mylapore')) ? 30 : 0);
        const scoreGuindy = rand(40, 65) + (activeEventsList.some((e: any) => e.location.includes('Kodambakkam')) ? 25 : 0);
        const scoreBroadway = rand(25, 45);
        const scoreVelachery = rand(35, 55) + (activeEventsList.some((e: any) => e.type === 'FLOOD' || e.location.includes('Velachery')) ? 45 : 0);
        const scoreSholi = rand(30, 50) + (activeEventsList.some((e: any) => e.type === 'MARINA') ? 20 : 0);
        const scoreTambaram = rand(45, 65) + (activeEventsList.some((e: any) => e.type === 'FLOOD') ? 30 : 0);
        const scoreKoyambedu = rand(50, 75) + (activeEventsList.some((e: any) => e.location.includes('Kodambakkam')) ? 20 : 0);

        const getRisk = (score: number) => {
          if (score >= 85) return 'CRITICAL';
          if (score >= 65) return 'HIGH';
          if (score >= 45) return 'MEDIUM';
          return 'LOW';
        };

        store.setTrafficScores([
          { area: 'T Nagar', score: Math.min(100, scoreTNagar), risk: getRisk(scoreTNagar) },
          { area: 'Guindy', score: Math.min(100, scoreGuindy), risk: getRisk(scoreGuindy) },
          { area: 'Broadway', score: Math.min(100, scoreBroadway), risk: getRisk(scoreBroadway) },
          { area: 'Velachery', score: Math.min(100, scoreVelachery), risk: getRisk(scoreVelachery) },
          { area: 'Sholinganallur', score: Math.min(100, scoreSholi), risk: getRisk(scoreSholi) },
          { area: 'Tambaram', score: Math.min(100, scoreTambaram), risk: getRisk(scoreTambaram) },
          { area: 'Koyambedu', score: Math.min(100, scoreKoyambedu), risk: getRisk(scoreKoyambedu) },
        ]);
      }

      // Periodically trigger events and sync recommendations
      if (tickCount === 2) {
        // Event 1: Metro Construction at Kodambakkam High Road
        const newEvent = {
          id: 'evt-kodambakkam-metro',
          type: 'CONSTRUCTION' as const,
          title: 'Kodambakkam High Road Metro works',
          location: 'Kodambakkam High Road',
          impact: '40% Lane reduction, severe bottlenecking',
          affectedRoutes: ['29C', '23C', '12B'],
          suggestedAction: 'Divert Route 29C & 23C via G.N. Chetty Road and Valluvar Kottam bypass.',
          confidence: 94,
          improvement: 'Reduces delay propagation by 12 mins. Restores frequency to 85%.',
          severity: 'high' as const,
        };

        const store = useUBOCCStore.getState();
        store.setActiveEvents([newEvent]);

        // Trigger Alert
        store.addAlert({
          id: 'alert-metro-kodambakkam',
          code: 'SEVERE_DELAY',
          routeId: '29C',
          detectedAt: new Date(),
          description: 'Kodambakkam Metro works: Route 29C slowing down. Speeds < 8 km/h. Bunching suspected.',
          severity: 'high',
          status: 'active',
          location: [13.0472, 80.2282],
        });

        // Add to active recommendations list
        store.setRecommendations([
          {
            id: 'rec-metro-kodambakkam',
            priority: 'high',
            busId: 'MTC-29C-012',
            routeId: '29C',
            action: 'reroute',
            dispatchFrom: 'ADYAR',
            timeToAct: 120,
            predictedGapMin: 15,
            expectedHeadwayAfter: 6,
            confidence: 0.94,
            createdAt: Date.now(),
            reasons: [{ type: 'delay_propagation', description: 'Metro construction slowdown near Kodambakkam', weight: 0.8 }],
            problemDetected: 'Metro Construction (40% lane capacity reduction) near Kodambakkam High Road',
            affectedRoutesList: ['29C', '23C', '12B'],
            predictedImpact: 'Travel times increased by 18 mins. Bunching index up to 0.72.',
            suggestedAction: 'Divert Route 29C and 23C via G.N. Chetty Road to bypass congested junction.',
            confidenceScore: 94,
            expectedImprovement: 'Saves 12 mins travel delay. Regularizes headway from 25m to 8m.',
          },
        ]);

        // Add to sidebar list actions without duplicates
        setActions((prev) => {
          if (prev.some((a) => a.id === 'act-metro-kodambakkam')) return prev;
          return [
            {
              id: 'act-metro-kodambakkam',
              route: '29C',
              priority: 'CRITICAL',
              actionType: 'REROUTE',
              description: 'Divert Route 29C via G.N. Chetty Road bypass to avoid Metro construction.',
              routeDescription: 'Besant Nagar → Perambur (via Kodambakkam bypass)',
              depot: 'ADYAR',
              busesRequired: null,
              waitBefore: 27,
              waitAfter: 10,
              impact: 'Avoids 40% lane bottleneck at Kodambakkam High Road.',
            },
            ...prev,
          ];
        });
      } else if (tickCount === 20) {
        // Event 2: Velachery Main Road Sewer/Roadworks
        const newEvent = {
          id: 'evt-velachery-roadworks',
          type: 'ROADWORKS' as const,
          title: 'Velachery Main Road Sewer Repairs',
          location: 'Velachery Main Road',
          impact: '35% congestion increase',
          affectedRoutes: ['119', '102', '102C'],
          suggestedAction: 'Reroute buses via Velachery Bypass Road and Taramani Link Road.',
          confidence: 89,
          improvement: 'Avoids 18 min bottleneck. Restores regular headway timing.',
          severity: 'medium' as const,
        };

        const store = useUBOCCStore.getState();
        const activeEventsList = store.activeEvents;
        if (!activeEventsList.some((e: any) => e.id === 'evt-velachery-roadworks')) {
          store.setActiveEvents([...activeEventsList, newEvent]);
        }

        store.addAlert({
          id: 'alert-velachery-roadworks',
          code: 'severe_delay' as any,
          routeId: '119',
          detectedAt: new Date(),
          description: 'Velachery roadworks causing severe crawl speed (7 km/h) for Route 119.',
          severity: 'medium',
          status: 'active',
          location: [12.9796, 80.2196],
        });

        const recs = store.recommendations;
        if (!recs.some((r: any) => r.id === 'rec-velachery-roadworks')) {
          store.setRecommendations([
            ...recs,
            {
              id: 'rec-velachery-roadworks',
              priority: 'medium',
              busId: 'MTC-119-004',
              routeId: '119',
              action: 'reroute',
              dispatchFrom: 'ADYAR',
              timeToAct: 180,
              predictedGapMin: 12,
              expectedHeadwayAfter: 7,
              confidence: 0.89,
              createdAt: Date.now(),
              reasons: [{ type: 'gap_prediction', description: 'Roadwork bottleneck near Velachery', weight: 0.7 }],
              problemDetected: 'Emergency sewer repairs on Velachery Main Road causing 35% delay increase.',
              affectedRoutesList: ['119', '102', '102C'],
              predictedImpact: 'Headway collapse. 15 min gaps forming between Velachery and Guindy.',
              suggestedAction: 'Divert Route 119 and 102 via Velachery Bypass and Taramani Link Road.',
              confidenceScore: 89,
              expectedImprovement: 'Saves 14 mins delay. Stabilizes headway gap down to 6 mins.',
            },
          ]);
        }

        setActions((prev) => {
          if (prev.some((a) => a.id === 'act-velachery-roadworks')) return prev;
          return [
            {
              id: 'act-velachery-roadworks',
              route: '119',
              priority: 'MEDIUM',
              actionType: 'REROUTE',
              description: 'Divert Route 119 via Velachery Bypass to avoid sewer repair works.',
              routeDescription: 'Guindy TVK Estate → Semmancheri (via Velachery Bypass)',
              depot: 'ADYAR',
              busesRequired: null,
              waitBefore: 22,
              waitAfter: 11,
              impact: 'Bypasses Velachery Main Road bottleneck.',
            },
            ...prev,
          ];
        });
      } else if (tickCount === 40) {
        // Event 3: Heavy Rain & Waterlogging at Velachery & Pallikaranai
        const newEvent = {
          id: 'evt-velachery-flooding',
          type: 'FLOOD' as const,
          title: 'Heavy Rain & Waterlogging',
          location: 'Velachery / Pallikaranai',
          impact: 'Heavy rain alert (85% probability). Waterlogging up to 1.5 ft.',
          affectedRoutes: ['119', '104', '101'],
          suggestedAction: 'Activate Emergency Flood Diversions. Reroute via Pallikaranai Bypass.',
          confidence: 95,
          improvement: 'Maintains 100% service continuity. Reduces vehicle water hazard risk.',
          severity: 'critical' as const,
        };

        const store = useUBOCCStore.getState();
        const activeEventsList = store.activeEvents;
        if (!activeEventsList.some((e: any) => e.id === 'evt-velachery-flooding')) {
          store.setActiveEvents([...activeEventsList, newEvent]);
        }

        store.addAlert({
          id: 'alert-velachery-flood',
          code: 'severe_delay' as any,
          routeId: '104',
          detectedAt: new Date(),
          description: 'Velachery bypass waterlogged. Route 104 and 119 buses moving extremely slow. Crawl speed.',
          severity: 'critical',
          status: 'active',
          location: [12.9796, 80.2196],
        });

        const recs = store.recommendations;
        if (!recs.some((r: any) => r.id === 'rec-velachery-flood')) {
          store.setRecommendations([
            ...recs,
            {
              id: 'rec-velachery-flood',
              priority: 'critical',
              busId: 'MTC-104-002',
              routeId: '104',
              action: 'reroute',
              dispatchFrom: 'TAMBARAM',
              timeToAct: 90,
              predictedGapMin: 22,
              expectedHeadwayAfter: 9,
              confidence: 0.95,
              createdAt: Date.now(),
              reasons: [{ type: 'breakdown', description: 'Flooding waterlogging hazard', weight: 0.95 }],
              problemDetected: 'Severe waterlogging (1.5 ft) on Velachery bypass underpass due to heavy rains (85% probability).',
              affectedRoutesList: ['119', '104', '101'],
              predictedImpact: 'Bus operations at risk of complete stalling. Commute delay +30 mins.',
              suggestedAction: 'Divert Route 119 & 104 via Pallikaranai bypass road. Deploy 5 additional high-chassis buses.',
              confidenceScore: 95,
              expectedImprovement: 'Keeps routes open. Prevents engine failures. Limits delays to +10 mins.',
            },
          ]);
        }

        setActions((prev) => {
          if (prev.some((a) => a.id === 'act-velachery-flood')) return prev;
          return [
            {
              id: 'act-velachery-flood',
              route: '104',
              priority: 'CRITICAL',
              actionType: 'REROUTE',
              description: 'Divert Route 104 via Pallikaranai bypass road to avoid waterlogged underpass.',
              routeDescription: 'Redhills → Tambaram (via Pallikaranai bypass detour)',
              depot: 'TAMBARAM',
              busesRequired: null,
              waitBefore: 35,
              waitAfter: 12,
              impact: 'Bypasses dangerous waterlogged underpass.',
            },
            ...prev,
          ];
        });
      }
    }, TICK_MS);

    return () => clearInterval(interval);
  }, []);

  // ── Bus Movement Tick Loop ──
  useEffect(() => {
    const interval = setInterval(() => {
      setBuses((prevBuses) => {
        if (prevBuses.length === 0) return prevBuses;
        
        const activeEventsList = useUBOCCStore.getState().activeEvents;
        const activeBusesOnRoute: Record<string, Bus[]> = {};
        
        prevBuses.forEach((b) => {
          if (b.dispatchStatus === 'active') {
            if (!activeBusesOnRoute[b.route]) activeBusesOnRoute[b.route] = [];
            activeBusesOnRoute[b.route].push(b);
          }
        });

        return prevBuses.map((bus) => {
          const route = DYNAMIC_ROUTE_MAP[bus.route];

          if (!route) {
            return {
              ...bus,
              lat: bus.lat + (Math.random() - 0.5) * 0.0001,
              lng: bus.lng + (Math.random() - 0.5) * 0.0001,
              occupancy: Math.min(100, Math.max(10, bus.occupancy + (Math.random() - 0.5) * 3)),
            };
          }

          // A. Dispatching bus: driving from depot to first waypoint
          if (bus.dispatchStatus === 'dispatching') {
            const targetCoord = route.waypoints[0];
            const distDeg = Math.sqrt(
              Math.pow(targetCoord[0] - bus.lng, 2) + Math.pow(targetCoord[1] - bus.lat, 2)
            );

            const hoursPerTick = TICK_MS / 3600000;
            const kmPerTick = 50 * hoursPerTick;
            const degreesPerTick = kmPerTick / 111;

            if (distDeg <= degreesPerTick) {
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
                currentStop: route.stops[0]?.name || 'Origin',
                nextStop: route.stops[Math.min(1, route.stops.length - 1)]?.name || 'Next Stop',
              };
            } else {
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

          if (bus.status === 'stuck') return bus;

          // Dwell timer
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

          // B. Route following
          const wps = route.waypoints;
          const totalWaypoints = wps.length;

          let baseSpeed = route.baseSpeedKmh;
          let speedKmh = baseSpeed;

          // Proximity slowdown checks (Dynamic Event slowdowns!)
          const isNearCoord = (center: [number, number], lat: number, lng: number, radiusKm: number) => {
            return waypointDistance([lng, lat], center) <= radiusKm;
          };

          // 1. Kodambakkam Construction slowdown (Route 29C & 23C)
          const isKodambakkamEventActive = activeEventsList.some((e) => e.id === 'evt-kodambakkam-metro');
          const isDiverted = divertedRoutesRef.current[bus.route];

          if (
            isKodambakkamEventActive &&
            (bus.route === '29C' || bus.route === '23C') &&
            isNearCoord([13.0472, 80.2282], bus.lat, bus.lng, 1.2)
          ) {
            if (!isDiverted) {
              speedKmh = 8; // Crawling bottleneck!
            } else {
              speedKmh = baseSpeed * 0.9; // detour is fast!
            }
          }
          // 2. Velachery Roadworks slowdown (Route 119 & 102)
          else if (
            activeEventsList.some((e) => e.id === 'evt-velachery-roadworks') &&
            (bus.route === '119' || bus.route === '102') &&
            isNearCoord([12.9796, 80.2196], bus.lat, bus.lng, 1.0)
          ) {
            if (!isDiverted) {
              speedKmh = 7;
            } else {
              speedKmh = baseSpeed * 0.85;
            }
          }
          // 3. Velachery Heavy Rain Flooding slowdown
          else if (
            activeEventsList.some((e) => e.id === 'evt-velachery-flooding') &&
            (bus.route === '104' || bus.route === '119' || bus.route === '101') &&
            isNearCoord([12.9796, 80.2196], bus.lat, bus.lng, 1.5)
          ) {
            if (!isDiverted) {
              speedKmh = 5; // near stalling!
            } else {
              speedKmh = baseSpeed * 0.8;
            }
          }
          // Default Traffic Corridors slowdowns
          else if (isNearCoord([13.05, 80.25], bus.lat, bus.lng, 1.5)) {
            speedKmh = 12; // Anna Salai Center
          } else if (isNearCoord([13.0421, 80.2399], bus.lat, bus.lng, 1.0)) {
            speedKmh = 14; // T Nagar
          } else {
            speedKmh = baseSpeed;
          }

          // Spacing adjustments
          let headwaySpeedAdjustment = 1.0;
          const sameRouteBuses = activeBusesOnRoute[bus.route] || [];
          const myPos = bus.waypointIndex + bus.waypointProgress;

          const aheadBus = sameRouteBuses
            .filter((b) => b.id !== bus.id && b.direction === bus.direction)
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
            const spacing = Math.abs(aheadBus.waypointIndex + aheadBus.waypointProgress - myPos);
            const minSpacing = totalWaypoints * 0.08;
            if (spacing < minSpacing) {
              headwaySpeedAdjustment = 0.7; // Slow down trailing bus to re-align headway
            }
          }

          let finalSpeed = speedKmh * headwaySpeedAdjustment;

          // Dwell slowdown near stops
          let approachSlowdown = 1.0;
          const upcomingStops = route.stops.filter((s: any) =>
            bus.direction === 1 ? s.waypointIndex > bus.waypointIndex : s.waypointIndex < bus.waypointIndex
          );
          if (upcomingStops.length > 0) {
            const nextStopObj = bus.direction === 1 ? upcomingStops[0] : upcomingStops[upcomingStops.length - 1];
            const wpsToStop = Math.abs(nextStopObj.waypointIndex - bus.waypointIndex);
            if (wpsToStop <= 2 && wpsToStop > 0) {
              approachSlowdown = Math.max(0.4, wpsToStop / 2.0);
            }
          }
          finalSpeed *= approachSlowdown;

          const hoursPerTick = TICK_MS / 3600000;
          const kmPerTick = finalSpeed * hoursPerTick;
          const degreesPerTick = kmPerTick / 111;

          const fromWp = wps[bus.waypointIndex];
          const toWpIdx = Math.min(Math.max(bus.waypointIndex + bus.direction, 0), totalWaypoints - 1);
          const toWp = wps[toWpIdx];
          const segmentDistDeg = Math.sqrt(Math.pow(toWp[0] - fromWp[0], 2) + Math.pow(toWp[1] - fromWp[1], 2));

          // Guard against extremely small distances and cap progressDelta to 1.0
          const progressDelta = segmentDistDeg > 0.00001
            ? Math.min(1.0, degreesPerTick / segmentDistDeg)
            : 0.25;

          let newProgress = bus.waypointProgress + progressDelta;
          let newWpIndex = bus.waypointIndex;
          let newDirection = bus.direction;

          let iterations = 0;
          while (newProgress >= 1 && iterations < 10) {
            iterations++;
            newProgress -= 1;
            newWpIndex += newDirection;

            if (newWpIndex >= totalWaypoints - 1) {
              newWpIndex = totalWaypoints - 2;
              newDirection = -1;
            } else if (newWpIndex < 0) {
              newWpIndex = 1;
              newDirection = 1;
            }
          }
          if (newProgress >= 1) {
            newProgress = 0.99; // Cap runaway progress
          }

          let hitStop = false;
          let isTerminus = false;
          const passedStop = route.stops.find((s: any) => s.waypointIndex === newWpIndex);
          if (passedStop && bus.waypointIndex !== newWpIndex) {
            hitStop = true;
            const stopIdx = route.stops.indexOf(passedStop);
            isTerminus = stopIdx === 0 || stopIdx === route.stops.length - 1;
          }

          const fromWpNew = wps[newWpIndex];
          const toWpNew = wps[Math.min(Math.max(newWpIndex + newDirection, 0), totalWaypoints - 1)];

          const lat = lerp(fromWpNew[1], toWpNew[1], newProgress);
          const lng = fromWpNew[0] + (toWpNew[0] - fromWpNew[0]) * newProgress;
          const heading = computeHeading(fromWpNew, toWpNew);

          const stopsList = route.stops;
          const currentStop = stopsList[Math.min(newWpIndex, stopsList.length - 1)]?.name || route.name.split(' ↔ ')[0];
          const nextStop = stopsList[Math.min(newWpIndex + 1, stopsList.length - 1)]?.name || route.name.split(' ↔ ')[1];

          let eta = 5;
          const nextStopObj = route.stops.find((s: any) => s.name === nextStop);
          if (nextStopObj) {
            const dist = Math.abs(nextStopObj.waypointIndex - newWpIndex) * 0.6; // approx km
            eta = Math.max(1, Math.round((dist / Math.max(10, finalSpeed)) * 60));
          }

          let newStatus: Bus['status'] = bus.status;
          let dwellTime = 0;
          if (hitStop) {
            newStatus = 'stopped';
            dwellTime = isTerminus ? 20 : 10;
          } else {
            if (Math.random() < 0.001) {
              const randStatus = Math.random();
              if (randStatus < 0.8) newStatus = 'running';
              else if (randStatus < 0.95) newStatus = 'overloaded';
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
  }, []);

  // Update KPI metrics periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const currentBuses = busesRef.current;
      const activeCount = currentBuses.filter((b) => b.status === 'running' && b.dispatchStatus === 'active').length;
      const overloadedCount = currentBuses.filter((b) => b.status === 'overloaded').length;

      const totalOccupancy = currentBuses.reduce((acc, b) => acc + b.occupancy, 0);
      const avgOcc = currentBuses.length > 0 ? Math.round(totalOccupancy / currentBuses.length) : 62;

      setActiveKpi((prev) => {
        const updates: Record<string, boolean> = {};

        // Calculate avgWait time based on active count and active diversions
        // More buses + more diversions approved = lower wait times!
        const diversionCount = Object.keys(divertedRoutesRef.current).length;
        const waitReduction = Math.max(0, (currentBuses.length - 560) * 0.35 + diversionCount * 1.5);
        const newAvgWait = parseFloat(Math.max(6.0, 18.0 - waitReduction).toFixed(1));

        const newReserve = Math.max(0, 140 - (currentBuses.length - 560));
        const pendingActionsCount = actionsRef.current.length;

        if (activeCount !== prev.activeBuses) updates.activeBuses = true;
        if (overloadedCount !== prev.overloaded) updates.overloaded = true;
        if (newAvgWait !== prev.avgWait) updates.avgWait = true;
        if (avgOcc !== prev.avgOcc) updates.avgOcc = true;
        if (newReserve !== prev.reserveFleet) updates.reserveFleet = true;
        if (pendingActionsCount !== prev.pendingActions) updates.pendingActions = true;

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
          pendingActions: pendingActionsCount,
          busesLive: currentBuses.length,
        };
      });
    }, 4000);

    return () => clearInterval(interval);
  }, []);

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
