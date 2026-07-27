"use client";

import { useEffect, useRef } from "react";

type InfiniteScrollOptions = {
  enabled: boolean;
  loading: boolean;
  onLoadMore: () => void;
};

export function useInfiniteScroll({ enabled, loading, onLoadMore }: InfiniteScrollOptions) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const callbackRef = useRef(onLoadMore);
  const lockedRef = useRef(false);

  useEffect(() => {
    callbackRef.current = onLoadMore;
  }, [onLoadMore]);

  useEffect(() => {
    if (!loading) lockedRef.current = false;
  }, [loading]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!enabled || !sentinel || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || lockedRef.current) return;
      lockedRef.current = true;
      callbackRef.current();
    }, { rootMargin: "600px 0px 300px" });

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [enabled]);

  return sentinelRef;
}
