import { Alert } from '../types';

export const INITIAL_ALERTS: Alert[] = [
  {
    id: 'al1',
    type: 'WEATHER',
    title: 'Heavy Rain: Velachery Bypass Flood',
    description: 'Flooding reported on Velachery Bypass. Route 29C and 119 affected. Slow traffic moving in both directions.',
    severity: 'CRITICAL',
    timestamp: '10 mins ago',
  },
  {
    id: 'al2',
    type: 'EVENT',
    title: 'IPL Match: CSK vs MI @ MA Chidambaram Stadium',
    description: 'High crowd density expected post-match at Chepauk. Extra dispatches recommended for routes passing through Triplicane / Anna Salai.',
    severity: 'WARNING',
    timestamp: '25 mins ago',
  },
  {
    id: 'al3',
    type: 'CROWD',
    title: 'Marina Beach Weekend Crowd Surge',
    description: 'Elevated pedestrian activity and congestion near Kamarajar Salai (Beach Road). Regular delays on routes 102 and 1D.',
    severity: 'INFO',
    timestamp: '1 hour ago',
  },
  {
    id: 'al4',
    type: 'INFRASTRUCTURE',
    title: 'Metro Phase-2 Construction: Saidapet',
    description: 'Lane closures causing traffic slowdown on Mount Road near Saidapet Metro station. Commuters advised to expect 10-15 mins delay.',
    severity: 'WARNING',
    timestamp: '2 hours ago',
  },
];
