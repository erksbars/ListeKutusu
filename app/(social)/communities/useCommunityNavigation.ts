"use client";
import { useEffect, useState } from "react";
import { communityNavigationFromParams, communityNavigationParams, type CommunityNavigation } from "@/lib/communityNavigation";
import { communityFeedReturn } from "@/lib/feedNavigation";

export function useCommunityNavigation(initial: CommunityNavigation, initialFeedReturnTo: string | null = null) {
  const [location, setLocation] = useState({ navigation: initial, feedReturnTo: initialFeedReturnTo });
  useEffect(() => {
    const sync = () => {
      const params = new URLSearchParams(window.location.search);
      setLocation({ navigation: communityNavigationFromParams(params), feedReturnTo: communityFeedReturn(params) });
    };
    sync(); window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, [initial, initialFeedReturnTo]);
  function navigate(patch: Partial<CommunityNavigation>, replace = false) {
    const params = communityNavigationParams(new URLSearchParams(window.location.search), patch);
    const feedReturnTo = communityFeedReturn(params);
    params.delete("from");
    if (feedReturnTo) params.set("from", feedReturnTo);
    const query = params.toString(), target = `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`;
    if (target !== `${window.location.pathname}${window.location.search}${window.location.hash}`) {
      if (replace) window.history.replaceState(window.history.state, "", target); else window.history.pushState(window.history.state, "", target);
    }
    setLocation({ navigation: communityNavigationFromParams(params), feedReturnTo });
  }
  return { ...location, navigate };
}
