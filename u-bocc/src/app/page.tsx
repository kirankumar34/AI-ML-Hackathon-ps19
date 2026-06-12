'use client';

import React, { useState } from 'react';
import Header from '../components/Header';
import LeftSidebar from '../components/LeftSidebar';
import MapView from '../components/MapView';
import BusPopup from '../components/BusPopup';
import RightSidebar from '../components/RightSidebar';
import Legend from '../components/Legend';
import DisruptionTicker from '../components/DisruptionTicker';
import RouteDecisionOverlay from '../components/RouteDecisionOverlay';
import { useSimulation } from '../hooks/useSimulation';
import { useRouteOverlay } from '../hooks/useRouteOverlay';
import { Bus, Action } from '../types';

export default function DashboardPage() {
  const {
    buses,
    actions,
    alerts,
    depots,
    logs,
    activeKpi,
    kpiUpdateTrigger,
    approveAction,
    rejectAction,
  } = useSimulation();

  const { overlay, showOverlay, dismissOverlay } = useRouteOverlay();

  // Selected bus state
  const [selectedBusId, setSelectedBusId] = useState<string | null>(null);

  // Mounted state to prevent hydration mismatch
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Highlighted route after decision state
  const [highlightedRoute, setHighlightedRoute] = useState<{
    routeNumber: string;
    color: string;
    expiresAt: number;
  } | null>(null);

  // Active map layers
  const [layers, setLayers] = useState({
    routes: true,
    hotspots: false,
    depots: false,
    traffic: true,
  });

  // Handle bus marker click
  const handleSelectBus = (bus: Bus) => {
    setSelectedBusId(bus.id);
  };

  // Handle Approve with Overlay and Route Highlight
  const handleApproveAction = (action: Action, dispatchCount: number | null) => {
    approveAction(action.id, dispatchCount);

    const color = '#06d6a0'; // green for approved
    setHighlightedRoute({
      routeNumber: action.route,
      color,
      expiresAt: Date.now() + 8000,
    });

    const actionWithCount = {
      ...action,
      busesRequired: dispatchCount ?? action.busesRequired,
    };
    showOverlay(actionWithCount, 'APPROVED');

    setTimeout(() => {
      setHighlightedRoute((prev) => {
        if (prev && prev.routeNumber === action.route && prev.color === color) {
          return null;
        }
        return prev;
      });
    }, 8000);
  };

  // Handle Reject with Overlay and Route Highlight
  const handleRejectAction = (action: Action) => {
    rejectAction(action.id);

    const color = '#ef476f'; // red for rejected
    setHighlightedRoute({
      routeNumber: action.route,
      color,
      expiresAt: Date.now() + 8000,
    });

    showOverlay(action, 'REJECTED');

    setTimeout(() => {
      setHighlightedRoute((prev) => {
        if (prev && prev.routeNumber === action.route && prev.color === color) {
          return null;
        }
        return prev;
      });
    }, 8000);
  };

  // Find the selected bus object from current state
  const selectedBus = buses.find(b => b.id === selectedBusId) || null;

  if (!mounted) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#0a0a0f] text-[#6b6b80]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#4a9eff] border-t-transparent"></div>
          <span className="text-[10px] font-bold uppercase tracking-widest animate-pulse">Initializing Chennai MTC Command System...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-[#0a0a0f] text-[#e8e8f0] font-sans">
      {/* 1. Header KPI pill row */}
      <Header kpis={activeKpi} updateTrigger={kpiUpdateTrigger} />

      {/* Main Command Center workspace */}
      <div className="flex flex-1 w-full overflow-hidden relative">
        {/* 2. Left side layer controls */}
        <LeftSidebar 
          layers={layers} 
          setLayers={setLayers} 
          liveBusCount={buses.filter(b => b.status === 'running').length} 
        />

        {/* 3. Interactive Map (Leaflet Dark Theme) */}
        <div className="flex-1 h-full relative overflow-hidden">
          <MapView 
            buses={buses} 
            depots={depots}
            layers={layers}
            highlightedRoute={highlightedRoute}
            onSelectBus={handleSelectBus}
          />

          {/* Floating Bus Details popup (overlaid on top of map, bottom-left style) */}
          <BusPopup 
            bus={selectedBus} 
            onClose={() => setSelectedBusId(null)} 
          />

          {/* Floating Route Decision Toast Overlay (bottom-center, sitting above bottom ticker) */}
          {overlay && (
            <RouteDecisionOverlay overlay={overlay} onDismiss={dismissOverlay} />
          )}

          {/* Floating Map Legend (bottom-left) */}
          <Legend />
        </div>

        {/* 4. Right Sidebar Action console */}
        <RightSidebar
          actions={actions}
          alerts={alerts}
          depots={depots}
          logs={logs}
          onApproveAction={handleApproveAction}
          onRejectAction={handleRejectAction}
        />
      </div>

      {/* 5. Bottom disruption marquee ticker */}
      <DisruptionTicker />
    </div>
  );
}
