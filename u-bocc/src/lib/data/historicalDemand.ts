import { HistoricalDemand } from '../../types';

// Simple seeded hash function for deterministic pseudo-randomness
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

export function getHistoricalDemand(stopId: string, hourOfDay: number): HistoricalDemand {
  // Hackathon Mode: Seeded demand generation instead of backend call
  const seedStr = `${stopId}-${hourOfDay}`;
  const hash = simpleHash(seedStr);
  
  // Base demand 40-240 pax
  const avgBoardingPax = 40 + (hash % 200);
  const avgAlightingPax = 30 + ((hash >> 2) % 180);
  
  return {
    stopId,
    hourOfDay,
    dayType: 'weekday',
    avgBoardingPax,
    avgAlightingPax
  };
}

export function getDemandLevel(boardingPax: number): 'high' | 'medium' | 'low' {
  if (boardingPax > 150) return 'high';
  if (boardingPax > 80) return 'medium';
  return 'low';
}
