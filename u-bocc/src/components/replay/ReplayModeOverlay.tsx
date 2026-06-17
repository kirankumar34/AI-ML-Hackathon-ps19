import React from 'react';
import { useUBOCCStore } from '../../store/ubocc-store';
import { ReplayControls } from './ReplayControls';
import { CounterfactualBuilder } from './CounterfactualBuilder';
import { TimelineScrubber } from './TimelineScrubber';
import { HeadwayComparisonChart } from './HeadwayComparisonChart';

export function ReplayModeOverlay() {
  const { replayMode, setReplayMode } = useUBOCCStore();

  if (!replayMode) return null;

  return (
    <div className="absolute inset-0 z-[2000] pointer-events-none flex flex-col justify-between">
      {/* Top Banner */}
      <div className="bg-amber-500/90 backdrop-blur-sm text-amber-950 font-bold px-6 py-2 flex justify-between items-center pointer-events-auto shadow-md">
        <div className="flex items-center gap-2">
          <span className="text-xl">⏪</span>
          <span>SIMULATION REPLAY MODE — "WHAT IF" SCENARIO TESTING</span>
        </div>
        <button 
          onClick={() => setReplayMode(false)}
          className="px-4 py-1 bg-amber-950 text-amber-100 hover:bg-amber-900 rounded text-sm transition-colors shadow-sm"
        >
          EXIT REPLAY
        </button>
      </div>

      {/* Main Workspace Area (sides are pointer-events-auto) */}
      <div className="flex-1 flex justify-between p-4 pb-0 pointer-events-none">
        
        {/* Left Side: Controls & Interventions */}
        <div className="w-80 space-y-4 pointer-events-auto flex flex-col h-full">
          <ReplayControls />
          <CounterfactualBuilder />
        </div>

        {/* Right Side / Bottom: We leave center open for the Map. 
            The timeline will be at the bottom, so nothing strictly on the right for now, 
            unless we want the chart there. Let's put the chart at bottom-right. */}
        <div className="flex-1" />
      </div>

      {/* Bottom Area: Scrubber & Chart */}
      <div className="p-4 pointer-events-auto space-y-4">
        <HeadwayComparisonChart />
        <TimelineScrubber />
      </div>
    </div>
  );
}
