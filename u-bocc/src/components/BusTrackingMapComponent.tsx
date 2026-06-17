import React, { useEffect, useRef } from 'react';
import {
  MapContainer, TileLayer, Polyline, Marker, Popup, useMap,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import BusMarker from './BusMarker';
import { Stop, BusState } from '../hooks/useBusTracking';

interface Props {
  stops: Stop[];
  busState: BusState | null;
  allWaypoints: [number, number][];
  cameraFollow: boolean;
}

// Inject stop-pulse CSS once
function injectStopCSS() {
  if (typeof document === 'undefined') return;
  if (document.getElementById('stop-css')) return;
  const el = document.createElement('style');
  el.id = 'stop-css';
  el.textContent = `
    @keyframes sp {
      0%   { transform:scale(0.6); opacity:1; }
      100% { transform:scale(2.2); opacity:0; }
    }
    .leaflet-popup-content-wrapper {
      background:#0f172a !important;
      border:1px solid #1e293b !important;
      border-radius:12px !important;
      color:#e2e8f0 !important;
      box-shadow:0 8px 32px rgba(0,0,0,0.6) !important;
      padding:0 !important;
    }
    .leaflet-popup-tip { background:#0f172a !important; }
    .leaflet-popup-content { margin:0 !important; }
  `;
  document.head.appendChild(el);
}

// Camera follow controller
function CameraController({ pos, enabled }: { pos: [number, number]; enabled: boolean }) {
  const map = useMap();
  const posRef = useRef(pos);
  posRef.current = pos;

  useEffect(() => {
    if (!enabled) return;
    map.panTo(pos, { animate: true, duration: 0.6, easeLinearity: 0.4 });
  });
  return null;
}

// Fit to route on load
function FitBounds({ stops }: { stops: Stop[] }) {
  const map = useMap();
  const fitted = useRef(false);
  useEffect(() => {
    if (fitted.current || stops.length < 2) return;
    fitted.current = true;
    const bounds = L.latLngBounds(stops.map(s => [s.lat, s.lng] as [number, number]));
    map.fitBounds(bounds, { padding: [50, 50], animate: true });
  }, [stops, map]);
  return null;
}

function makeStopIcon(variant: 'past' | 'current' | 'next' | 'upcoming') {
  const cfg = {
    past:     { c: '#374151', border: '#4b5563',  size: 10, pulse: false },
    current:  { c: '#064e3b', border: '#10b981',  size: 14, pulse: true  },
    next:     { c: '#0c1a40', border: '#38bdf8',  size: 13, pulse: true  },
    upcoming: { c: '#0f172a', border: '#94a3b8',  size: 10, pulse: false },
  };
  const { c, border, size, pulse } = cfg[variant];
  const total = size + 12;
  return L.divIcon({
    html: `
      <div style="width:${total}px;height:${total}px;position:relative;
                  display:flex;align-items:center;justify-content:center;">
        ${pulse ? `
          <div style="position:absolute;width:${size + 6}px;height:${size + 6}px;
            border-radius:50%;border:2px solid ${border};opacity:0.8;
            animation:sp 1.6s ease-out infinite;pointer-events:none;">
          </div>` : ''}
        <div style="
          width:${size}px;height:${size}px;border-radius:50%;
          background:${c};border:2.5px solid ${border};
          box-shadow:${pulse ? `0 0 10px ${border}99` : 'none'};
          position:relative;z-index:2;">
        </div>
      </div>`,
    className: '',
    iconSize:   [total, total],
    iconAnchor: [total / 2, total / 2],
  });
}

export default function BusTrackingMapComponent({ stops, busState, allWaypoints, cameraFollow }: Props) {
  injectStopCSS();

  const busPos: [number, number] = busState
    ? [busState.lat, busState.lng]
    : stops.length > 0 ? [stops[0].lat, stops[0].lng] : [13.0827, 80.2707];

  const wIdx  = busState?.waypointIdx ?? 0;
  const segIdx = busState?.nearestStopIdx ?? 0;

  // Split path at current waypoint
  const donePath      = allWaypoints.slice(0, wIdx + 1);
  const remainingPath = allWaypoints.slice(wIdx);

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <MapContainer
        center={busPos}
        zoom={14}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        {/* Dark base map */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; OpenStreetMap &copy; CARTO'
        />

        {stops.length > 0 && <FitBounds stops={stops} />}
        {busState && cameraFollow && <CameraController pos={busPos} enabled={cameraFollow} />}

        {/* ── Completed path — thick green ── */}
        {donePath.length > 1 && (
          <Polyline
            positions={donePath}
            pathOptions={{ color: '#10b981', weight: 6, opacity: 0.9, lineCap: 'round', lineJoin: 'round' }}
          />
        )}

        {/* ── Remaining path — blue ── */}
        {remainingPath.length > 1 && (
          <Polyline
            positions={remainingPath}
            pathOptions={{ color: '#38bdf8', weight: 5, opacity: 0.55, lineCap: 'round', lineJoin: 'round' }}
          />
        )}

        {/* ── Stop markers ── */}
        {stops.map((stop, i) => {
          let variant: 'past' | 'current' | 'next' | 'upcoming' = 'upcoming';
          if (i < segIdx)      variant = 'past';
          else if (i === segIdx)    variant = 'current';
          else if (i === segIdx + 1) variant = 'next';

          return (
            <Marker key={stop.stop_id} position={[stop.lat, stop.lng]} icon={makeStopIcon(variant)}>
              <Popup>
                <div style={{ padding: '10px 14px', minWidth: '160px' }}>
                  <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: '13px', color: '#fff' }}>
                    {stop.stop_name}
                  </p>
                  <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>
                    Stop {stop.stop_sequence} of {stops.length}
                  </p>
                  {busState && (
                    <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#38bdf8', fontWeight: 600 }}>
                      {i < segIdx ? '✓ Departed'
                        : i === segIdx ? '📍 Bus is here'
                        : `ETA: ${Math.ceil((busState.stopEtas[i]?.eta_sec ?? 0) / 60)} min`}
                    </p>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* ── Bus ── */}
        {busState && (
          <BusMarker
            position={busPos}
            heading={busState.heading}
            speed={busState.speed}
            atStop={busState.atStop}
          />
        )}
      </MapContainer>
    </div>
  );
}
