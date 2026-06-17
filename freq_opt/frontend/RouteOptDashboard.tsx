import React, { useState, useEffect } from 'react';
import FrequencyOptPanel from './FrequencyOptPanel';
import { useFrequencyOpt, FreqOptResult, FreqOptInput } from './useFrequencyOpt';

// Toast type
interface Toast {
  id: string;
  message: string;
  eta: number;
}

// Route Telemetry structure
interface RouteTelemetry {
  route_no: string;
  description: string;
  occupancy_pct: number;
  avg_wait_time_min: number;
  active_buses_on_route: number;
  traffic_score: number;
  event_impact_score: number;
  temp_celsius: number;
  // Post-optimization fields
  buses_to_add?: number;
  expected_wait_after?: number;
  priority_level?: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  prediction_loaded?: boolean;
  prediction?: FreqOptResult;
  status: 'PENDING' | 'APPROVED' | 'OVERRIDDEN' | 'REJECTED';
}

const INITIAL_ROUTES: RouteTelemetry[] = [
  { route_no: "47A", description: "Koyambedu \u2192 Tambaram", occupancy_pct: 1.42, avg_wait_time_min: 18.0, active_buses_on_route: 6, traffic_score: 4.2, event_impact_score: 0.6, temp_celsius: 36.0, status: 'PENDING' },
  { route_no: "21C", description: "Thiruvanmiyur \u2192 Broadway", occupancy_pct: 1.18, avg_wait_time_min: 14.0, active_buses_on_route: 8, traffic_score: 3.8, event_impact_score: 0.0, temp_celsius: 35.0, status: 'PENDING' },
  { route_no: "9A", description: "Velachery \u2192 Central", occupancy_pct: 1.05, avg_wait_time_min: 11.0, active_buses_on_route: 10, traffic_score: 2.8, event_impact_score: 0.0, temp_celsius: 34.0, status: 'PENDING' },
  { route_no: "23C", description: "T.Nagar \u2192 Central", occupancy_pct: 0.88, avg_wait_time_min: 8.0, active_buses_on_route: 12, traffic_score: 2.2, event_impact_score: 0.0, temp_celsius: 33.0, status: 'PENDING' },
  { route_no: "29C", description: "Besant Nagar \u2192 Perambur", occupancy_pct: 1.35, avg_wait_time_min: 22.0, active_buses_on_route: 5, traffic_score: 4.5, event_impact_score: 0.3, temp_celsius: 34.5, status: 'PENDING' },
  { route_no: "21G", description: "Broadway \u2192 Tambaram", occupancy_pct: 1.55, avg_wait_time_min: 29.0, active_buses_on_route: 4, traffic_score: 4.8, event_impact_score: 0.8, temp_celsius: 36.5, status: 'PENDING' },
  { route_no: "101", description: "Thiruvotriyur \u2192 Poonamallee", occupancy_pct: 1.25, avg_wait_time_min: 24.0, active_buses_on_route: 6, traffic_score: 3.5, event_impact_score: 0.0, temp_celsius: 33.5, status: 'PENDING' },
  { route_no: "104", description: "Redhills \u2192 Tambaram", occupancy_pct: 1.10, avg_wait_time_min: 16.0, active_buses_on_route: 8, traffic_score: 3.2, event_impact_score: 0.0, temp_celsius: 34.0, status: 'PENDING' },
  { route_no: "70", description: "CMBT \u2192 Tambaram", occupancy_pct: 0.95, avg_wait_time_min: 13.0, active_buses_on_route: 9, traffic_score: 2.9, event_impact_score: 0.0, temp_celsius: 35.0, status: 'PENDING' },
  { route_no: "102", description: "Island Ground \u2192 Kelambakkam", occupancy_pct: 1.48, avg_wait_time_min: 26.0, active_buses_on_route: 5, traffic_score: 4.0, event_impact_score: 0.5, temp_celsius: 37.0, status: 'PENDING' },
  { route_no: "12E", description: "Anna Nagar \u2192 Broadway", occupancy_pct: 0.82, avg_wait_time_min: 9.0, active_buses_on_route: 10, traffic_score: 2.1, event_impact_score: 0.0, temp_celsius: 32.5, status: 'PENDING' },
  { route_no: "5C", description: "Adyar \u2192 Koyambedu", occupancy_pct: 0.75, avg_wait_time_min: 7.0, active_buses_on_route: 11, traffic_score: 1.8, event_impact_score: 0.0, temp_celsius: 33.0, status: 'PENDING' },
  { route_no: "29B", description: "Guindy \u2192 Perambur", occupancy_pct: 0.60, avg_wait_time_min: 6.0, active_buses_on_route: 14, traffic_score: 1.5, event_impact_score: 0.0, temp_celsius: 34.0, status: 'PENDING' },
  { route_no: "M70", description: "Medavakkam \u2192 CMBT", occupancy_pct: 0.50, avg_wait_time_min: 15.0, active_buses_on_route: 8, traffic_score: 2.0, event_impact_score: 0.0, temp_celsius: 33.8, status: 'PENDING' },
  { route_no: "27D", description: "Vadapalani \u2192 Royapuram", occupancy_pct: 0.89, avg_wait_time_min: 12.0, active_buses_on_route: 7, traffic_score: 2.5, event_impact_score: 0.0, temp_celsius: 32.0, status: 'PENDING' }
];

export default function RouteOptDashboard() {
  const [routes, setRoutes] = useState<RouteTelemetry[]>(INITIAL_ROUTES);
  const [selectedRoute, setSelectedRoute] = useState<RouteTelemetry | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isBulkApproving, setIsBulkApproving] = useState(false);
  const [hoveredBarRoute, setHoveredBarRoute] = useState<RouteTelemetry | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const { result, loading, predict } = useFrequencyOpt();

  // On mount, run predictions for all routes to get initial recommendations
  useEffect(() => {
    runInitialPredictions();
  }, []);

  const runInitialPredictions = async () => {
    // Generate initial predictions locally using a deterministic fallback generator
    // so the dashboard populates instantly with correct values.
    const updated = INITIAL_ROUTES.map(route => {
      const pred = generateHeuristicPrediction(route);
      return {
        ...route,
        buses_to_add: pred.buses_to_add,
        expected_wait_after: pred.expected_wait_time_after,
        priority_level: pred.priority_level,
        prediction: pred,
        prediction_loaded: true
      };
    });
    setRoutes(updated);
  };

  const generateHeuristicPrediction = (route: RouteTelemetry): FreqOptResult => {
    const occupancy = route.occupancy_pct;
    const waitBefore = route.avg_wait_time_min;
    
    let busesToAdd = 0;
    if (occupancy >= 0.85) {
      busesToAdd = Math.min(5, Math.max(0, Math.round((occupancy - 0.85) * 4)));
    }
    
    // Rule constraint: buses_to_add = 0 if occupancy < 85%
    if (occupancy < 0.85) {
      busesToAdd = 0;
    }
    
    const totalBuses = route.active_buses_on_route + busesToAdd;
    const baseHeadway = 60 / totalBuses;
    const trafficPenalty = (route.traffic_score - 1) * 1.2;
    const waitAfter = parseFloat(Math.max(2.0, baseHeadway + trafficPenalty - 1.5).toFixed(1));
    const reductionPct = waitBefore > 0 
      ? parseFloat(((1 - waitAfter / waitBefore) * 100).toFixed(1))
      : 0.0;
      
    let priority: FreqOptResult['priority_level'] = "LOW";
    if (busesToAdd >= 4 || occupancy > 1.5 || waitBefore > 25) {
      priority = "CRITICAL";
    } else if (busesToAdd >= 3 || occupancy > 1.2) {
      priority = "HIGH";
    } else if (busesToAdd >= 1) {
      priority = "MEDIUM";
    }
    
    const reasons: string[] = [];
    if (occupancy > 1.0) reasons.push(`occupancy at ${Math.round(occupancy * 100)}% capacity`);
    if (waitBefore > 15) reasons.push(`avg wait of ${waitBefore} min exceeds threshold`);
    if (route.traffic_score > 3.5) reasons.push(`high traffic congestion (score ${route.traffic_score.toFixed(1)}/5)`);
    if (route.event_impact_score > 0.5) reasons.push("active event impact on corridor");
    
    const reasoning = reasons.length > 0 ? "Triggered by: " + reasons.join("; ") : "Routine optimization cycle.";
    
    return {
      route_no: route.route_no,
      recommendation: `Deploy ${busesToAdd} additional bus${busesToAdd > 1 ? 'es' : ''} on Route ${route.route_no}. Expected wait time drop: ${waitBefore} -> ${waitAfter} min. Priority: ${priority}.`,
      buses_to_add: busesToAdd,
      confidence: parseFloat((0.75 + Math.random() * 0.2).toFixed(2)),
      expected_wait_time_before: waitBefore,
      expected_wait_time_after: waitAfter,
      wait_time_reduction_pct: reductionPct,
      priority_level: priority,
      reasoning
    };
  };

  const addToast = (message: string, eta: number = 4) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { id, message, eta }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  const handleRouteClick = (route: RouteTelemetry) => {
    setSelectedRoute(route);
    // Call the hook's predict function to load dynamic FastAPI prediction
    const hour = new Date().getHours();
    const isWeekend = new Date().getDay() === 0 || new Date().getDay() === 6 ? 1 : 0;
    
    predict({
      route_no: route.route_no,
      hour_of_day: hour,
      day_type: isWeekend,
      occupancy_pct: route.occupancy_pct,
      avg_wait_time_min: route.avg_wait_time_min,
      traffic_score: route.traffic_score,
      event_impact_score: route.event_impact_score,
      active_buses_on_route: route.active_buses_on_route,
      temp_celsius: route.temp_celsius
    });
  };

  // Perform prediction when hook returns a result
  useEffect(() => {
    if (result && selectedRoute) {
      setRoutes(prev => prev.map(r => {
        if (r.route_no === result.route_no) {
          return {
            ...r,
            buses_to_add: result.buses_to_add,
            expected_wait_after: result.expected_wait_time_after,
            priority_level: result.priority_level,
            prediction: result,
            prediction_loaded: true
          };
        }
        return r;
      }));
    }
  }, [result]);

  const handleApprove = (res: FreqOptResult, overrideCount?: number) => {
    const finalCount = overrideCount !== undefined ? overrideCount : res.buses_to_add;
    
    setRoutes(prev => prev.map(r => {
      if (r.route_no === res.route_no) {
        return {
          ...r,
          active_buses_on_route: r.active_buses_on_route + finalCount,
          avg_wait_time_min: r.expected_wait_after || r.avg_wait_time_min,
          occupancy_pct: parseFloat((r.occupancy_pct / (1 + finalCount / r.active_buses_on_route)).toFixed(2)),
          buses_to_add: 0,
          expected_wait_after: r.expected_wait_after,
          priority_level: 'LOW',
          status: overrideCount !== undefined && overrideCount !== res.buses_to_add ? 'OVERRIDDEN' : 'APPROVED'
        };
      }
      return r;
    }));

    addToast(`Dispatching ${finalCount} bus${finalCount > 1 ? 'es' : ''} to Route ${res.route_no} — ETA ${Math.floor(Math.random() * 3) + 3} min`, 4);
    
    // Close panel after short delay
    setTimeout(() => {
      setSelectedRoute(null);
    }, 1500);
  };

  const handleReject = (res: FreqOptResult, reason: string) => {
    setRoutes(prev => prev.map(r => {
      if (r.route_no === res.route_no) {
        return {
          ...r,
          status: 'REJECTED'
        };
      }
      return r;
    }));
    
    addToast(`Rejected AI recommendation for Route ${res.route_no}: "${reason}"`, 0);
    setTimeout(() => {
      setSelectedRoute(null);
    }, 1500);
  };

  // Bulk Approve CRITICAL routes
  const handleBulkApprove = async () => {
    const criticalRoutes = routes.filter(r => r.priority_level === 'CRITICAL' && r.status === 'PENDING');
    if (criticalRoutes.length === 0) {
      alert("No pending CRITICAL routes found.");
      return;
    }
    
    setIsBulkApproving(true);
    
    for (let i = 0; i < criticalRoutes.length; i++) {
      const route = criticalRoutes[i];
      await new Promise(resolve => setTimeout(resolve, i * 400)); // 400ms stagger
      
      const busesToAdd = route.buses_to_add || 2;
      
      setRoutes(prev => prev.map(r => {
        if (r.route_no === route.route_no) {
          return {
            ...r,
            active_buses_on_route: r.active_buses_on_route + busesToAdd,
            avg_wait_time_min: r.expected_wait_after || r.avg_wait_time_min,
            occupancy_pct: parseFloat((r.occupancy_pct / (1 + busesToAdd / r.active_buses_on_route)).toFixed(2)),
            buses_to_add: 0,
            priority_level: 'LOW',
            status: 'APPROVED'
          };
        }
        return r;
      }));

      addToast(`[BULK] Dispatching ${busesToAdd} buses to Route ${route.route_no} — ETA ${Math.floor(Math.random() * 3) + 3} min`, 4);
    }
    
    setIsBulkApproving(false);
  };

  // Export MTC Report
  const handleExport = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + ["Route,Occupancy,Active Buses,Suggested Additions,Wait Before,Wait After,Priority,Status"].join(",") + "\n"
      + routes.map(r => `${r.route_no},${Math.round(r.occupancy_pct*100)}%,${r.active_buses_on_route},${r.buses_to_add || 0},${r.avg_wait_time_min}m,${r.expected_wait_after || r.avg_wait_time_min}m,${r.priority_level || 'LOW'},${r.status}`).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `MTC_Frequency_Optimization_Report_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // KPI calculations
  const criticalCount = routes.filter(r => r.priority_level === 'CRITICAL' && r.status === 'PENDING').length;
  const highCount = routes.filter(r => r.priority_level === 'HIGH' && r.status === 'PENDING').length;
  const mediumCount = routes.filter(r => r.priority_level === 'MEDIUM' && r.status === 'PENDING').length;
  const lowCount = routes.filter(r => (r.priority_level === 'LOW' || r.status !== 'PENDING')).length;

  // Render Custom SVG Chart dimensions
  const chartHeight = 220;
  const chartWidth = 720;
  const paddingLeft = 40;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 40;
  
  const graphWidth = chartWidth - paddingLeft - paddingRight;
  const graphHeight = chartHeight - paddingTop - paddingBottom;
  
  // Max wait time is 35 mins
  const maxVal = 35;
  const routesForChart = routes.slice(0, 10); // Show top 10 routes in chart

  const handleBarMouseMove = (e: React.MouseEvent, route: RouteTelemetry) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const parentRect = e.currentTarget.parentElement?.getBoundingClientRect();
    if (parentRect) {
      setTooltipPos({
        x: rect.left - parentRect.left + rect.width / 2,
        y: rect.top - parentRect.top - 70
      });
    }
    setHoveredBarRoute(route);
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#0a0a0f] text-[#e8e8f0] p-6 overflow-y-auto custom-scrollbar relative">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1f1f2e] pb-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>📊</span> ROUTE FREQUENCY OPTIMIZATION CONSOLE
          </h1>
          <p className="text-xs text-[#9f9fb5] mt-1">
            AI-Powered dispatch recommendation engine utilizing Chennai MTC fleet telemetry models.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={runInitialPredictions}
            className="px-4 py-2 bg-[#1b1b2a] hover:bg-[#25253b] border border-[#2d2d42] text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
          >
            🔄 Refresh Simulation
          </button>
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-[#1b1b2a] hover:bg-[#25253b] border border-[#2d2d42] text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
          >
            📥 Export CSV
          </button>
        </div>
      </div>

      {/* KPI summary widgets */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-[#1b1215] border border-red-500/20 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-red-400 block mb-1">Critical Shortfall</span>
            <span className="text-3xl font-mono font-bold text-red-500">{criticalCount}</span>
          </div>
          {criticalCount > 0 && <span className="absolute top-3 right-3 h-2 w-2 bg-red-500 rounded-full animate-ping" />}
        </div>
        <div className="bg-[#1b1612] border border-orange-500/20 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-orange-400 block mb-1">High Demand</span>
            <span className="text-3xl font-mono font-bold text-orange-500">{highCount}</span>
          </div>
        </div>
        <div className="bg-[#1a1a12] border border-yellow-500/20 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-yellow-400 block mb-1">Medium Priority</span>
            <span className="text-3xl font-mono font-bold text-yellow-500">{mediumCount}</span>
          </div>
        </div>
        <div className="bg-[#121b14] border border-green-500/20 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-green-400 block mb-1">Stable Routes</span>
            <span className="text-3xl font-mono font-bold text-green-500">{lowCount}</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Left list table, Right preview card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Table & Chart Container */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Routes Table */}
          <div className="bg-[#12121a] border border-[#1f1f2e] rounded-xl overflow-hidden shadow-lg">
            <div className="px-5 py-4 bg-[#161622] border-b border-[#1f1f2e] flex items-center justify-between">
              <span className="text-sm font-bold uppercase tracking-wider text-white">Live Route Diagnostics</span>
              {criticalCount > 0 && (
                <button
                  onClick={handleBulkApprove}
                  disabled={isBulkApproving}
                  className="px-3 py-1 bg-red-500 hover:bg-red-600 disabled:bg-gray-800 disabled:text-gray-500 text-white font-bold text-[11px] rounded-lg transition-colors cursor-pointer"
                >
                  {isBulkApproving ? "Approving..." : `✓ Approve All CRITICAL (${criticalCount})`}
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#1f1f2e] text-[10px] uppercase text-[#6b6b80] font-bold">
                    <th className="py-3 px-4">Route</th>
                    <th className="py-3 px-4">Occupancy</th>
                    <th className="py-3 px-4">Wait Now</th>
                    <th className="py-3 px-4">+Buses (AI)</th>
                    <th className="py-3 px-4">Wait After</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#181826] text-xs">
                  {routes.map((route, index) => {
                    const isSelected = selectedRoute?.route_no === route.route_no;
                    const waitBefore = route.avg_wait_time_min;
                    const waitAfter = route.expected_wait_after || waitBefore;
                    const isCritical = route.priority_level === 'CRITICAL' && route.status === 'PENDING';
                    
                    return (
                      <tr 
                        key={index} 
                        className={`hover:bg-[#181828] cursor-pointer transition-colors ${isSelected ? 'bg-[#1a1a2e]' : ''} ${isCritical ? 'border-l-2 border-red-500' : ''}`}
                        onClick={() => handleRouteClick(route)}
                      >
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-white block">{route.route_no}</span>
                          <span className="text-[10px] text-[#6b6b80]">{route.description}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-12 bg-gray-800 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${route.occupancy_pct > 1.0 ? 'bg-red-500' : route.occupancy_pct > 0.85 ? 'bg-orange-500' : 'bg-green-500'}`} 
                                style={{ width: `${Math.min(100, route.occupancy_pct * 70)}%` }}
                              />
                            </div>
                            <span className="font-mono font-bold text-[#e8e8f0]">{Math.round(route.occupancy_pct * 100)}%</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-semibold text-red-400">{waitBefore} min</td>
                        <td className="py-3.5 px-4 font-bold">
                          {route.status !== 'PENDING' ? (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${route.status === 'REJECTED' ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>
                              {route.status}
                            </span>
                          ) : (
                            <span className={route.buses_to_add && route.buses_to_add > 0 ? 'text-[#4a9eff]' : 'text-gray-500'}>
                              {route.buses_to_add && route.buses_to_add > 0 ? `+${route.buses_to_add}` : '0'}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-semibold text-emerald-400">{waitAfter} min</td>
                        <td className="py-3.5 px-4 text-right" onClick={e => e.stopPropagation()}>
                          <button 
                            onClick={() => handleRouteClick(route)}
                            className={`px-2.5 py-1 text-[11px] font-bold rounded ${
                              isSelected 
                                ? 'bg-[#4a9eff] text-slate-950' 
                                : 'bg-[#1b1b2c] hover:bg-[#232338] text-white border border-[#2d2d42]'
                            } transition-all cursor-pointer`}
                          >
                            Diagnose
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* SVG Bar Chart */}
          <div className="bg-[#12121a] border border-[#1f1f2e] rounded-xl p-5 shadow-lg relative select-none">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-4">Fleet Deployment Efficiency — Before vs After</h3>
            
            <div className="w-full overflow-x-auto custom-scrollbar">
              <svg 
                height={chartHeight} 
                width={chartWidth} 
                className="overflow-visible"
              >
                {/* Grid lines */}
                {[0, 1, 2, 3].map((gridIdx) => {
                  const val = (maxVal / 3) * gridIdx;
                  const yPos = paddingTop + graphHeight - (val / maxVal) * graphHeight;
                  return (
                    <g key={gridIdx}>
                      <line 
                        x1={paddingLeft} 
                        y1={yPos} 
                        x2={chartWidth - paddingRight} 
                        y2={yPos} 
                        stroke="#1f1f2e" 
                        strokeWidth="1"
                        strokeDasharray="4 4"
                      />
                      <text 
                        x={paddingLeft - 8} 
                        y={yPos + 4} 
                        fill="#6b6b80" 
                        fontSize="10" 
                        fontFamily="monospace"
                        textAnchor="end"
                      >
                        {Math.round(val)}m
                      </text>
                    </g>
                  );
                })}

                {/* X Axis */}
                <line 
                  x1={paddingLeft} 
                  y1={paddingTop + graphHeight} 
                  x2={chartWidth - paddingRight} 
                  y2={paddingTop + graphHeight} 
                  stroke="#2d2d42" 
                  strokeWidth="1"
                />

                {/* Bars */}
                {routesForChart.map((route, idx) => {
                  const numRoutes = routesForChart.length;
                  const sectionWidth = graphWidth / numRoutes;
                  const barGroupWidth = sectionWidth * 0.7;
                  const individualBarWidth = barGroupWidth / 2 - 2;
                  
                  const sectionCenterX = paddingLeft + (idx * sectionWidth) + (sectionWidth / 2);
                  const startX = sectionCenterX - (barGroupWidth / 2);
                  
                  const waitBefore = route.avg_wait_time_min;
                  const waitAfter = route.expected_wait_after || waitBefore;
                  
                  const beforeHeight = (waitBefore / maxVal) * graphHeight;
                  const afterHeight = (waitAfter / maxVal) * graphHeight;
                  
                  const beforeY = paddingTop + graphHeight - beforeHeight;
                  const afterY = paddingTop + graphHeight - afterHeight;
                  
                  return (
                    <g key={idx} className="group cursor-pointer">
                      {/* Before bar (Red) */}
                      <rect
                        x={startX}
                        y={beforeY}
                        width={individualBarWidth}
                        height={beforeHeight}
                        fill="#ef476f"
                        fillOpacity="0.85"
                        rx="2"
                        className="transition-all hover:fill-opacity-100"
                        onMouseMove={(e) => handleBarMouseMove(e, route)}
                        onMouseLeave={() => setHoveredBarRoute(null)}
                        onClick={() => handleRouteClick(route)}
                      />
                      
                      {/* After bar (Green) */}
                      <rect
                        x={startX + individualBarWidth + 4}
                        y={afterY}
                        width={individualBarWidth}
                        height={afterHeight}
                        fill="#06d6a0"
                        fillOpacity="0.85"
                        rx="2"
                        className="transition-all hover:fill-opacity-100"
                        onMouseMove={(e) => handleBarMouseMove(e, route)}
                        onMouseLeave={() => setHoveredBarRoute(null)}
                        onClick={() => handleRouteClick(route)}
                      />

                      {/* X axis Label */}
                      <text
                        x={sectionCenterX}
                        y={paddingTop + graphHeight + 16}
                        fill="#9f9fb5"
                        fontSize="10"
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        {route.route_no}
                      </text>
                    </g>
                  );
                })}

                {/* Tooltip Overlay */}
                {hoveredBarRoute && (
                  <g transform={`translate(${tooltipPos.x}, ${tooltipPos.y})`}>
                    <rect
                      x="-90"
                      y="0"
                      width="180"
                      height="65"
                      fill="#12121a"
                      stroke="#2d2d42"
                      strokeWidth="1"
                      rx="6"
                      filter="drop-shadow(0 4px 6px rgba(0,0,0,0.4))"
                    />
                    <text x="0" y="15" fill="white" fontSize="10" fontWeight="bold" textAnchor="middle">
                      Route {hoveredBarRoute.route_no} Diagnostics
                    </text>
                    <text x="-80" y="32" fill="#ef476f" fontSize="10" fontWeight="bold">
                      Wait Before: {hoveredBarRoute.avg_wait_time_min}m
                    </text>
                    <text x="-80" y="47" fill="#06d6a0" fontSize="10" fontWeight="bold">
                      Wait After: {hoveredBarRoute.expected_wait_after || hoveredBarRoute.avg_wait_time_min}m
                    </text>
                  </g>
                )}
              </svg>
            </div>
            
            {/* Chart Legend */}
            <div className="flex gap-4 justify-center mt-3 text-[10px] font-bold">
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded bg-[#ef476f]" />
                <span className="text-[#6b6b80]">Wait Time Before Optimization</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded bg-[#06d6a0]" />
                <span className="text-[#6b6b80]">Expected Wait Time After</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar - AI Panel details */}
        <div>
          {selectedRoute ? (
            <div className="sticky top-6 flex flex-col gap-4 animate-[scaleIn_0.2s_ease]">
              <FrequencyOptPanel
                result={selectedRoute.prediction || generateHeuristicPrediction(selectedRoute)}
                loading={loading && selectedRoute.prediction_loaded !== true}
                onApprove={handleApprove}
                onReject={handleReject}
                onClose={() => setSelectedRoute(null)}
              />
              
              <div className="bg-[#12121a] border border-[#1f1f2e] rounded-xl p-4 flex flex-col gap-3">
                <span className="text-[10px] uppercase tracking-wider font-bold text-[#6b6b80]">Live Route Telemetry</span>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-[#161622] rounded p-2">
                    <span className="text-[#6b6b80] block text-[9px] uppercase font-bold mb-0.5">Active Buses</span>
                    <span className="font-mono font-bold text-white">{selectedRoute.active_buses_on_route}</span>
                  </div>
                  <div className="bg-[#161622] rounded p-2">
                    <span className="text-[#6b6b80] block text-[9px] uppercase font-bold mb-0.5">Traffic Score</span>
                    <span className="font-mono font-bold text-orange-400">{selectedRoute.traffic_score.toFixed(1)}/5.0</span>
                  </div>
                  <div className="bg-[#161622] rounded p-2">
                    <span className="text-[#6b6b80] block text-[9px] uppercase font-bold mb-0.5">Temp Ambient</span>
                    <span className="font-mono font-bold text-white">{selectedRoute.temp_celsius}&deg;C</span>
                  </div>
                  <div className="bg-[#161622] rounded p-2">
                    <span className="text-[#6b6b80] block text-[9px] uppercase font-bold mb-0.5">Event Impact</span>
                    <span className="font-mono font-bold text-yellow-500">{Math.round(selectedRoute.event_impact_score * 100)}%</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="sticky top-6 bg-[#12121a] border border-dashed border-[#2d2d42] rounded-xl p-8 text-center flex flex-col items-center justify-center gap-3 py-16">
              <span className="text-3xl">🤖</span>
              <h4 className="font-bold text-sm text-white">AI Diagnostics Ready</h4>
              <p className="text-xs text-[#6b6b80] leading-relaxed max-w-xs">
                Select any route from the live diagnostics dashboard table or click on a chart bar to review and approve frequency optimizations.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Floating Zomato/Swiggy style toast alerts (bottom-center) */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 flex flex-col gap-3.5 max-w-sm w-full px-4">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="w-full bg-[#1b1b2a] border border-[#06d6a0]/30 shadow-[0_10px_25px_rgba(0,0,0,0.6)] rounded-xl py-3.5 px-4 flex items-center justify-between text-xs text-white border-l-4 border-l-[#06d6a0] animate-[slideUpFade_0.4s_ease-out] relative overflow-hidden"
          >
            {/* Swiggy/Zomato Style sliding loading bar */}
            <div 
              className="absolute bottom-0 left-0 h-1 bg-[#06d6a0]/40 animate-[shrinkBar_4.5s_linear_forwards]"
            />
            
            <div className="flex items-center gap-2.5">
              <span className="text-base">🚚</span>
              <div>
                <p className="font-semibold text-white leading-tight">{toast.message}</p>
                {toast.eta > 0 && (
                  <p className="text-[10px] text-[#6b6b80] mt-0.5">ETA Tracker active &bull; Live dispatch updates enabled</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
