'use client';

import React from 'react';
import { Depot } from '../types';
import { Warehouse } from 'lucide-react';

interface DepotTableProps {
  depots: Depot[];
}

export default function DepotTable({ depots }: DepotTableProps) {
  return (
    <div className="flex flex-col gap-3 select-none">
      {depots.map((depot) => (
        <div key={depot.name} className="bg-[#1a1a26]/40 border border-[#2a2a3a] rounded-lg p-3 flex flex-col gap-2.5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded bg-[#b388ff]/10 border border-[#b388ff]/20 text-[#b388ff]">
                <Warehouse className="h-3.5 w-3.5" />
              </div>
              <span className="text-xs font-bold text-[#e8e8f0] uppercase tracking-wide">
                {depot.name} Depot
              </span>
            </div>
            <span className="text-[8px] font-bold font-mono text-[#6b6b80] uppercase tracking-widest">
              {depot.routes.length} Routes
            </span>
          </div>

          {/* Details */}
          <div className="text-[10px] text-[#6b6b80] leading-relaxed truncate" title={depot.location}>
            {depot.location}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#2a2a3a]/60 text-center font-mono">
            <div className="flex flex-col bg-[#12121a] py-1.5 px-2 rounded border border-[#2a2a3a]">
              <span className="text-sm font-bold text-[#06d6a0]">{depot.busesAvailable}</span>
              <span className="text-[8px] font-bold text-[#6b6b80] uppercase tracking-wider">Available</span>
            </div>
            <div className="flex flex-col bg-[#12121a] py-1.5 px-2 rounded border border-[#2a2a3a]">
              <span className="text-sm font-bold text-[#4a9eff]">{depot.busesDeployed}</span>
              <span className="text-[8px] font-bold text-[#6b6b80] uppercase tracking-wider">Deployed</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
