import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../services/api';

export function useHealthCheck(pollIntervalMs = 20000) {
  const [backendHealth, setBackendHealth] = useState(null);
  const [aiHealth, setAiHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState(null);
  const isFirstRun = useRef(true);

  const checkHealth = useCallback(async (isManual = false) => {
    // Only show full loading spinner on initial mount or explicit manual button click
    if (isFirstRun.current || isManual) {
      setLoading(true);
    }

    try {
      const [be, ai] = await Promise.all([
        api.getBackendHealth(),
        api.getAIServiceHealth(),
      ]);
      setBackendHealth(be);
      setAiHealth(ai);
      setLastChecked(new Date());
    } catch {
      // Handled within api client
    } finally {
      if (isFirstRun.current || isManual) {
        setLoading(false);
        isFirstRun.current = false;
      }
    }
  }, []);

  useEffect(() => {
    checkHealth(false);

    // Visibility-aware background interval
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) {
        return; // Pause polling when user is not viewing this browser tab
      }
      checkHealth(false);
    }, pollIntervalMs);

    const handleVisibilityChange = () => {
      if (typeof document !== 'undefined' && !document.hidden) {
        checkHealth(false);
      }
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    return () => {
      clearInterval(interval);
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
    };
  }, [checkHealth, pollIntervalMs]);

  return { backendHealth, aiHealth, loading, lastChecked, refresh: () => checkHealth(true) };
}
