"use client";

import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import type { FeedPost, TrackResult } from "./feedTypes";

type FeedComposerOptions = {
  authenticated: boolean;
  setFeedPosts: Dispatch<SetStateAction<FeedPost[]>>;
  setMessage: Dispatch<SetStateAction<string | null>>;
  onAuthRequired: () => void;
};

export function useFeedComposer({
  authenticated,
  setFeedPosts,
  setMessage,
  onAuthRequired,
}: FeedComposerOptions) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TrackResult[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<TrackResult | null>(null);
  const [note, setNote] = useState("");
  const [tags, setTags] = useState("");
  const [searching, setSearching] = useState(false);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    if (selectedTrack || query.trim().length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setSearching(true);
      setMessage(null);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
          signal: controller.signal,
        });
        const data = await res.json().catch(() => ({}));
        setResults(data.results ?? []);
        if (!res.ok) setMessage(data.error || "Arama başarısız oldu.");
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setResults([]);
        setMessage("Şarkı aramasına ulaşılamadı. Bağlantını kontrol edip tekrar dene.");
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, 350);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, selectedTrack, setMessage]);

  async function createPost() {
    if (!authenticated) {
      onAuthRequired();
      return;
    }
    if (!selectedTrack) {
      setMessage("Akışa bırakmak için önce bir şarkı seç.");
      return;
    }

    setPosting(true);
    setMessage(null);
    try {
      const res = await fetch("/api/feed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trackId: selectedTrack.id,
          track: {
            id: selectedTrack.id,
            uri: selectedTrack.uri,
            name: selectedTrack.name,
            artist: selectedTrack.artist,
            album: selectedTrack.album,
            externalUrl: selectedTrack.externalUrl,
            durationMs: selectedTrack.durationMs,
          },
          note,
          tags,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.post) {
        setMessage(data.error || "Şarkı akışa bırakılamadı.");
        return;
      }

      setFeedPosts((current) => [data.post, ...current]);
      setSelectedTrack(null);
      setQuery("");
      setResults([]);
      setNote("");
      setTags("");
      window.dispatchEvent(new Event("feed-composer:close"));
      setMessage("Şarkı keşif akışına bırakıldı.");
      window.dispatchEvent(new Event("achievement:refresh"));
      window.dispatchEvent(new Event("daily-goals:refresh"));
      window.dispatchEvent(new Event("onboarding:refresh"));
    } catch {
      setMessage("Şarkı paylaşılamadı. Bağlantını kontrol edip tekrar dene.");
    } finally {
      setPosting(false);
    }
  }

  function changeQuery(value: string) {
    setSelectedTrack(null);
    setQuery(value);
  }

  function selectTrack(track: TrackResult) {
    setSelectedTrack(track);
    setResults([]);
  }

  function clearTrack() {
    setSelectedTrack(null);
    setQuery("");
  }

  return {
    query,
    results,
    selectedTrack,
    note,
    tags,
    searching,
    posting,
    setTags,
    setNote,
    changeQuery,
    selectTrack,
    clearTrack,
    createPost,
  };
}
