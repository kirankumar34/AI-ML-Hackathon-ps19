import { create } from 'zustand';
import {
  Bus,
  Route,
  SegmentHeadway,
  BunchingCluster,
  DispatchRecommendation,
  StopWaitEstimate,
  FleetAlert,
  ReplaySession,
  SimulationResult,
  DispatchLogEntry,
} from '../types';
import { generateHistoricalFrames } from '../lib/data/historicalFrameGen';

interface UBOCCStore {
  // ── Existing ────────────────────────────────────────────
  activeBuses: Bus[];
  routes: Route[];
  setActiveBuses: (buses: Bus[]) => void;
  setRoutes: (routes: Route[]) => void;

  // ── Views & Events ──────────────────────────────────────
  currentView: 'normal' | 'ops' | 'ai' | 'emergency';
  setCurrentView: (view: 'normal' | 'ops' | 'ai' | 'emergency') => void;
  activeEvents: any[];
  setActiveEvents: (events: any[]) => void;
  trafficScores: { area: string; score: number; risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' }[];
  setTrafficScores: (scores: { area: string; score: number; risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' }[]) => void;

  // ── Feature 1: Heatmap ──────────────────────────────────
  segmentHeadways: SegmentHeadway[];
  bunchingClusters: BunchingCluster[];
  setSegmentHeadways: (h: SegmentHeadway[]) => void;
  setBunchingClusters: (c: BunchingCluster[]) => void;

  // ── Feature 2: Recommendations ──────────────────────────
  recommendations: DispatchRecommendation[];
  dispatchLog: DispatchLogEntry[];
  setRecommendations: (r: DispatchRecommendation[]) => void;
  dismissRecommendation: (id: string, reason: string) => void;
  executeDispatch: (recommendationId: string) => void;
  dismissedIds: Record<string, number>; // id → timestamp of dismiss

  // ── Feature 3: Wait Times ───────────────────────────────
  stopWaitEstimates: StopWaitEstimate[];
  setStopWaitEstimates: (e: StopWaitEstimate[]) => void;

  // ── Feature 4: Alerts ───────────────────────────────────
  alerts: FleetAlert[];
  addAlert: (alert: FleetAlert) => void;
  acknowledgeAlert: (id: string) => void;
  resolveAlert: (id: string) => void;
  clearResolvedAlerts: () => void;

  // ── Feature 5: Replay ───────────────────────────────────
  replayMode: boolean;
  activeReplaySession: ReplaySession | null;
  simulationResult: SimulationResult | null;
  setReplayMode: (active: boolean) => void;
  setActiveReplaySession: (session: ReplaySession | null) => void;
  setSimulationResult: (result: SimulationResult | null) => void;

  // Playback Control States
  isPlaying: boolean;
  playbackSpeed: number;
  currentTimeMs: number;
  currentFrameBuses: any[];
  setIsPlaying: (playing: boolean) => void;
  setPlaybackSpeed: (speed: number) => void;
  setCurrentTimeMs: (time: number) => void;
  setCurrentFrameBuses: (buses: any[]) => void;

  // Map Navigation
  flyToTarget: [number, number] | null;
  setFlyToTarget: (target: [number, number] | null) => void;

  // Simulation Spawning Callback
  spawnBusCallback: ((routeNo: string, depotName: string, count: number) => void) | null;
  setSpawnBusCallback: (callback: ((routeNo: string, depotName: string, count: number) => void) | null) => void;

  // Active Route Layers
  activeRouteLayers: Record<'Feeder' | 'Ring' | 'BRT' | 'Suburban', boolean>;
  toggleRouteLayer: (layer: 'Feeder' | 'Ring' | 'BRT' | 'Suburban') => void;

  // AI Prediction Timeframe
  predictionTimeframe: 'current' | '30m' | '1h';
  setPredictionTimeframe: (timeframe: 'current' | '30m' | '1h') => void;
}

export const useUBOCCStore = create<UBOCCStore>((set, get) => ({
  // ── Existing ────────────────────────────────────────────
  activeBuses: [],
  routes: [],
  setActiveBuses: (buses) => set({ activeBuses: buses }),
  setRoutes: (routes) => set({ routes }),

  // ── Views & Events ──────────────────────────────────────
  currentView: 'ops',
  setCurrentView: (view) => set({ currentView: view }),
  activeEvents: [],
  setActiveEvents: (events) => set({ activeEvents: events }),
  trafficScores: [
    { area: 'T Nagar', score: 45, risk: 'MEDIUM' },
    { area: 'Guindy', score: 72, risk: 'HIGH' },
    { area: 'Broadway', score: 32, risk: 'LOW' },
    { area: 'Velachery', score: 85, risk: 'CRITICAL' },
    { area: 'Sholinganallur', score: 55, risk: 'MEDIUM' },
    { area: 'Tambaram', score: 68, risk: 'HIGH' },
    { area: 'Koyambedu', score: 90, risk: 'CRITICAL' },
  ],
  setTrafficScores: (scores) => set({ trafficScores: scores }),

  // Simulation Callback implementation
  spawnBusCallback: null,
  setSpawnBusCallback: (callback) => set({ spawnBusCallback: callback }),

  // ── Feature 1 ───────────────────────────────────────────
  segmentHeadways: [],
  bunchingClusters: [],
  setSegmentHeadways: (h) => set({ segmentHeadways: h }),
  setBunchingClusters: (c) => set({ bunchingClusters: c }),

  // ── Feature 2 ───────────────────────────────────────────
  recommendations: [],
  dispatchLog: [],
  dismissedIds: {},
  setRecommendations: (r) => {
    const dismissed = get().dismissedIds;
    const now = Date.now();
    // Filter out recommendations that were dismissed within last 10 minutes
    const filtered = r.filter(rec => {
      const dismissedAt = dismissed[rec.id];
      if (!dismissedAt) return true;
      return now - dismissedAt > 10 * 60 * 1000;
    });
    set({ recommendations: filtered });
  },
  dismissRecommendation: (id, _reason) => {
    set((state) => ({
      recommendations: state.recommendations.filter(r => r.id !== id),
      dismissedIds: { ...state.dismissedIds, [id]: Date.now() },
    }));
  },
  executeDispatch: (recommendationId) => {
    const rec = get().recommendations.find(r => r.id === recommendationId);
    if (!rec) return;

    // Trigger simulation spawn bus callback if available
    const callback = get().spawnBusCallback;
    if (callback) {
      callback(rec.routeId, rec.dispatchFrom, 1);
    }

    const entry: DispatchLogEntry = {
      id: `dispatch-${Date.now()}`,
      timestamp: Date.now(),
      busId: rec.busId,
      routeId: rec.routeId,
      action: rec.action,
      commander: 'Ops Commander',
    };
    set((state) => ({
      recommendations: state.recommendations.filter(r => r.id !== recommendationId),
      dispatchLog: [entry, ...state.dispatchLog],
    }));
  },

  // ── Feature 3 ───────────────────────────────────────────
  stopWaitEstimates: [],
  setStopWaitEstimates: (e) => set({ stopWaitEstimates: e }),

  // ── Feature 4 ───────────────────────────────────────────
  alerts: [],
  addAlert: (alert) => {
    set((state) => {
      // Dedup: do not re-fire same alert code for same entity within 5 min, or duplicate ID
      const isDuplicate = state.alerts.some(
        a =>
          (a.id === alert.id && a.status !== 'resolved') ||
          (a.code === alert.code &&
            a.busId === alert.busId &&
            a.routeId === alert.routeId &&
            a.status !== 'resolved' &&
            Date.now() - new Date(a.detectedAt).getTime() < 5 * 60 * 1000)
      );
      if (isDuplicate) return state;
      return { alerts: [alert, ...state.alerts].slice(0, 50) }; // cap at 50
    });
  },
  acknowledgeAlert: (id) => {
    set((state) => ({
      alerts: state.alerts.map(a =>
        a.id === id
          ? { ...a, status: 'acknowledged' as const, acknowledgedBy: 'Ops Commander' }
          : a
      ),
    }));
  },
  resolveAlert: (id) => {
    set((state) => ({
      alerts: state.alerts.map(a =>
        a.id === id
          ? { ...a, status: 'resolved' as const, resolvedAt: new Date() }
          : a
      ),
    }));
  },
  clearResolvedAlerts: () => {
    set((state) => ({
      alerts: state.alerts.filter(a => a.status !== 'resolved'),
    }));
  },

  // ── Feature 5 ───────────────────────────────────────────
  replayMode: false,
  activeReplaySession: null,
  simulationResult: null,
  setReplayMode: (active) => {
    if (active && !get().activeReplaySession) {
      // Find Route 29C Definition
      const route29C = get().routes.find(r => r.busNo === '29C');
      if (route29C) {
        // Generate historical frames
        const windowStart = new Date('2026-06-16T08:00:00');
        const frames = generateHistoricalFrames(
          route29C,
          windowStart,
          30, // 30 minutes
          8,  // 8 buses
          42  // seed
        );
        const session: ReplaySession = {
          id: 'session-default',
          date: '2026-06-16',
          windowStart: '08:00',
          windowEnd: '08:30',
          routeId: '29C',
          historicalFrames: frames,
          counterfactuals: [],
        };
        set({ replayMode: active, activeReplaySession: session });
        return;
      }
    }
    set({ replayMode: active });
  },
  setActiveReplaySession: (session) => set({ activeReplaySession: session }),
  setSimulationResult: (result) => set({ simulationResult: result }),

  // Playback Control Implementation
  isPlaying: false,
  playbackSpeed: 1,
  currentTimeMs: 0,
  currentFrameBuses: [],
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),
  setCurrentTimeMs: (time) => set({ currentTimeMs: time }),
  setCurrentFrameBuses: (buses) => set({ currentFrameBuses: buses }),

  // Map Navigation Implementation
  flyToTarget: null,
  setFlyToTarget: (target) => set({ flyToTarget: target }),

  // Active Route Layers
  activeRouteLayers: {
    Feeder: true,
    Ring: true,
    BRT: true,
    Suburban: true
  },
  toggleRouteLayer: (layer) => set((state) => ({
    activeRouteLayers: {
      ...state.activeRouteLayers,
      [layer]: !state.activeRouteLayers[layer]
    }
  })),

  // AI Prediction Timeframe
  predictionTimeframe: 'current',
  setPredictionTimeframe: (timeframe) => set({ predictionTimeframe: timeframe }),
}));
