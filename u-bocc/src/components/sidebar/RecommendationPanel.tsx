import React from 'react';
import { useUBOCCStore } from '../../store/ubocc-store';
import { RecommendationCard } from './RecommendationCard';

export function RecommendationPanel() {
  const { recommendations } = useUBOCCStore();

  return (
    <div className="w-80 bg-slate-900 border-l border-slate-700 h-full flex flex-col shadow-2xl overflow-hidden z-40">
      <div className="p-4 border-b border-slate-700 bg-slate-800">
        <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          ⚡ Smart Dispatch
          {recommendations.length > 0 && (
            <span className="bg-amber-500/20 text-amber-400 text-xs py-0.5 px-2 rounded-full font-mono">
              {recommendations.length} new
            </span>
          )}
        </h2>
        <p className="text-xs text-slate-400 mt-1">AI-driven interventions</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {recommendations.length === 0 ? (
          <div className="text-center text-slate-500 py-8">
            <div className="text-4xl mb-3 opacity-20">🤖</div>
            <p>No interventions needed.</p>
            <p className="text-xs mt-2">Headways are stable.</p>
          </div>
        ) : (
          recommendations.map(rec => (
            <RecommendationCard key={rec.id} recommendation={rec} />
          ))
        )}
      </div>
    </div>
  );
}
