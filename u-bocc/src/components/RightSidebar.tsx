'use client';

import React, { useState } from 'react';
import { Action, Alert, Depot, LogEntry } from '../types';
import ActionCard from './ActionCard';
import AlertCard from './AlertCard';
import DepotTable from './DepotTable';
import { Zap, Bell, Warehouse, FileText, CheckCircle, XCircle } from 'lucide-react';

interface RightSidebarProps {
  actions: Action[];
  alerts: Alert[];
  depots: Depot[];
  logs: LogEntry[];
  onApproveAction: (action: Action, dispatchCount: number | null) => void;
  onRejectAction: (action: Action) => void;
}

type TabType = 'actions' | 'alerts' | 'depots' | 'log';

export default function RightSidebar({
  actions,
  alerts,
  depots,
  logs,
  onApproveAction,
  onRejectAction,
}: RightSidebarProps) {
  const [activeTab, setActiveTab] = useState<TabType>('actions');

  // Critical alerts count
  const criticalAlertsCount = alerts.filter(a => a.severity === 'CRITICAL').length;

  return (
    <aside className="flex h-full w-[320px] flex-col border-l border-[#2a2a3a] bg-[#12121a] text-[#e8e8f0] select-none z-20 shadow-md">
      {/* Tab Header */}
      <div className="flex border-b border-[#2a2a3a] text-xs font-bold font-sans">
        {/* Actions Tab */}
        <button
          onClick={() => setActiveTab('actions')}
          className={`flex-1 flex items-center justify-center gap-1 py-3.5 border-b-2 hover:text-[#e8e8f0] transition-colors cursor-pointer uppercase ${
            activeTab === 'actions' 
              ? 'border-[#4a9eff] text-[#4a9eff] bg-[#1a1a26]/20' 
              : 'border-transparent text-[#6b6b80]'
          }`}
        >
          <Zap className="h-3.5 w-3.5" />
          <span>Actions</span>
          {actions.length > 0 && (
            <span className="flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-[#ef476f] text-[9px] text-white font-mono font-bold leading-none">
              {actions.length}
            </span>
          )}
        </button>

        {/* Alerts Tab */}
        <button
          onClick={() => setActiveTab('alerts')}
          className={`flex-1 flex items-center justify-center gap-1 py-3.5 border-b-2 hover:text-[#e8e8f0] transition-colors cursor-pointer uppercase ${
            activeTab === 'alerts' 
              ? 'border-[#4a9eff] text-[#4a9eff] bg-[#1a1a26]/20' 
              : 'border-transparent text-[#6b6b80]'
          }`}
        >
          <Bell className="h-3.5 w-3.5" />
          <span>Alerts</span>
          {criticalAlertsCount > 0 && (
            <span className="flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-[#ef476f] text-[9px] text-white font-mono font-bold leading-none animate-pulse">
              {criticalAlertsCount}
            </span>
          )}
        </button>

        {/* Depots Tab */}
        <button
          onClick={() => setActiveTab('depots')}
          className={`flex-1 flex items-center justify-center gap-1 py-3.5 border-b-2 hover:text-[#e8e8f0] transition-colors cursor-pointer uppercase ${
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
          className={`flex-1 flex items-center justify-center gap-1 py-3.5 border-b-2 hover:text-[#e8e8f0] transition-colors cursor-pointer uppercase ${
            activeTab === 'log' 
              ? 'border-[#4a9eff] text-[#4a9eff] bg-[#1a1a26]/20' 
              : 'border-transparent text-[#6b6b80]'
          }`}
        >
          <FileText className="h-3.5 w-3.5" />
          <span>Log</span>
          {logs.length > 0 && (
            <span className="flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-[#6b6b80] text-[9px] text-white font-mono font-bold leading-none">
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

        {activeTab === 'alerts' && (
          <div>
            <div className="text-[10px] font-bold text-[#6b6b80] uppercase tracking-wider font-mono mb-3">
              INTELLIGENCE ALERTS ({alerts.length})
            </div>
            {alerts.map((alert) => (
              <AlertCard key={alert.id} alert={alert} />
            ))}
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
