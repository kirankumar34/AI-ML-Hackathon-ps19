import React, { useState } from 'react';
import { useUBOCCStore } from '../../store/ubocc-store';
import { runSimulation } from '../../lib/computations/replaySimulator';
import { ROUTE_MAP } from '../../data/routes';
import { Route } from '../../types';

export function CounterfactualBuilder() {
  const { activeReplaySession, setSimulationResult } = useUBOCCStore();
  const [isRunning, setIsRunning] = useState(false);

  const handleRunSimulation = () => {
    if (!activeReplaySession) return;
    setIsRunning(true);
    
    // Simulate delay
    setTimeout(() => {
      // Create a mock counterfactual for the active route
      const mockCf = {
        id: `cf-${Date.now()}`,
        type: 'add_bus' as const,
        activateAt: '08:15',
        busId: 'CF-001',
        startStopId: 'Depot',
        routeId: activeReplaySession.routeId
      };

      const routeDef = ROUTE_MAP[activeReplaySession.routeId];

      if (routeDef) {
        const mappedRoute: Route = {
          busNo: routeDef.routeNumber,
          startPoint: routeDef.name.split(' \u2192 ')[0] || routeDef.name.split(' → ')[0] || '',
          endPoint: routeDef.name.split(' \u2192 ')[1] || routeDef.name.split(' → ')[1] || '',
          stops: routeDef.stops.map(s => s.name),
          coordinates: routeDef.waypoints.map(([lng, lat]) => [lat, lng]),
          serviceType: routeDef.busType,
          frequency: 'every 15 mins',
          firstTrip: '06:00',
          lastTrip: '22:00',
        };

        const result = runSimulation(
          activeReplaySession.historicalFrames,
          [mockCf],
          mappedRoute
        );
        setSimulationResult(result);
      }
      setIsRunning(false);
    }, 1000);
  };

  return (
    <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-xl shadow-xl overflow-hidden flex-1">
      <div className="bg-slate-800 p-3 border-b border-slate-700">
        <h3 className="font-bold text-slate-100 flex items-center gap-2 text-sm uppercase tracking-wider">
          🧪 WHAT IF...
        </h3>
      </div>
      <div className="p-4 space-y-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2 p-2 rounded bg-slate-800 border border-slate-700">
            <span className="text-green-400 font-bold">+</span>
            <span className="text-sm text-slate-300">Add Bus at 08:15</span>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex flex-col">
              <label className="text-xs text-slate-500 mb-1">From</label>
              <select className="bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-slate-200 outline-none focus:border-amber-500">
                <option>Nearest Depot</option>
                <option>Central Station</option>
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-xs text-slate-500 mb-1">Route</label>
              <select className="bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-slate-200 outline-none focus:border-amber-500" disabled>
                <option>{activeReplaySession?.routeId || '21C'}</option>
              </select>
            </div>
          </div>
        </div>

        <button 
          onClick={handleRunSimulation}
          disabled={isRunning || !activeReplaySession}
          className={`w-full py-2.5 rounded font-bold text-sm tracking-wide transition-colors flex justify-center items-center gap-2 ${
            isRunning 
              ? 'bg-amber-900/50 text-amber-600 cursor-wait'
              : 'bg-amber-600 hover:bg-amber-500 text-white'
          }`}
        >
          {isRunning ? (
            <>
              <span className="animate-spin text-lg leading-none">⟳</span> COMPUTING...
            </>
          ) : (
            <>
              <span className="text-lg leading-none">▶</span> RUN SIMULATION
            </>
          )}
        </button>
      </div>
    </div>
  );
}
