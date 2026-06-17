import { useUBOCCStore } from '../../store/ubocc-store';

export type EventType = 'METRO_CONSTRUCTION' | 'ROAD_WORK' | 'FESTIVAL' | 'MARINA_EVENT' | 'RAIN_FLOOD';

export interface CityEvent {
  id: string;
  type: EventType;
  title: string;
  location: string;
  impactDescription: string;
  active: boolean;
  affectedRoutes: string[];
}

export const MOCK_EVENTS: CityEvent[] = [
  {
    id: 'evt-kodambakkam-metro',
    type: 'METRO_CONSTRUCTION',
    title: 'Metro Construction Blockage',
    location: 'Kodambakkam High Road',
    impactDescription: '40% lane reduction',
    active: false,
    affectedRoutes: ['29C', '12B', '47B'],
  },
  {
    id: 'evt-velachery-roadwork',
    type: 'ROAD_WORK',
    title: 'Road Work Event',
    location: 'Velachery Main Road',
    impactDescription: '35% congestion increase',
    active: false,
    affectedRoutes: ['21G', '570', '119'],
  },
  {
    id: 'evt-mylapore-festival',
    type: 'FESTIVAL',
    title: 'Mylapore Panguni Festival',
    location: 'Mylapore Tank',
    impactDescription: 'Increased passengers, temporary road restrictions',
    active: false,
    affectedRoutes: ['21G', '12B', '29C'],
  },
  {
    id: 'evt-marina-event',
    type: 'MARINA_EVENT',
    title: 'Marina Air Show',
    location: 'Marina Beach Corridor',
    impactDescription: 'Massive passenger surge',
    active: false,
    affectedRoutes: ['102', '109', '21G'],
  },
  {
    id: 'evt-velachery-flood',
    type: 'RAIN_FLOOD',
    title: 'Heavy Rain Alert',
    location: 'Velachery',
    impactDescription: '85% Probability of Waterlogging',
    active: false,
    affectedRoutes: ['21G', '570', '119'],
  }
];

export function toggleMockEvent(eventId: string) {
  const store = useUBOCCStore.getState();
  const existingEvents = store.activeEvents || [];
  const event = existingEvents.find(e => e.id === eventId);
  
  if (event) {
    // Turn it off
    store.setActiveEvents(existingEvents.filter(e => e.id !== eventId));
  } else {
    // Turn it on
    const mockEvent = MOCK_EVENTS.find(e => e.id === eventId);
    if (mockEvent) {
      store.setActiveEvents([...existingEvents, { ...mockEvent, active: true }]);
      
      // Also generate an AI Recommendation for this event
      generateEventRecommendation(mockEvent);
    }
  }
}

function generateEventRecommendation(event: CityEvent) {
  const store = useUBOCCStore.getState();
  
  let problemDetected = '';
  let predictedImpact = '';
  let suggestedAction = '';
  let expectedImprovement = '';
  let confidenceScore = 0;
  
  switch (event.type) {
    case 'METRO_CONSTRUCTION':
      problemDetected = 'Lane closure due to metro construction';
      predictedImpact = 'Severe delays forming on Kodambakkam corridor (+25 mins)';
      suggestedAction = 'Divert Express buses via Arcot Road; dispatch 2 reserve buses';
      expectedImprovement = 'Restore headway consistency to 12 mins';
      confidenceScore = 92;
      break;
    case 'ROAD_WORK':
      problemDetected = 'Sudden road work causing bottleneck';
      predictedImpact = '35% congestion increase; speeds reduced to 8 km/h';
      suggestedAction = 'Route diversion recommended for upcoming buses';
      expectedImprovement = 'Avoid 18 min average delay per trip';
      confidenceScore = 88;
      break;
    case 'FESTIVAL':
      problemDetected = 'Temple festival crowds surging';
      predictedImpact = 'Bus stops overloaded; dwell times increased by 400%';
      suggestedAction = 'Deploy 5 additional buses from Central Depot';
      expectedImprovement = 'Clear passenger backlog within 45 mins';
      confidenceScore = 95;
      break;
    case 'MARINA_EVENT':
      problemDetected = 'Massive crowd leaving Marina Event';
      predictedImpact = 'Critical shortage of buses toward South Chennai';
      suggestedAction = 'Reallocate 8 buses from non-peak routes';
      expectedImprovement = 'Reduce wait times from 40 mins to 15 mins';
      confidenceScore = 96;
      break;
    case 'RAIN_FLOOD':
      problemDetected = 'Waterlogging risk detected';
      predictedImpact = 'Buses on Velachery bypass risk being stranded';
      suggestedAction = 'Immediate diversion to alternate elevated roads';
      expectedImprovement = 'Prevent fleet damage and complete trip safely';
      confidenceScore = 85;
      break;
  }

  const recommendation = {
    id: `rec-evt-${event.id}-${Date.now()}`,
    priority: 'critical' as const,
    busId: 'ALL',
    routeId: event.affectedRoutes[0] || 'Multi',
    action: 'reroute' as const,
    dispatchFrom: 'Ops Command',
    timeToAct: 120, // 2 minutes window
    predictedGapMin: 0,
    expectedHeadwayAfter: 0,
    reasons: [],
    confidence: confidenceScore / 100,
    createdAt: Date.now(),
    
    // Prompt.md exact fields
    problemDetected,
    affectedRoutesList: event.affectedRoutes,
    predictedImpact,
    suggestedAction,
    confidenceScore,
    expectedImprovement
  };

  store.setRecommendations([recommendation, ...store.recommendations]);
}
