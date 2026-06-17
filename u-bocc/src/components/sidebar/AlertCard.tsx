import React from 'react';
import { FleetAlert } from '../../types';
import { useUBOCCStore } from '../../store/ubocc-store';

interface AlertCardProps {
  alert: FleetAlert;
}

const SEVERITY_STYLES = {
  critical: 'border-red-500 bg-red-950/30',
  high: 'border-amber-500 bg-amber-950/30',
  medium: 'border-orange-500 bg-orange-950/30',
};

const SEVERITY_ICONS = {
  critical: '🔴',
  high: '🟡',
  medium: '🟠',
};

export function AlertCard({ alert }: AlertCardProps) {
  const { acknowledgeAlert, resolveAlert, setFlyToTarget } = useUBOCCStore();

  const isAck = alert.status === 'acknowledged';

  const formatTime = (d: Date) => {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`p-3 rounded-md border-l-4 ${SEVERITY_STYLES[alert.severity]} shadow-md transition-opacity ${isAck ? 'opacity-60' : 'opacity-100'}`}>
      <div className="flex justify-between items-start mb-2">
        <div className="font-bold text-slate-200 text-sm flex items-center gap-2">
          {SEVERITY_ICONS[alert.severity]} {alert.code.replace(/_/g, ' ')}
        </div>
        <div className="text-xs text-slate-400 font-mono">
          {formatTime(alert.detectedAt)}
        </div>
      </div>
      
      <div className="text-sm text-slate-300 mb-3 leading-snug">
        {alert.description}
      </div>
      
      <div className="flex gap-2 text-xs font-semibold">
        <button 
          className="flex-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-600 transition-colors"
          onClick={() => {
            setFlyToTarget(alert.location);
          }}
        >
          VIEW ON MAP
        </button>
        
        {!isAck ? (
          <button 
            className="flex-1 py-1.5 px-2 bg-blue-900/40 hover:bg-blue-800/60 text-blue-300 rounded border border-blue-800 transition-colors"
            onClick={() => acknowledgeAlert(alert.id)}
          >
            ACKNOWLEDGE
          </button>
        ) : (
          <button 
            className="flex-1 py-1.5 px-2 bg-green-900/40 hover:bg-green-800/60 text-green-300 rounded border border-green-800 transition-colors"
            onClick={() => resolveAlert(alert.id)}
          >
            RESOLVE
          </button>
        )}
      </div>
    </div>
  );
}
