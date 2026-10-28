"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { searchPath } from "@/lib/socialSearchTypes";
import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import {
  Compass,
  ExternalLink,
  Flame,
  Heart,
  ListMusic,
  ListPlus,
  LogIn,
  Music2,
  Search,
  UserRound,
  UsersRound,
} from "lucide-react";
import { Toast } from "@/app/components/Toast";
import { MobileDock } from "@/app/components/MobileDock";
import { DiscoverySession } from "@/app/components/DiscoverySession";
import { AccountMenu } from "@/app/components/AccountMenu";
import { PageTopbar } from "@/app/components/PageTopbar";
import { useSessionNavigation } from "@/app/hooks/useSessionNavigation";
import { loadAccountSession } from "@/lib/clientAccountSession";
import { communityError, communityFetch, communityRequestStatus } from "@/lib/communityRequest";
import { CommunityReadFeedback } from "@/app/components/CommunityReadFeedback";
import { ContentState } from "@/app/components/ui/ContentState";
import { accountLoginPath } from "@/lib/navigation";

type DiscoverTrack = {
  id: string;
  trackId: string;
  trackName: string;
  artistName: string;
  externalUrl: string | null;
  tags: string[];
  createdAt: string;
  likeCount: number;
  addCount: number;
  likedByMe: boolean;
  addedByMe: boolean;
  score: number;
  author: {
    id: string;
    ownerName: string;
    slug: string;
    profileTheme: string;
  };
};

type DiscoverData = {
  tracks: DiscoverTrack[];
  tags: Array<{ tag: string; posts: number; engagement: number }>;
  curators: Array<{
    id: string;
    ownerName: string;
    slug: string;
    profileTheme: string;
    posts: number;
    likes: number;
    adds: number;
    score: number;
  }>;
  people: Array<{
    id: string;
    ownerName: string;
    slug: string;
    profileTheme: string;
    posts: number;
    followers: number;
    sharedGenres: string[];
    reason: string;
  }>;
  lists: Array<{
    id: string;
    name: string;
    ownerName: string;
    slug: string;
    profileTheme: string;
    followers: number;
    posts: number;
    tracks: number;
    score: number;
  }>;
  totals: { posts: number; tracks: number; tags: number; curators: number; lists: number };
};

type Account = { ownerName: string; email?: string | null; slug: string; role?: string | null } | null;
type SearchScope = "all" | "tracks" | "people" | "lists";
type DiscoveryOrder = "popular" | "new";

const searchScopes: Array<{ id: SearchScope; label: string }> = [
  { id: "all", label: "Tümü" },
  { id: "tracks", label: "Şarkılar" },
  { id: "people", label: "Kullanıcılar" },
  { id: "lists", label: "Listeler" },
];

const themeClasses: Record<string, string> = {
  aurora: "from-cyan-400 to-violet-500",
  violet: "from-fuchsia-400 to-indigo-500",
  emerald: "from-emerald-400 to-cyan-500",
  sunset: "from-rose-400 to-orange-400",
};

export default function DiscoverPage() {
  const { goToLogin, logoutToHome } = useSessionNavigation();
  const [data, setData] = useState<DiscoverData | null>(null);
  const [account, setAccount] = useState<Account>(null);
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [searchScope, setSearchScope] = useState<SearchScope>("all");
  const [discoveryOrder, setDiscoveryOrder] = useState<DiscoveryOrder>("popular");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [loadStatus, setLoadStatus] = useState<number | null>(null);
  const requestRef = useRef<AbortController | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [workingIds, setWorkingIds] = useState<string[]>([]);
  const [urlStateReady, setUrlStateReady] = useState(false);
  const [trackLimit, setTrackLimit] = useState(10);
  const trackSentinelRef = useRef<HTMLDivElement>(null);

  const loadDiscover = useCallback(async () => {
    const controller = new AbortController();
    requestRef.current?.abort(); requestRef.current = controller;
    setLoading(true);
    setLoadError(""); setLoadStatus(null); setData(null);
    try {
      const [discover, nextAccount] = await Promise.all([
        communityFetch<DiscoverData>("/api/discover", undefined, controller.signal),
        loadAccountSession(),
      ]);
      if (controller.signal.aborted) return;
      if (![discover.tracks, discover.tags, discover.curators, discover.people, discover.lists].every(Array.isArray) || !discover.totals) throw new Error("Keşfet yanıtı doğrulanamadı. Yeniden deneyebilirsin.");
      setData(discover);
      setAccount(nextAccount);
    } catch (cause) {
      if (!controller.signal.aborted) { setLoadError(communityError(cause)); setLoadStatus(communityRequestStatus(cause)); }
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDiscover();
    return () => requestRef.current?.abort();
  }, [loadDiscover]);

  useEffect(() => {
    const applyUrlState = () => {
      const params = new URLSearchParams(window.location.search);
      const nextQuery = params.get("q")?.trim() || "";
      const nextScope = params.get("type") as SearchScope | null;
      if (nextQuery) { router.replace(searchPath(nextQuery, nextScope === "people" || nextScope === "lists" ? "people" : "all")); return; }
      setQuery(nextQuery);
      setSearchScope(searchScopes.some((scope) => scope.id === nextScope) ? nextScope! : "all");
    };
    applyUrlState();
    setUrlStateReady(true);
    window.addEventListener("popstate", applyUrlState);
    return () => window.removeEventListener("popstate", applyUrlState);
  }, [router]);

  useEffect(() => {
    if (!urlStateReady) return;
    const url = new URL(window.location.href);
    const normalizedQuery = query.trim();
    if (normalizedQuery) url.searchParams.set("q", normalizedQuery);
    else url.searchParams.delete("q");
    if (normalizedQuery && searchScope !== "all") url.searchParams.set("type", searchScope);
    else url.searchParams.delete("type");
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
  }, [query, searchScope, urlStateReady]);

  const visibleTracks = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("tr-TR");
    const filtered = (data?.tracks ?? []).filter((track) => {
      const matchesTag = Boolean(normalizedQuery) || !activeTag || track.tags.includes(activeTag);
      const matchesQuery =
        !normalizedQuery ||
        track.trackName.toLocaleLowerCase("tr-TR").includes(normalizedQuery) ||
        track.artistName.toLocaleLowerCase("tr-TR").includes(normalizedQuery) ||
        track.author.ownerName.toLocaleLowerCase("tr-TR").includes(normalizedQuery) ||
        track.tags.some((tag) => tag.toLocaleLowerCase("tr-TR").includes(normalizedQuery));
      return matchesTag && matchesQuery;
    });
    return filtered.sort((left, right) => discoveryOrder === "new"
      ? new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
      : right.score - left.score);
  }, [activeTag, data, discoveryOrder, query]);

  const displayedTracks = visibleTracks.slice(0, trackLimit);

  useEffect(() => {
    setTrackLimit(10);
  }, [activeTag, discoveryOrder, query, searchScope]);

  useEffect(() => {
    const sentinel = trackSentinelRef.current;
    if (!sentinel || displayedTracks.length >= visibleTracks.length) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      setTrackLimit((current) => Math.min(current + 10, visibleTracks.length));
    }, { rootMargin: "500px 0px 240px" });

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [displayedTracks.length, visibleTracks.length]);
  const visiblePeople = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("tr-TR");
    if (!normalizedQuery) return data?.people ?? [];
    return (data?.people ?? []).filter((person) =>
      person.ownerName.toLocaleLowerCase("tr-TR").includes(normalizedQuery) ||
      person.slug.toLocaleLowerCase("tr-TR").includes(normalizedQuery) ||
      person.sharedGenres.some((genre) => genre.toLocaleLowerCase("tr-TR").includes(normalizedQuery))
    );
  }, [data, query]);
  const visibleLists = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("tr-TR");
    if (!normalizedQuery) return data?.lists ?? [];
    return (data?.lists ?? []).filter((list) =>
      list.name.toLocaleLowerCase("tr-TR").includes(normalizedQuery) ||
      list.ownerName.toLocaleLowerCase("tr-TR").includes(normalizedQuery)
    );
  }, [data, query]);
  const searchActive = query.trim().length > 0;
  const hasActiveFilters = Boolean(searchActive || activeTag);
  const allSearchResultCount = visibleTracks.length + visiblePeople.length + visibleLists.length;
  const noSearchResults = searchActive && !loading && !loadError && allSearchResultCount === 0;
  const showTracks = !searchActive || searchScope === "tracks" || (searchScope === "all" && visibleTracks.length > 0);
  const showPeopleAside = !searchActive;

  function searchResultCount(scope: SearchScope) {
    if (scope === "tracks") return visibleTracks.length;
    if (scope === "people") return visiblePeople.length;
    if (scope === "lists") return visibleLists.length;
    return allSearchResultCount;
  }

  function handleSearchTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const lastIndex = searchScopes.length - 1;
    const nextIndex = event.key === "Home"
      ? 0
      : event.key === "End"
        ? lastIndex
        : event.key === "ArrowRight"
          ? (index + 1) % searchScopes.length
          : (index - 1 + searchScopes.length) % searchScopes.length;
    const nextScope = searchScopes[nextIndex].id;
    setSearchScope(nextScope);
    document.getElementById(`discover-search-tab-${nextScope}`)?.focus();
  }

  function requireAccount() {
    if (account) return true;
    goToLogin("/discover");
    return false;
  }

  async function logoutAccount() {
    try {
      await logoutToHome();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Çıkış işlemi tamamlanamadı.");
    }
  }

  async function toggleLike(postId: string) {
    if (!requireAccount() || workingIds.includes(postId)) return;
    setWorkingIds((current) => [...current, postId]);
    setData((current) => current ? {
      ...current,
      tracks: current.tracks.map((track) => track.id === postId
        ? {
            ...track,
            likedByMe: !track.likedByMe,
            likeCount: Math.max(0, track.likeCount + (track.likedByMe ? -1 : 1)),
          }
        : track),
    } : current);

    const rollback = () => {
      setData((current) => current ? {
        ...current,
        tracks: current.tracks.map((track) => track.id === postId
          ? {
              ...track,
              likedByMe: !track.likedByMe,
              likeCount: Math.max(0, track.likeCount + (track.likedByMe ? -1 : 1)),
            }
          : track),
      } : current);
    };

    try {
      const res = await fetch("/api/feed/likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        rollback();
        setMessage(result.error || "Beğeni güncellenemedi.");
        return;
      }
      setData((current) => current ? {
        ...current,
        tracks: current.tracks.map((track) => track.id === postId
          ? { ...track, likedByMe: result.liked, likeCount: result.likeCount }
          : track),
      } : current);
    } catch {
      rollback();
      setMessage("Beğeni güncellenemedi. Bağlantını kontrol edip yeniden dene.");
    } finally {
      setWorkingIds((current) => current.filter((id) => id !== postId));
    }
  }

  async function addToList(postId: string) {
    if (!requireAccount() || workingIds.includes(postId)) return;
    setWorkingIds((current) => [...current, postId]);
    setData((current) => current ? {
      ...current,
      tracks: current.tracks.map((track) => track.id === postId
        ? { ...track, addedByMe: true, addCount: track.addCount + 1 }
        : track),
    } : current);

    const rollback = () => {
      setData((current) => current ? {
        ...current,
        tracks: current.tracks.map((track) => track.id === postId
          ? { ...track, addedByMe: false, addCount: Math.max(0, track.addCount - 1) }
          : track),
      } : current);
    };

    try {
      const res = await fetch("/api/feed/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok && !result.alreadyExists) {
        rollback();
        setMessage(result.error || "Şarkı listene eklenemedi.");
        return;
      }
      if (result.alreadyExists) {
        setData((current) => current ? {
          ...current,
          tracks: current.tracks.map((track) => track.id === postId
            ? { ...track, addCount: Math.max(0, track.addCount - 1) }
            : track),
        } : current);
      }
      setMessage(result.warning || result.message || "Şarkı listene eklendi.");
      window.dispatchEvent(new Event("daily-goals:refresh"));
    } catch {
      rollback();
      setMessage("Şarkı listene eklenemedi. Bağlantını kontrol edip yeniden dene.");
    } finally {
      setWorkingIds((current) => current.filter((id) => id !== postId));
    }
  }

  return (
    <main id="main-content" tabIndex={-1} className="stage-shell min-h-screen bg-app px-4 pb-28 text-white sm:px-6 xl:pb-14">
      <Toast message={message} onClose={() => setMessage(null)} />
      <MobileDock authenticated={Boolean(account)} profileSlug={account?.slug} active="discover" />
      <section className="ui-page-frame relative mx-auto">
        <PageTopbar
          title="Keşfet"
          subtitle="Topluluğun müzik haritası"
          icon={<Compass size={19} />}
          backLabel="Ana akışa dön"
          showPrimaryNavigation
          actions={account ? (
            <AccountMenu
              ownerName={account.ownerName}
              email={account.email}
              profileSlug={account.slug}
              role={account.role}
              onLogout={() => void logoutAccount()}
            />
          ) : (
            <Link href="/account?mode=login&next=/discover" className="topbar-primary-button"><LogIn size={17} /><span>Giriş yap</span></Link>
          )}
        />

        <section className={searchActive ? "discover-heading discover-heading-search py-5 sm:py-6" : "discover-heading py-6 sm:py-8"}>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-200/78">
            {searchActive ? "Topluluk araması" : "Son 30 gün"}
          </p>
          <div className="mt-2 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-3xl font-black text-white sm:text-4xl">
                {searchActive ? "Arama sonuçları" : "Yeni sesleri bul"}
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-cyan-50/72">
                {searchActive
                  ? `"${query.trim()}" için topluluk şarkıları, kullanıcılar ve listeler gösteriliyor.`
                  : "Yükselen şarkıları, konuşulan türleri ve topluluğun aktif küratörlerini tek yerde tara."}
              </p>
            </div>
            <Link href="/search" className="secondary-action inline-flex items-center gap-2 rounded-xl px-4 py-3"><Search size={17} aria-hidden="true" />Her şeyde ara</Link>
          </div>
        </section>

        {searchActive ? (
          <section className="discover-search-toolbar" aria-label="Arama sonucu türü">
            <div className="discover-search-tabs" role="tablist" aria-label="Sonuçları filtrele">
              {searchScopes.map(({ id: scope, label }, index) => (
                <button
                  key={scope}
                  id={`discover-search-tab-${scope}`}
                  type="button"
                  role="tab"
                  aria-selected={searchScope === scope}
                  aria-controls={`discover-search-panel-${scope}`}
                  tabIndex={searchScope === scope ? 0 : -1}
                  onClick={() => setSearchScope(scope)}
                  onKeyDown={(event) => handleSearchTabKeyDown(event, index)}
                  className={searchScope === scope ? "discover-search-tab discover-search-tab-active" : "discover-search-tab"}
                >
                  {label}<span>{data ? searchResultCount(scope) : "—"}</span>
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setSearchScope("all");
              }}
              className="discover-clear-filter"
            >
              Keşfete dön
            </button>
          </section>
        ) : (
          <>
            <section className="discover-stats" aria-label="Keşfet özeti">
              {[
                ["Paylaşım", data?.totals.posts ?? "—"],
                ["Şarkı", data?.totals.tracks ?? "—"],
                ["Etiket", data?.totals.tags ?? "—"],
                ["Liste", data?.totals.lists ?? "—"],
              ].map(([label, value]) => (
                <div key={label} className="discover-stat"><strong>{value}</strong><span>{label}</span></div>
              ))}
            </section>
            <DiscoverySession authenticated={Boolean(account)} onMessage={setMessage} />
          </>
        )}

        <div className={showPeopleAside ? "mt-6 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px]" : "mt-6"}>
          <div id={`discover-search-panel-${searchScope}`} role={searchActive ? "tabpanel" : undefined} aria-labelledby={searchActive ? `discover-search-tab-${searchScope}` : undefined} className="min-w-0">
            <CommunityReadFeedback loading={loading} error={loadError} status={loadStatus} loadingLabel="Keşfet hazırlanıyor" errorTitle="Keşfet şu anda yüklenemedi" loginHref={accountLoginPath(`/discover${searchActive ? `?${new URLSearchParams({ q: query.trim(), type: searchScope })}` : ""}`)} onRetry={() => void loadDiscover()} />
            {noSearchResults && (
              <section className="discover-no-results" aria-live="polite">
                <span className="discover-empty-icon"><Search size={20} /></span>
                <h2>Bu aramayla eşleşen sonuç yok</h2>
                <p>Yazımı kontrol et veya daha kısa bir şarkı, kullanıcı ya da liste adı dene.</p>
                <button type="button" onClick={() => { setQuery(""); setSearchScope("all"); }} className="secondary-action mt-4 h-10 rounded-xl px-4 text-xs font-black">Keşfete dön</button>
              </section>
            )}
            {!searchActive && (
              <section className="discover-topic-strip" aria-label="Keşif sıralaması ve popüler konular">
                <button type="button" onClick={() => { setActiveTag(null); setDiscoveryOrder("popular"); }} className={!activeTag && discoveryOrder === "popular" ? "discover-topic discover-topic-active" : "discover-topic"}>Popüler</button>
                <button type="button" onClick={() => { setActiveTag(null); setDiscoveryOrder("new"); }} className={!activeTag && discoveryOrder === "new" ? "discover-topic discover-topic-active" : "discover-topic"}>Yeni</button>
                {(data?.tags ?? []).map((item) => (
                  <button key={item.tag} type="button" onClick={() => setActiveTag((current) => current === item.tag ? null : item.tag)} className={activeTag === item.tag ? "discover-topic discover-topic-active" : "discover-topic"}>
                    #{item.tag}<span>{item.posts}</span>
                  </button>
                ))}
              </section>
            )}

            {showTracks && <section className={searchActive ? "discover-track-section" : "discover-track-section mt-4"} aria-labelledby="rising-tracks-title">
              <header className="discover-track-header">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-100/70">
                    {query.trim() ? "Arama" : activeTag ? "Seçili konu" : "Topluluk sinyali"}
                  </p>
                  <h2 id="rising-tracks-title" className="mt-1 text-xl font-bold text-white">
                    {query.trim() ? "Şarkı sonuçları" : activeTag ? `#${activeTag} keşifleri` : discoveryOrder === "new" ? "Yeni paylaşılanlar" : "Yükselen şarkılar"}
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-100/72"><Flame size={15} /> {data ? `${visibleTracks.length} sonuç` : "Sonuç sayısı bilinmiyor"}</span>
                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={() => {
                        setQuery("");
                        setActiveTag(null);
                      }}
                      className="discover-clear-filter"
                    >
                      Temizle
                    </button>
                  )}
                </div>
              </header>
              <div className="discover-track-list">
                {displayedTracks.map((track, index) => (
                  <article key={track.id} className="discover-track-row">
                    <span className="discover-rank">{index + 1}</span>
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-black text-white">{track.trackName}</h3>
                      <p className="mt-0.5 truncate text-xs font-semibold text-cyan-50/72">{track.artistName} · <Link href={`/u/${track.author.slug}`} className="discover-author-link">{track.author.ownerName}</Link></p>
                      {track.tags.length > 0 && <p className="mt-1 truncate text-xs font-bold text-cyan-200/75">{track.tags.slice(0, 3).map((tag) => `#${tag}`).join("  ")}</p>}
                    </div>
                    <div className="discover-track-signals">
                      <button type="button" onClick={() => toggleLike(track.id)} disabled={workingIds.includes(track.id)} className={track.likedByMe ? "discover-signal discover-signal-active" : "discover-signal"} aria-label={track.likedByMe ? "Beğeniyi kaldır" : "Beğen"} aria-pressed={track.likedByMe}>
                        <Heart size={14} fill={track.likedByMe ? "currentColor" : "none"} /> {track.likeCount}
                      </button>
                      <button type="button" onClick={() => addToList(track.id)} disabled={track.addedByMe || workingIds.includes(track.id)} className={track.addedByMe ? "discover-signal discover-signal-added" : "discover-signal"} aria-label={track.addedByMe ? "Listende" : "Listene ekle"}>
                        <ListPlus size={14} /> {track.addCount}
                      </button>
                    </div>
                    {track.externalUrl && <a href={track.externalUrl} target="_blank" rel="noreferrer" className="discover-open" aria-label={`${track.trackName} Spotify'da aç`} title="Spotify'da aç"><ExternalLink size={15} /></a>}
                  </article>
                ))}
                {!loading && displayedTracks.length < visibleTracks.length && (
                  <div ref={trackSentinelRef} className="discover-auto-load" role="status">
                    <span aria-hidden="true" />
                    Yeni keşifler hazırlanıyor
                  </div>
                )}
                {!loading && !loadError && visibleTracks.length === 0 && (!searchActive || searchScope === "tracks") && (
                  <ContentState kind="empty" title={data?.tracks.length ? "Bu filtreyle eşleşme yok" : "Keşfet akışı henüz boş"}>
                    <p>{data?.tracks.length ? "Aramayı veya seçili konuyu temizleyerek yeniden bak." : "İlk paylaşımlar geldikçe yükselen şarkılar burada sıralanacak."}</p>
                    {data?.tracks.length ? (
                      <button type="button" onClick={() => { setQuery(""); setActiveTag(null); }} className="secondary-action mt-4 h-10 rounded-xl px-4 text-xs font-black">Filtreleri temizle</button>
                    ) : (
                      <Link href="/#feed-composer" className="secondary-action mt-4 inline-flex h-10 items-center rounded-xl px-4 text-xs font-black">Akışa şarkı bırak</Link>
                    )}
                  </ContentState>
                )}
              </div>
            </section>}

            {searchActive && (searchScope === "people" || (searchScope === "all" && visiblePeople.length > 0)) && (
              <section className="discover-people-results" aria-labelledby="people-results-title">
                <header>
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-100/70">Topluluk</p>
                    <h2 id="people-results-title" className="mt-1 text-xl font-bold text-white">Kullanıcı sonuçları</h2>
                  </div>
                  {searchScope === "all" ? (
                    <button type="button" onClick={() => setSearchScope("people")} className="discover-section-link">Tümünü gör</button>
                  ) : (
                    <span><UsersRound size={15} /> {data ? `${visiblePeople.length} sonuç` : "Sonuç sayısı bilinmiyor"}</span>
                  )}
                </header>
                <div className="discover-people-grid">
                  {(searchScope === "all" ? visiblePeople.slice(0, 4) : visiblePeople).map((person) => (
                    <Link key={person.id} href={`/u/${person.slug}`} className="discover-person-card">
                      <span className={`discover-person-avatar bg-gradient-to-br ${themeClasses[person.profileTheme] || themeClasses.aurora}`}>{person.ownerName.slice(0, 1).toUpperCase()}</span>
                      <span className="min-w-0">
                        <strong>{person.ownerName}</strong>
                        <small>{person.posts} paylaşım · {person.followers} takipçi</small>
                        <em>{person.reason}</em>
                      </span>
                    </Link>
                  ))}
                </div>
                {!loading && !loadError && visiblePeople.length === 0 && searchScope === "people" && (
                  <div className="discover-empty-state">
                    <span className="discover-empty-icon"><UserRound size={20} /></span>
                    <h3>Kullanıcı bulunamadı</h3>
                    <p>Farklı bir kullanıcı adıyla yeniden aramayı dene.</p>
                  </div>
                )}
              </section>
            )}

            {searchActive && (searchScope === "lists" || (searchScope === "all" && visibleLists.length > 0)) && (
              <section className="discover-list-results" aria-labelledby="list-results-title">
                <header>
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-100/70">Topluluk listeleri</p>
                    <h2 id="list-results-title" className="mt-1 text-xl font-bold text-white">Liste sonuçları</h2>
                  </div>
                  {searchScope === "all" ? (
                    <button type="button" onClick={() => setSearchScope("lists")} className="discover-section-link">Tümünü gör</button>
                  ) : (
                    <span><ListMusic size={15} /> {data ? `${visibleLists.length} sonuç` : "Sonuç sayısı bilinmiyor"}</span>
                  )}
                </header>
                <div className="discover-list-grid">
                  {(searchScope === "all" ? visibleLists.slice(0, 4) : visibleLists).map((list) => (
                    <Link key={list.id} href={`/u/${list.slug}`} className="discover-list-card">
                      <span className={`discover-list-icon bg-gradient-to-br ${themeClasses[list.profileTheme] || themeClasses.aurora}`}><ListMusic size={18} /></span>
                      <span className="min-w-0">
                        <strong>{list.name}</strong>
                        <small>{list.ownerName}</small>
                      </span>
                      <span className="discover-list-meta">{list.tracks} şarkı · {list.followers} takipçi</span>
                    </Link>
                  ))}
                </div>
                {!loading && !loadError && visibleLists.length === 0 && searchScope === "lists" && (
                  <div className="discover-empty-state">
                    <span className="discover-empty-icon"><ListMusic size={20} /></span>
                    <h3>Liste bulunamadı</h3>
                    <p>Liste adı veya sahibinin kullanıcı adıyla yeniden aramayı dene.</p>
                  </div>
                )}
              </section>
            )}
          </div>

          {showPeopleAside && <aside className="discover-curators lg:sticky lg:top-24" aria-labelledby="curators-title">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-100/70">{searchActive ? "Kullanıcı sonuçları" : "İnsanlar"}</p>
                <h2 id="curators-title" className="mt-1 text-lg font-black text-white">{searchActive ? `"${query.trim()}"` : "Aktif küratörler"}</h2>
              </div>
              <UserRound size={18} className="text-cyan-200/78" />
            </div>
            <div className="mt-4 grid gap-1.5">
              {(data?.curators ?? []).map((curator, index) => (
                <Link key={curator.id} href={`/u/${curator.slug}`} className="discover-curator-row">
                  <span className={`discover-curator-avatar bg-gradient-to-br ${themeClasses[curator.profileTheme] || themeClasses.aurora}`}>{curator.ownerName.slice(0, 1).toUpperCase()}</span>
                  <span className="min-w-0 flex-1"><span className="block truncate text-sm font-black text-white">{curator.ownerName}</span><span className="block truncate text-xs text-cyan-50/70">{curator.posts} paylaşım · {curator.adds} ekleme</span></span>
                  <span className="text-xs font-black text-cyan-100">#{index + 1}</span>
                </Link>
              ))}
              {!loading && !loadError && (data?.curators ?? []).length === 0 && <p className="py-4 text-sm leading-6 text-cyan-50/72">Aktif küratörler paylaşımlarla burada görünür.</p>}
            </div>
            {!searchActive && (data?.people ?? []).length > 0 && (
              <section className="discover-people-aside" aria-labelledby="people-aside-title">
                <div className="discover-people-aside-heading">
                  <div>
                    <p className="section-kicker">Müzikseverler</p>
                    <h3 id="people-aside-title">Yeni profiller keşfet</h3>
                  </div>
                  <UsersRound size={17} />
                </div>
                <div className="discover-people-aside-list">
                  {data!.people.slice(0, 4).map((person) => (
                    <Link key={person.id} href={`/u/${person.slug}`} className="discover-curator-row">
                      <span className={`discover-curator-avatar bg-gradient-to-br ${themeClasses[person.profileTheme] || themeClasses.aurora}`}>{person.ownerName.slice(0, 1).toLocaleUpperCase("tr-TR")}</span>
                      <span className="min-w-0 flex-1">
                        <strong>{person.ownerName}</strong>
                        <small>{person.reason}</small>
                      </span>
                      <span className="discover-person-arrow" aria-hidden="true">→</span>
                    </Link>
                  ))}
                </div>
              </section>
            )}
            {!searchActive && <Link href="/" className="secondary-action mt-5 flex h-11 items-center justify-center rounded-xl px-4 text-sm font-black"><Music2 size={16} /> Akışa dön</Link>}
          </aside>}
        </div>
      </section>
    </main>
  );
}
