"use client";
import { useEffect, useState } from "react";
import { communityNavigationFromParams, communityNavigationParams, type CommunityNavigation } from "@/lib/communityNavigation";
import { communityFeedReturn } from "@/lib/feedNavigation";
import { useDraftNavigationRequest } from "@/app/components/DraftNavigationProvider";

export function useCommunityNavigation(initial: CommunityNavigation, initialFeedReturnTo: string | null = null) {
  const [location, setLocation] = useState({ navigation: initial, feedReturnTo: initialFeedReturnTo });
  const requestExit = useDraftNavigationRequest(true);
  useEffect(() => {
    const sync = () => {
      const params = new URLSearchParams(window.location.search);
      setLocation({ navigation: communityNavigationFromParams(params), feedReturnTo: communityFeedReturn(params) });
    };
    sync(); window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, [initial, initialFeedReturnTo]);
  function navigate(patch: Partial<CommunityNavigation>, replace = false, confirmed = false) {
    const params = communityNavigationParams(new URLSearchParams(window.location.search), patch);
    const feedReturnTo = communityFeedReturn(params);
    params.delete("from");
    if (feedReturnTo) params.set("from", feedReturnTo);
    const query = params.toString(), target = `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`;
    if (target === `${window.location.pathname}${window.location.search}${window.location.hash}`) return;
    const apply = () => {
      if (replace) window.history.replaceState(window.history.state, "", target); else window.history.pushState(window.history.state, "", target);
      setLocation({ navigation: communityNavigationFromParams(params), feedReturnTo });
    };
    // Replace follows successful mutations; confirmed follows the shared exit dialog.
    const next = communityNavigationFromParams(params);
    const currentContext = { ...location.navigation, commentPage: 1 };
    const nextContext = { ...next, commentPage: 1 };
    if (replace || confirmed || JSON.stringify(currentContext) === JSON.stringify(nextContext)) apply();
    else requestExit(apply);
  }
  return { ...location, navigate };
}
