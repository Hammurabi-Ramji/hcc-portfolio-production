import { useEffect } from "react";

/**
 * Custom hook to automatically refresh data at specified intervals
 * @param refreshFn - Function to call on each refresh
 * @param intervalMs - Refresh interval in milliseconds (default: 30000ms = 30 seconds)
 * @param enabled - Whether auto-refresh is enabled (default: true)
 */
export function useAutoRefresh(
  refreshFn: () => void,
  intervalMs: number = 30000,
  enabled: boolean = true
) {
  useEffect(() => {
    if (!enabled) return;

    const intervalId = setInterval(() => {
      refreshFn();
    }, intervalMs);

    return () => clearInterval(intervalId);
  }, [refreshFn, intervalMs, enabled]);
}
