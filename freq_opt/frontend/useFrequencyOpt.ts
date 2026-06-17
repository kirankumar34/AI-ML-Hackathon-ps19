import { useState, useCallback } from 'react';

export interface FreqOptInput {
  route_no: string;
  hour_of_day: number;
  day_type: number;
  occupancy_pct: number;
  avg_wait_time_min: number;
  traffic_score: number;
  event_impact_score: number;
  active_buses_on_route: number;
  temp_celsius: number;
}

export interface FreqOptResult {
  route_no: string;
  recommendation: string;
  buses_to_add: number;
  confidence: number;
  expected_wait_time_before: number;
  expected_wait_time_after: number;
  wait_time_reduction_pct: number;
  priority_level: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  reasoning: string;
}

// Hardcoded Mock Payload for Demo Mode / Fallback
export const DEMO_PREDICTIONS: Record<string, Omit<FreqOptResult, 'route_no'>> = {
  "47A": {
    recommendation: "Deploy 3 additional buses on Route 47A. Expected wait time will drop from 18 min \u2192 6 min (67% improvement). Priority: HIGH.",
    buses_to_add: 3,
    confidence: 0.87,
    expected_wait_time_before: 18,
    expected_wait_time_after: 6,
    wait_time_reduction_pct: 66.7,
    priority_level: "HIGH",
    reasoning: "Triggered by: occupancy at 142% capacity; avg wait of 18 min exceeds threshold; peak hour demand window"
  },
  "21C": {
    recommendation: "Deploy 2 additional buses on Route 21C. Expected wait time will drop from 14 min \u2192 7 min (50% improvement). Priority: HIGH.",
    buses_to_add: 2,
    confidence: 0.81,
    expected_wait_time_before: 14,
    expected_wait_time_after: 7,
    wait_time_reduction_pct: 50.0,
    priority_level: "HIGH",
    reasoning: "Triggered by: occupancy at 118% capacity; peak hour demand window"
  },
  "9A": {
    recommendation: "Deploy 1 additional bus on Route 9A. Expected wait time will drop from 11 min \u2192 8 min (27% improvement). Priority: MEDIUM.",
    buses_to_add: 1,
    confidence: 0.74,
    expected_wait_time_before: 11,
    expected_wait_time_after: 8,
    wait_time_reduction_pct: 27.3,
    priority_level: "MEDIUM",
    reasoning: "Triggered by: occupancy at 105% capacity"
  }
};

// Heuristic fallback generator when route is not in DEMO_PREDICTIONS
const generateFallbackResult = (input: FreqOptInput): FreqOptResult => {
  const occupancy = input.occupancy_pct;
  const waitBefore = input.avg_wait_time_min;
  
  let busesToAdd = 0;
  if (occupancy >= 0.85) {
    busesToAdd = Math.min(5, Math.max(0, Math.round((occupancy - 0.85) * 4)));
  }
  
  // Rule check
  if (occupancy < 0.85) {
    busesToAdd = 0;
  }
  
  const totalBuses = input.active_buses_on_route + busesToAdd;
  const baseHeadway = 60 / totalBuses;
  const trafficPenalty = (input.traffic_score - 1) * 1.2;
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
  if (occupancy > 1.0) reasons.append ? reasons.push(`occupancy at ${Math.round(occupancy * 100)}% capacity`) : reasons.push(`occupancy at ${Math.round(occupancy * 100)}% capacity`);
  if (waitBefore > 15) reasons.push(`avg wait of ${waitBefore} min exceeds threshold`);
  if (input.traffic_score > 3.5) reasons.push(`high traffic congestion (score ${input.traffic_score.toFixed(1)}/5)`);
  if (input.event_impact_score > 0.5) reasons.push("active event impact on corridor");
  if (7 <= input.hour_of_day && input.hour_of_day <= 10 || 17 <= input.hour_of_day && input.hour_of_day <= 21) {
    reasons.push("peak hour demand window");
  }
  const reasoning = reasons.length > 0 
    ? "Triggered by: " + reasons.join("; ")
    : "Routine optimization cycle.";
    
  let recommendation = `Route ${input.route_no} is operating within normal capacity. No additional deployment needed.`;
  if (busesToAdd > 0) {
    const improvement = Math.round((1 - waitAfter / waitBefore) * 100);
    recommendation = `Deploy ${busesToAdd} additional bus${busesToAdd > 1 ? 'es' : ''} on Route ${input.route_no}. Expected wait time will drop from ${waitBefore} min \u2192 ${waitAfter} min (${improvement}% improvement). Priority: ${priority}.`;
  }
  
  return {
    route_no: input.route_no,
    recommendation,
    buses_to_add: busesToAdd,
    confidence: parseFloat((0.75 + Math.random() * 0.15).toFixed(2)),
    expected_wait_time_before: waitBefore,
    expected_wait_time_after: waitAfter,
    wait_time_reduction_pct: reductionPct,
    priority_level: priority,
    reasoning
  };
};

export function useFrequencyOpt() {
  const [result, setResult] = useState<FreqOptResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);

  const predict = useCallback(async (input: FreqOptInput) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:8000/predict-frequency', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
      setIsDemoMode(false);
    } catch (err) {
      console.warn("FastAPI server unreachable. Activating Demo/Fallback mode.", err);
      setIsDemoMode(true);
      
      // Look up in hardcoded predictions
      const routeNo = input.route_no;
      if (DEMO_PREDICTIONS[routeNo]) {
        const demoData = DEMO_PREDICTIONS[routeNo];
        // Merge in inputs or adjust wait times to match inputs for consistency
        const beforeWait = input.avg_wait_time_min;
        const busesToAdd = demoData.buses_to_add;
        
        // Calculate wait after
        const totalBuses = input.active_buses_on_route + busesToAdd;
        const baseHeadway = 60 / totalBuses;
        const trafficPenalty = (input.traffic_score - 1) * 1.2;
        const waitAfter = parseFloat(Math.max(2.0, baseHeadway + trafficPenalty - 1.5).toFixed(1));
        const reductionPct = beforeWait > 0 ? parseFloat(((1 - waitAfter / beforeWait) * 100).toFixed(1)) : 0;
        
        let priority = demoData.priority_level;
        if (input.occupancy_pct < 0.85) {
          // Rule constraint: buses_to_add must be 0
          setResult(generateFallbackResult(input));
        } else {
          setResult({
            route_no: routeNo,
            recommendation: `Deploy ${busesToAdd} additional bus${busesToAdd > 1 ? 'es' : ''} on Route ${routeNo}. Expected wait time will drop from ${beforeWait} min \u2192 ${waitAfter} min (${Math.round(reductionPct)}% improvement). Priority: ${priority}.`,
            buses_to_add: busesToAdd,
            confidence: demoData.confidence,
            expected_wait_time_before: beforeWait,
            expected_wait_time_after: waitAfter,
            wait_time_reduction_pct: reductionPct,
            priority_level: priority,
            reasoning: demoData.reasoning
          });
        }
      } else {
        // Generate fallback dynamically based on inputs
        setResult(generateFallbackResult(input));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  return { result, loading, error, isDemoMode, predict };
}
