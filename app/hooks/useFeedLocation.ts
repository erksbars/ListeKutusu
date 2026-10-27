"use client";

import { useEffect, useRef, useState } from "react";
import { feedLocationPath, parseFeedLocation, type FeedLocation } from "@/lib/feedNavigation";
import { readFeedAnchor } from "@/lib/feedRestoration";

export function useFeedLocation() {
  const [value, setValue] = useState<FeedLocation>({ scope: "all", kind: "all", topic: null });
  const [ready, setReady] = useState(false);
  const [anchor, setAnchor] = useState<string | null>(null);
  useEffect(() => {
    const apply = () => { setValue(parseFeedLocation(new URLSearchParams(window.location.search))); setAnchor(readFeedAnchor(window.location.hash)); setReady(true); };
    apply(); window.addEventListener("popstate", apply); window.addEventListener("hashchange", apply);
    return () => { window.removeEventListener("popstate", apply); window.removeEventListener("hashchange", apply); };
  }, []);
  function update(next: FeedLocation) {
    const path = feedLocationPath(next);
    const normalized = parseFeedLocation(new URL(path, window.location.origin).searchParams);
    setValue(normalized);
    setAnchor(null);
    const url = new URL(window.location.href);
    for (const key of ["scope", "kind", "topic"]) url.searchParams.delete(key);
    new URL(path, window.location.origin).searchParams.forEach((entry, key) => url.searchParams.set(key, entry));
    // Preserve Next's entry metadata; changing a filter does not add a history entry.
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}`);
  }
  function clearAnchor() {
    window.history.replaceState(window.history.state, "", `${window.location.pathname}${window.location.search}`);
    setAnchor(null);
    window.requestAnimationFrame(() => {
      const target = document.querySelector<HTMLElement>("#feed-posts .feed-post-permalink") ?? document.getElementById("main-content");
      target?.focus();
    });
  }
  return { value, ready, anchor, clearAnchor, update, path: feedLocationPath(value) };
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
