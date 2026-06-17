'use client';

import React from 'react';
import { Layers, Activity, Brain, ShieldAlert, History } from 'lucide-react';
import { useUBOCCStore } from '../store/ubocc-store';

interface LeftSidebarProps {
  liveBusCount: number;
}

export default function LeftSidebar({ liveBusCount }: LeftSidebarProps) {
  const { currentView, setCurrentView, replayMode, setReplayMode, activeRouteLayers, toggleRouteLayer } = useUBOCCStore();

  const views = [
    {
      id: 'normal' as const,
      name: 'Normal',
      icon: Layers,
      color: 'text-[#4a9eff]',
      bgColor: 'bg-[#4a9eff]/10',
      borderColor: 'border-[#4a9eff]/40',
      glow: 'shadow-[0_0_12px_rgba(74,158,255,0.15)]',
    },
    {
      id: 'ops' as const,
      name: 'Operations',
      icon: Activity,
      color: 'text-[#b388ff]',
      bgColor: 'bg-[#b388ff]/10',
      borderColor: 'border-[#b388ff]/40',
      glow: 'shadow-[0_0_12px_rgba(179,136,255,0.15)]',
    },
    {
      id: 'ai' as const,
      name: 'AI View',
      icon: Brain,
      color: 'text-[#ef476f]',
      bgColor: 'bg-[#ef476f]/10',
      borderColor: 'border-[#ef476f]/40',
      glow: 'shadow-[0_0_12px_rgba(239,71,111,0.15)]',
    },
    {
      id: 'emergency' as const,
      name: 'Emergency',
      icon: ShieldAlert,
      color: 'text-[#ffd166]',
      bgColor: 'bg-[#ffd166]/10',
      borderColor: 'border-[#ffd166]/40',
      glow: 'shadow-[0_0_12px_rgba(255,209,102,0.15)]',
    },
  ];

  return (
    <aside className="flex h-full w-22 flex-col items-center justify-between border-r border-[#2a2a3a] bg-[#0c0c14] py-4 text-[#e8e8f0] select-none z-20 shadow-lg">
      {/* View Selectors */}
      <div className="flex w-full flex-col gap-4 px-2.5">
        <div className="text-center mb-1">
          <span className="text-[9px] font-bold text-[#6b6b80] uppercase tracking-widest font-mono">Console</span>
        </div>

        {views.map((v) => {
          const Icon = v.icon;
          const isActive = currentView === v.id && !replayMode;
          return (
            <button
              key={v.id}
              onClick={() => {
                setReplayMode(false); // disable replay when changing views
                setCurrentView(v.id);
              }}
              className={`flex flex-col items-center justify-center rounded-lg py-3 transition-all duration-200 cursor-pointer border ${
                isActive
                  ? `${v.bgColor} ${v.borderColor} ${v.color} ${v.glow}`
                  : 'border-transparent text-[#5c5c70] hover:text-[#e8e8f0] hover:bg-[#1a1a26]'
              }`}
            >
              <Icon className="h-5 w-5 mb-1.5" />
              <span className="text-[8px] font-bold uppercase tracking-wider font-sans text-center leading-tight">
                {v.name}
              </span>
            </button>
          );
        })}

        {/* Divider */}
        <div className="h-[1px] w-full bg-[#2a2a3a] my-1" />

        {/* Replay Mode Toggle */}
        <button
          onClick={() => setReplayMode(!replayMode)}
          className={`flex flex-col items-center justify-center rounded-lg py-3 transition-all duration-200 cursor-pointer border ${
            replayMode
              ? 'bg-amber-500/10 border border-amber-500/40 text-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.15)]'
              : 'border border-transparent text-[#5c5c70] hover:text-[#e8e8f0] hover:bg-[#1a1a26]'
          }`}
        >
          <History className="h-5 w-5 mb-1.5" />
          <span className="text-[8px] font-bold uppercase tracking-wider font-sans text-center leading-tight">
            Replay
          </span>
        </button>

        {/* Divider */}
        <div className="h-[1px] w-full bg-[#2a2a3a] my-1" />

        <div className="text-center mb-1">
          <span className="text-[9px] font-bold text-[#6b6b80] uppercase tracking-widest font-mono">Layers</span>
        </div>

        {/* Route Category Toggles */}
        {[
          { id: 'Feeder', label: 'Feeder', color: 'text-emerald-400', border: 'border-emerald-400/40', bg: 'bg-emerald-400/10' },
          { id: 'Ring', label: 'Ring', color: 'text-blue-400', border: 'border-blue-400/40', bg: 'bg-blue-400/10' },
          { id: 'BRT', label: 'BRT', color: 'text-rose-400', border: 'border-rose-400/40', bg: 'bg-rose-400/10' },
          { id: 'Suburban', label: 'Outer', color: 'text-yellow-400', border: 'border-yellow-400/40', bg: 'bg-yellow-400/10' }
        ].map((layer) => {
          const isActive = activeRouteLayers[layer.id as keyof typeof activeRouteLayers];
          return (
            <button
              key={layer.id}
              onClick={() => toggleRouteLayer(layer.id as any)}
              className={`flex flex-col items-center justify-center rounded-lg py-2 transition-all duration-200 cursor-pointer border ${
                isActive
                  ? `${layer.bg} ${layer.border} ${layer.color}`
                  : 'border-transparent text-[#5c5c70] hover:text-[#e8e8f0] hover:bg-[#1a1a26]'
              }`}
            >
              <span className="text-[8px] font-bold uppercase tracking-wider font-sans text-center leading-tight">
                {layer.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Live count stats at bottom */}
      <div className="flex flex-col items-center px-1 text-center">
        <span className="relative flex h-2 w-2 mb-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22c55e] opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#22c55e]"></span>
        </span>
        <span className="text-[10px] font-bold font-mono text-[#e8e8f0] tracking-tighter">{liveBusCount}</span>
        <span className="text-[7px] font-bold text-[#6b6b80] uppercase tracking-widest">Live</span>
      </div>
    </aside>
  );
}
