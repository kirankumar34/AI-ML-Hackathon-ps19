import React from 'react';
import { ReasonItem } from '../../types';

interface ConfidenceBarProps {
  confidence: number;
  reasons: ReasonItem[];
}

export function ConfidenceBar({ confidence, reasons }: ConfidenceBarProps) {
  const percentage = Math.round(confidence * 100);
  
  // Sort reasons by weight descending
  const sortedReasons = [...reasons].sort((a, b) => b.weight - a.weight);

  return (
    <div className="mt-3 bg-slate-900 rounded p-2 border border-slate-700/50">
      <div className="flex justify-between text-xs mb-1 font-mono text-slate-400">
        <span>CONFIDENCE</span>
        <span className={percentage > 80 ? 'text-green-400 font-bold' : percentage > 50 ? 'text-amber-400 font-bold' : 'text-slate-300 font-bold'}>
          {percentage}%
        </span>
      </div>
      <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden flex">
        {sortedReasons.map((reason, idx) => {
          // Colors based on type or just alternate
          const colors = ['bg-blue-500', 'bg-purple-500', 'bg-indigo-500', 'bg-cyan-500'];
          const width = `${Math.max(5, reason.weight * 100)}%`; // Ensure min width for visibility
          return (
            <div 
              key={idx} 
              className={`h-full ${colors[idx % colors.length]}`} 
              style={{ width }} 
              title={`${reason.description} (${Math.round(reason.weight * 100)}%)`}
            />
          );
        })}
      </div>
      <div className="mt-2 space-y-1">
        {sortedReasons.map((reason, idx) => (
          <div key={idx} className="flex items-start gap-2 text-[10px] text-slate-400 leading-tight">
            <span className="mt-0.5 opacity-50">•</span>
            <span>{reason.description}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
