import { useEffect } from 'react';
import { useUBOCCStore } from '../store/ubocc-store';
import { computeWaitTimes } from '../lib/computations/waitTimeEstimator';

export function useWaitTimeEngine() {
  const { setStopWaitEstimates } = useUBOCCStore();

  useEffect(() => {
    const run = () => {
      const { activeBuses, routes } = useUBOCCStore.getState();
      const estimates = computeWaitTimes(activeBuses, routes);
      setStopWaitEstimates(estimates);
    };

    // Run wait time computation loop every 30 seconds
    const interval = setInterval(run, 30 * 1000);

    // Initial run
    run();

    return () => clearInterval(interval);
  }, [setStopWaitEstimates]);
}
