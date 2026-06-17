import { useEffect } from 'react';
import { useUBOCCStore } from '../store/ubocc-store';
import { computeSegmentHeadways } from '../lib/computations/segmentHeadway';

export function useHeadwayEngine() {
  const { 
    setSegmentHeadways, 
    setBunchingClusters 
  } = useUBOCCStore();

  useEffect(() => {
    const run = () => {
      const { activeBuses, routes } = useUBOCCStore.getState();
      const { headways, clusters } = computeSegmentHeadways(activeBuses, routes);
      setSegmentHeadways(headways);
      setBunchingClusters(clusters);
    };

    // Run detection loop every 30 seconds
    const interval = setInterval(run, 30 * 1000);

    // Initial run
    run();

    return () => clearInterval(interval);
  }, [setSegmentHeadways, setBunchingClusters]);
}
