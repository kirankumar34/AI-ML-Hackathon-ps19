import React, { useState } from 'react';
import { DispatchRecommendation } from '../../types';
import { ConfidenceBar } from '../ui/ConfidenceBar';
import { useUBOCCStore } from '../../store/ubocc-store';

interface RecommendationCardProps {
  recommendation: DispatchRecommendation;
}

export function RecommendationCard({ recommendation }: RecommendationCardProps) {
  const { executeDispatch, dismissRecommendation } = useUBOCCStore();
  const [showDismissPrompt, setShowDismissPrompt] = useState(false);

  const priorityStyles = {
    critical: 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)] bg-[#ef476f]/5',
    high: 'border-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.15)] bg-amber-500/5',
    medium: 'border-blue-500 shadow-md bg-[#4a9eff]/5',
  };

  const priorityBadgeColors = {
    critical: 'bg-red-500/10 text-red-500 border border-red-500/20',
    high: 'bg-amber-500/10 text-amber-500 border border-amber-500/20',
    medium: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  };

  const handleDismiss = (reason: string) => {
    dismissRecommendation(recommendation.id, reason);
    setShowDismissPrompt(false);
  };

  // Structured Storytelling Layout (prompt.md compliance)
  const isStructured = !!recommendation.problemDetected;

  return (
    <div className={`rounded-xl border-l-4 ${priorityStyles[recommendation.priority]} p-4 select-none relative overflow-hidden font-sans border border-[#2a2a3a]`}>
      {/* Header Info */}
      <div className="flex items-center justify-between mb-3 border-b border-[#2a2a3a]/40 pb-2">
        <div className="flex items-center gap-2">
          <span className="bg-[#12121a] border border-[#2a2a3a] px-2 py-0.5 rounded font-mono text-[10px] font-bold text-white">
            Route {recommendation.routeId}
          </span>
          <span className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${priorityBadgeColors[recommendation.priority]}`}>
            {recommendation.priority}
          </span>
        </div>
        <span className="text-[10px] font-bold text-[#ffd166] font-mono">
          {recommendation.confidenceScore || Math.round(recommendation.confidence * 100)}% Match
        </span>
      </div>

      {isStructured ? (
        <div className="space-y-3.5 text-xs leading-relaxed">
          {/* Problem Detected */}
          <div>
            <span className="text-[9px] font-bold text-[#ef476f] uppercase tracking-wider block font-mono">Problem Detected</span>
            <p className="text-white font-medium mt-0.5">{recommendation.problemDetected}</p>
          </div>

          {/* Affected Routes */}
          {recommendation.affectedRoutesList && recommendation.affectedRoutesList.length > 0 && (
            <div>
              <span className="text-[9px] font-bold text-[#6b6b80] uppercase tracking-wider block font-mono">Affected Routes</span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {recommendation.affectedRoutesList.map((r) => (
                  <span key={r} className="bg-[#12121a] border border-[#2a2a3a] px-1.5 py-0.5 rounded font-mono text-[9px] text-slate-300">
                    {r}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Predicted Impact */}
          <div>
            <span className="text-[9px] font-bold text-[#ffd166] uppercase tracking-wider block font-mono">Predicted Impact</span>
            <p className="text-slate-300 mt-0.5">{recommendation.predictedImpact}</p>
          </div>

          {/* Suggested Action */}
          <div>
            <span className="text-[9px] font-bold text-[#06d6a0] uppercase tracking-wider block font-mono">Suggested Action</span>
            <p className="text-white font-semibold mt-0.5">{recommendation.suggestedAction}</p>
          </div>

          {/* Expected Improvement */}
          <div>
            <span className="text-[9px] font-bold text-[#4a9eff] uppercase tracking-wider block font-mono">Expected Improvement</span>
            <p className="text-[#06d6a0] font-bold mt-0.5">{recommendation.expectedImprovement}</p>
          </div>
        </div>
      ) : (
        // Fallback Layout
        <>
          <div className="mb-2">
            <h3 className="text-slate-100 font-bold text-sm tracking-wide">
              Bus #{recommendation.busId} → Route {recommendation.routeId}
            </h3>
            <p className="text-amber-400 text-xs font-semibold uppercase mt-1">
              {recommendation.action} from {recommendation.dispatchFrom} NOW
            </p>
          </div>

          <ConfidenceBar confidence={recommendation.confidence} reasons={recommendation.reasons} />

          <div className="mt-3 bg-slate-900/50 p-2 rounded text-xs border border-slate-700">
            <span className="text-slate-400 block mb-1">EXPECTED IMPACT:</span>
            <span className="text-slate-200">
              Headway → <span className="font-bold text-green-400">{recommendation.expectedHeadwayAfter} min</span> 
              {' '}↓ from {recommendation.predictedGapMin}
            </span>
          </div>
        </>
      )}

      {/* Approve/Dismiss Section */}
      {showDismissPrompt ? (
        <div className="mt-4 bg-[#12121a] p-2 rounded border border-[#2a2a3a] space-y-1.5 z-10 relative">
          <p className="text-[10px] text-[#6b6b80] font-bold uppercase tracking-wider mb-1">Reason for dismissing:</p>
          <button className="w-full text-left px-2 py-1.5 bg-[#1a1a26] hover:bg-[#2a2a3a] text-slate-300 text-xs rounded transition-colors" onClick={() => handleDismiss('False alarm')}>False alarm / Bad data</button>
          <button className="w-full text-left px-2 py-1.5 bg-[#1a1a26] hover:bg-[#2a2a3a] text-slate-300 text-xs rounded transition-colors" onClick={() => handleDismiss('Already handled')}>Already handled</button>
          <button className="w-full text-center px-2 py-1 mt-1 text-[#6b6b80] hover:text-slate-300 text-[10px] uppercase font-bold tracking-wider transition-colors cursor-pointer" onClick={() => setShowDismissPrompt(false)}>Cancel</button>
        </div>
      ) : (
        <div className="mt-4 flex gap-2 font-bold text-xs">
          <button 
            onClick={() => executeDispatch(recommendation.id)}
            className="flex-1 bg-[#06d6a0] hover:bg-[#06d6a0]/80 text-[#0c0c14] py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer font-bold uppercase tracking-wide shadow-md"
          >
            ✓ APPROVE
          </button>
          <button 
            onClick={() => setShowDismissPrompt(true)}
            className="flex-1 bg-[#1a1a26] hover:bg-[#2a2a3a] border border-[#2a2a3a] text-[#6b6b80] hover:text-slate-300 py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer font-bold uppercase tracking-wide"
          >
            ✗ DISMISS
          </button>
        </div>
      )}
    </div>
  );
}
