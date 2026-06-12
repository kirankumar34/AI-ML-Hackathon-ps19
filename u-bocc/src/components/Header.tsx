'use client';

import React from 'react';
import { Bus, AlertCircle, Clock, BarChart3, Layers, Zap } from 'lucide-react';
import { useClock } from '../hooks/useClock';

interface HeaderProps {
  kpis: {
    activeBuses: number;
    overloaded: number;
    avgWait: number;
    avgOcc: number;
    reserveFleet: number;
    pendingActions: number;
  };
  updateTrigger: Record<string, boolean>;
}

export default function Header({ kpis, updateTrigger }: HeaderProps) {
  const time = useClock();

  return (
    <header className="flex h-14 w-full items-center justify-between border-b border-[#2a2a3a] bg-[#12121a] px-4 text-[#e8e8f0] select-none z-30 shadow-md">
      {/* Left Branding */}
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-[#4a9eff]/10 p-1.5 border border-[#4a9eff]/20">
          <Bus className="h-5 w-5 text-[#4a9eff]" />
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-wider text-[#e8e8f0]">U-BOCC</h1>
          <p className="text-[9px] font-medium tracking-widest text-[#6b6b80]">
            UNIFIED BUS OPERATIONS COMMAND CENTER • CHENNAI MTC
          </p>
        </div>
      </div>

      {/* Center KPIs */}
      <div className="hidden md:flex items-center gap-2 lg:gap-4">
        {/* Active Buses */}
        <div 
          className={`flex items-center gap-3 bg-[#1a1a26]/60 border border-[#2a2a3a] px-3 py-1 rounded-md transition-all duration-300 ${
            updateTrigger.activeBuses ? 'border-[#ffd166] bg-[#ffd166]/5 scale-102' : ''
          }`}
        >
          <Bus className="h-4 w-4 text-[#4a9eff]" />
          <div className="flex flex-col">
            <span className="text-xs font-bold font-mono tracking-tight">{kpis.activeBuses}</span>
            <span className="text-[8px] font-bold text-[#6b6b80] tracking-wider uppercase">Active Buses</span>
          </div>
        </div>

        {/* Overloaded */}
        <div 
          className={`flex items-center gap-3 bg-[#1a1a26]/60 border border-[#2a2a3a] px-3 py-1 rounded-md transition-all duration-300 ${
            updateTrigger.overloaded ? 'border-[#ef476f] bg-[#ef476f]/5 scale-102' : ''
          }`}
        >
          <AlertCircle className={`h-4 w-4 ${kpis.overloaded > 0 ? 'text-[#ef476f] animate-pulse' : 'text-[#6b6b80]'}`} />
          <div className="flex flex-col">
            <span className="text-xs font-bold font-mono tracking-tight">{kpis.overloaded}</span>
            <span className="text-[8px] font-bold text-[#6b6b80] tracking-wider uppercase">Overloaded</span>
          </div>
        </div>

        {/* Avg Wait */}
        <div 
          className={`flex items-center gap-3 bg-[#1a1a26]/60 border border-[#2a2a3a] px-3 py-1 rounded-md transition-all duration-300 ${
            updateTrigger.avgWait ? 'border-[#ffd166] bg-[#ffd166]/5 scale-102' : ''
          }`}
        >
          <Clock className="h-4 w-4 text-[#ffd166]" />
          <div className="flex flex-col">
            <span className="text-xs font-bold font-mono tracking-tight">{kpis.avgWait} min</span>
            <span className="text-[8px] font-bold text-[#6b6b80] tracking-wider uppercase">Avg Wait</span>
          </div>
        </div>

        {/* Avg Occupancy */}
        <div 
          className={`flex items-center gap-3 bg-[#1a1a26]/60 border border-[#2a2a3a] px-3 py-1 rounded-md transition-all duration-300 ${
            updateTrigger.avgOcc ? 'border-[#ffd166] bg-[#ffd166]/5 scale-102' : ''
          }`}
        >
          <BarChart3 className="h-4 w-4 text-[#06d6a0]" />
          <div className="flex flex-col">
            <span className="text-xs font-bold font-mono tracking-tight">{kpis.avgOcc}%</span>
            <span className="text-[8px] font-bold text-[#6b6b80] tracking-wider uppercase">Avg Occ</span>
          </div>
        </div>

        {/* Reserve Fleet */}
        <div 
          className={`flex items-center gap-3 bg-[#1a1a26]/60 border border-[#2a2a3a] px-3 py-1 rounded-md transition-all duration-300 ${
            updateTrigger.reserveFleet ? 'border-[#ffd166] bg-[#ffd166]/5 scale-102' : ''
          }`}
        >
          <Layers className="h-4 w-4 text-[#b388ff]" />
          <div className="flex flex-col">
            <span className="text-xs font-bold font-mono tracking-tight">{kpis.reserveFleet}</span>
            <span className="text-[8px] font-bold text-[#6b6b80] tracking-wider uppercase">Reserve Fleet</span>
          </div>
        </div>

        {/* Pending Actions */}
        <div 
          className={`flex items-center gap-3 bg-[#1a1a26]/60 border border-[#2a2a3a] px-3 py-1 rounded-md transition-all duration-300 ${
            updateTrigger.pendingActions ? 'border-[#4a9eff] bg-[#4a9eff]/5 scale-102' : ''
          }`}
        >
          <Zap className="h-4 w-4 text-[#00e5ff]" />
          <div className="flex flex-col">
            <span className="text-xs font-bold font-mono tracking-tight">{kpis.pendingActions}</span>
            <span className="text-[8px] font-bold text-[#6b6b80] tracking-wider uppercase">Pending Actions</span>
          </div>
        </div>
      </div>

      {/* Right side live stats */}
      <div className="flex items-center gap-4">
        {/* Pulsing LIVE indicator */}
        <div className="flex items-center gap-2 bg-[#0a0a0f] border border-[#2a2a3a] px-2.5 py-1 rounded-md">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22c55e] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#22c55e]"></span>
          </span>
          <span className="text-[9px] font-bold tracking-wider text-[#22c55e] uppercase">LIVE</span>
        </div>

        {/* Local time */}
        <div className="hidden sm:block text-xs font-bold font-mono text-[#6b6b80] bg-[#0a0a0f] border border-[#2a2a3a] px-2.5 py-1 rounded-md">
          {time || '00:00:00 IST'}
        </div>

        {/* Demo Button */}
        <button 
          onClick={() => window.location.reload()}
          className="text-[10px] font-bold border border-[#2a2a3a] hover:bg-[#2a2a3a] hover:text-white px-2.5 py-1.5 rounded transition-all duration-200 uppercase cursor-pointer"
        >
          Reset Demo
        </button>
      </div>
    </header>
  );
}
