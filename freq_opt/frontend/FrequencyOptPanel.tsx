import React, { useState, useEffect } from 'react';
import { FreqOptResult } from './useFrequencyOpt';

interface FrequencyOptPanelProps {
  result: FreqOptResult;
  loading?: boolean;
  onApprove: (result: FreqOptResult, overrideCount?: number) => void;
  onReject: (result: FreqOptResult, reason: string) => void;
  onClose?: () => void;
}

export default function FrequencyOptPanel({
  result,
  loading = false,
  onApprove,
  onReject,
  onClose
}: FrequencyOptPanelProps) {
  const [animatedBefore, setAnimatedBefore] = useState(0);
  const [animatedAfter, setAnimatedAfter] = useState(0);
  const [showApprovalCard, setShowApprovalCard] = useState(false);
  const [overrideCount, setOverrideCount] = useState<number>(result.buses_to_add);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitState, setSubmitState] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | 'OVERRIDDEN'>('PENDING');
  const [officerName, setOfficerName] = useState('');

  // Animate before/after wait times on load/change
  useEffect(() => {
    setOverrideCount(result.buses_to_add);
    setShowApprovalCard(false);
    setShowRejectForm(false);
    setIsSubmitted(false);
    setSubmitState('PENDING');
    
    let startB = 0;
    let startA = 0;
    const endB = result.expected_wait_time_before;
    const endA = result.expected_wait_time_after;
    const duration = 800; // 800ms animation
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = progress * (2 - progress); // easeOutQuad
      
      setAnimatedBefore(parseFloat((startB + (endB - startB) * ease).toFixed(1)));
      setAnimatedAfter(parseFloat((startA + (endA - startA) * ease).toFixed(1)));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setAnimatedBefore(endB);
        setAnimatedAfter(endA);
      }
    };
    requestAnimationFrame(animate);
  }, [result]);

  const priorityColors = {
    CRITICAL: {
      badge: 'bg-red-500/20 text-red-400 border border-red-500/30',
      border: 'border-red-500/50 shadow-[0_0_15px_rgba(239,71,111,0.15)] animate-[pulse_2s_infinite]',
      text: 'text-red-500'
    },
    HIGH: {
      badge: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
      border: 'border-orange-500/40 shadow-[0_0_10px_rgba(247,140,107,0.1)]',
      text: 'text-orange-500'
    },
    MEDIUM: {
      badge: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
      border: 'border-yellow-500/30',
      text: 'text-yellow-500'
    },
    LOW: {
      badge: 'bg-green-500/20 text-green-400 border border-green-500/30',
      border: 'border-green-500/30',
      text: 'text-green-500'
    }
  };

  const currentStyle = priorityColors[result.priority_level] || priorityColors.LOW;

  // Confidence bar color utility
  const getConfidenceColor = (conf: number) => {
    if (conf >= 0.8) return 'bg-gradient-to-r from-emerald-500 to-teal-400';
    if (conf >= 0.6) return 'bg-gradient-to-r from-yellow-500 to-amber-400';
    return 'bg-gradient-to-r from-red-500 to-rose-400';
  };

  const handleApproveClick = () => {
    setShowApprovalCard(true);
    setShowRejectForm(false);
  };

  const handleOverrideClick = () => {
    setShowApprovalCard(true);
    setShowRejectForm(false);
  };

  const handleConfirmSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!officerName.trim()) {
      alert("Please enter the approving officer's name / ID.");
      return;
    }
    
    const isOverridden = overrideCount !== result.buses_to_add;
    const finalState = isOverridden ? 'OVERRIDDEN' : 'APPROVED';
    setSubmitState(finalState);
    setIsSubmitted(true);
    
    // Call the parent approval handler
    onApprove(result, overrideCount);
  };

  const handleRejectClick = () => {
    setShowRejectForm(true);
    setShowApprovalCard(false);
  };

  const handleConfirmReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectReason.trim()) {
      alert("Please specify a reason for rejection.");
      return;
    }
    setSubmitState('REJECTED');
    setIsSubmitted(true);
    onReject(result, rejectReason);
  };

  const quickRejectReasons = [
    "Buses unavailable",
    "Traffic clear",
    "Manual override in progress"
  ];

  return (
    <div className={`flex flex-col bg-[#12121a] border ${currentStyle.border} rounded-xl overflow-hidden text-[#e8e8f0] max-w-md w-full transition-all duration-300`}>
      {/* Panel Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#161622] border-b border-[#2a2a3a]">
        <div className="flex items-center gap-2">
          <span className="text-xl">🤖</span>
          <span className="text-sm font-bold uppercase tracking-wider text-[#9f9fb5]">AI Recommendation</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#1b1b2a] border border-[#2d2d42]">Route {result.route_no}</span>
          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${currentStyle.badge}`}>{result.priority_level}</span>
          {onClose && (
            <button onClick={onClose} className="text-[#6b6b80] hover:text-[#e8e8f0] transition-colors ml-1">
              &times;
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="p-5 flex-1 flex flex-col gap-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#4a9eff] border-t-transparent"></div>
            <span className="text-xs text-[#6b6b80]">Analyzing corridor metrics...</span>
          </div>
        ) : isSubmitted ? (
          /* Submission success state */
          <div className="flex flex-col items-center justify-center py-6 text-center gap-3 animate-[scaleIn_0.3s_ease]">
            <div className={`h-12 w-12 rounded-full flex items-center justify-center text-xl font-bold ${
              submitState === 'APPROVED' || submitState === 'OVERRIDDEN'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}>
              {submitState === 'APPROVED' || submitState === 'OVERRIDDEN' ? '✓' : '✗'}
            </div>
            <div>
              <h4 className="font-bold text-lg">
                {submitState === 'APPROVED' && "Deployment Approved"}
                {submitState === 'OVERRIDDEN' && `Deployment Overridden (+${overrideCount})`}
                {submitState === 'REJECTED' && "Recommendation Rejected"}
              </h4>
              <p className="text-xs text-[#9f9fb5] mt-1 px-4 leading-relaxed">
                {submitState === 'APPROVED' && `Dispatched ${result.buses_to_add} buses to Route ${result.route_no}.`}
                {submitState === 'OVERRIDDEN' && `Dispatched ${overrideCount} buses (AI suggested ${result.buses_to_add}) to Route ${result.route_no}.`}
                {submitState === 'REJECTED' && `Logged rejection of recommendation for Route ${result.route_no}.`}
              </p>
            </div>
          </div>
        ) : (
          /* Interactive Recommendation Panel */
          <>
            <div>
              <h3 className="text-lg font-bold text-white leading-tight">
                {result.buses_to_add > 0 
                  ? `Deploy ${result.buses_to_add} additional bus${result.buses_to_add > 1 ? 'es' : ''}`
                  : "No additional deployment needed"
                }
              </h3>
              <p className="text-xs text-[#4a9eff] mt-1 font-medium">
                {result.buses_to_add > 0 
                  ? `Expected wait time will drop from ${result.expected_wait_time_before} min \u2192 ${result.expected_wait_time_after} min`
                  : "Route operates within normal capacity headway."
                }
              </p>
            </div>

            {/* Wait time comparison and confidence */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-[#1b1b28] border border-[#252538] rounded-lg p-2.5 text-center">
                <span className="text-[10px] uppercase font-bold text-[#6b6b80] tracking-wider block mb-1">Before</span>
                <span className="font-mono text-2xl font-bold text-[#ef476f]">{animatedBefore}<span className="text-xs font-sans font-normal ml-0.5 text-[#6b6b80]">m</span></span>
              </div>
              <div className="bg-[#1b1b28] border border-[#252538] rounded-lg p-2.5 text-center">
                <span className="text-[10px] uppercase font-bold text-[#6b6b80] tracking-wider block mb-1">After</span>
                <span className="font-mono text-2xl font-bold text-[#06d6a0]">{animatedAfter}<span className="text-xs font-sans font-normal ml-0.5 text-[#6b6b80]">m</span></span>
              </div>
              <div className="bg-[#1b1b28] border border-[#252538] rounded-lg p-2.5 flex flex-col justify-between">
                <div className="flex justify-between items-center text-[10px] uppercase font-bold text-[#6b6b80] tracking-wider">
                  <span>Confidence</span>
                  <span className="font-mono text-white font-bold">{Math.round(result.confidence * 100)}%</span>
                </div>
                <div className="h-2 w-full bg-[#2a2a3a] rounded-full overflow-hidden mt-1.5">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000`} 
                    style={{ 
                      width: `${result.confidence * 100}%`,
                      backgroundImage: 'linear-gradient(to right, #ef476f, #ffd166, #06d6a0)'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Reasoning section */}
            <div className="bg-[#161622] rounded-lg p-3 border border-[#232335]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#6b6b80]">Reasoning</span>
              <p className="text-xs text-[#9f9fb5] mt-1 leading-relaxed">{result.reasoning}</p>
            </div>

            {/* Action buttons or approval forms */}
            {!showApprovalCard && !showRejectForm ? (
              <div className="flex gap-2.5 mt-2">
                <button
                  onClick={handleApproveClick}
                  disabled={result.buses_to_add === 0}
                  className="flex-1 bg-[#06d6a0] hover:bg-[#05b88a] disabled:bg-gray-800 disabled:text-gray-500 text-slate-900 font-bold text-xs py-2.5 px-4 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>✓</span> Approve Deployment
                </button>
                <button
                  onClick={handleOverrideClick}
                  disabled={result.buses_to_add === 0}
                  className="bg-[#1e1e2d] hover:bg-[#28283d] disabled:bg-gray-900 disabled:text-gray-600 text-[#9f9fb5] hover:text-white border border-[#2d2d42] font-semibold text-xs py-2.5 px-3 rounded-lg flex items-center justify-center gap-1 transition-colors cursor-pointer"
                >
                  <span>✎</span> Override
                </button>
                <button
                  onClick={handleRejectClick}
                  disabled={result.buses_to_add === 0}
                  className="bg-transparent hover:bg-red-500/10 text-red-400 hover:text-red-300 font-medium text-xs py-2.5 px-3 rounded-lg transition-colors border border-transparent hover:border-red-500/20 cursor-pointer"
                >
                  ✗ Reject
                </button>
              </div>
            ) : showApprovalCard ? (
              /* Officer Approval stepper form */
              <form onSubmit={handleConfirmSubmit} className="flex flex-col gap-3 mt-1 pt-2 border-t border-[#232335] animate-[scaleIn_0.2s_ease]">
                <div className="flex items-center justify-between bg-[#1e1e2d] border border-[#2d2d42] rounded-lg p-2">
                  <span className="text-xs text-[#9f9fb5] font-semibold pl-1">Adjust Deployment Count</span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setOverrideCount(Math.max(0, overrideCount - 1))}
                      className="h-7 w-7 rounded bg-[#2a2a3d] flex items-center justify-center hover:bg-[#383854] text-sm font-bold cursor-pointer"
                    >
                      &minus;
                    </button>
                    <span className="font-mono font-bold text-base w-5 text-center text-white">{overrideCount}</span>
                    <button
                      type="button"
                      onClick={() => setOverrideCount(Math.min(8, overrideCount + 1))}
                      className="h-7 w-7 rounded bg-[#2a2a3d] flex items-center justify-center hover:bg-[#383854] text-sm font-bold cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                {overrideCount !== result.buses_to_add && (
                  <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] rounded p-2 text-center font-medium animate-pulse">
                    ⚠️ State set to OVERRIDDEN (recommending {result.buses_to_add} buses)
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold text-[#6b6b80] tracking-wider">Officer ID / Signature</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter MTC Officer Name (e.g. Officer K. Kumar)"
                    value={officerName}
                    onChange={(e) => setOfficerName(e.target.value)}
                    className="bg-[#1b1b28] border border-[#2d2d42] text-xs rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#4a9eff] transition-colors"
                  />
                </div>

                <div className="flex gap-2 mt-1">
                  <button
                    type="submit"
                    className="flex-1 bg-[#06d6a0] hover:bg-[#05b88a] text-slate-900 font-bold text-xs py-2 px-4 rounded-lg cursor-pointer"
                  >
                    Confirm & Dispatch
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowApprovalCard(false)}
                    className="bg-[#1e1e2d] hover:bg-[#28283d] text-[#9f9fb5] text-xs py-2 px-4 rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              /* Rejection Form */
              <form onSubmit={handleConfirmReject} className="flex flex-col gap-3 mt-1 pt-2 border-t border-[#232335] animate-[scaleIn_0.2s_ease]">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold text-[#6b6b80] tracking-wider">Reason for Rejection</label>
                  <input
                    type="text"
                    required
                    placeholder="Provide details or select a quick-pick below"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="bg-[#1b1b28] border border-[#2d2d42] text-xs rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#4a9eff] transition-colors"
                  />
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {quickRejectReasons.map((reason, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setRejectReason(reason)}
                      className="bg-[#1b1b2a] hover:bg-[#2a2a3f] border border-[#2d2d42] text-[#9f9fb5] hover:text-white text-[10px] px-2 py-1 rounded transition-colors cursor-pointer"
                    >
                      {reason}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2 mt-1">
                  <button
                    type="submit"
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold text-xs py-2 px-4 rounded-lg cursor-pointer"
                  >
                    Submit Rejection
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowRejectForm(false)}
                    className="bg-[#1e1e2d] hover:bg-[#28283d] text-[#9f9fb5] text-xs py-2 px-4 rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}
