import React from 'react';
import { useUBOCCStore } from '../../store/ubocc-store';
import { AlertCard } from './AlertCard';

export function AlertPanel() {
  const { alerts, clearResolvedAlerts } = useUBOCCStore();
  
  const activeAlerts = alerts.filter(a => a.status !== 'resolved');
  const resolvedAlerts = alerts.filter(a => a.status === 'resolved');

  return (
    <div className="w-80 bg-slate-900 border-l border-slate-700 h-full flex flex-col shadow-2xl overflow-hidden z-40">
      <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800">
        <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          🚨 Fleet Alerts
          <span className="bg-red-500/20 text-red-400 text-xs py-0.5 px-2 rounded-full font-mono">
            {activeAlerts.length} active
          </span>
        </h2>
        {resolvedAlerts.length > 0 && (
          <button 
            onClick={clearResolvedAlerts}
            className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            Clear Resolved
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeAlerts.length === 0 ? (
          <div className="text-center text-slate-500 py-8">
            <p>No active anomalies detected.</p>
            <p className="text-xs mt-2">Fleet is operating normally.</p>
          </div>
        ) : (
          activeAlerts.map(alert => (
            <AlertCard key={alert.id} alert={alert} />
          ))
        )}
      </div>
    </div>
  );
}
