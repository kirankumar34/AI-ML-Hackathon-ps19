import { useEffect } from 'react';
import { useUBOCCStore } from '../store/ubocc-store';
import { generateRecommendations } from '../lib/computations/dispatchRecommender';

export function usePredictiveEngine() {
  const { setRecommendations } = useUBOCCStore();

  useEffect(() => {
    const run = () => {
      const { activeBuses, routes } = useUBOCCStore.getState();
      const newRecs = generateRecommendations(activeBuses, routes);
      setRecommendations(newRecs);
    };

    // Run predictive engine loop every 60 seconds
    const interval = setInterval(run, 60 * 1000);

    // Initial run
    run();

    return () => clearInterval(interval);
  }, [setRecommendations]);
}
