import React, { useState } from 'react';

export interface OfficerApprovalCardProps {
  routeNo: string;
  routeDescription: string;
  suggestedBuses: number;
  confidence: number;
  priorityLevel: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  expectedWaitBefore: number;
  expectedWaitAfter: number;
  onApprove: (decision: {
    status: 'APPROVED' | 'OVERRIDDEN';
    busesDispatched: number;
    officerId: string;
    timestamp: string;
  }) => void;
  onReject: (decision: {
    status: 'REJECTED';
    reason: string;
    officerId: string;
    timestamp: string;
  }) => void;
  onClose?: () => void;
}

export default function OfficerApprovalCard({
  routeNo,
  routeDescription,
  suggestedBuses,
  confidence,
  priorityLevel,
  expectedWaitBefore,
  expectedWaitAfter,
  onApprove,
  onReject,
  onClose
}: OfficerApprovalCardProps) {
  const [status, setStatus] = useState<'PENDING' | 'APPROVED' | 'OVERRIDDEN' | 'REJECTED'>('PENDING');
  const [busesCount, setBusesCount] = useState<number>(suggestedBuses);
  const [officerName, setOfficerName] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  const priorityColors = {
    CRITICAL: 'text-red-400 bg-red-950/40 border border-red-500/20',
    HIGH: 'text-orange-400 bg-orange-950/40 border border-orange-500/20',
    MEDIUM: 'text-yellow-400 bg-yellow-950/40 border border-yellow-500/20',
    LOW: 'text-green-400 bg-green-950/40 border border-green-500/20'
  };

  const currentPillColor = priorityColors[priorityLevel] || priorityColors.LOW;

  const handleIncrement = () => {
    setBusesCount(prev => Math.min(8, prev + 1));
  };

  const handleDecrement = () => {
    setBusesCount(prev => Math.max(0, prev - 1));
  };

  const handleSubmitApprove = (e: React.FormEvent) => {
    e.preventDefault();
    if (!officerName.trim()) {
      alert("Please enter authorizing MTC officer name/ID.");
      return;
    }
    const isOverridden = busesCount !== suggestedBuses;
    const finalStatus = isOverridden ? 'OVERRIDDEN' : 'APPROVED';
    
    setStatus(finalStatus);
    
    onApprove({
      status: finalStatus,
      busesDispatched: busesCount,
      officerId: officerName,
      timestamp: new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })
    });
  };

  const handleSubmitReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectReason.trim()) {
      alert("Please specify a reason for rejection.");
      return;
    }
    setStatus('REJECTED');
    onReject({
      status: 'REJECTED',
      reason: rejectReason,
      officerId: officerName || 'MTC-OFFICER',
      timestamp: new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })
    });
  };

  const isOverridden = busesCount !== suggestedBuses;

  return (
    <div className="flex flex-col bg-[#12121a] border border-[#2d2d42] rounded-xl overflow-hidden text-[#e8e8f0] max-w-md w-full shadow-2xl transition-all duration-300">
      {/* Top Header Card */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#161622] border-b border-[#2a2a3a]">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${status === 'PENDING' ? 'bg-[#ffc107] animate-pulse' : status === 'REJECTED' ? 'bg-[#ef476f]' : 'bg-[#06d6a0]'}`} />
          <span className="text-xs font-bold uppercase tracking-wider text-[#9f9fb5]">
            {status === 'PENDING' && (isOverridden ? 'OVERRIDE PENDING' : 'PENDING APPROVAL')}
            {status !== 'PENDING' && status}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-[#6b6b80] font-mono">
            {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' })}
          </span>
          {onClose && (
            <button onClick={onClose} className="text-[#6b6b80] hover:text-[#e8e8f0] transition-colors ml-1 cursor-pointer">
              &times;
            </button>
          )}
        </div>
      </div>

      {/* Main Body */}
      <div className="p-5 flex flex-col gap-4">
        {status === 'PENDING' && !showRejectForm ? (
          <>
            <div>
              <h3 className="text-base font-bold text-white leading-snug">Route {routeNo} &bull; {routeDescription}</h3>
              <p className="text-xs text-[#9f9fb5] mt-1">
                AI recommends: <span className="text-[#4a9eff] font-bold">+{suggestedBuses} buses</span>
              </p>
              <p className="text-xs text-[#06d6a0] mt-0.5">
                Expected impact: <span className="font-bold">&darr;{Math.round((1 - expectedWaitAfter / expectedWaitBefore) * 100)}%</span> wait time ({expectedWaitBefore} &rarr; {expectedWaitAfter} min)
              </p>
            </div>

            {/* Badges Row */}
            <div className="flex gap-2 text-[10px] font-bold">
              <span className={`px-2 py-0.5 rounded ${currentPillColor}`}>Priority: {priorityLevel}</span>
              <span className="px-2 py-0.5 rounded bg-gray-800 text-gray-300">Confidence: {Math.round(confidence * 100)}%</span>
            </div>

            {/* Stepper Counter */}
            <div className="flex flex-col gap-1.5 mt-1">
              <label className="text-[10px] uppercase font-bold text-[#6b6b80] tracking-wider">Override Count</label>
              <div className="flex items-center justify-between bg-[#1e1e2d] border border-[#2d2d42] rounded-lg p-2">
                <span className="text-xs text-[#9f9fb5] pl-1">Buses to deploy</span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleDecrement}
                    className="h-7 w-7 rounded bg-[#2a2a3d] flex items-center justify-center hover:bg-[#383854] text-sm font-bold cursor-pointer"
                  >
                    &minus;
                  </button>
                  <span className="font-mono font-bold text-base w-5 text-center text-white">{busesCount}</span>
                  <button
                    type="button"
                    onClick={handleIncrement}
                    className="h-7 w-7 rounded bg-[#2a2a3d] flex items-center justify-center hover:bg-[#383854] text-sm font-bold cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Form submit */}
            <form onSubmit={handleSubmitApprove} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-bold text-[#6b6b80] tracking-wider">Officer Signature</label>
                <input
                  type="text"
                  required
                  placeholder="Enter Officer Signature / ID"
                  value={officerName}
                  onChange={(e) => setOfficerName(e.target.value)}
                  className="bg-[#1b1b28] border border-[#2d2d42] text-xs rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#4a9eff] transition-colors"
                />
              </div>

              <div className="flex gap-2 mt-1">
                <button
                  type="submit"
                  className="flex-1 bg-[#06d6a0] hover:bg-[#05b88a] text-slate-900 font-bold text-xs py-2.5 px-4 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  ✓ Approve
                </button>
                <button
                  type="button"
                  onClick={() => setShowRejectForm(true)}
                  className="bg-transparent hover:bg-red-500/10 text-red-400 hover:text-red-300 font-medium text-xs py-2.5 px-4 rounded-lg transition-colors border border-transparent hover:border-red-500/20 cursor-pointer"
                >
                  ✗ Reject
                </button>
              </div>
            </form>
          </>
        ) : showRejectForm && status === 'PENDING' ? (
          /* Rejection subform */
          <form onSubmit={handleSubmitReject} className="flex flex-col gap-3">
            <div>
              <h3 className="text-sm font-bold text-white">Reject Route {routeNo} AI Recommendation</h3>
              <p className="text-xs text-[#9f9fb5] mt-0.5">Please provide a reason to help improve the MTC model.</p>
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-bold text-[#6b6b80] tracking-wider">Reason</label>
              <input
                type="text"
                required
                placeholder="Why are you rejecting this?"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="bg-[#1b1b28] border border-[#2d2d42] text-xs rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#ef476f] transition-colors"
              />
            </div>

            {/* Quick picks */}
            <div className="flex flex-wrap gap-1.5">
              {["Buses unavailable", "Traffic clear", "Manual override"].map((pick, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setRejectReason(pick)}
                  className="bg-[#1b1b2a] hover:bg-[#2a2a3f] border border-[#2d2d42] text-[#9f9fb5] text-[10px] px-2 py-1 rounded transition-colors cursor-pointer"
                >
                  {pick}
                </button>
              ))}
            </div>

            <div className="flex gap-2 mt-2">
              <button
                type="submit"
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold text-xs py-2 px-4 rounded-lg cursor-pointer"
              >
                Confirm Rejection
              </button>
              <button
                type="button"
                onClick={() => setShowRejectForm(false)}
                className="bg-[#1e1e2d] hover:bg-[#28283d] text-[#9f9fb5] text-xs py-2 px-4 rounded-lg cursor-pointer"
              >
                Back
              </button>
            </div>
          </form>
        ) : (
          /* Completed Action state */
          <div className="flex flex-col items-center justify-center py-6 text-center gap-3 animate-[scaleIn_0.3s_ease]">
            <div className={`h-12 w-12 rounded-full flex items-center justify-center text-xl font-bold ${
              status === 'APPROVED' || status === 'OVERRIDDEN'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}>
              {status === 'APPROVED' || status === 'OVERRIDDEN' ? '✓' : '✗'}
            </div>
            <div>
              <h4 className="font-bold text-base">
                {status === 'APPROVED' && "Deployment Dispatched"}
                {status === 'OVERRIDDEN' && `Overridden Dispatch (+${busesCount})`}
                {status === 'REJECTED' && "Recommendation Rejected"}
              </h4>
              <p className="text-xs text-[#9f9fb5] mt-1 px-4 leading-relaxed">
                {status === 'APPROVED' && `Officer ${officerName || 'MTC'} authorized +${suggestedBuses} buses on Route ${routeNo}.`}
                {status === 'OVERRIDDEN' && `Officer ${officerName || 'MTC'} changed count to +${busesCount} (AI suggested +${suggestedBuses}).`}
                {status === 'REJECTED' && `Logged rejection: "${rejectReason}" by Officer ${officerName}.`}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
