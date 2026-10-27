"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { feedReturnPhase } from "@/lib/feedRestoration";

type SearchRun = { key: string; requests: number; seen: string[]; pending: boolean };
const freshRun = (key: string): SearchRun => ({ key, requests: 0, seen: [], pending: false });

export function useFeedRestoration({ target, context, ready, found, loading, error, cursor, loadMore }: {
  target: string | null; context: string; ready: boolean; found: boolean;
  loading: boolean; error: string | null; cursor: string | null;
  loadMore: (cursor: string) => Promise<unknown>;
}) {
  const key = JSON.stringify([context, target]);
  const [run, setRun] = useState<SearchRun>(() => freshRun(key));
  const lock = useRef<{ key: string } | null>(null);
  const mounted = useRef(false);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => { setRun(freshRun(key)); }, [key]);
  const current = run.key === key ? run : freshRun(key);
  const phase = feedReturnPhase({ target, ready, found, loading: loading || current.pending, error, cursor, requests: current.requests, seen: current.seen });

  const requestPage = useCallback((nextCursor: string, restart: boolean) => {
    if (lock.current?.key === key) return;
    const token = { key }; lock.current = token;
    setRun(previous => {
      const active = previous.key === key ? previous : freshRun(key);
      return { key, requests: restart ? 1 : active.requests + 1,
        seen: [...active.seen.filter(value => value !== nextCursor), nextCursor].slice(-32), pending: true };
    });
    const finish = () => {
      if (lock.current !== token) return;
      lock.current = null;
      if (mounted.current) setRun(previous => previous.key === key ? { ...previous, pending: false } : previous);
    };
    void loadMore(nextCursor).then(finish, finish);
  }, [key, loadMore]);

  useEffect(() => {
    if (run.key !== key || phase !== "searching" || loading || current.pending || !cursor) return;
    requestPage(cursor, false);
  }, [key, run.key, phase, loading, current.pending, cursor, requestPage]);

  function continueSearch() {
    if (!ready || !target || found || loading || current.pending || !cursor || !["paused", "error"].includes(phase)) return;
    requestPage(cursor, true);
  }
  return { phase, continueSearch, blockInfiniteScroll: Boolean(target && (!ready || !found)) };
}
