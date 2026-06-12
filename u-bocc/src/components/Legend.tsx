'use client';

import React from 'react';

export default function Legend() {
  return (
    <div className="absolute bottom-4 left-4 z-20 bg-[#12121a]/95 border border-[#2a2a3a] text-[#e8e8f0] rounded-lg shadow-lg p-3 backdrop-blur-sm select-none pointer-events-none">
      <div className="flex flex-col gap-2.5">
        {/* Bus Types */}
        <div>
          <div className="text-[8px] font-bold text-[#6b6b80] uppercase tracking-wider mb-1.5">Bus Types</div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1">
            <div className="flex items-center gap-1.5 text-[9px] font-medium text-[#e8e8f0]">
              <span className="w-2 h-2 rounded bg-zinc-800 border border-zinc-700" />
              <span>Ordinary</span>
            </div>
            <div className="flex items-center gap-1.5 text-[9px] font-medium text-[#e8e8f0]">
              <span className="w-2 h-2 rounded bg-[#b388ff]/20 border border-[#b388ff]" />
              <span>Deluxe</span>
            </div>
            <div className="flex items-center gap-1.5 text-[9px] font-medium text-[#e8e8f0]">
              <span className="w-2 h-2 rounded bg-[#00e5ff]/20 border border-[#00e5ff]" />
              <span>AC</span>
            </div>
            <div className="flex items-center gap-1.5 text-[9px] font-medium text-[#e8e8f0]">
              <span className="w-2 h-2 rounded bg-[#ff8c42]/20 border border-[#ff8c42]" />
              <span>Express</span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-[#2a2a3a] w-full" />

        {/* Bus Status */}
        <div>
          <div className="text-[8px] font-bold text-[#6b6b80] uppercase tracking-wider mb-1.5">Bus Status</div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1">
            <div className="flex items-center gap-1.5 text-[9px] font-medium text-[#e8e8f0]">
              <span className="w-2 h-2 rounded bg-[#0a0a0f] border border-[#4a9eff]" />
              <span>Running</span>
            </div>
            <div className="flex items-center gap-1.5 text-[9px] font-medium text-[#e8e8f0]">
              <span className="w-2 h-2 rounded bg-[#ff8c42]/20 border border-[#ff8c42]" />
              <span>Stopped</span>
            </div>
            <div className="flex items-center gap-1.5 text-[9px] font-medium text-[#e8e8f0]">
              <span className="w-2 h-2 rounded bg-[#ffd166]/10 border border-[#ffd166]" />
              <span>Stuck</span>
            </div>
            <div className="flex items-center gap-1.5 text-[9px] font-medium text-[#e8e8f0]">
              <span className="w-2 h-2 rounded bg-[#ef476f]/20 border border-[#ef476f] animate-pulse" />
              <span>Overloaded</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
