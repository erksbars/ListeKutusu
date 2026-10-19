"use client";

import { useEffect, useRef, useState } from "react";
import { feedLocationPath, parseFeedLocation, type FeedLocation } from "@/lib/feedNavigation";

export function useFeedLocation() {
  const [value, setValue] = useState<FeedLocation>({ scope: "all", kind: "all", topic: null });
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const apply = () => { setValue(parseFeedLocation(new URLSearchParams(window.location.search))); setReady(true); };
    apply(); window.addEventListener("popstate", apply);
    return () => window.removeEventListener("popstate", apply);
  }, []);
  function update(next: FeedLocation) {
    const path = feedLocationPath(next);
    const normalized = parseFeedLocation(new URL(path, window.location.origin).searchParams);
    setValue(normalized);
    const url = new URL(window.location.href);
    for (const key of ["scope", "kind", "topic"]) url.searchParams.delete(key);
    new URL(path, window.location.origin).searchParams.forEach((entry, key) => url.searchParams.set(key, entry));
    // Preserve Next's entry metadata; changing a filter does not add a history entry.
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}`);
  }
  return { value, ready, update, path: feedLocationPath(value) };
}

export function useFeedAnchor(loading: boolean, visibleIds: string) {
  const restored = useRef("");
  const [epoch, setEpoch] = useState(0);
  useEffect(() => {
    const revisit = () => setEpoch(value => value + 1);
    window.addEventListener("popstate", revisit); window.addEventListener("hashchange", revisit);
    return () => { window.removeEventListener("popstate", revisit); window.removeEventListener("hashchange", revisit); };
  }, []);
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) { restored.current = ""; return; }
    if (loading || !/^#post-[a-zA-Z0-9_-]{1,160}$/u.test(hash) || restored.current === hash) return;
    const card = document.getElementById(hash.slice(1));
    if (!card) return; // Never auto-fetch arbitrary pages or resurrect cached private posts.
    const frame = window.requestAnimationFrame(() => {
      card.scrollIntoView({ block: "start", behavior: "instant" });
      card.querySelector<HTMLAnchorElement>('a.feed-post-permalink')?.focus({ preventScroll: true });
      restored.current = hash;
    });
    return () => window.cancelAnimationFrame(frame);
  }, [loading, visibleIds, epoch]);
}
