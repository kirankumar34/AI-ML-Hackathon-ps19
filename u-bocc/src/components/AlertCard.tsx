'use client';

import React from 'react';
import { Alert } from '../types';
import { CloudRain, Trophy, Users, Construction } from 'lucide-react';

interface AlertCardProps {
  alert: Alert;
}

export default function AlertCard({ alert }: AlertCardProps) {
  // Severity styling
  const severityColors = {
    CRITICAL: 'bg-[#ef476f]/20 border-[#ef476f]/40 text-[#ef476f]',
    WARNING: 'bg-[#ffd166]/10 border-[#ffd166]/30 text-[#ffd166]',
    INFO: 'bg-[#4a9eff]/10 border-[#4a9eff]/30 text-[#4a9eff]',
  };

  // Icon mapping
  const getIcon = (type: Alert['type']) => {
    switch (type) {
      case 'WEATHER':
        return <CloudRain className="h-4 w-4 text-[#4a9eff]" />;
      case 'EVENT':
        return <Trophy className="h-4 w-4 text-[#ffd166]" />;
      case 'CROWD':
        return <Users className="h-4 w-4 text-[#06d6a0]" />;
      case 'INFRASTRUCTURE':
        return <Construction className="h-4 w-4 text-[#b388ff]" />;
      default:
        return <CloudRain className="h-4 w-4 text-[#6b6b80]" />;
    }
  };

  return (
    <div className="bg-[#1a1a26]/60 border border-[#2a2a3a] rounded-lg p-3.5 mb-3 select-none flex gap-3">
      {/* Icon */}
      <div className="flex-shrink-0 mt-0.5">
        <div className="p-2 bg-[#12121a] border border-[#2a2a3a] rounded-md">
          {getIcon(alert.type)}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col gap-1 min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-bold text-[#6b6b80] uppercase tracking-wider">
            {alert.type}
          </span>
          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${severityColors[alert.severity]}`}>
            {alert.severity}
          </span>
        </div>

        {/* Title */}
        <h4 className="text-xs font-bold text-[#e8e8f0] tracking-wide truncate">
          {alert.title}
        </h4>

        {/* Description */}
        <p className="text-[10px] text-[#6b6b80] leading-relaxed">
          {alert.description}
        </p>

        {/* Timestamp */}
        <span className="text-[8px] font-semibold text-[#6b6b80] mt-1.5 uppercase font-mono tracking-wider">
          ● {alert.timestamp}
        </span>
      </div>
    </div>
  );
}
