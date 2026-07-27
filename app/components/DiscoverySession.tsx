"use client";

import { Check, ExternalLink, ListPlus, RefreshCw, Shuffle, SkipForward } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useSessionNavigation } from "@/app/hooks/useSessionNavigation";

type DiscoveryTrack = {
  id: string;
  uri: string;
  name: string;
  artist: string;
  album: string;
  externalUrl: string | null;
  durationMs: number;
};

type DiscoverySessionProps = {
  authenticated: boolean;
  onMessage: (message: string) => void;
  variant?: "panel" | "feed";
};

function formatDuration(durationMs: number) {
  const seconds = Math.floor(durationMs / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

const SEEN_TRACKS_KEY = "listekutusu_discovery_seen";

export function DiscoverySession({ authenticated, onMessage, variant = "panel" }: DiscoverySessionProps) {
  const { goToLogin } = useSessionNavigation();
  const [tracks, setTracks] = useState<DiscoveryTrack[]>([]);
  const [seenIds, setSeenIds] = useState<string[]>([]);
  const [addedIds, setAddedIds] = useState<string[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [replacingId, setReplacingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sourceName, setSourceName] = useState("Editör seçkisi");

  const rememberTracks = useCallback((current: string[], incoming: DiscoveryTrack[]) => {
    const next = [...new Set([...current, ...incoming.map((track) => track.id)])].slice(-50);
    setSeenIds(next);
    try {
      window.localStorage.setItem(SEEN_TRACKS_KEY, JSON.stringify(next));
    } catch {
      // Gizli tarama veya kapalı depolama keşif akışını engellememeli.
    }
    return next;
  }, []);

  const loadTracks = useCallback(async (avoidSeen = false, initialSeen: string[] = []) => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    const excludedIds = initialSeen.length ? initialSeen : seenIds;
    if (avoidSeen && excludedIds.length) params.set("exclude", excludedIds.slice(-50).join(","));
    try {
      const res = await fetch(`/api/discovery/random?${params.toString()}`);
      const data = await res.json().catch(() => null);
      if (!res.ok || !Array.isArray(data?.tracks)) {
        setError(data?.error || "Beşli keşif hazırlanamadı.");
        return;
      }
      setTracks(data.tracks);
      setSourceName(data.sourceName || "Editör seçkisi");
      rememberTracks(excludedIds, data.tracks);
    } catch {
      setError("Beşli keşif yüklenemedi. Bağlantını kontrol edip yeniden dene.");
    } finally {
      setLoading(false);
    }
  }, [rememberTracks, seenIds]);

  useEffect(() => {
    let stored: string[] = [];
    try {
      const parsed = JSON.parse(window.localStorage.getItem(SEEN_TRACKS_KEY) || "[]");
      if (Array.isArray(parsed)) stored = parsed.filter((id) => typeof id === "string").slice(-50);
    } catch {
      stored = [];
    }
    setSeenIds(stored);
    void loadTracks(stored.length > 0, stored);
    // İlk tur yalnızca bileşen açıldığında yüklenir.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function replaceTrack(trackId: string) {
    if (replacingId || loading) return;
    setReplacingId(trackId);
    setError(null);
    const excluded = [...new Set([...seenIds, ...tracks.map((track) => track.id)])].slice(-50);
    const params = new URLSearchParams({ count: "1", exclude: excluded.join(",") });
    try {
      const res = await fetch(`/api/discovery/random?${params.toString()}`);
      const data = await res.json().catch(() => null);
      const replacement = Array.isArray(data?.tracks) ? data.tracks[0] as DiscoveryTrack | undefined : undefined;
      if (!res.ok || !replacement) {
        setError(data?.error || "Yeni bir şarkı getirilemedi.");
        return;
      }
      setTracks((current) => current.map((track) => track.id === trackId ? replacement : track));
      setSourceName(data.sourceName || sourceName);
      rememberTracks(seenIds, [replacement]);
    } catch {
      setError("Yeni bir şarkı getirilemedi. Bağlantını kontrol edip yeniden dene.");
    } finally {
      setReplacingId(null);
    }
  }

  async function addTrack(track: DiscoveryTrack) {
    if (!authenticated) {
      goToLogin("/discover");
      return;
    }
    if (busyId || addedIds.includes(track.id)) return;

    setBusyId(track.id);
    try {
      const res = await fetch("/api/accounts/control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add", trackId: track.id }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        if (res.status === 409) setAddedIds((current) => [...current, track.id]);
        onMessage(data?.error || "Şarkı listene eklenemedi.");
        return;
      }

      setAddedIds((current) => [...current, track.id]);
      onMessage(data?.warning || "Şarkı listene eklendi.");
      window.dispatchEvent(new Event("daily-goals:refresh"));
    } catch {
      onMessage("Şarkı listene eklenemedi. Bağlantını kontrol edip yeniden dene.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section id="five-discovery" className={`discovery-session ${variant === "feed" ? "discovery-session-feed" : ""}`} aria-labelledby="discovery-title">
      <header className="discovery-session-header">
        <div className="flex min-w-0 items-center gap-3">
          <span className="discovery-session-icon"><Shuffle size={19} /></span>
          <div className="min-w-0">
            <p className="max-w-44 truncate text-xs font-black uppercase tracking-[0.14em] text-cyan-700 sm:max-w-72">{sourceName}</p>
            <h2 id="discovery-title" className="truncate text-base font-black text-navy">
              {variant === "feed" ? "Editörden 5" : "Rastgele 5 keşif"}
            </h2>
          </div>
        </div>
        <button type="button" onClick={() => void loadTracks(true)} disabled={loading} className="discovery-refresh-button">
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          <span>Yeni 5</span>
        </button>
      </header>

      {error && <p className="discovery-state" role="alert">{error}</p>}
      {loading && tracks.length === 0 && (
        <div className="grid gap-1.5 p-2" role="status" aria-label="Keşifler yükleniyor">
          {Array.from({ length: 5 }).map((_, index) => <span key={index} className="h-14 animate-pulse rounded-xl bg-slate-200/70" />)}
        </div>
      )}
      {tracks.length > 0 && (
        <ol className="discovery-track-list">
          {tracks.map((track, index) => {
            const added = addedIds.includes(track.id);
            return (
              <li key={track.id} className="discovery-track-row">
                <span className="discovery-track-rank">{index + 1}</span>
                <div className="min-w-0">
                  {track.externalUrl ? (
                    <a href={track.externalUrl} target="_blank" rel="noreferrer" className="group flex min-w-0 items-center gap-1 text-sm font-black text-navy hover:text-cyan-700" title="Spotify'da aç">
                      <span className="truncate">{track.name}</span><ExternalLink size={12} className="shrink-0 opacity-45 group-hover:opacity-100" />
                    </a>
                  ) : (
                    <p className="truncate text-sm font-black text-navy">{track.name}</p>
                  )}
                  <p className="truncate text-xs font-semibold text-slate-500">{track.artist} · {formatDuration(track.durationMs)}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button type="button" onClick={() => void replaceTrack(track.id)} disabled={Boolean(replacingId) || added} className="discovery-icon-button" aria-label={`${track.name} yerine başka şarkı getir`} title="Başka şarkı getir">
                    <SkipForward size={15} className={replacingId === track.id ? "animate-pulse" : ""} />
                  </button>
                  <button type="button" onClick={() => void addTrack(track)} disabled={added || busyId === track.id} className={added ? "discovery-add-button discovery-added" : "discovery-add-button"}>
                    {added ? <Check size={15} /> : <ListPlus size={15} />}
                    <span>{busyId === track.id ? "..." : added ? "Eklendi" : "Ekle"}</span>
                  </button>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
