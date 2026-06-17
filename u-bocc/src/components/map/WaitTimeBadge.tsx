import React from 'react';
import { Marker, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import { useUBOCCStore } from '../../store/ubocc-store';

export function WaitTimeBadge() {
  const { stopWaitEstimates } = useUBOCCStore();

  return (
    <>
      {stopWaitEstimates.map((estimate) => {
        let colorClass = 'bg-green-500';
        let borderColor = 'border-green-600';
        
        if (estimate.estimatedWaitMin > 12) {
          colorClass = 'bg-red-500';
          borderColor = 'border-red-600';
        } else if (estimate.estimatedWaitMin >= 5) {
          colorClass = 'bg-amber-500';
          borderColor = 'border-amber-600';
        }

        const iconHtml = `
          <div class="flex items-center justify-center w-8 h-8 rounded-full ${colorClass} text-white font-bold text-xs border-2 shadow-md ${borderColor}">
            ${estimate.estimatedWaitMin}m
          </div>
        `;

        const customIcon = L.divIcon({
          html: iconHtml,
          className: 'custom-wait-time-icon',
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        return (
          <Marker 
            key={`wait-time-${estimate.stopId}`} 
            position={[estimate.lat, estimate.lng]} 
            icon={customIcon}
          >
            <Tooltip direction="top" offset={[0, -16]} opacity={1}>
              <div className="text-sm font-medium p-1">
                <p className="font-bold text-slate-800 border-b pb-1 mb-1">{estimate.stopName}</p>
                <p className="text-slate-600 text-xs mb-1">Route {estimate.routeId}</p>
                <div className="flex justify-between gap-4">
                  <span>Next Bus:</span>
                  <span className="font-mono">{estimate.nextBusEtaMin} min</span>
                </div>
                <div className="flex justify-between gap-4 font-bold text-blue-600">
                  <span>Est. Wait:</span>
                  <span className="font-mono">~{estimate.estimatedWaitMin} min</span>
                </div>
                <div className="flex justify-between gap-4 text-xs text-slate-500 mt-1">
                  <span>Demand:</span>
                  <span className="uppercase">{estimate.demandLevel}</span>
                </div>
              </div>
            </Tooltip>
          </Marker>
        );
      })}
    </>
  );
}
