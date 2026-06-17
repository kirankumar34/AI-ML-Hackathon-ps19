import React from 'react';
import { Marker } from 'react-leaflet';
import L from 'leaflet';

interface BusMarkerProps {
  position: [number, number];
  heading: number;
  speed: number;
  atStop: boolean;
}

// Inject CSS once
function injectStyles() {
  if (typeof document === 'undefined') return;
  if (document.getElementById('bus-icon-css')) return;
  const el = document.createElement('style');
  el.id = 'bus-icon-css';
  el.textContent = `
    @keyframes ring1 {
      0%   { transform: scale(0.4); opacity: 1; }
      100% { transform: scale(2.6); opacity: 0; }
    }
    @keyframes ring2 {
      0%   { transform: scale(0.4); opacity: 0.7; }
      100% { transform: scale(2.2); opacity: 0; }
    }
    @keyframes stopBlink {
      0%,100% { opacity: 1; }
      50%     { opacity: 0.4; }
    }
  `;
  document.head.appendChild(el);
}

export default function BusMarker({ position, heading, speed, atStop }: BusMarkerProps) {
  injectStyles();

  const isMoving = speed > 2;
  const accent   = atStop ? '#f97316' : '#22d3ee';   // orange when stopped, cyan when moving
  const glow     = atStop ? 'rgba(249,115,22,0.5)' : 'rgba(34,211,238,0.5)';

  const html = `
    <div style="
      width:56px; height:56px;
      position:relative;
      display:flex; align-items:center; justify-content:center;
    ">
      ${isMoving ? `
        <div style="
          position:absolute; width:44px; height:44px; border-radius:50%;
          border:2px solid ${accent}; opacity:0.9;
          animation:ring1 1.8s ease-out infinite;
          pointer-events:none;
        "></div>
        <div style="
          position:absolute; width:44px; height:44px; border-radius:50%;
          border:1.5px solid ${accent}; opacity:0.6;
          animation:ring2 1.8s ease-out 0.5s infinite;
          pointer-events:none;
        "></div>
      ` : ''}

      <!-- Outer glow ring -->
      <div style="
        position:absolute; width:36px; height:36px; border-radius:50%;
        background:${glow}; filter:blur(6px); pointer-events:none;
        ${atStop ? 'animation:stopBlink 1.2s ease-in-out infinite;' : ''}
      "></div>

      <!-- Main bus body — rotates with heading -->
      <div style="
        position:relative; z-index:2;
        transform: rotate(${heading}deg);
        transition: transform 0.25s ease-out;
        display:flex; flex-direction:column; align-items:center; gap:1px;
      ">
        <!-- Direction arrow tip -->
        <div style="
          width:0; height:0;
          border-left:5px solid transparent;
          border-right:5px solid transparent;
          border-bottom:10px solid ${accent};
          filter:drop-shadow(0 0 4px ${accent});
          margin-bottom:-2px;
        "></div>

        <!-- Bus pill -->
        <div style="
          width:22px; height:30px;
          background:linear-gradient(180deg,#0c1a2e 0%,#111827 100%);
          border:2.5px solid ${accent};
          border-radius:6px 6px 4px 4px;
          box-shadow:0 0 10px ${glow}, 0 2px 8px rgba(0,0,0,0.6);
          display:flex; flex-direction:column; align-items:center;
          justify-content:space-between; padding:3px 3px 4px;
          position:relative; overflow:hidden;
        ">
          <!-- Windshield -->
          <div style="
            width:100%; height:9px;
            background:linear-gradient(135deg,${accent}44,${accent}22);
            border-radius:3px 3px 0 0;
            border-bottom:1px solid ${accent}55;
          "></div>
          <!-- Side windows strip -->
          <div style="display:flex; gap:2px;">
            <div style="width:5px;height:5px;background:${accent}66;border-radius:1px;"></div>
            <div style="width:5px;height:5px;background:${accent}66;border-radius:1px;"></div>
          </div>
          <!-- Undercarriage -->
          <div style="
            width:90%; height:2px;
            background:${accent}55; border-radius:1px;
          "></div>
        </div>
      </div>
    </div>
  `;

  const icon = L.divIcon({
    html,
    className: '',
    iconSize:   [56, 56],
    iconAnchor: [28, 28],
  });

  return <Marker position={position} icon={icon} zIndexOffset={1000} />;
}
