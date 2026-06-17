import React from 'react';
import { useReplayEngine } from '../../hooks/useReplayEngine';
import { useUBOCCStore } from '../../store/ubocc-store';

export function TimelineScrubber() {
  const { 
    isPlaying, 
    setIsPlaying, 
    currentTimeMs, 
    setCurrentTimeMs 
  } = useReplayEngine();
  const { activeReplaySession } = useUBOCCStore();

  if (!activeReplaySession) return null;

  const frames = activeReplaySession.historicalFrames;
  if (frames.length === 0) return null;

  const startTs = frames[0].timestamp;
  const endTs = frames[frames.length - 1].timestamp;

  const progressPct = ((currentTimeMs - startTs) / (endTs - startTs)) * 100;

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-xl p-4 shadow-2xl mx-auto max-w-4xl w-full">
      <div className="flex items-center gap-4 mb-2">
        <button 
          onClick={() => setIsPlaying(!isPlaying)}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-600 transition-colors"
        >
          {isPlaying ? '⏸' : '▶'}
        </button>
        <button 
          onClick={() => setCurrentTimeMs(Math.max(startTs, currentTimeMs - 30000))}
          className="text-slate-400 hover:text-slate-200 text-sm font-mono"
        >
          ◀◀ -30s
        </button>
        <button 
          onClick={() => setCurrentTimeMs(Math.min(endTs, currentTimeMs + 30000))}
          className="text-slate-400 hover:text-slate-200 text-sm font-mono"
        >
          ▶▶ +30s
        </button>
        <div className="ml-auto text-lg font-mono text-amber-400 bg-slate-950 px-3 py-1 rounded border border-amber-900/30 shadow-inner">
          {formatTime(currentTimeMs)}
        </div>
      </div>

      <div className="relative pt-4 pb-2 group">
        <div className="flex justify-between text-xs text-slate-500 font-mono mb-1 absolute top-0 w-full">
          <span>{formatTime(startTs)}</span>
          <span>{formatTime(endTs)}</span>
        </div>
        
        {/* Track background */}
        <div className="h-2 bg-slate-800 rounded-full w-full overflow-hidden border border-slate-700">
          {/* Progress fill */}
          <div 
            className="h-full bg-amber-500 transition-all duration-75 ease-linear"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        
        {/* Thumb */}
        <div 
          className="absolute top-4 w-4 h-4 bg-white rounded-full shadow-[0_0_10px_rgba(245,158,11,0.5)] border-2 border-amber-500 transform -translate-x-1/2 -translate-y-1 transition-all duration-75 ease-linear pointer-events-none"
          style={{ left: `${progressPct}%` }}
        />
        
        {/* Invisible range input for scrubbing */}
        <input 
          type="range"
          min={startTs}
          max={endTs}
          value={currentTimeMs}
          onChange={(e) => {
            setCurrentTimeMs(parseInt(e.target.value));
            setIsPlaying(false);
          }}
          className="absolute top-4 w-full h-4 opacity-0 cursor-pointer"
        />
      </div>
    </div>
  );
}
