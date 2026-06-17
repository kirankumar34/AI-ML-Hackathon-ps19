import React from 'react';
import { useUBOCCStore } from '../../store/ubocc-store';

export function AlertBadge() {
  const { alerts } = useUBOCCStore();
  
  const activeAlerts = alerts.filter(a => a.status !== 'resolved');
  
  if (activeAlerts.length === 0) {
    return (
      <div className="relative inline-flex p-2 text-slate-400">
        <span className="text-xl">🔔</span>
      </div>
    );
  }

  const hasCritical = activeAlerts.some(a => a.severity === 'critical');
  const badgeColor = hasCritical ? 'bg-red-500' : 'bg-amber-500';
  const animationClass = hasCritical ? 'animate-pulse' : '';

  return (
    <div className="relative inline-flex p-2 text-slate-200 cursor-pointer hover:bg-slate-800 rounded-full transition-colors">
      <span className="text-xl">🔔</span>
      <span className={`absolute top-0 right-0 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white shadow-lg ${badgeColor} ${animationClass}`}>
        {activeAlerts.length > 9 ? '9+' : activeAlerts.length}
      </span>
    </div>
  );
}
