'use client';

import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, Polygon, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Bus, Depot, Route } from '../types';
import { ROUTES } from '../data/compiledData';
import { useUBOCCStore } from '../store/ubocc-store';
import { classifyRoute, getCategoryColor } from '../data/buses';
import { ROUTE_MAP } from '../data/routes';
import ANNA_SALAI_GEOMETRY from '../data/anna_salai.json';
import GST_ROAD_GEOMETRY from '../data/gst_road.json';

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

const TRAFFIC_CORRIDORS = {
  annaSalai: ANNA_SALAI_GEOMETRY as [number, number][],
  gstRoad: GST_ROAD_GEOMETRY as [number, number][],
  omr: [
    [13.0012, 80.2565] as [number, number],
    [12.9654, 80.2461] as [number, number],
    [12.9611, 80.2444] as [number, number],
    [12.9428, 80.2325] as [number, number],
    [12.9010, 80.2279] as [number, number],
    [12.8967, 80.2256] as [number, number],
  ]
};

// 15 representative routes from dataset to display polylines for in normal/ops views
const REPRESENTATIVE_ROUTES = [
  '101', '102', '104', '29C', '23C', '18', '70', '87', '21G', '119', '154', '170A', '12B', '109', '47B'
];

// Major Hotspots with Stop Coordinates
const HOTSPOTS = [
  { name: 'T Nagar Depot', coords: [13.0421, 80.2399] as [number, number] },
  { name: 'Guindy Station', coords: [13.0067, 80.2206] as [number, number] },
  { name: 'Broadway Terminus', coords: [13.0878, 80.2785] as [number, number] },
  { name: 'Velachery Junction', coords: [12.9796, 80.2196] as [number, number] },
  { name: 'Sholinganallur', coords: [12.9010, 80.2279] as [number, number] },
  { name: 'Tambaram East', coords: [12.9230, 80.1171] as [number, number] },
  { name: 'Koyambedu CMBT', coords: [13.0673, 80.2057] as [number, number] }
];

// Emergency View Overlay Geometries
const VELACHERY_FLOOD_POLYGON: [number, number][] = [
  [12.986, 80.210],
  [12.989, 80.225],
  [12.973, 80.231],
  [12.966, 80.218],
];

const MUDICHUR_FLOOD_POLYGON: [number, number][] = [
  [12.918, 80.075],
  [12.924, 80.083],
  [12.911, 80.086],
  [12.906, 80.077],
];

const PALLIKARANAI_FLOOD_POLYGON: [number, number][] = [
  [12.943, 80.205],
  [12.951, 80.218],
  [12.937, 80.225],
  [12.932, 80.210],
];

// Custom Icons
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

const createClusterIcon = (count: number, routeNames: string) => {
  return L.divIcon({
    className: 'custom-cluster-marker',
    html: `<div class="flex items-center justify-center w-[36px] h-[36px] rounded-full bg-[#0a0a0f]/90 border-2 border-[#b388ff] text-[#b388ff] font-mono font-bold text-[10px] shadow-xl hover:scale-110 transition-all duration-200 animate-pulse" title="${routeNames}">
      ${count}
    </div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18]
  });
};

function MapController() {
  const map = useMap();
  useEffect(() => {
    setTimeout(() => {
      map.invalidateSize();
    }, 200);
  }, [map]);
  return null;
}

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
  
  const currentLat = useRef(bus.lat);
  const currentLng = useRef(bus.lng);
  const currentHeading = useRef(bus.heading);
  
  const targetLat = useRef(bus.lat);
  const targetLng = useRef(bus.lng);
  const targetHeading = useRef(bus.heading);
  
  useEffect(() => {
    targetLat.current = bus.lat;
    targetLng.current = bus.lng;
    targetHeading.current = bus.heading;
  }, [bus.lat, bus.lng, bus.heading]);

  const [initialPosition] = useState<[number, number]>(() => [bus.lat, bus.lng]);

  useEffect(() => {
    let animFrame: number;
    const animate = () => {
      const marker = markerRef.current;
      if (marker) {
        currentLat.current += (targetLat.current - currentLat.current) * 0.08;
        currentLng.current += (targetLng.current - currentLng.current) * 0.08;
        currentHeading.current = interpolateAngle(currentHeading.current, targetHeading.current, 0.08);
        marker.setLatLng([currentLat.current, currentLng.current]);
        
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

  let borderColor = 'border-[#4a9eff]';
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

  const icon = L.divIcon({
    className: 'custom-bus-marker-wrap',
    html: `
      <div class="custom-bus-marker-inner relative flex items-center justify-center w-[34px] h-[14px] rounded border ${borderColor} ${bgColor} ${textColor} ${glowClass} text-[7px] font-extrabold font-mono tracking-tighter shadow-sm">
        <span class="leading-none text-center">${bus.route}</span>
      </div>
    `,
    iconSize: [34, 14],
    iconAnchor: [17, 7]
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
  const position: [number, number] = [13.0827, 80.2707];
  const zoom = 11;
  const currentView = useUBOCCStore((state) => state.currentView);
  const activeEvents = useUBOCCStore((state) => state.activeEvents);
  const predictionTimeframe = useUBOCCStore((state) => state.predictionTimeframe);

  const [expandedClusters, setExpandedClusters] = useState<Record<string, boolean>>({});

  // Use high-resolution snapped geometries from routes.ts
  const activeRoutes = Object.values(ROUTE_MAP);

  // Grouping buses for intelligent visual clustering to mitigate clutter
  const clusters: Record<string, Bus[]> = {};
  buses.forEach((bus) => {
    // Generate cluster grid key (approx 500m spacing)
    const gridKey = `${Math.round(bus.lat * 170) / 170},${Math.round(bus.lng * 170) / 170}`;
    if (!clusters[gridKey]) clusters[gridKey] = [];
    clusters[gridKey].push(bus);
  });

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
        
        <TileLayer
          attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {/* ── Normal View or Routes Layer: Color-Coded Categorized Routes ── */}
        {layers.routes && activeRoutes.map((route: any) => {
          const category = classifyRoute(
            route.routeNumber,
            route.name.split(' → ')[0] || 'Origin',
            route.name.split(' → ')[1] || 'Destination',
            route.stops.map((s: any) => s.name),
            route.busType
          );
          
          const categoryMap: Record<string, 'Feeder' | 'Ring' | 'BRT' | 'Suburban'> = {
            feeder: 'Feeder',
            circular: 'Ring',
            express: 'BRT',
            suburban: 'Suburban'
          };
          if (!useUBOCCStore.getState().activeRouteLayers[categoryMap[category]]) return null;

          const color = getCategoryColor(category);
          return (
            <Polyline
              key={route.routeNumber}
              positions={route.waypoints.map(([lng, lat]: any) => [lat, lng])}
              pathOptions={{
                color: color,
                weight: 2.5,
                opacity: 0.75,
                dashArray: '4, 4'
              }}
            >
              <Tooltip sticky>
                <div className="bg-[#12121a] text-[#e8e8f0] border border-[#2a2a3a] text-[10px] p-1.5 rounded uppercase font-mono">
                  Route {route.routeNumber}: {route.name}
                </div>
              </Tooltip>
            </Polyline>
          );
        })}

        {/* ── Operations View: Traffic Congestion Corridors ── */}
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

        {/* ── AI View: 3-Tiered Concentric Hotspot Heatmap Layers ── */}
        {currentView === 'ai' && HOTSPOTS.map((h) => (
          <React.Fragment key={h.name}>
            {/* Inner Ring: Current Demand (Red) */}
            <Circle
              center={h.coords}
              radius={300}
              pathOptions={{
                fillColor: '#ef476f',
                fillOpacity: 0.35,
                color: '#ef476f',
                weight: 1.5,
              }}
            />
            {/* Middle Ring: Predicted Demand 30m (Orange) */}
            {(predictionTimeframe === '30m' || predictionTimeframe === '1h') && (
              <Circle
                center={h.coords}
                radius={600}
                pathOptions={{
                  fillColor: '#ff8c42',
                  fillOpacity: 0.20,
                  color: '#ff8c42',
                  weight: 1.0,
                  dashArray: '3, 3'
                }}
              />
            )}
            {/* Outer Ring: Predicted Demand 1h (Yellow) */}
            {predictionTimeframe === '1h' && (
              <Circle
                center={h.coords}
                radius={900}
                pathOptions={{
                  fillColor: '#ffd166',
                  fillOpacity: 0.10,
                  color: '#ffd166',
                  weight: 0.8,
                  dashArray: '4, 4'
                }}
              />
            )}
          </React.Fragment>
        ))}

        {/* ── Emergency View Overlays ── */}
        {currentView === 'emergency' && (
          <>
            {/* Flood Zone 1: Velachery */}
            <Polygon
              positions={VELACHERY_FLOOD_POLYGON}
              pathOptions={{
                color: '#ef476f',
                weight: 2,
                fillColor: '#00e5ff',
                fillOpacity: 0.25,
              }}
            >
              <Tooltip sticky>
                <div className="font-bold text-red-500 text-[10px]">CRITICAL FLOOD ZONE: VELACHERY BYPASS (1.5FT WATERLOGGING)</div>
              </Tooltip>
            </Polygon>

            {/* Flood Zone 2: Mudichur */}
            <Polygon
              positions={MUDICHUR_FLOOD_POLYGON}
              pathOptions={{
                color: '#ef476f',
                weight: 2,
                fillColor: '#00e5ff',
                fillOpacity: 0.25,
              }}
            >
              <Tooltip sticky>
                <div className="font-bold text-red-500 text-[10px]">CRITICAL FLOOD ZONE: MUDICHUR UNDERPASS</div>
              </Tooltip>
            </Polygon>

            {/* Flood Zone 3: Pallikaranai */}
            <Polygon
              positions={PALLIKARANAI_FLOOD_POLYGON}
              pathOptions={{
                color: '#ef476f',
                weight: 2,
                fillColor: '#00e5ff',
                fillOpacity: 0.20,
              }}
            >
              <Tooltip sticky>
                <div className="font-bold text-orange-500 text-[10px]">WARNING FLOOD ZONE: PALLIKARANAI LOW AREA</div>
              </Tooltip>
            </Polygon>

            {/* Metro Construction Closure Pin (Kodambakkam) */}
            {activeEvents.some(e => e.id === 'evt-kodambakkam-metro') && (
              <Circle
                center={[13.0472, 80.2282]}
                radius={350}
                pathOptions={{
                  color: '#ff8c42',
                  weight: 2.5,
                  fillColor: '#ff8c42',
                  fillOpacity: 0.35,
                  dashArray: '4, 2',
                }}
              >
                <Popup className="custom-leaflet-popup">
                  <div className="bg-[#12121a] text-[#e8e8f0] p-2 text-xs border border-[#2a2a3a] rounded shadow-2xl">
                    <span className="font-bold text-orange-400 block mb-1">METRO CONSTRUCTION BLOCKAGE</span>
                    Kodambakkam High Road reduced to 1 lane. Alternate diversions recommended.
                  </div>
                </Popup>
              </Circle>
            )}

            {/* Temple Festival Closure Pin (Mylapore Tank) */}
            <Circle
              center={[13.0330, 80.2680]}
              radius={400}
              pathOptions={{
                color: '#ffd166',
                weight: 2,
                fillColor: '#ffd166',
                fillOpacity: 0.25,
              }}
            >
              <Tooltip sticky>
                <div className="font-bold text-yellow-400 text-[10px]">FESTIVAL RESTRICTION: MYLAPORE TANK ROAD CLOSED</div>
              </Tooltip>
            </Circle>
          </>
        )}

        {/* Highlighted Route Detour Path */}
        {highlightedRoute && (() => {
          const routeDef = ROUTE_MAP[highlightedRoute.routeNumber];
          if (!routeDef) return null;
          return (
            <>
              <Polyline
                positions={routeDef.waypoints.map(([lng, lat]) => [lat, lng])}
                pathOptions={{
                  color: highlightedRoute.color,
                  weight: 10,
                  opacity: 0.30,
                }}
              />
              <Polyline
                positions={routeDef.waypoints.map(([lng, lat]) => [lat, lng])}
                pathOptions={{
                  color: highlightedRoute.color,
                  weight: 3.5,
                  opacity: 0.95,
                  dashArray: '6, 2',
                }}
              />
            </>
          );
        })()}

        {/* Depots */}
        {layers.depots && depots.map((depot) => (
          <Marker
            key={depot.name}
            position={[depot.lat, depot.lng]}
            icon={createDepotIcon()}
          >
            <Popup className="custom-leaflet-popup">
              <div className="bg-[#12121a] border border-[#2a2a3a] text-[#e8e8f0] p-2.5 rounded-lg text-xs min-w-[150px] shadow-xl">
                <div className="font-bold text-[#b388ff] mb-1 flex items-center gap-1.5 uppercase tracking-wide">
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

        {/* ── Bus Rendering ── */}
        {currentView !== 'normal' && buses.map((bus) => {
          const routeDef = ROUTE_MAP[bus.route];
          if (!routeDef) return null;
          const category = classifyRoute(
            routeDef.routeNumber,
            routeDef.name.split(' → ')[0] || 'Origin',
            routeDef.name.split(' → ')[1] || 'Destination',
            routeDef.stops.map((s: any) => s.name),
            routeDef.busType
          );
          const categoryMap: Record<string, 'Feeder' | 'Ring' | 'BRT' | 'Suburban'> = {
            feeder: 'Feeder',
            circular: 'Ring',
            express: 'BRT',
            suburban: 'Suburban'
          };
          if (!useUBOCCStore.getState().activeRouteLayers[categoryMap[category]]) return null;

          return (
            <SmoothMarker
              key={bus.id}
              bus={bus}
              onSelectBus={onSelectBus}
            />
          );
        })}
      </MapContainer>
    </div>
  );
}
