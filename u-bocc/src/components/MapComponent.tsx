'use client';

import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Bus, Depot, Route } from '../types';
import { ROUTES } from '../data/compiledData';
import { ROUTE_MAP } from '../data/routes';

interface MapComponentProps {
  buses: Bus[];
  depots: Depot[];
  layers: {
    routes: boolean;
    hotspots: boolean;
    depots: boolean;
    traffic: boolean;
  };
  highlightedRoute: {
    routeNumber: string;
    color: string;
    expiresAt: number;
  } | null;
  onSelectBus: (bus: Bus) => void;
}

// Congestion/Traffic corridors coordinates
const TRAFFIC_CORRIDORS = {
  annaSalai: [
    [13.0827, 80.2707] as [number, number], // Central
    [13.0783, 80.2599] as [number, number], // Egmore
    [13.0500, 80.2500] as [number, number], // Anna Salai Center
    [13.0317, 80.2307] as [number, number], // T Nagar
    [13.0214, 80.2231] as [number, number], // Saidapet
    [13.0067, 80.2206] as [number, number], // Guindy
  ],
  gstRoad: [
    [13.0067, 80.2206] as [number, number], // Guindy
    [12.9975, 80.2006] as [number, number], // Alandur
    [12.9675, 80.1492] as [number, number], // Pallavaram
    [12.9516, 80.1409] as [number, number], // Chromepet
    [12.9230, 80.1171] as [number, number], // Tambaram
  ],
  omr: [
    [13.0012, 80.2565] as [number, number], // Adyar
    [12.9654, 80.2461] as [number, number], // Perungudi
    [12.9611, 80.2444] as [number, number], // Thoraipakkam
    [12.9428, 80.2325] as [number, number], // Karapakkam
    [12.9010, 80.2279] as [number, number], // Sholinganallur
    [12.8967, 80.2256] as [number, number], // Semmencheri
  ]
};

// 9 key routes to display polylines for (to keep the map responsive and beautiful)
const KEY_ROUTE_IDS = ['101', '102', '104', '23C', '21G', '29C', '18', '70', '87'];

// Custom Depot Icon Creator
const createDepotIcon = () => {
  return L.divIcon({
    className: 'custom-depot-marker',
    html: `<div class="flex items-center justify-center w-[26px] h-[26px] rounded-full bg-[#12121a]/95 border-2 border-[#b388ff] text-[#b388ff] shadow-lg hover:scale-110 transition-transform duration-200">
      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 20h18"/><path d="M6 20V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16"/></svg>
    </div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13]
  });
};

// Map settings controller
function MapController() {
  const map = useMap();
  useEffect(() => {
    // Force leaflet to invalidate size to prevent render glitches
    setTimeout(() => {
      map.invalidateSize();
    }, 200);
  }, [map]);
  return null;
}

// Helper to interpolate angles smoothly (handling 360 wrap-around)
const interpolateAngle = (current: number, target: number, lerpFactor: number) => {
  let diff = (target - current) % 360;
  if (diff < -180) diff += 360;
  if (diff > 180) diff -= 360;
  return current + diff * lerpFactor;
};

interface SmoothMarkerProps {
  bus: Bus;
  onSelectBus: (bus: Bus) => void;
}

function SmoothMarker({ bus, onSelectBus }: SmoothMarkerProps) {
  const markerRef = useRef<L.Marker | null>(null);
  
  // Store the current animated state in refs
  const currentLat = useRef(bus.lat);
  const currentLng = useRef(bus.lng);
  const currentHeading = useRef(bus.heading);
  
  // Track target values from props
  const targetLat = useRef(bus.lat);
  const targetLng = useRef(bus.lng);
  const targetHeading = useRef(bus.heading);
  
  useEffect(() => {
    targetLat.current = bus.lat;
    targetLng.current = bus.lng;
    targetHeading.current = bus.heading;
  }, [bus.lat, bus.lng, bus.heading]);

  // Keep a static initial position for react-leaflet so it doesn't reset position on render
  const [initialPosition] = useState<[number, number]>(() => [bus.lat, bus.lng]);

  useEffect(() => {
    let animFrame: number;
    
    const animate = () => {
      const marker = markerRef.current;
      if (marker) {
        // Interpolate position (Uber/Ola style smooth tracking)
        currentLat.current += (targetLat.current - currentLat.current) * 0.08;
        currentLng.current += (targetLng.current - currentLng.current) * 0.08;
        
        // Interpolate heading (gradual turning)
        currentHeading.current = interpolateAngle(currentHeading.current, targetHeading.current, 0.08);
        
        // Update leaflet marker coordinate
        marker.setLatLng([currentLat.current, currentLng.current]);
        
        // Rotate inner element
        const element = marker.getElement();
        if (element) {
          const inner = element.querySelector('.custom-bus-marker-inner') as HTMLElement;
          if (inner) {
            inner.style.transform = `rotate(${currentHeading.current}deg)`;
          }
        }
      }
      animFrame = requestAnimationFrame(animate);
    };
    
    animFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrame);
  }, []);

  const typeAbbrs: Record<string, string> = {
    'Ordinary': 'ORD',
    'Deluxe': 'DLX',
    'AC': 'AC',
    'Express': 'EXP',
  };
  const typeAbbr = typeAbbrs[bus.type] || 'ORD';

  // Get color and styling based on status and type
  let borderColor = 'border-[#4a9eff]'; // running
  let bgColor = 'bg-[#0a0a0f]/95';
  let textColor = 'text-[#e8e8f0]';
  let glowClass = '';
  let arrowColor = '#4a9eff';

  if (bus.status === 'stopped') {
    borderColor = 'border-[#ff8c42]';
    bgColor = 'bg-[#ff8c42]/20';
    textColor = 'text-[#ff8c42]';
    arrowColor = '#ff8c42';
  } else if (bus.status === 'overloaded') {
    borderColor = 'border-[#ef476f]';
    bgColor = 'bg-[#ef476f]/20';
    textColor = 'text-[#ef476f]';
    glowClass = 'animate-pulse shadow-[0_0_12px_rgba(239,71,111,0.8)] border-2';
    arrowColor = '#ef476f';
  } else if (bus.status === 'stuck') {
    borderColor = 'border-[#ffd166]';
    bgColor = 'bg-[#ffd166]/10';
    textColor = 'text-[#ffd166]';
    arrowColor = '#ffd166';
  }

  if (bus.status === 'running') {
    if (bus.type === 'Deluxe') {
      textColor = 'text-[#b388ff]';
      borderColor = 'border-[#b388ff]';
      arrowColor = '#b388ff';
    } else if (bus.type === 'AC') {
      textColor = 'text-[#00e5ff]';
      borderColor = 'border-[#00e5ff]';
      arrowColor = '#00e5ff';
    } else if (bus.type === 'Express') {
      textColor = 'text-[#ff8c42]';
      borderColor = 'border-[#ff8c42]';
      arrowColor = '#ff8c42';
    }
  }

  // Create DivIcon matching visual requirements: [21G] [AC] [65%]
  const icon = L.divIcon({
    className: 'custom-bus-marker-wrap',
    html: `
      <div class="custom-bus-marker-inner relative flex items-center justify-center w-[92px] h-[22px] rounded border ${borderColor} ${bgColor} ${textColor} ${glowClass} text-[8px] font-bold font-mono tracking-tighter shadow-md">
        <div class="bus-direction-arrow" style="border-bottom-color: ${arrowColor}"></div>
        <span>[${bus.route}] [${typeAbbr}] [${bus.occupancy}%]</span>
      </div>
    `,
    iconSize: [92, 22],
    iconAnchor: [46, 11]
  });

  return (
    <Marker
      position={initialPosition}
      ref={markerRef}
      icon={icon}
      eventHandlers={{
        click: () => onSelectBus(bus),
      }}
    />
  );
}

export default function MapComponent({ buses, depots, layers, highlightedRoute, onSelectBus }: MapComponentProps) {
  const position: [number, number] = [13.0827, 80.2707]; // Chennai center
  const zoom = 11;

  // Filter key routes that have coordinates
  const activeRoutes = Object.values(ROUTES).filter(
    (r: Route) => KEY_ROUTE_IDS.includes(r.busNo) && r.coordinates && r.coordinates.length > 0
  );

  return (
    <div className="relative h-full w-full bg-[#0a0a0f] z-10">
      <MapContainer
        center={position}
        zoom={zoom}
        minZoom={9}
        maxZoom={16}
        zoomControl={false}
        className="h-full w-full"
      >
        <MapController />
        
        {/* Dark basemap tiles */}
        <TileLayer
          attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {/* Route Polylines */}
        {layers.routes && activeRoutes.map((route) => (
          <Polyline
            key={route.busNo}
            positions={route.coordinates}
            pathOptions={{
              color: '#4a9eff',
              weight: 2.5,
              opacity: 0.55,
              dashArray: '5, 5'
            }}
          />
        ))}

        {/* Traffic Congestion Overlays */}
        {layers.traffic && (
          <>
            <Polyline
              positions={TRAFFIC_CORRIDORS.annaSalai}
              pathOptions={{ color: '#ef476f', weight: 4.5, opacity: 0.45 }}
            />
            <Polyline
              positions={TRAFFIC_CORRIDORS.gstRoad}
              pathOptions={{ color: '#ff8c42', weight: 4.5, opacity: 0.40 }}
            />
            <Polyline
              positions={TRAFFIC_CORRIDORS.omr}
              pathOptions={{ color: '#ffd166', weight: 4, opacity: 0.35 }}
            />
          </>
        )}

        {/* Highlight Route Polyline After Decision */}
        {highlightedRoute && (() => {
          const routeDef = ROUTE_MAP[highlightedRoute.routeNumber];
          if (!routeDef) return null;
          return (
            <>
              {/* Glow Layer */}
              <Polyline
                positions={routeDef.waypoints.map(([lng, lat]) => [lat, lng])}
                pathOptions={{
                  color: highlightedRoute.color,
                  weight: 12,
                  opacity: 0.25,
                }}
              />
              {/* Core Line Layer */}
              <Polyline
                positions={routeDef.waypoints.map(([lng, lat]) => [lat, lng])}
                pathOptions={{
                  color: highlightedRoute.color,
                  weight: 4,
                  opacity: 0.9,
                  dashArray: '6, 2',
                }}
              />
            </>
          );
        })()}

        {/* Congestion Hotspot Circles */}
        {layers.hotspots && (
          <>
            {/* Chepauk */}
            <Circle
              center={[13.0625, 80.2800]}
              radius={800}
              pathOptions={{
                fillColor: '#ef476f',
                fillOpacity: 0.2,
                color: '#ef476f',
                weight: 1.5,
                dashArray: '3, 3'
              }}
            />
            {/* Guindy */}
            <Circle
              center={[13.0067, 80.2206]}
              radius={1000}
              pathOptions={{
                fillColor: '#ef476f',
                fillOpacity: 0.18,
                color: '#ef476f',
                weight: 1.5,
                dashArray: '3, 3'
              }}
            />
            {/* Koyambedu */}
            <Circle
              center={[13.0673, 80.2057]}
              radius={1200}
              pathOptions={{
                fillColor: '#ef476f',
                fillOpacity: 0.18,
                color: '#ef476f',
                weight: 1.5,
                dashArray: '3, 3'
              }}
            />
            {/* Tambaram */}
            <Circle
              center={[12.9230, 80.1171]}
              radius={1100}
              pathOptions={{
                fillColor: '#ef476f',
                fillOpacity: 0.18,
                color: '#ef476f',
                weight: 1.5,
                dashArray: '3, 3'
              }}
            />
          </>
        )}

        {/* Depot Markers */}
        {layers.depots && depots.map((depot) => (
          <Marker
            key={depot.name}
            position={[depot.lat, depot.lng]}
            icon={createDepotIcon()}
          >
            <Popup className="custom-leaflet-popup">
              <div className="bg-[#12121a] border border-[#2a2a3a] text-[#e8e8f0] p-2.5 rounded-lg text-xs min-w-[150px] shadow-xl">
                <div className="font-bold text-[#b388ff] mb-1 flex items-center gap-1.5 uppercase tracking-wide">
                  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 20h18"/><path d="M6 20V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16"/></svg>
                  {depot.name} Depot
                </div>
                <div className="text-[10px] text-[#6b6b80] mb-2">{depot.location}</div>
                <div className="grid grid-cols-2 gap-2 text-center pt-1.5 border-t border-[#2a2a3a]">
                  <div className="flex flex-col bg-[#1a1a26] p-1 rounded border border-[#2a2a3a]">
                    <span className="font-mono font-bold text-[#06d6a0]">{depot.busesAvailable}</span>
                    <span className="text-[7px] text-[#6b6b80] uppercase tracking-wider">Available</span>
                  </div>
                  <div className="flex flex-col bg-[#1a1a26] p-1 rounded border border-[#2a2a3a]">
                    <span className="font-mono font-bold text-[#4a9eff]">{depot.busesDeployed}</span>
                    <span className="text-[7px] text-[#6b6b80] uppercase tracking-wider">Deployed</span>
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Smoothly Animated Snapped Bus Markers */}
        {buses.map((bus) => (
          <SmoothMarker
            key={bus.id}
            bus={bus}
            onSelectBus={onSelectBus}
          />
        ))}
      </MapContainer>
    </div>
  );
}
