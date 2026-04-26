import { useEffect, useState } from "react";
import { loadStudioSnapshot } from "@openclaw/bridge";
import type { StudioShellState } from "@openclaw/shared";

const STUDIO_DATA_REFRESH_INTERVAL_MS = 5_000;

export function useStudioData() {
  const [data, setData] = useState<StudioShellState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    let inFlight = false;
    let hasLoadedSnapshot = false;

    const refresh = async () => {
      if (inFlight) {
        return;
      }

      inFlight = true;

      if (!cancelled) {
        setIsRefreshing(true);
      }

      try {
        const snapshot = await loadStudioSnapshot();

        if (!cancelled) {
          hasLoadedSnapshot = true;
          setData(snapshot);
          setError(null);
          setSyncError(null);
          setLastUpdatedAt(Date.now());
        }
      } catch (cause: unknown) {
        const message = cause instanceof Error ? cause.message : "Failed to load studio data.";

        if (!cancelled) {
          if (hasLoadedSnapshot) {
            setSyncError(message);
          } else {
            setError(message);
          }
        }
      } finally {
        inFlight = false;

        if (!cancelled) {
          setIsRefreshing(false);
        }
      }
    };

    const refreshOnForeground = () => {
      if (document.visibilityState === "visible") {
        void refresh();
      }
    };

    void refresh();
    const interval = window.setInterval(() => {
      void refresh();
    }, STUDIO_DATA_REFRESH_INTERVAL_MS);
    window.addEventListener("focus", refreshOnForeground);
    window.addEventListener("hashchange", refreshOnForeground);
    document.addEventListener("visibilitychange", refreshOnForeground);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.removeEventListener("focus", refreshOnForeground);
      window.removeEventListener("hashchange", refreshOnForeground);
      document.removeEventListener("visibilitychange", refreshOnForeground);
    };
  }, []);

  return { data, error, syncError, isRefreshing, lastUpdatedAt };
}
