import React from 'react';
import { useUBOCCStore } from '../../store/ubocc-store';

// Note: Recharts dependency would be ideal here as per PRD, but we'll build a custom pure SVG chart for now to avoid installing new dependencies.

export function HeadwayComparisonChart() {
  const { simulationResult } = useUBOCCStore();

  if (!simulationResult) return null;

  const { realHeadways, projectedHeadways } = simulationResult;
  
  if (realHeadways.length === 0) return null;

  const maxVal = Math.max(
    ...realHeadways.map(h => h.headwayMin),
    ...projectedHeadways.map(h => h.headwayMin)
  ) + 2;

  const width = 600;
  const height = 150;
  
  const getX = (idx: number, len: number) => (idx / (len - 1)) * width;
  const getY = (val: number) => height - (val / maxVal) * height;

  const realPoints = realHeadways.map((h, i) => `${getX(i, realHeadways.length)},${getY(h.headwayMin)}`).join(' ');
  const projPoints = projectedHeadways.map((h, i) => `${getX(i, projectedHeadways.length)},${getY(h.headwayMin)}`).join(' ');

  return (
    <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-xl shadow-2xl p-4 max-w-4xl mx-auto w-full relative">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-slate-100 flex items-center gap-2 text-sm uppercase tracking-wider">
          📊 Headway Comparison
        </h3>
        <div className="flex gap-4 text-xs font-mono">
          <div className="flex items-center gap-2 text-slate-400">
            <span className="w-3 h-0.5 bg-slate-500 block"></span> ACTUAL
          </div>
          <div className="flex items-center gap-2 text-amber-400">
            <span className="w-3 h-0.5 bg-amber-500 block border-b border-dashed"></span> COUNTERFACTUAL
          </div>
        </div>
      </div>

      {/* SVG Line Chart */}
      <div className="relative w-full h-[150px]">
        {/* Y-axis Labels */}
        <div className="absolute left-0 h-full flex flex-col justify-between text-[10px] text-slate-500 font-mono transform -translate-x-full pr-2 pb-5">
          <span>{Math.round(maxVal)}m</span>
          <span>{Math.round(maxVal/2)}m</span>
          <span>0m</span>
        </div>

        <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="overflow-visible">
          {/* Grid lines */}
          <line x1="0" y1={height} x2={width} y2={height} stroke="#334155" strokeWidth="1" />
          <line x1="0" y1={height/2} x2={width} y2={height/2} stroke="#334155" strokeWidth="1" strokeDasharray="4 4" />
          <line x1="0" y1="0" x2={width} y2="0" stroke="#334155" strokeWidth="1" strokeDasharray="4 4" />

          {/* Actual Line */}
          <polyline 
            points={realPoints}
            fill="none"
            stroke="#64748b"
            strokeWidth="3"
            strokeLinejoin="round"
          />

          {/* Projected Line */}
          <polyline 
            points={projPoints}
            fill="none"
            stroke="#f59e0b"
            strokeWidth="3"
            strokeLinejoin="round"
            strokeDasharray="6 4"
          />
        </svg>
      </div>

      <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1 w-full pl-2">
        <span>{new Date(realHeadways[0].timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
        <span>{new Date(realHeadways[Math.floor(realHeadways.length/2)].timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
        <span>{new Date(realHeadways[realHeadways.length-1].timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
      </div>

      <div className="absolute top-4 right-4 bg-green-500/10 text-green-400 border border-green-500/30 px-3 py-2 rounded text-xs">
        <div className="font-bold">IMPACT</div>
        <div>Gap Reduced by {simulationResult.peakGapReduction} mins</div>
        <div>Wait times down {simulationResult.improvementPct}%</div>
      </div>
    </div>
  );
}
