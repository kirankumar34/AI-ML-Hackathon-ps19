import React from 'react';

export function HeadwayLegend() {
  return (
    <div className="absolute bottom-6 left-6 z-[1000] bg-slate-900/90 backdrop-blur-md border border-slate-700 rounded-lg p-4 text-sm shadow-xl text-slate-200">
      <h4 className="font-semibold mb-3 text-white tracking-wide uppercase text-xs">
        Headway Deviation
      </h4>
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-4 h-1 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
          <span className="text-slate-300">&le; 20% dev (On time)</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-4 h-1 bg-amber-500 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.6)] border border-amber-500 border-dashed"></div>
          <span className="text-slate-300">21–50% dev (Mild)</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-4 h-1 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.6)]"></div>
          <span className="text-slate-300">&gt; 50% dev / Gap &gt; 15m</span>
        </div>
        <div className="flex items-center gap-3 mt-2 pt-2 border-t border-slate-700">
          <div className="w-4 h-4 rounded-full bg-red-500/40 border-2 border-red-500 flex items-center justify-center"></div>
          <span className="text-slate-300">Bunching Cluster (&gt;2 buses)</span>
        </div>
      </div>
    </div>
  );
}
