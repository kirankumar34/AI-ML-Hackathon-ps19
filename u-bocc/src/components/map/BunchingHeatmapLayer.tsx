'use client';

import React from 'react';
import { Polyline, CircleMarker, Tooltip } from 'react-leaflet';
import { useUBOCCStore } from '../../store/ubocc-store';

const SEVERITY_COLORS = {
  green: '#22c55e', // text-green-500
  amber: '#f59e0b', // text-amber-500
  red: '#ef4444',   // text-red-500
};

export function BunchingHeatmapLayer() {
  const { segmentHeadways, bunchingClusters } = useUBOCCStore();

  return (
    <>
      {/* Render segments with colors based on deviation severity */}
      {segmentHeadways.map((segment) => {
        const positions: [number, number][] = [
          [segment.lat1, segment.lng1],
          [segment.lat2, segment.lng2],
        ];

        return (
          <Polyline
            key={`segment-${segment.segmentId}`}
            positions={positions}
            pathOptions={{
              color: SEVERITY_COLORS[segment.severity],
              weight: segment.severity === 'red' ? 6 : 4,
              opacity: 0.8,
              dashArray: segment.severity === 'amber' ? '10, 10' : undefined,
            }}
          >
            <Tooltip>
              <div className="text-sm font-medium">
                <p>Route {segment.routeId}</p>
                <p>Headway: {segment.actualHeadway} min</p>
                <p className="text-xs text-slate-500">Scheduled: {segment.scheduledHeadway} min</p>
              </div>
            </Tooltip>
          </Polyline>
        );
      })}

      {/* Render Heatmap circles for bunched buses */}
      {bunchingClusters.map((cluster, idx) => (
        <CircleMarker
          key={`cluster-${idx}`}
          center={cluster.center}
          radius={20}
          pathOptions={{
            color: SEVERITY_COLORS.red,
            fillColor: SEVERITY_COLORS.red,
            fillOpacity: 0.4,
            weight: 2,
          }}
        >
          <Tooltip>
            <div className="text-sm font-medium">
              <p className="text-red-500">⚠️ Severe Bunching</p>
              <p>Stop: {cluster.stopId}</p>
              <p>Buses: {cluster.busIds.join(', ')}</p>
            </div>
          </Tooltip>
        </CircleMarker>
      ))}
    </>
  );
}
