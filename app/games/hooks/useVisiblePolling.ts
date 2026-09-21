"use client";

import { useEffect, useRef } from "react";

type VisiblePollingOptions = {
  enabled: boolean;
  intervalMs: number;
  onPoll: () => void | Promise<void>;
  refreshOnFocus?: boolean;
};

export function useVisiblePolling({
  enabled,
  intervalMs,
  onPoll,
  refreshOnFocus = true,
}: VisiblePollingOptions) {
  const pollRef = useRef(onPoll);
  const pollingRef = useRef(false);

  useEffect(() => {
    pollRef.current = onPoll;
  }, [onPoll]);

  useEffect(() => {
    if (!enabled) return;

    const pollWhenAvailable = () => {
      if (document.visibilityState !== "visible" || !navigator.onLine || pollingRef.current) return;
      pollingRef.current = true;
      Promise.resolve()
        .then(() => pollRef.current())
        .catch(() => undefined)
        .finally(() => { pollingRef.current = false; });
    };
    const handleVisibility = () => {
      if (document.visibilityState === "visible") pollWhenAvailable();
    };
    const timer = window.setInterval(pollWhenAvailable, intervalMs);

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("online", pollWhenAvailable);
    if (refreshOnFocus) window.addEventListener("focus", pollWhenAvailable);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("online", pollWhenAvailable);
      if (refreshOnFocus) window.removeEventListener("focus", pollWhenAvailable);
    };
  }, [enabled, intervalMs, refreshOnFocus]);
}
