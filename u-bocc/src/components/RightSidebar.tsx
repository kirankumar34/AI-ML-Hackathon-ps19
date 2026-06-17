'use client';

import React, { useState } from 'react';
import { Action, Depot, LogEntry } from '../types';
import ActionCard from './ActionCard';
import DepotTable from './DepotTable';
import { Zap, Bell, Warehouse, FileText, CheckCircle, XCircle, Sparkles, Activity } from 'lucide-react';
import { RecommendationCard } from './sidebar/RecommendationCard';
import { AlertCard as AnomalyAlertCard } from './sidebar/AlertCard';
import { MOCK_EVENTS, toggleMockEvent } from '../lib/computations/eventSimulator';
import { useUBOCCStore } from '../store/ubocc-store';

interface RightSidebarProps {
  actions: Action[];
  depots: Depot[];
  logs: LogEntry[];
  onApproveAction: (action: Action, dispatchCount: number | null) => void;
  onRejectAction: (action: Action) => void;
}

type TabType = 'actions' | 'recs' | 'alerts' | 'depots' | 'log';

export default function RightSidebar({
  actions,
  depots,
  logs,
  onApproveAction,
  onRejectAction,
}: RightSidebarProps) {
  const [activeTab, setActiveTab] = useState<TabType>('actions');

  // Query Zustand store states for Phase 2 recommendations and alerts
  const { 
    recommendations, 
    alerts: anomalyAlerts, 
    clearResolvedAlerts,
    trafficScores,
    activeEvents,
    predictionTimeframe,
    setPredictionTimeframe
  } = useUBOCCStore();

  const activeAnomalyAlerts = anomalyAlerts.filter(a => a.status !== 'resolved');
  const resolvedAnomalyAlerts = anomalyAlerts.filter(a => a.status === 'resolved');

  // Critical alerts count from Phase 2 alerts
  const criticalAlertsCount = activeAnomalyAlerts.filter(a => a.severity === 'critical').length;

  return (
    <aside className="flex h-full w-[320px] flex-col border-l border-[#2a2a3a] bg-[#12121a] text-[#e8e8f0] select-none z-20 shadow-md">
      {/* Tab Header */}
      <div className="flex border-b border-[#2a2a3a] text-[10px] font-bold font-sans">
        {/* Actions Tab */}
        <button
          onClick={() => setActiveTab('actions')}
          className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 border-b-2 hover:text-[#e8e8f0] transition-colors cursor-pointer uppercase ${
            activeTab === 'actions' 
              ? 'border-[#4a9eff] text-[#4a9eff] bg-[#1a1a26]/20' 
              : 'border-transparent text-[#6b6b80]'
          }`}
        >
          <Zap className="h-3.5 w-3.5" />
          <span>Ops Act</span>
          {actions.length > 0 && (
            <span className="absolute top-1 right-28 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-[#ef476f] text-[9px] text-white font-mono font-bold leading-none">
              {actions.length}
            </span>
          )}
        </button>

        {/* AI Recs Tab */}
        <button
          onClick={() => setActiveTab('recs')}
          className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 border-b-2 hover:text-[#e8e8f0] transition-colors cursor-pointer uppercase relative ${
            activeTab === 'recs' 
              ? 'border-[#4a9eff] text-[#4a9eff] bg-[#1a1a26]/20' 
              : 'border-transparent text-[#6b6b80]'
          }`}
        >
          <Sparkles className="h-3.5 w-3.5 text-amber-400" />
          <span>AI Recs</span>
          {recommendations.length > 0 && (
            <span className="absolute top-1 right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-amber-500 text-[9px] text-[#0a0a0f] font-mono font-bold leading-none">
              {recommendations.length}
            </span>
          )}
        </button>

        {/* Alerts Tab */}
        <button
          onClick={() => setActiveTab('alerts')}
          className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 border-b-2 hover:text-[#e8e8f0] transition-colors cursor-pointer uppercase relative ${
            activeTab === 'alerts' 
              ? 'border-[#4a9eff] text-[#4a9eff] bg-[#1a1a26]/20' 
              : 'border-transparent text-[#6b6b80]'
          }`}
        >
          <Bell className="h-3.5 w-3.5" />
          <span>Alerts</span>
          {activeAnomalyAlerts.length > 0 && (
            <span className={`absolute top-1 right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-[#ef476f] text-[9px] text-white font-mono font-bold leading-none ${criticalAlertsCount > 0 ? 'animate-pulse' : ''}`}>
              {activeAnomalyAlerts.length}
            </span>
          )}
        </button>

        {/* Depots Tab */}
        <button
          onClick={() => setActiveTab('depots')}
          className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 border-b-2 hover:text-[#e8e8f0] transition-colors cursor-pointer uppercase ${
            activeTab === 'depots' 
              ? 'border-[#4a9eff] text-[#4a9eff] bg-[#1a1a26]/20' 
              : 'border-transparent text-[#6b6b80]'
          }`}
        >
          <Warehouse className="h-3.5 w-3.5" />
          <span>Depots</span>
        </button>

        {/* Log Tab */}
        <button
          onClick={() => setActiveTab('log')}
          className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 border-b-2 hover:text-[#e8e8f0] transition-colors cursor-pointer uppercase relative ${
            activeTab === 'log' 
              ? 'border-[#4a9eff] text-[#4a9eff] bg-[#1a1a26]/20' 
              : 'border-transparent text-[#6b6b80]'
          }`}
        >
          <FileText className="h-3.5 w-3.5" />
          <span>Audit</span>
          {logs.length > 0 && (
            <span className="absolute top-1 right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-[#6b6b80] text-[9px] text-white font-mono font-bold leading-none">
              {logs.length}
            </span>
          )}
        </button>
      </div>

      {/* Tab Contents (Scrollable Container) */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {activeTab === 'actions' && (
          <div>
            <div className="text-[10px] font-bold text-[#6b6b80] uppercase tracking-wider font-mono mb-3">
              PENDING OFFICER APPROVAL ({actions.length})
            </div>
            {actions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center text-[#6b6b80] gap-2">
                <CheckCircle className="h-8 w-8 text-[#06d6a0] opacity-50" />
                <span className="text-xs font-bold uppercase tracking-wider">All Clear</span>
                <span className="text-[10px] leading-relaxed">No pending dispatcher dispatches or reroutes requiring approval.</span>
              </div>
            ) : (
              actions.map((action) => (
                <ActionCard
                  key={action.id}
                  action={action}
                  onApprove={onApproveAction}
                  onReject={onRejectAction}
                />
              ))
            )}
          </div>
        )}

        {activeTab === 'recs' && (
          <div className="flex flex-col gap-3">
            {/* AI Traffic Prediction Table */}
            <div className="bg-[#1a1a26]/60 border border-[#2a2a3a] rounded-xl p-3.5 mb-2">
              <div className="flex items-center justify-between mb-2">
                <div className="text-[10px] font-bold text-[#ef476f] uppercase tracking-widest font-mono flex items-center gap-1.5">
                  <Activity className="h-3 w-3" />
                  AI Traffic Engine
                </div>
                
                {/* Timeframe Toggle */}
                <div className="flex bg-[#0f0f15] border border-[#2a2a3a] rounded p-0.5">
                  {(['current', '30m', '1h'] as const).map(tf => {
                    const isActive = predictionTimeframe === tf;
                    return (
                      <button
                        key={tf}
                        onClick={() => setPredictionTimeframe(tf)}
                        className={`px-1.5 py-0.5 text-[8px] font-bold uppercase rounded ${
                          isActive ? 'bg-[#4a9eff]/20 text-[#4a9eff]' : 'text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        {tf === 'current' ? 'Now' : `+${tf}`}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="overflow-hidden border border-[#2a2a3a]/40 rounded-lg">
                <table className="w-full text-left border-collapse text-[10px] font-mono">
                  <thead>
                    <tr className="bg-[#0f0f15] text-[#6b6b80] border-b border-[#2a2a3a]/60">
                      <th className="py-2 px-2.5 font-bold uppercase text-[8px]">Area</th>
                      <th className="py-2 px-2 text-center font-bold uppercase text-[8px]">Score</th>
                      <th className="py-2 px-2.5 text-right font-bold uppercase text-[8px]">Risk</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2a2a3a]/40 text-[#e8e8f0]">
                    {trafficScores.map((ts) => {
                      let riskBadgeColor = 'text-green-400 border border-green-500/25 bg-green-500/5';
                      if (ts.risk === 'CRITICAL') riskBadgeColor = 'text-red-400 border border-red-500/25 bg-red-500/5 animate-pulse';
                      else if (ts.risk === 'HIGH') riskBadgeColor = 'text-orange-400 border border-orange-500/25 bg-orange-500/5';
                      else if (ts.risk === 'MEDIUM') riskBadgeColor = 'text-blue-400 border border-blue-500/25 bg-blue-500/5';

                      return (
                        <tr key={ts.area} className="hover:bg-[#1a1a26]/40 transition-colors">
                          <td className="py-2 px-2.5 font-sans font-bold text-white text-[9px]">{ts.area}</td>
                          <td className="py-2 px-2 text-center font-bold text-[#ffd166]">{ts.score}%</td>
                          <td className="py-2 px-2.5 text-right font-bold">
                            <span className={`inline-block text-[8px] font-bold px-1.5 py-0.5 rounded ${riskBadgeColor}`}>
                              {ts.risk}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-[#1a1a26]/60 border border-[#2a2a3a] rounded-xl p-3.5 mb-2">
              <div className="text-[10px] font-bold text-[#b388ff] uppercase tracking-widest font-mono mb-2 flex items-center gap-1.5">
                <Sparkles className="h-3 w-3" />
                Mock Event Simulator
              </div>
              <div className="flex flex-col gap-1.5">
                {MOCK_EVENTS.map(evt => {
                  const isActive = activeEvents.some(e => e.id === evt.id);
                  return (
                    <button
                      key={evt.id}
                      onClick={() => toggleMockEvent(evt.id)}
                      className={`text-left px-2 py-1.5 rounded text-[10px] font-mono border transition-colors cursor-pointer ${
                        isActive 
                          ? 'bg-[#ef476f]/20 border-[#ef476f]/40 text-[#ef476f]' 
                          : 'bg-[#0f0f15] border-[#2a2a3a] text-slate-400 hover:text-slate-200 hover:bg-[#2a2a3a]'
                      }`}
                    >
                      {isActive ? '🛑 STOP: ' : '▶ SIMULATE: '} {evt.title}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="text-[10px] font-bold text-[#6b6b80] uppercase tracking-wider font-mono mb-1 mt-2">
              AI SMART DISPATCH RECOMMENDATIONS ({recommendations.length})
            </div>
            {recommendations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center text-[#6b6b80] gap-2">
                <Sparkles className="h-8 w-8 text-amber-400 opacity-40 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider">Headways Stable</span>
                <span className="text-[10px] leading-relaxed">No AI interventions needed at this time. Segment spacings are normal.</span>
              </div>
            ) : (
              recommendations.map((rec) => (
                <RecommendationCard
                  key={rec.id}
                  recommendation={rec}
                />
              ))
            )}
          </div>
        )}

        {activeTab === 'alerts' && (
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] font-bold text-[#6b6b80] uppercase tracking-wider font-mono">
                INTELLIGENCE ALERTS ({activeAnomalyAlerts.length})
              </span>
              {resolvedAnomalyAlerts.length > 0 && (
                <button 
                  onClick={clearResolvedAlerts}
                  className="text-[9px] text-slate-500 hover:text-slate-300 font-semibold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Clear Resolved ({resolvedAnomalyAlerts.length})
                </button>
              )}
            </div>
            {activeAnomalyAlerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center text-[#6b6b80] gap-2">
                <CheckCircle className="h-8 w-8 text-[#06d6a0] opacity-50" />
                <span className="text-xs font-bold uppercase tracking-wider">All Normal</span>
                <span className="text-[10px] leading-relaxed">No active anomalies detected in the MTC Chennai fleet.</span>
              </div>
            ) : (
              activeAnomalyAlerts.map((alert) => (
                <AnomalyAlertCard key={alert.id} alert={alert} />
              ))
            )}
          </div>
        )}

        {activeTab === 'depots' && (
          <div>
            <div className="text-[10px] font-bold text-[#6b6b80] uppercase tracking-wider font-mono mb-3">
              DEPOT CAPACITIES ({depots.length})
            </div>
            <DepotTable depots={depots} />
          </div>
        )}

        {activeTab === 'log' && (
          <div>
            <div className="text-[10px] font-bold text-[#6b6b80] uppercase tracking-wider font-mono mb-3">
              OFFICER AUDIT TRAIL ({logs.length})
            </div>
            {logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center text-[#6b6b80] gap-2">
                <FileText className="h-8 w-8 opacity-30" />
                <span className="text-xs font-bold uppercase tracking-wider">Empty Log</span>
                <span className="text-[10px] leading-relaxed">No actions have been approved or rejected during this session.</span>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {logs.map((log) => (
                  <div key={log.id} className="bg-[#1a1a26]/40 border border-[#2a2a3a] rounded-lg p-3 select-none flex flex-col gap-2 font-sans">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[9px] font-semibold text-[#6b6b80]">
                        {log.timestamp}
                      </span>
                      <span className={`inline-flex items-center gap-1 text-[8px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${
                        log.status === 'APPROVED' 
                          ? 'bg-[#06d6a0]/10 border-[#06d6a0]/30 text-[#06d6a0]' 
                          : 'bg-[#ef476f]/10 border-[#ef476f]/30 text-[#ef476f]'
                      }`}>
                        {log.status === 'APPROVED' ? (
                          <>
                            <CheckCircle className="h-2.5 w-2.5" /> Approved
                          </>
                        ) : (
                          <>
                            <XCircle className="h-2.5 w-2.5" /> Rejected
                          </>
                        )}
                      </span>
                    </div>

                    {/* Route Info */}
                    <div className="text-[10px] font-bold text-white flex items-center gap-1.5">
                      <span className="bg-[#12121a] border border-[#2a2a3a] px-1.5 py-0.5 rounded font-mono text-[9px]">
                        Route {log.route}
                      </span>
                      <span className="text-[#6b6b80] font-medium text-[9px]">
                        {log.actionType === 'ADD_BUSES' ? 'ADD BUSES' : 'REROUTE'}
                      </span>
                    </div>

                    {/* Details */}
                    <div className="text-[10px] text-[#6b6b80] leading-relaxed">
                      {log.details}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
