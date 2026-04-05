import { useEffect, useState } from "react";
import { loadStudioSnapshot } from "@openclaw/bridge";
import type { StudioShellState } from "@openclaw/shared";

export function useStudioData() {
  const [data, setData] = useState<StudioShellState | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    loadStudioSnapshot()
      .then((snapshot) => {
        if (!cancelled) {
          setData(snapshot);
        }
      })
      .catch((cause: unknown) => {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : "Failed to load studio data.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { data, error };
}
