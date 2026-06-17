import React from 'react';
import { StopWaitEstimate } from '../../types';

interface StopInfoCardProps {
  estimates: StopWaitEstimate[];
  stopName: string;
  onClose: () => void;
}

export function StopInfoCard({ estimates, stopName, onClose }: StopInfoCardProps) {
  if (!estimates || estimates.length === 0) return null;

  // Assuming first estimate is representative of the stop's general demand level for UI simplicity
  const demandLevel = estimates[0].demandLevel;
  
  return (
    <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-[1000] w-80 bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-xl shadow-2xl overflow-hidden">
      <div className="p-3 border-b border-slate-700 flex justify-between items-center bg-slate-800">
        <h3 className="font-bold text-slate-100 flex items-center gap-2">
          📍 {stopName}
        </h3>
        <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
          ✕
        </button>
      </div>
      
      <div className="p-4 space-y-3">
        <div className="space-y-2">
          {estimates.map(est => (
            <div key={est.routeId} className="flex justify-between items-center bg-slate-800 p-2 rounded-lg border border-slate-700/50">
              <span className="text-sm font-medium text-slate-300">🚌 Route {est.routeId}</span>
              <span className="font-mono text-sm text-slate-200">{est.nextBusEtaMin} min <span className="text-xs text-slate-500">(#{est.nextBusId})</span></span>
            </div>
          ))}
        </div>
        
        <div className="pt-3 border-t border-slate-700/50 space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">⏱ Est. Wait:</span>
            <span className="font-bold text-white">~{estimates[0].estimatedWaitMin} min</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">👥 Demand:</span>
            <span className={`font-bold uppercase ${
              demandLevel === 'high' ? 'text-red-400' : 
              demandLevel === 'medium' ? 'text-amber-400' : 
              'text-green-400'
            }`}>
              {demandLevel}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
