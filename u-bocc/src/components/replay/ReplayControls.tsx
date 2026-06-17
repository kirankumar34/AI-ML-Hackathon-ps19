import React from 'react';
import { useReplayEngine } from '../../hooks/useReplayEngine';
import { useUBOCCStore } from '../../store/ubocc-store';

export function ReplayControls() {
  const { playbackSpeed, setPlaybackSpeed } = useReplayEngine();
  const { activeReplaySession } = useUBOCCStore();

  return (
    <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-xl shadow-xl overflow-hidden">
      <div className="bg-slate-800 p-3 border-b border-slate-700">
        <h3 className="font-bold text-slate-100 flex items-center gap-2 text-sm uppercase tracking-wider">
          ⚙️ Controls
        </h3>
      </div>
      <div className="p-4 space-y-4 text-sm">
        <div className="flex justify-between items-center text-slate-300">
          <span className="text-slate-400">Date:</span>
          <span className="font-mono bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
            {activeReplaySession?.date || '2024-03-15'}
          </span>
        </div>
        <div className="flex justify-between items-center text-slate-300">
          <span className="text-slate-400">Window:</span>
          <span className="font-mono bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
            {activeReplaySession?.windowStart || '08:00'} – {activeReplaySession?.windowEnd || '08:30'}
          </span>
        </div>
        <div className="flex justify-between items-center text-slate-300">
          <span className="text-slate-400">Route:</span>
          <span className="font-mono bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
            {activeReplaySession?.routeId || '21C'}
          </span>
        </div>

        <div className="pt-3 border-t border-slate-700/50">
          <span className="text-slate-400 block mb-2 text-xs uppercase tracking-wide">Speed</span>
          <div className="flex gap-2">
            {[1, 5, 10, 20].map((speed) => (
              <button
                key={speed}
                onClick={() => setPlaybackSpeed(speed)}
                className={`flex-1 py-1 text-xs font-mono rounded border transition-colors ${
                  playbackSpeed === speed 
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-300' 
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {speed}×
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
