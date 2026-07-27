"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ExternalLink, ListMusic, LogIn, Music2, Plus, RefreshCw, Search, Settings2, ShieldCheck, Tags, UsersRound } from "lucide-react";
import { SpotifyAttribution } from "../components/SpotifyAttribution";
import { Toast } from "../components/Toast";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { PageTopbar } from "../components/PageTopbar";

type ControlTrack = {
  id: string;
  trackId: string;
  trackName: string;
  artistName: string;
  durationMs: number;
  suggestedBy: string | null;
  imageUrl: string | null;
  externalUrl: string | null;
  album: string;
  genres: string[];
  primaryGenre: string;
  artists: { id: string; name: string; genres: string[] }[];
};

type SearchTrack = {
  id: string;
  uri: string;
  name: string;
  artist: string;
  album: string;
  imageUrl: string | null;
  externalUrl: string | null;
  durationMs: number;
};

type ControlList = {
  id: string;
  ownerName: string;
  playlistName: string | null;
  spotifyExternalUrl: string | null;
  lastExportedAt: string | null;
};

function formatDuration(ms: number) {
  const total = Math.round(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

function groupByGenre(tracks: ControlTrack[]) {
  const groups = new Map<string, ControlTrack[]>();
  for (const track of tracks) {
    const genre = track.primaryGenre || "Tür belirtilmemiş";
    groups.set(genre, [...(groups.get(genre) ?? []), track]);
  }
  return [...groups.entries()].sort((a, b) => b[1].length - a[1].length);
}

function groupByArtist(tracks: ControlTrack[]) {
  const groups = new Map<string, ControlTrack[]>();
  for (const track of tracks) {
    const artists = track.artists.length
      ? track.artists
      : [{ id: track.artistName, name: track.artistName, genres: [] }];
    for (const artist of artists) {
      groups.set(artist.name, [...(groups.get(artist.name) ?? []), track]);
    }
  }
  return [...groups.entries()].sort((a, b) => b[1].length - a[1].length);
}

export default function ControlPage() {
  const [list, setList] = useState<ControlList | null>(null);
  const [tracks, setTracks] = useState<ControlTrack[]>([]);
  const [mode, setMode] = useState<"genre" | "artist">("genre");
  const [filter, setFilter] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchTrack[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [searching, setSearching] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [removeCandidate, setRemoveCandidate] = useState<ControlTrack | null>(null);

  const visibleTracks = useMemo(() => {
    const needle = filter.trim().toLocaleLowerCase("tr-TR");
    if (!needle) return tracks;
    return tracks.filter((track) =>
      `${track.trackName} ${track.artistName} ${track.album} ${track.genres.join(" ")}`
        .toLocaleLowerCase("tr-TR")
        .includes(needle)
    );
  }, [filter, tracks]);

  const groups = useMemo(
    () => (mode === "genre" ? groupByGenre(visibleTracks) : groupByArtist(visibleTracks)),
    [mode, visibleTracks]
  );
  const genreCount = useMemo(
    () => new Set(tracks.map((track) => track.primaryGenre || "Tür belirtilmemiş")).size,
    [tracks]
  );
  const artistCount = useMemo(
    () => new Set(tracks.flatMap((track) => track.artists.map((artist) => artist.name))).size,
    [tracks]
  );

  useEffect(() => {
    loadControl();
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, { signal: controller.signal });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setMessage(data.error || "Arama başarısız oldu.");
          setResults([]);
          return;
        }
        setResults(data.results ?? []);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setResults([]);
        setMessage("Şarkı aramasına ulaşılamadı. Bağlantını kontrol edip tekrar dene.");
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, 320);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  async function loadControl() {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch("/api/accounts/control");
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        setNeedsLogin(true);
        setList(null);
        setTracks([]);
        return;
      }
      if (!res.ok) {
        const error = data.error || "Liste kontrol bilgileri alınamadı.";
        setLoadError(error);
        setMessage(error);
        return;
      }
      setNeedsLogin(false);
      setList(data.list);
      setTracks(data.tracks ?? []);
      if (data.warning) setMessage(data.warning);
    } catch {
      const error = "Liste bilgilerine ulaşılamadı. Bağlantını kontrol edip tekrar dene.";
      setLoadError(error);
      setMessage(error);
    } finally {
      setLoading(false);
    }
  }

  async function addTrack(track: SearchTrack) {
    if (busyId) return;
    setBusyId(track.id);
    setMessage(null);
    try {
      const res = await fetch("/api/accounts/control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add",
          trackId: track.id,
          track: {
            id: track.id,
            uri: track.uri,
            name: track.name,
            artist: track.artist,
            album: track.album,
            imageUrl: track.imageUrl,
            externalUrl: track.externalUrl,
            durationMs: track.durationMs,
          },
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage(data.error || "Şarkı eklenemedi.");
        return;
      }
      setQuery("");
      setResults([]);
      await loadControl();
      setMessage(data.warning || "Şarkı listeye eklendi.");
    } catch {
      setMessage("Şarkı eklenemedi. Bağlantını kontrol edip tekrar dene.");
    } finally {
      setBusyId(null);
    }
  }

  async function removeTrack(track: ControlTrack) {
    if (busyId) return;
    setRemoveCandidate(null);
    setBusyId(track.id);
    setMessage(null);
    try {
      const res = await fetch("/api/accounts/control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "remove", id: track.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage(data.error || "Şarkı çıkarılamadı.");
        return;
      }
      await loadControl();
      setMessage(data.warning || "Şarkı listeden çıkarıldı.");
    } catch {
      setMessage("Şarkı çıkarılamadı. Bağlantını kontrol edip tekrar dene.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <main id="main-content" tabIndex={-1} className="stage-shell min-h-screen bg-app px-4 pb-12 text-slate-950 sm:px-6">
      <Toast message={message} onClose={() => setMessage(null)} />
      <ConfirmDialog
        open={Boolean(removeCandidate)}
        title="Şarkı listeden çıkarılsın mı?"
        body={removeCandidate ? `${removeCandidate.trackName} - ${removeCandidate.artistName} uygulamadaki listenden çıkarılacak.` : ""}
        confirmLabel="Listeden çıkar"
        tone="danger"
        onCancel={() => setRemoveCandidate(null)}
        onConfirm={() => {
          const track = removeCandidate;
          if (track) void removeTrack(track);
        }}
      />
      <section className="ui-page-frame relative mx-auto">
        <PageTopbar
          title="Liste kontrolü"
          subtitle="Şarkıları düzenle ve gruplandır"
          icon={<Music2 size={18} />}
          backLabel="Ana akışa dön"
          className="control-topbar mb-6"
          actions={!needsLogin && list && (
            <div className="flex items-center gap-2">
              <Link href="/account" className="topbar-text-button" aria-label="Hesap paneli" title="Hesap paneli">
                <Settings2 size={17} />
                <span>Hesap paneli</span>
              </Link>
              {list?.spotifyExternalUrl && (
                <a href={list.spotifyExternalUrl} target="_blank" rel="noreferrer" className="topbar-icon-button" aria-label="Spotify'da aç" title="Spotify'da aç">
                  <ExternalLink size={18} />
                </a>
              )}
            </div>
          )}
        />

        {needsLogin ? (
          <section className="control-access-gate" aria-labelledby="control-login-title">
            <span className="control-access-icon"><ShieldCheck size={24} /></span>
            <p className="section-kicker">Üyelik gerekli</p>
            <h2 id="control-login-title">Listeni düzenlemek için giriş yap</h2>
            <p>
              Liste kontrolü yalnızca hesap sahibine açıktır. Giriş yaptıktan sonra
              şarkıları tür ve sanatçıya göre düzenleyebilirsin.
            </p>
            <div className="control-access-actions">
              <Link href="/account?mode=login&next=%2Fcontrol" className="primary-action">
                <LogIn size={17} /> Giriş yap
              </Link>
              <Link href="/" className="secondary-action">Ana akışa dön</Link>
            </div>
          </section>
        ) : loading && !list ? (
          <section className="control-loading-state" role="status" aria-live="polite">
            <span className="control-loading-pulse" />
            <div>
              <strong>Listen hazırlanıyor</strong>
              <p>Şarkılar ve liste bilgileri yükleniyor.</p>
            </div>
          </section>
        ) : loadError && !list ? (
          <section className="control-access-gate" role="alert" aria-labelledby="control-error-title">
            <span className="control-access-icon"><RefreshCw size={24} /></span>
            <p className="section-kicker">Bağlantı sorunu</p>
            <h2 id="control-error-title">Liste bilgileri alınamadı</h2>
            <p>{loadError}</p>
            <div className="control-access-actions">
              <button type="button" onClick={() => void loadControl()} className="primary-action"><RefreshCw size={17} /> Tekrar dene</button>
              <Link href="/" className="secondary-action">Ana akışa dön</Link>
            </div>
          </section>
        ) : (
          <>
            <section
              className="control-summary"
              tabIndex={0}
              aria-label="Liste özeti. Dar ekranlarda yatay kaydırılabilir."
            >
              <div className="control-summary-title">
                <span className="brand-mark"><ListMusic size={18} /></span>
                <div className="min-w-0">
                  <p className="truncate text-base font-black text-white">{list?.playlistName || list?.ownerName || "Yükleniyor"}</p>
                  <p className="mt-0.5 text-xs text-cyan-50/72">Düzenlemeye hazır onaylı liste</p>
                </div>
              </div>
              <div className="control-metric"><Music2 size={17} /><span><strong>{tracks.length}</strong> şarkı</span></div>
              <div className="control-metric"><Tags size={17} /><span><strong>{genreCount}</strong> tür</span></div>
              <div className="control-metric"><UsersRound size={17} /><span><strong>{artistCount}</strong> sanatçı</span></div>
            </section>

            <section className="mt-6 grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
              <div className="min-w-0">
                <div className="control-toolbar">
                  <div>
                    <h2 className="text-xs font-black uppercase tracking-[0.16em] text-cyan-100/72">Gruplu liste</h2>
                    <p className="mt-1 text-sm text-cyan-50/68">
                      Tür veya sanatçı kırılımıyla listeyi hızlıca düzenle.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <label className="control-search">
                      <Search size={17} />
                      <span className="sr-only">Listede şarkı, sanatçı veya tür ara</span>
                      <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Şarkı, sanatçı veya tür ara..." />
                    </label>
                    <div role="group" aria-label="Liste gruplama biçimi" className="flex rounded-xl border border-white/14 bg-white/10 p-1 text-xs font-bold backdrop-blur-xl">
                      <button
                        type="button"
                        aria-pressed={mode === "genre"}
                        onClick={() => setMode("genre")}
                        className={`rounded-lg px-3 py-2 transition ${mode === "genre" ? "bg-white/16 text-white shadow-sm" : "text-cyan-50/68 hover:bg-white/10 hover:text-white"}`}
                      >
                        Türe göre
                      </button>
                      <button
                        type="button"
                        aria-pressed={mode === "artist"}
                        onClick={() => setMode("artist")}
                        className={`rounded-lg px-3 py-2 transition ${mode === "artist" ? "bg-white/16 text-white shadow-sm" : "text-cyan-50/68 hover:bg-white/10 hover:text-white"}`}
                      >
                        Sanatçıya göre
                      </button>
                    </div>
                  </div>
                </div>

                {loading && (
                  <p className="track-card mt-4 rounded-2xl p-5 text-sm text-slate-500">
                    Liste yükleniyor...
                  </p>
                )}
                {!loading && groups.length === 0 && (
                  <div className="track-card mt-4 rounded-2xl p-5 text-sm text-slate-500">
                    <strong className="block text-navy">{tracks.length === 0 ? "Listen henüz boş" : "Bu filtreyle eşleşen şarkı yok"}</strong>
                    <p className="mt-1 leading-6">{tracks.length === 0 ? "Şarkı ekleme alanından ilk parçanı bulup listene ekleyebilirsin." : "Arama metnini temizleyerek bütün şarkıları yeniden göster."}</p>
                    {tracks.length > 0 && <button type="button" onClick={() => setFilter("")} className="secondary-action mt-3 h-10 rounded-xl px-4 text-xs font-bold">Filtreyi temizle</button>}
                  </div>
                )}
                <div className="mt-4 grid gap-4">
                  {groups.map(([groupName, groupTracks], index) => (
                    <details
                      key={groupName}
                      className="control-group"
                      open={index === 0 || Boolean(filter.trim())}
                    >
                      <summary className="control-group-summary">
                        <span className="min-w-0">
                          <strong>{groupName}</strong>
                          <small>{groupTracks.length} şarkı</small>
                        </span>
                        <ChevronDown size={18} aria-hidden="true" />
                      </summary>
                      <ul className="control-group-tracks">
                        {groupTracks.map((track) => (
                          <li key={`${groupName}-${track.id}`} className="track-card grid gap-3 rounded-2xl p-3 sm:grid-cols-[56px_minmax(0,1fr)_auto] sm:items-center">
                            <div className="h-14 w-14 overflow-hidden rounded-xl bg-sky-100">
                              {track.imageUrl ? (
                                <Image src={track.imageUrl} alt="" width={56} height={56} className="h-full w-full object-contain" />
                              ) : (
                                <span className="flex h-full w-full items-center justify-center text-sky-700">♫</span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-black text-navy">{track.trackName}</p>
                              <p className="mt-1 truncate text-xs text-slate-500">
                                {track.artistName} · {formatDuration(track.durationMs)}
                              </p>
                              <div className="mt-2 flex flex-wrap gap-1">
                                {track.genres.slice(0, 3).map((genre) => (
                                  <span key={genre} className="rounded-full border border-sky-100 bg-sky-50 px-2 py-1 text-xs font-bold text-sky-800">
                                    {genre}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div className="flex gap-2 sm:justify-end">
                              {track.externalUrl && (
                                <a href={track.externalUrl} target="_blank" rel="noreferrer" className="secondary-action flex h-10 items-center rounded-xl px-3 text-xs font-bold">
                                  <ExternalLink size={15} /><span>Aç</span>
                                </a>
                              )}
                              <button
                                type="button"
                                onClick={() => setRemoveCandidate(track)}
                                disabled={Boolean(busyId)}
                                className="danger-action h-10 rounded-xl px-3 text-xs font-bold disabled:text-slate-400"
                              >
                                {busyId === track.id ? "..." : "Çıkar"}
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </details>
                  ))}
                </div>
              </div>

              <aside className="grid gap-4 xl:sticky xl:top-6">
                <section className="sticky-panel rounded-2xl p-5">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-cyan-100/80">
                      Şarkı ekle
                    </h2>
                    <SpotifyAttribution />
                  </div>
                  <label htmlFor="control-track-search" className="mt-4 block text-xs font-bold text-cyan-50/80">Şarkı veya sanatçı</label>
                  <input
                    id="control-track-search"
                    type="search"
                    autoComplete="off"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Şarkı veya sanatçı ara..."
                    className="mt-2 h-12 w-full rounded-xl border border-white/16 bg-white/92 px-4 text-sm text-slate-950 outline-none transition focus:border-cyan-300 focus:ring-2 focus:ring-cyan-200"
                  />
                  <div className="mt-3 grid gap-2">
                    {searching && <p className="rounded-xl bg-white/10 p-3 text-sm text-cyan-50/70" role="status">Aranıyor...</p>}
                    {!searching &&
                      results.map((track) => (
                        <div key={track.id} className="grid grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl bg-white/10 p-2 ring-1 ring-white/10">
                          <div className="h-11 w-11 overflow-hidden rounded-lg bg-sky-100">
                            {track.imageUrl ? (
                              <Image src={track.imageUrl} alt="" width={44} height={44} className="h-full w-full object-contain" />
                            ) : (
                              <span className="flex h-full w-full items-center justify-center text-sky-700">♫</span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-black text-white">{track.name}</p>
                            <p className="truncate text-xs text-cyan-50/72">{track.artist}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => addTrack(track)}
                            disabled={Boolean(busyId)}
                            className="primary-action h-9 rounded-xl px-3 text-xs font-black"
                          >
                            {busyId === track.id ? "..." : <><Plus size={14} /><span>Ekle</span></>}
                          </button>
                        </div>
                      ))}
                    {!searching && query.trim().length >= 2 && results.length === 0 && (
                      <p className="rounded-2xl bg-white/10 p-3 text-sm text-cyan-50/70">Sonuç bulunamadı.</p>
                    )}
                  </div>
                </section>

                <section className="dark-panel rounded-2xl p-5">
                  <h2 className="control-note-title">
                    Kontrol notu
                  </h2>
                  <p className="control-note-copy">
                    Tür bilgileri Spotify sanatçı verisinden gelir. Spotify bu
                    veriyi döndürmezse şarkılar “Tür belirtilmemiş” grubunda kalır.
                  </p>
                  <button type="button" onClick={() => void loadControl()} disabled={loading || Boolean(busyId)} className="secondary-action mt-4 h-11 w-full rounded-xl px-3 text-sm font-bold disabled:cursor-wait disabled:opacity-60">
                    <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> <span>{loading ? "Yenileniyor..." : "Listeyi yenile"}</span>
                  </button>
                </section>
              </aside>
            </section>
          </>
        )}
      </section>
    </main>
  );
}
