"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { GeneralCommunityItem } from "@/lib/communityGeneralFeed";
import type { FeedScope } from "../components/FeedSectionHeader";
import type { FeedPost } from "./feedTypes";

export function useHomeFeed({ scope, filter, viewerId, enabled = true }: { scope: FeedScope; filter: string; viewerId: string | null; enabled?: boolean }) {
  const [feedPosts, setFeedPosts] = useState<FeedPost[]>([]);
  const [communityItems, setCommunityItems] = useState<GeneralCommunityItem[]>([]);
  const [feedNextCursor, setFeedNextCursor] = useState<string | null>(null);
  const [feedPageLoading, setFeedPageLoading] = useState(true);
  const [feedLoadingMore, setFeedLoadingMore] = useState(false);
  const [feedLoadMoreError, setFeedLoadMoreError] = useState<string | null>(null);
  const [feedLoadError, setFeedLoadError] = useState<string | null>(null);
  const [feedEmptyReason, setFeedEmptyReason] = useState<string | null>(null);
  const [feedRead, setFeedRead] = useState({ key: "", version: 0 });
  const request = useRef<AbortController | null>(null);
  const pagination = useRef({ key: "", cursor: null as string | null, loading: false });
  const loadFeed = useCallback(async (requestedScope: FeedScope, options: { append?: boolean; cursor?: string | null } = {}) => {
    const append = Boolean(options.append && options.cursor);
    const key = `${requestedScope}:${filter}:${viewerId ?? "anonymous"}`;
    // An old observer can fire between a filter render and its first request.
    if (append && (pagination.current.key !== key || pagination.current.cursor !== options.cursor || pagination.current.loading)) return;
    pagination.current = { key, cursor: append ? options.cursor! : null, loading: true };
    request.current?.abort();
    const controller = new AbortController(); request.current = controller;
    setFeedLoadMoreError(null); setFeedLoadError(null);
    if (append) setFeedLoadingMore(true);
    else { setFeedPageLoading(true); setFeedLoadingMore(false); setFeedPosts([]); setCommunityItems([]); setFeedNextCursor(null); setFeedRead(current => ({ ...current, key: "" })); }
    try {
      if (requestedScope === "following" && !viewerId) throw new Error("Takip akışı için giriş yapmalısın.");
      const mixed = requestedScope === "all" || requestedScope === "following";
      const params = new URLSearchParams({ take: "10", scope: requestedScope });
      if (mixed) params.set("filter", filter);
      if (append && options.cursor) params.set("cursor", options.cursor);
      const response = await fetch(`/api/feed${mixed ? "/mixed" : ""}?${params}`, { signal: controller.signal, cache: "no-store" });
      const data = await response.json().catch(() => null);
      if (!response.ok || !Array.isArray(data?.posts) || (mixed && !Array.isArray(data.communityItems))) throw new Error(data?.error || "Keşif akışı yüklenemedi.");
      if (data.nextCursor != null && (typeof data.nextCursor !== "string" || !data.nextCursor.length || data.nextCursor.length > 4096)) throw new Error("Akış sayfalama bilgisi geçersiz. Akışı yeniden yükleyebilirsin.");
      if (controller.signal.aborted) return;
      setFeedPosts(current => {
        if (!append) return data.posts;
        const ids = new Set(current.map(post => post.id));
        return [...current, ...data.posts.filter((post: FeedPost) => !ids.has(post.id))];
      });
      setCommunityItems(current => {
        const items: GeneralCommunityItem[] = data.communityItems ?? [];
        if (!append) return items;
        const keys = new Set(current.map(item => `${item.kind}:${item.id}`));
        return [...current, ...items.filter(item => !keys.has(`${item.kind}:${item.id}`))];
      });
      setFeedNextCursor(data.nextCursor ?? null); setFeedEmptyReason(data.emptyReason ?? null);
      if (!append) setFeedRead(current => ({ key, version: current.version + 1 }));
      pagination.current.cursor = data.nextCursor ?? null;
    } catch (error) {
      if (!controller.signal.aborted) {
        const message = error instanceof Error ? error.message : "Keşif akışına ulaşılamadı.";
        if (append) setFeedLoadMoreError(message); else setFeedLoadError(message);
      }
    } finally { if (!controller.signal.aborted) { pagination.current.loading = false; setFeedPageLoading(false); setFeedLoadingMore(false); } }
  // A new account must refetch personalized interaction flags and block visibility.
  }, [filter, viewerId]);
  useEffect(() => { if (!enabled) return; void loadFeed(scope); return () => request.current?.abort(); }, [scope, loadFeed, enabled]);
  return { feedPosts, setFeedPosts, communityItems, feedNextCursor, feedPageLoading, feedLoadingMore, feedLoadMoreError, feedLoadError, feedEmptyReason, loadFeed,
    feedReadVersion: feedRead.version, feedContextReady: feedRead.key === `${scope}:${filter}:${viewerId ?? "anonymous"}` };
}
