import { useState, useEffect, useCallback } from 'react';
import { DashboardMetrics } from '../types';
import { fetchDashboardMetrics as apiFetchDashboardMetrics } from '../services/api';

export function useDashboardMetrics(token?: string) {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const refreshMetrics = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await apiFetchDashboardMetrics(token);
      setMetrics(data);
    } catch (e) {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    refreshMetrics();
  }, [refreshMetrics]);

  return {
    metrics,
    isLoading,
    refreshMetrics,
  };
}
