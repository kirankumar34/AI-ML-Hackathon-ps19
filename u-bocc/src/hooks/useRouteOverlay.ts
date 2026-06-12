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
      busesRequired?: number | null;
      depot?: string | null;
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
      busesAdded: action.busesRequired ?? undefined,
      depot: action.depot ?? undefined,
      visibleUntil: Date.now() + 8000,
    });

    // Auto-dismiss after 8 seconds
    const timer = setTimeout(() => setOverlay(null), 8000);
    return () => clearTimeout(timer);
  }, []);

  const dismissOverlay = useCallback(() => setOverlay(null), []);

  return { overlay, showOverlay, dismissOverlay };
}
