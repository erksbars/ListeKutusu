"use client";
import { useEffect, useState } from "react";
import { communityReadKey, communityReadState, communityReadStatus, type CommunityReadSnapshot } from "@/lib/communityReadState";
import { communityRequestStatus } from "@/lib/communityRequest";
import { communityError, communityFetch } from "./communityFetch";

// Stamp both success and error with the requested URL and refresh generation.
// Render never borrows a previous target's content or permission flags.
export function useCommunityRead<T>(url: string | null, revision: string | number, enabled = true) {
  const [snapshot, setSnapshot] = useState<CommunityReadSnapshot<T> | null>(null);
  const key = communityReadKey(url, revision), active = Boolean(enabled && url);
  useEffect(() => {
    setSnapshot(null);
    if (!active || !url) return;
    const controller = new AbortController();
    void communityFetch<T>(url, undefined, controller.signal)
      .then(data => { if (!controller.signal.aborted) setSnapshot({ key, data, error: "", status: 200 }); })
      .catch(cause => { if (!controller.signal.aborted) setSnapshot({ key, data: null, error: communityError(cause), status: communityRequestStatus(cause) }); });
    return () => controller.abort();
  }, [active, url, key]);
  return { ...communityReadState(snapshot, key, active), status: communityReadStatus(snapshot, key, active) };
}
