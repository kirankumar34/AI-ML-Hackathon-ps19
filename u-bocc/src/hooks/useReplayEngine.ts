import { useEffect, useRef } from 'react';
import { useUBOCCStore } from '../store/ubocc-store';

export function useReplayEngine() {
  const {
    activeReplaySession,
    isPlaying,
    setIsPlaying,
    playbackSpeed,
    setPlaybackSpeed,
    currentTimeMs,
    setCurrentTimeMs,
    currentFrameBuses,
    setCurrentFrameBuses,
    replayMode,
  } = useUBOCCStore();

  const requestRef = useRef<number | undefined>(undefined);
  const lastUpdateRef = useRef<number>(0);

  // Initialize playback time to first frame when session changes
  useEffect(() => {
    if (activeReplaySession && activeReplaySession.historicalFrames.length > 0) {
      setCurrentTimeMs(activeReplaySession.historicalFrames[0].timestamp);
    } else {
      setIsPlaying(false);
      setCurrentTimeMs(0);
      setCurrentFrameBuses([]);
    }
  }, [activeReplaySession, setCurrentTimeMs, setIsPlaying, setCurrentFrameBuses]);

  // Animation Loop (single loop utilizing Zustand direct state access)
  useEffect(() => {
    if (!replayMode || !activeReplaySession) {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
      return;
    }

    const animate = (time: number) => {
      if (!lastUpdateRef.current) lastUpdateRef.current = time;
      const deltaTime = time - lastUpdateRef.current;
      lastUpdateRef.current = time;

      const state = useUBOCCStore.getState();
      if (state.isPlaying && state.activeReplaySession) {
        const frames = state.activeReplaySession.historicalFrames;
        const endTs = frames[frames.length - 1].timestamp;

        const nextTime = state.currentTimeMs + (deltaTime * state.playbackSpeed * 10);
        if (nextTime >= endTs) {
          state.setIsPlaying(false);
          state.setCurrentTimeMs(endTs);
        } else {
          state.setCurrentTimeMs(nextTime);
        }
      }

      requestRef.current = requestAnimationFrame(animate);
    };

    lastUpdateRef.current = 0; // reset
    requestRef.current = requestAnimationFrame(animate);

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [replayMode, activeReplaySession]);

  // Interpolate buses for current time
  useEffect(() => {
    if (!replayMode || !activeReplaySession) return;
    const frames = activeReplaySession.historicalFrames;
    if (frames.length === 0) return;

    // Find bounding frames
    let frame1 = frames[0];
    let frame2 = frames[frames.length - 1];

    for (let i = 0; i < frames.length - 1; i++) {
      if (currentTimeMs >= frames[i].timestamp && currentTimeMs <= frames[i+1].timestamp) {
        frame1 = frames[i];
        frame2 = frames[i+1];
        break;
      }
    }

    if (frame1.timestamp === frame2.timestamp) {
      setCurrentFrameBuses(frame1.buses);
      return;
    }

    const alpha = (currentTimeMs - frame1.timestamp) / (frame2.timestamp - frame1.timestamp);
    
    // Lerp bus positions
    const interpolated = frame1.buses.map(b1 => {
      const b2 = frame2.buses.find(b => b.busId === b1.busId) || b1;
      return {
        ...b1,
        lat: b1.lat + (b2.lat - b1.lat) * alpha,
        lng: b1.lng + (b2.lng - b1.lng) * alpha,
      };
    });

    setCurrentFrameBuses(interpolated);
  }, [currentTimeMs, activeReplaySession, replayMode, setCurrentFrameBuses]);

  return {
    isPlaying,
    setIsPlaying,
    playbackSpeed,
    setPlaybackSpeed,
    currentTimeMs,
    setCurrentTimeMs,
    currentFrameBuses
  };
}
