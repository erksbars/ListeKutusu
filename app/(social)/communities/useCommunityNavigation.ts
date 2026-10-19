"use client";
import { useEffect, useState } from "react";
import { communityNavigationFromParams, communityNavigationParams, type CommunityNavigation } from "@/lib/communityNavigation";

export function useCommunityNavigation(initial: CommunityNavigation) {
  const [navigation, setNavigation] = useState(initial);
  useEffect(() => {
    const sync = () => setNavigation(communityNavigationFromParams(new URLSearchParams(window.location.search)));
    sync(); window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, [initial]);
  function navigate(patch: Partial<CommunityNavigation>, replace = false) {
    const params = communityNavigationParams(new URLSearchParams(window.location.search), patch);
    const query = params.toString(), target = `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`;
    if (target !== `${window.location.pathname}${window.location.search}${window.location.hash}`) {
      if (replace) window.history.replaceState(null, "", target); else window.history.pushState(null, "", target);
    }
    setNavigation(communityNavigationFromParams(params));
  }
  return { navigation, navigate };
}
