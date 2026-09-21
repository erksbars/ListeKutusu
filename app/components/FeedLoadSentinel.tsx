"use client";

import type { RefObject } from "react";

type FeedLoadSentinelProps = {
  sentinelRef: RefObject<HTMLDivElement>;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  loadingLabel?: string;
};

export function FeedLoadSentinel({
  sentinelRef,
  loading,
  error,
  onRetry,
  loadingLabel = "Yeni keşifler yükleniyor...",
}: FeedLoadSentinelProps) {
  return (
    <div
      ref={error ? undefined : sentinelRef}
      className="feed-load-sentinel"
      role="status"
    >
      {loading && <span>{loadingLabel}</span>}
      {error && (
        <div className="feed-load-error">
          <p>{error}</p>
          <button type="button" className="secondary-action" onClick={onRetry}>
            Yeniden dene
          </button>
        </div>
      )}
    </div>
  );
}
