'use client';

import React, { useState } from 'react';
import { Action } from '../types';
import { Plus, Minus, Check, X, AlertTriangle, ArrowRight } from 'lucide-react';

interface ActionCardProps {
  action: Action;
  onApprove: (action: Action, dispatchCount: number | null) => void;
  onReject: (action: Action) => void;
}

export default function ActionCard({ action, onApprove, onReject }: ActionCardProps) {
  const [busesCount, setBusesCount] = useState<number>(action.busesRequired || 10);
  const [animationState, setAnimationState] = useState<'idle' | 'approving' | 'rejecting'>('idle');

  const handleApprove = () => {
    setAnimationState('approving');
    setTimeout(() => {
      onApprove(action, action.actionType === 'ADD_BUSES' ? busesCount : null);
    }, 300); // match duration of css transition
  };

  const handleReject = () => {
    setAnimationState('rejecting');
    setTimeout(() => {
      onReject(action);
    }, 300);
  };

  const incrementBuses = () => {
    setBusesCount(prev => Math.min(20, prev + 1));
  };

  const decrementBuses = () => {
    setBusesCount(prev => Math.max(1, prev - 1));
  };

  // Animation classes
  let animationClass = 'opacity-100 transform translate-x-0';
  if (animationState === 'approving') {
    animationClass = 'opacity-0 transform translate-x-12 bg-[#06d6a0]/10 border-[#06d6a0]/50 transition-all duration-300 ease-out';
  } else if (animationState === 'rejecting') {
    animationClass = 'opacity-0 transform -translate-x-12 bg-[#ef476f]/10 border-[#ef476f]/50 transition-all duration-300 ease-out';
  } else {
    animationClass = 'transition-all duration-300 ease-out';
  }

  const isCritical = action.priority === 'CRITICAL';

  return (
    <div className={`bg-[#1a1a26] border border-[#2a2a3a] rounded-lg p-4 mb-4 select-none ${animationClass}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-1.5 text-xs">
          <span className="font-bold text-[#e8e8f0] font-mono bg-[#12121a] border border-[#2a2a3a] px-2 py-0.5 rounded">
            Route {action.route}
          </span>
        </div>
        <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
          isCritical ? 'bg-[#ef476f]/20 border border-[#ef476f]/40 text-[#ef476f]' : 'bg-[#ffd166]/10 border border-[#ffd166]/30 text-[#ffd166]'
        }`}>
          {action.priority}
        </span>
      </div>

      {/* Description */}
      <p className="text-[11px] text-[#6b6b80] mb-3 leading-relaxed">
        {action.actionType === 'ADD_BUSES' 
          ? `Deploy ${busesCount} additional Ordinary buses from ${action.depot} depot on Route ${action.route} (${action.routeDescription}). Reduces avg wait from ${action.waitBefore} min to ${action.waitAfter} min.`
          : action.description}
      </p>

      {/* Divider */}
      <div className="h-px bg-[#2a2a3a] w-full mb-3" />

      {/* Grid details */}
      <div className="grid grid-cols-2 gap-y-2.5 text-[10px] mb-4">
        <div>
          <span className="text-[#6b6b80] uppercase tracking-wider font-bold block mb-0.5">Action Type</span>
          <span className="font-bold text-[#ffd166] uppercase tracking-wide">
            {action.actionType === 'ADD_BUSES' ? 'ADD BUSES' : 'REROUTE'}
          </span>
        </div>

        {action.depot && (
          <div>
            <span className="text-[#6b6b80] uppercase tracking-wider font-bold block mb-0.5">Source Depot</span>
            <span className="font-bold text-[#b388ff] uppercase tracking-wide">{action.depot}</span>
          </div>
        )}

        <div>
          <span className="text-[#6b6b80] uppercase tracking-wider font-bold block mb-0.5">Wait Time Impact</span>
          <span className="font-bold font-mono text-white flex items-center gap-1">
            {action.waitBefore}m <ArrowRight className="h-3 w-3 text-[#6b6b80]" /> {action.waitAfter}m
          </span>
        </div>

        <div className="col-span-2 bg-[#12121a] border border-[#2a2a3a] px-2 py-1.5 rounded flex items-start gap-1">
          <span className="text-[#06d6a0] font-bold font-mono text-[9px] tracking-wide uppercase">Impact:</span>
          <span className="text-[#e8e8f0] font-semibold text-[9px]">{action.impact}</span>
        </div>
      </div>

      {/* Dispatch Stepper (for ADD_BUSES) */}
      {action.actionType === 'ADD_BUSES' && (
        <div className="flex items-center justify-between bg-[#12121a] border border-[#2a2a3a] p-2 rounded-md mb-4 text-xs font-semibold">
          <span className="text-[#6b6b80] uppercase tracking-wider font-bold text-[9px]">Buses to dispatch:</span>
          <div className="flex items-center gap-2">
            <button 
              onClick={decrementBuses}
              className="p-1 rounded bg-[#1a1a26] border border-[#2a2a3a] hover:bg-[#2a2a3a] transition-all cursor-pointer"
            >
              <Minus className="h-3.5 w-3.5 text-[#e8e8f0]" />
            </button>
            <span className="font-mono text-white text-sm w-5 text-center">{busesCount}</span>
            <button 
              onClick={incrementBuses}
              className="p-1 rounded bg-[#1a1a26] border border-[#2a2a3a] hover:bg-[#2a2a3a] transition-all cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5 text-[#e8e8f0]" />
            </button>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleApprove}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md bg-[#06d6a0]/10 border border-[#06d6a0]/30 hover:bg-[#06d6a0] hover:text-[#0a0a0f] hover:border-transparent text-[#06d6a0] font-bold text-[10px] uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-sm"
        >
          <Check className="h-3.5 w-3.5" /> Approve
        </button>
        <button
          onClick={handleReject}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md bg-zinc-900 border border-[#2a2a3a] hover:bg-[#ef476f]/10 hover:text-[#ef476f] hover:border-[#ef476f]/30 text-[#6b6b80] font-bold text-[10px] uppercase tracking-wider transition-all duration-200 cursor-pointer"
        >
          <X className="h-3.5 w-3.5" /> Reject
        </button>
      </div>
    </div>
  );
}
