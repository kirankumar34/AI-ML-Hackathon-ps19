'use client';

import React from 'react';
import { Bus as BusType } from '../types';
import { X, Navigation, AlertTriangle, Gauge, Clock, Compass } from 'lucide-react';

interface BusPopupProps {
  bus: BusType | null;
  onClose: () => void;
}

export default function BusPopup({ bus, onClose }: BusPopupProps) {
  if (!bus) return null;

  // Status mapping
  const statusColors = {
    running: 'text-[#06d6a0] bg-[#06d6a0]/10 border-[#06d6a0]/30',
    stopped: 'text-[#ff8c42] bg-[#ff8c42]/10 border-[#ff8c42]/30',
    overloaded: 'text-[#ef476f] bg-[#ef476f]/10 border-[#ef476f]/30',
    stuck: 'text-[#ffd166] bg-[#ffd166]/10 border-[#ffd166]/30',
  };

  const statusLabels = {
    running: 'RUNNING',
    stopped: 'STOPPED',
    overloaded: 'OVERLOADED',
    stuck: 'STUCK',
  };

  // Type mapping
  const typeColors = {
    Ordinary: 'text-[#e8e8f0] bg-zinc-800 border-zinc-700',
    Deluxe: 'text-[#b388ff] bg-[#b388ff]/10 border-[#b388ff]/30',
    AC: 'text-[#00e5ff] bg-[#00e5ff]/10 border-[#00e5ff]/30',
    Express: 'text-[#ff8c42] bg-[#ff8c42]/10 border-[#ff8c42]/30',
  };

  // Occupancy color bar
  const getOccupancyColor = (occ: number) => {
    if (occ > 90) return 'bg-[#ef476f]';
    if (occ > 75) return 'bg-[#ffd166]';
    return 'bg-[#4a9eff]';
  };

  return (
    <div className="absolute top-4 left-4 z-20 w-[280px] bg-[#12121a]/95 border border-[#2a2a3a] text-[#e8e8f0] rounded-lg shadow-[0_4px_20px_rgba(0,0,0,0.5)] p-4 animate-[scaleIn_0.15s_ease-out] backdrop-blur-sm">
      {/* Close button */}
      <button 
        onClick={onClose}
        className="absolute top-2.5 right-2.5 text-[#6b6b80] hover:text-[#e8e8f0] p-1 rounded-full transition-colors cursor-pointer"
      >
        <X className="h-4 w-4" />
      </button>

      {/* Header Info */}
      <div className="flex items-center justify-between mb-3.5 pr-6">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono tracking-tight text-white">{bus.route}</span>
          <span className="text-[9px] font-bold text-[#6b6b80] font-mono">{bus.id}</span>
        </div>
        <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${typeColors[bus.type]}`}>
          {bus.type}
        </span>
      </div>

      {/* Divider */}
      <div className="h-px bg-[#2a2a3a] w-full mb-3.5" />

      {/* Status Alert Badge */}
      <div className="mb-4">
        <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded border uppercase tracking-wider ${statusColors[bus.status]}`}>
          {bus.status === 'overloaded' && <AlertTriangle className="h-3.5 w-3.5" />}
          {statusLabels[bus.status]}
        </span>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-3.5 mb-4 text-xs">
        <div className="flex flex-col gap-0.5">
          <span className="text-[9px] font-bold text-[#6b6b80] uppercase tracking-wider">Current Stop</span>
          <span className="font-semibold text-white truncate" title={bus.currentStop}>{bus.currentStop}</span>
        </div>

        <div className="flex flex-col gap-0.5">
          <span className="text-[9px] font-bold text-[#6b6b80] uppercase tracking-wider">Next Stop</span>
          <span className="font-semibold text-[#06d6a0] truncate" title={bus.nextStop}>{bus.nextStop}</span>
        </div>

        <div className="flex flex-col gap-0.5">
          <span className="text-[9px] font-bold text-[#6b6b80] uppercase tracking-wider flex items-center gap-1">
            <Clock className="h-3 w-3 text-[#ffd166]" /> ETA
          </span>
          <span className="font-bold text-white font-mono">
            {bus.status === 'stuck' ? '---' : `${bus.eta} mins`}
          </span>
        </div>

        <div className="flex flex-col gap-0.5">
          <span className="text-[9px] font-bold text-[#6b6b80] uppercase tracking-wider">Home Depot</span>
          <span className="font-semibold text-[#b388ff] truncate">{bus.depot}</span>
        </div>

        <div className="flex flex-col gap-0.5">
          <span className="text-[9px] font-bold text-[#6b6b80] uppercase tracking-wider flex items-center gap-1">
            <Gauge className="h-3 w-3 text-[#4a9eff]" /> Speed
          </span>
          <span className="font-bold text-white font-mono">{bus.speed} km/h</span>
        </div>

        <div className="flex flex-col gap-0.5">
          <span className="text-[9px] font-bold text-[#6b6b80] uppercase tracking-wider flex items-center gap-1">
            <Compass className="h-3 w-3 text-[#b388ff]" /> Heading
          </span>
          <span className="font-semibold text-white flex items-center gap-1 font-mono">
            {bus.heading}° <Navigation style={{ transform: `rotate(${bus.heading}deg)` }} className="h-3 w-3 inline text-[#b388ff] fill-current" />
          </span>
        </div>
      </div>

      {/* Occupancy Indicator */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[#6b6b80]">
          <span>Occupancy</span>
          <span className="font-mono text-white">{bus.occupancy}%</span>
        </div>
        <div className="w-full bg-[#1a1a26] rounded-full h-2 overflow-hidden border border-[#2a2a3a]">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${getOccupancyColor(bus.occupancy)}`} 
            style={{ width: `${bus.occupancy}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[9px] text-[#6b6b80] pt-0.5 font-bold uppercase tracking-wider">
          <span>{bus.direction}</span>
          <span>Max Capacity</span>
        </div>
      </div>
    </div>
  );
}
