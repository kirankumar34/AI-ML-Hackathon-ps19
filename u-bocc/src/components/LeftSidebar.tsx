'use client';

import React from 'react';
import { Compass, Flame, Warehouse, Activity } from 'lucide-react';

interface LeftSidebarProps {
  layers: {
    routes: boolean;
    hotspots: boolean;
    depots: boolean;
    traffic: boolean;
  };
  setLayers: React.Dispatch<React.SetStateAction<{
    routes: boolean;
    hotspots: boolean;
    depots: boolean;
    traffic: boolean;
  }>>;
  liveBusCount: number;
}

export default function LeftSidebar({ layers, setLayers, liveBusCount }: LeftSidebarProps) {
  const toggleLayer = (layer: keyof typeof layers) => {
    setLayers(prev => ({ ...prev, [layer]: !prev[layer] }));
  };

  return (
    <aside className="flex h-full w-20 flex-col items-center justify-between border-r border-[#2a2a3a] bg-[#12121a] py-4 text-[#e8e8f0] select-none z-20 shadow-md">
      {/* Layer Toggles */}
      <div className="flex w-full flex-col gap-4 px-2">
        {/* Routes Toggle */}
        <button
          onClick={() => toggleLayer('routes')}
          className={`flex flex-col items-center justify-center rounded-lg py-2.5 transition-all duration-200 cursor-pointer ${
            layers.routes 
              ? 'bg-[#4a9eff]/10 border border-[#4a9eff]/40 text-[#4a9eff] shadow-[0_0_12px_rgba(74,158,255,0.15)]' 
              : 'border border-transparent text-[#6b6b80] hover:text-[#e8e8f0] hover:bg-[#1a1a26]'
          }`}
        >
          <Compass className="h-5 w-5 mb-1" />
          <span className="text-[10px] font-medium font-sans">Routes</span>
        </button>

        {/* Hotspots Toggle */}
        <button
          onClick={() => toggleLayer('hotspots')}
          className={`flex flex-col items-center justify-center rounded-lg py-2.5 transition-all duration-200 cursor-pointer ${
            layers.hotspots 
              ? 'bg-[#ef476f]/10 border border-[#ef476f]/40 text-[#ef476f] shadow-[0_0_12px_rgba(239,71,111,0.15)]' 
              : 'border border-transparent text-[#6b6b80] hover:text-[#e8e8f0] hover:bg-[#1a1a26]'
          }`}
        >
          <Flame className="h-5 w-5 mb-1" />
          <span className="text-[10px] font-medium font-sans">Hotspots</span>
        </button>

        {/* Depots Toggle */}
        <button
          onClick={() => toggleLayer('depots')}
          className={`flex flex-col items-center justify-center rounded-lg py-2.5 transition-all duration-200 cursor-pointer ${
            layers.depots 
              ? 'bg-[#b388ff]/10 border border-[#b388ff]/40 text-[#b388ff] shadow-[0_0_12px_rgba(179,136,255,0.15)]' 
              : 'border border-transparent text-[#6b6b80] hover:text-[#e8e8f0] hover:bg-[#1a1a26]'
          }`}
        >
          <Warehouse className="h-5 w-5 mb-1" />
          <span className="text-[10px] font-medium font-sans">Depots</span>
        </button>

        {/* Traffic Toggle */}
        <button
          onClick={() => toggleLayer('traffic')}
          className={`flex flex-col items-center justify-center rounded-lg py-2.5 transition-all duration-200 cursor-pointer ${
            layers.traffic 
              ? 'bg-[#06d6a0]/10 border border-[#06d6a0]/40 text-[#06d6a0] shadow-[0_0_12px_rgba(6,214,160,0.15)]' 
              : 'border border-transparent text-[#6b6b80] hover:text-[#e8e8f0] hover:bg-[#1a1a26]'
          }`}
        >
          <Activity className="h-5 w-5 mb-1" />
          <span className="text-[10px] font-medium font-sans">Traffic</span>
        </button>
      </div>

      {/* Live count stats at bottom */}
      <div className="flex flex-col items-center px-1 text-center">
        <span className="relative flex h-2 w-2 mb-1">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22c55e] opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#22c55e]"></span>
        </span>
        <span className="text-[10px] font-bold font-mono text-[#e8e8f0] tracking-tighter">{liveBusCount}</span>
        <span className="text-[7px] font-bold text-[#6b6b80] uppercase tracking-wider">buses live</span>
      </div>
    </aside>
  );
}
