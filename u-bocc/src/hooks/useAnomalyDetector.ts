import { useEffect } from 'react';
import { useUBOCCStore } from '../store/ubocc-store';
import { detectAnomalies } from '../lib/computations/anomalyEngine';

export function useAnomalyDetector() {
  const { addAlert } = useUBOCCStore();

  useEffect(() => {
    const run = () => {
      const { activeBuses, routes } = useUBOCCStore.getState();
      const newAlerts = detectAnomalies(activeBuses, routes);
      
      newAlerts.forEach((alert) => {
        addAlert(alert);
      });
    };

    // Run anomaly detection loop every 30 seconds
    const interval = setInterval(run, 30 * 1000);

    // Initial run
    run();

    return () => clearInterval(interval);
  }, [addAlert]);
}
