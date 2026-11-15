import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

export function useHealthCheck(pollIntervalMs = 15000) {
  const [backendHealth, setBackendHealth] = useState(null);
  const [aiHealth, setAiHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState(null);

  const checkHealth = useCallback(async () => {
    setLoading(true);
    const [be, ai] = await Promise.all([
      api.getBackendHealth(),
      api.getAIServiceHealth(),
    ]);
    setBackendHealth(be);
    setAiHealth(ai);
    setLastChecked(new Date());
    setLoading(false);
  }, []);

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, pollIntervalMs);
    return () => clearInterval(interval);
  }, [checkHealth, pollIntervalMs]);

  return { backendHealth, aiHealth, loading, lastChecked, refresh: checkHealth };
}
