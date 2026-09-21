"use client";

import Link from "next/link";
import { FormEvent, KeyboardEvent as ReactKeyboardEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  AudioWaveform,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Eye,
  GraduationCap,
  Guitar,
  Headphones,
  LockKeyhole,
  LogIn,
  MessageSquareText,
  Music2,
  Plus,
  RefreshCcw,
  Search,
  SlidersHorizontal,
  UsersRound,
  UserRound,
  X,
} from "lucide-react";
import {
  FORUM_CATEGORY_GROUPS,
  forumCategoryGroup,
  forumCategoryIdsForFilter,
  forumCategoryLabel,
} from "@/lib/forum";
import { AccountMenu } from "@/app/components/AccountMenu";
import { MobileDock } from "@/app/components/MobileDock";
import { ProfileSearch } from "@/app/components/ProfileSearch";
import { PageTopbar } from "@/app/components/PageTopbar";
import { useSessionNavigation } from "@/app/hooks/useSessionNavigation";
import { loadAccountSession } from "@/lib/clientAccountSession";

type ForumThread = {
  id: string;
  slug: string;
  category: string;
  title: string;
  excerpt: string;
  views: number;
  createdAt: string;
  lastActivityAt: string;
  locked: boolean;
  solved: boolean;
  status: "published" | "pending" | "rejected";
  replyCount: number;
  author: { ownerName: string; slug: string; profileTheme: string };
  latestReply: { createdAt: string; author: { ownerName: string } } | null;
};

type DirectoryCategory = {
  id: string;
  label: string;
  description: string;
  threadCount: number;
  replyCount: number;
  latestThread: {
    slug: string;
    title: string;
    lastActivityAt: string;
    authorName: string;
    solved: boolean;
  } | null;
};

type DirectoryGroup = {
  id: string;
  label: string;
  description: string;
  categories: DirectoryCategory[];
};

type RecentThread = {
  id: string;
  slug: string;
  category: string;
  title: string;
  lastActivityAt: string;
  replyCount: number;
  solved: boolean;
};

type ForumSummary = {
  threadCount: number;
  replyCount: number;
  solvedCount: number;
};

type Pagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

type Account = {
  ownerName: string;
  email?: string | null;
  slug: string;
  role?: string | null;
} | null;

const dateFormatter = new Intl.DateTimeFormat("tr-TR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

const groupIcons = {
  muzik: Music2,
  enstrumanlar: Guitar,
  produksiyon: AudioWaveform,
  ekipman: Headphones,
  ogrenme: GraduationCap,
  topluluk: UsersRound,
} as const;

const validSorts = new Set(["latest", "popular", "unanswered"]);
const validStates = new Set(["all", "open", "solved"]);
const stateFilters = [
  ["all", "Tümü"],
  ["open", "Açık"],
  ["solved", "Çözüldü"],
] as const;

function formatActivity(value: string) {
  const timestamp = new Date(value).getTime();
  const elapsedMinutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60_000));
  if (elapsedMinutes < 1) return "Az önce";
  if (elapsedMinutes < 60) return `${elapsedMinutes} dk önce`;
  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) return `${elapsedHours} sa önce`;
  const elapsedDays = Math.floor(elapsedHours / 24);
  if (elapsedDays < 7) return `${elapsedDays} gün önce`;
  return dateFormatter.format(new Date(value));
}

function forumFilterGroupId(value: string) {
  return FORUM_CATEGORY_GROUPS.find((group) => group.id === value)?.id
    || forumCategoryGroup(value).id;
}

export default function ForumPage() {
  const { logoutToHome } = useSessionNavigation();
  const [threads, setThreads] = useState<ForumThread[]>([]);
  const [directory, setDirectory] = useState<DirectoryGroup[]>([]);
  const [recentThreads, setRecentThreads] = useState<RecentThread[]>([]);
  const [summary, setSummary] = useState<ForumSummary>({ threadCount: 0, replyCount: 0, solvedCount: 0 });
  const [pagination, setPagination] = useState<Pagination>({ page: 1, pageSize: 20, total: 0, totalPages: 1 });
  const [category, setCategory] = useState("");
  const [expandedGroup, setExpandedGroup] = useState("muzik");
  const [sort, setSort] = useState("latest");
  const [state, setState] = useState<"all" | "open" | "solved">("all");
  const [mine, setMine] = useState(false);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [filtersReady, setFiltersReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [account, setAccount] = useState<Account>(null);

  const directorySource = useMemo<DirectoryGroup[]>(() => {
    if (directory.length) return directory;
    return FORUM_CATEGORY_GROUPS.map((group) => ({
      id: group.id,
      label: group.label,
      description: group.description,
      categories: group.categories.map((item) => ({
        ...item,
        threadCount: 0,
        replyCount: 0,
        latestThread: null,
      })),
    }));
  }, [directory]);

  const loadThreads = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ sort, page: String(page) });
      if (category) params.set("category", category);
      if (search) params.set("q", search);
      if (state !== "all") params.set("state", state);
      if (mine) params.set("mine", "1");
      const response = await fetch(`/api/forum?${params.toString()}`);
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error || "Forum yüklenemedi.");
      setThreads(data.threads || []);
      setDirectory(data.directory || []);
      setRecentThreads(data.recentThreads || []);
      setSummary(data.summary || { threadCount: 0, replyCount: 0, solvedCount: 0 });
      setPagination(data.pagination || { page, pageSize: 20, total: 0, totalPages: 1 });
      if (data.pagination?.totalPages && page > data.pagination.totalPages) {
        setPage(data.pagination.totalPages);
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Forum yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }, [category, mine, page, search, sort, state]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const nextCategory = params.get("category")?.trim() || "";
    if (nextCategory && forumCategoryIdsForFilter(nextCategory).length) {
      setCategory(nextCategory);
      setExpandedGroup(forumFilterGroupId(nextCategory));
    }
    const nextSort = params.get("sort") || "latest";
    if (validSorts.has(nextSort)) setSort(nextSort);
    const nextState = params.get("state") || "all";
    if (validStates.has(nextState)) setState(nextState as "all" | "open" | "solved");
    setMine(params.get("mine") === "1");
    const nextSearch = params.get("q")?.trim().slice(0, 80) || "";
    setQuery(nextSearch);
    setSearch(nextSearch);
    const nextPage = Number.parseInt(params.get("page") || "1", 10);
    setPage(Number.isFinite(nextPage) ? Math.max(1, nextPage) : 1);
    setFiltersReady(true);
  }, []);

  useEffect(() => {
    if (!filtersReady) return;
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (search) params.set("q", search);
    if (sort !== "latest") params.set("sort", sort);
    if (state !== "all") params.set("state", state);
    if (mine) params.set("mine", "1");
    if (page > 1) params.set("page", String(page));
    const queryString = params.toString();
    window.history.replaceState(null, "", queryString ? `/forum?${queryString}` : "/forum");
    void loadThreads();
  }, [filtersReady, loadThreads, category, search, sort, state, mine, page]);

  useEffect(() => {
    loadAccountSession()
      .then((nextAccount) => setAccount(nextAccount))
      .catch(() => null);
  }, []);

  async function logoutAccount() {
    try {
      await logoutToHome();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Çıkış işlemi tamamlanamadı.");
    }
  }

  function submitSearch(event: FormEvent) {
    event.preventDefault();
    setPage(1);
    setSearch(query.trim());
  }

  function selectCategory(nextCategory: string, groupId?: string) {
    setCategory(nextCategory);
    setPage(1);
    if (groupId) setExpandedGroup(groupId);
  }

  function clearFilters() {
    setCategory("");
    setQuery("");
    setSearch("");
    setSort("latest");
    setState("all");
    setMine(false);
    setPage(1);
  }

  function handleStateKeyDown(event: ReactKeyboardEvent<HTMLButtonElement>, current: typeof state) {
    const currentIndex = stateFilters.findIndex(([value]) => value === current);
    let nextIndex = currentIndex;
    if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % stateFilters.length;
    else if (event.key === "ArrowLeft") nextIndex = (currentIndex - 1 + stateFilters.length) % stateFilters.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = stateFilters.length - 1;
    else return;
    event.preventDefault();
    const nextState = stateFilters[nextIndex][0];
    setState(nextState);
    setPage(1);
    event.currentTarget.parentElement
      ?.querySelector<HTMLButtonElement>(`[data-forum-state="${nextState}"]`)
      ?.focus();
  }

  function changePage(nextPage: number) {
    setPage(Math.min(pagination.totalPages, Math.max(1, nextPage)));
    window.requestAnimationFrame(() => {
      document.getElementById("forum-thread-panel")?.scrollIntoView({ block: "start" });
    });
  }

  const selectedLabel = category
    ? FORUM_CATEGORY_GROUPS.find((group) => group.id === category)?.label || forumCategoryLabel(category)
    : "Tüm konular";
  const activeGroup = category
    ? FORUM_CATEGORY_GROUPS.find((group) => group.id === category) || forumCategoryGroup(category)
    : FORUM_CATEGORY_GROUPS.find((group) => group.id === expandedGroup) || FORUM_CATEGORY_GROUPS[0];
  const hasActiveFilters = Boolean(category || search || state !== "all" || sort !== "latest" || mine);

  return (
    <main id="main-content" tabIndex={-1} className="stage-shell min-h-screen bg-app px-3 pb-24 text-white sm:px-6">
      <MobileDock authenticated={Boolean(account)} profileSlug={account?.slug} active="forum" />
      <section className="ui-page-frame relative mx-auto">
        <PageTopbar
          title="Müzik forumu"
          subtitle="Sor, deneyimini paylaş, birlikte çöz"
          icon={<MessageSquareText size={19} />}
          backLabel="Ana akışa dön"
          showPrimaryNavigation
          actions={<>
            <div className="hidden lg:block"><ProfileSearch /></div>
            <Link
              href={account ? "/forum/new" : "/account?mode=login&next=/forum/new"}
              className="topbar-primary-button"
              aria-label="Yeni konu"
              title="Yeni konu"
            >
              <Plus size={17} /><span className="hidden sm:inline">Yeni konu</span>
            </Link>
            {account ? (
              <AccountMenu
                ownerName={account.ownerName}
                email={account.email}
                profileSlug={account.slug}
                role={account.role}
                onLogout={() => void logoutAccount()}
              />
            ) : (
              <Link href="/account?mode=login&next=/forum" className="topbar-text-button" aria-label="Giriş yap">
                <LogIn size={16} /><span className="hidden sm:inline">Giriş yap</span>
              </Link>
            )}
          </>}
        />

        <div className="forum-mobile-filter-shell lg:hidden">
          <nav className="forum-mobile-groups" aria-label="Forum bölümleri">
            <button type="button" onClick={() => selectCategory("")} aria-pressed={!category} className={!category ? "active" : ""}>Tümü</button>
            {FORUM_CATEGORY_GROUPS.map((group) => (
              <button
                key={group.id}
                type="button"
                onClick={() => selectCategory(group.id, group.id)}
                aria-pressed={Boolean(category && forumFilterGroupId(category) === group.id)}
                className={category && forumFilterGroupId(category) === group.id ? "active" : ""}
              >
                {group.label}
              </button>
            ))}
          </nav>
          {category && (
            <nav className="forum-mobile-subcategories" aria-label={`${activeGroup.label} alt forumları`}>
              <button type="button" onClick={() => selectCategory(activeGroup.id, activeGroup.id)} aria-pressed={category === activeGroup.id} className={category === activeGroup.id ? "active" : ""}>
                Tüm bölüm
              </button>
              {activeGroup.categories.map((item) => (
                <button key={item.id} type="button" onClick={() => selectCategory(item.id, activeGroup.id)} aria-pressed={category === item.id} className={category === item.id ? "active" : ""}>
                  {item.label}
                </button>
              ))}
            </nav>
          )}
        </div>

        <div className="forum-workspace">
          <aside className="forum-navigation-panel">
            <div className="forum-navigation-heading">
              <div>
                <p className="section-kicker">Bölümler</p>
                <h2>Konu alanları</h2>
              </div>
              <span>{summary.threadCount}</span>
            </div>
            <button type="button" onClick={() => selectCategory("")} aria-pressed={!category} className={`forum-nav-all ${!category ? "active" : ""}`}>
              <MessageSquareText size={16} />
              <span><strong>Tüm forum</strong><small>Son tartışmaları göster</small></span>
            </button>
            <div className="forum-nav-groups">
              {directorySource.map((group) => {
                const Icon = groupIcons[group.id as keyof typeof groupIcons] || Music2;
                const groupThreadCount = group.categories.reduce((total, item) => total + item.threadCount, 0);
                const groupActive = category && forumFilterGroupId(category) === group.id;
                const groupExpanded = expandedGroup === group.id;
                return (
                  <div key={group.id} className="forum-nav-group">
                    <button
                      type="button"
                      onClick={() => selectCategory(group.id, group.id)}
                      className={`forum-nav-group-button ${groupActive ? "active" : ""}`}
                      aria-expanded={groupExpanded}
                      aria-pressed={Boolean(groupActive)}
                    >
                      <Icon size={16} />
                      <span><strong>{group.label}</strong><small>{groupThreadCount} konu</small></span>
                      <ChevronRight size={14} />
                    </button>
                    {groupExpanded && (
                      <div className="forum-nav-subcategories">
                        {group.categories.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => selectCategory(item.id, group.id)}
                            aria-pressed={category === item.id}
                            className={category === item.id ? "active" : ""}
                          >
                            <span>{item.label}</span>
                            <small>{item.threadCount}</small>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </aside>

          <div className="forum-main-column">
            <section className="forum-toolbar">
              <form onSubmit={submitSearch} className="forum-search">
                <Search size={17} aria-hidden="true" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value.slice(0, 80))}
                  placeholder="Başlık veya içerikte ara"
                  aria-label="Forumda ara"
                />
                {(query || search) && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery("");
                      setSearch("");
                      setPage(1);
                    }}
                    aria-label="Aramayı temizle"
                    title="Aramayı temizle"
                  >
                    <X size={15} />
                  </button>
                )}
              </form>
              <label className="forum-sort">
                <SlidersHorizontal size={16} aria-hidden="true" />
                <select
                  value={sort}
                  onChange={(event) => {
                    setSort(event.target.value);
                    setPage(1);
                  }}
                  aria-label="Konu sıralaması"
                >
                  <option value="latest">Son hareket</option>
                  <option value="popular">En çok görüntülenen</option>
                  <option value="unanswered">Yanıt bekleyen</option>
                </select>
              </label>
            </section>

            <div className="forum-filter-row">
              <div className="forum-state-filter" role="tablist" aria-label="Konu durumu">
                {stateFilters.map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    role="tab"
                    aria-selected={state === value}
                    aria-controls="forum-thread-panel"
                    tabIndex={state === value ? 0 : -1}
                    data-forum-state={value}
                    onKeyDown={(event) => handleStateKeyDown(event, value)}
                    onClick={() => {
                      setState(value);
                      setPage(1);
                    }}
                    className={state === value ? "active" : ""}
                  >
                    {value === "solved" && <CheckCircle2 size={14} aria-hidden="true" />}
                    {label}
                  </button>
                ))}
              </div>
              {account && (
                <button
                  type="button"
                  aria-pressed={mine}
                  onClick={() => {
                    setMine((current) => !current);
                    setState("all");
                    setPage(1);
                  }}
                  className={mine ? "forum-mine-filter active" : "forum-mine-filter"}
                >
                  <UserRound size={14} /> Konularım
                </button>
              )}
              {hasActiveFilters && (
                <button type="button" onClick={clearFilters} className="forum-clear-filters">
                  <X size={14} /> Filtreleri temizle
                </button>
              )}
            </div>

            <section id="forum-thread-panel" role="tabpanel" aria-busy={loading} className="forum-thread-list scroll-mt-24">
              <header className="forum-thread-list-header">
                <div>
                  <p>{selectedLabel}</p>
                  <h2>{search ? `"${search}" için sonuçlar` : mine ? "Gönderdiğin konular" : category ? "Bölümdeki konular" : "Güncel tartışmalar"}</h2>
                </div>
                <span aria-live="polite">{loading ? "Yükleniyor" : `${pagination.total} konu`}</span>
              </header>

              {loading && (
                <div role="status" aria-live="polite" aria-label="Konular yükleniyor">
                  {Array.from({ length: 7 }).map((_, index) => (
                    <div key={index} className="forum-thread-skeleton" aria-hidden="true">
                      <span />
                      <div><i /><i /><i /></div>
                      <b />
                    </div>
                  ))}
                </div>
              )}

              {!loading && error && (
                <div className="forum-state-message forum-state-message-error" role="alert">
                  <RefreshCcw size={24} />
                  <strong>Konular alınamadı</strong>
                  <p>{error}</p>
                  <button type="button" onClick={() => void loadThreads()} className="secondary-action">Tekrar dene</button>
                </div>
              )}

              {!loading && !error && threads.length === 0 && (
                <div className="forum-state-message">
                  <MessageSquareText size={25} />
                  <strong>{hasActiveFilters ? "Bu ölçütlere uyan konu yok" : "Forum henüz sessiz"}</strong>
                  <p>{hasActiveFilters ? "Filtreleri değiştirerek daha fazla tartışma görebilirsin." : "İlk soruyu göndererek topluluğu başlatabilirsin."}</p>
                  {hasActiveFilters ? (
                    <button type="button" onClick={clearFilters} className="secondary-action">Tüm konuları göster</button>
                  ) : (
                    <Link href="/forum/new" className="topbar-primary-button"><Plus size={15} />Konu aç</Link>
                  )}
                </div>
              )}

              {!loading && !error && threads.map((thread) => (
                <article key={thread.id} className="forum-thread-row">
                  <Link href={`/u/${thread.author.slug}`} className="nav-avatar forum-thread-avatar" title={thread.author.ownerName}>
                    {thread.author.ownerName.slice(0, 1).toUpperCase()}
                  </Link>
                  <div className="forum-thread-copy">
                    <div className="forum-thread-labels">
                      <button type="button" onClick={() => selectCategory(thread.category, forumFilterGroupId(thread.category))} className="forum-category-badge">
                        {forumCategoryLabel(thread.category)}
                      </button>
                      {thread.solved && <span className="forum-solved-badge"><CheckCircle2 size={13} /> Çözüldü</span>}
                      {thread.locked && <span className="forum-locked-badge"><LockKeyhole size={12} /> Kilitli</span>}
                      {thread.status === "pending" && <span className="forum-review-badge forum-review-pending"><Clock3 size={12} /> Onay bekliyor</span>}
                      {thread.status === "rejected" && <span className="forum-review-badge forum-review-rejected"><X size={12} /> Yayınlanmadı</span>}
                    </div>
                    <Link href={`/forum/${thread.slug}`} className="forum-thread-title">
                      {thread.title}
                    </Link>
                    <p className="forum-thread-excerpt">{thread.excerpt}</p>
                    <p className="forum-thread-meta">
                      <Link href={`/u/${thread.author.slug}`}>{thread.author.ownerName}</Link>
                      <span>·</span>
                      <time dateTime={thread.lastActivityAt} title={dateFormatter.format(new Date(thread.lastActivityAt))}>
                        {formatActivity(thread.lastActivityAt)}
                      </time>
                      {thread.latestReply && (
                        <>
                          <span>·</span>
                          <span className="forum-thread-latest-author">Son yanıt: {thread.latestReply.author.ownerName}</span>
                        </>
                      )}
                    </p>
                  </div>
                  <div className="forum-thread-stats">
                    <span><MessageSquareText size={14} /><strong>{thread.replyCount}</strong><small>yanıt</small></span>
                    <span><Eye size={14} /><strong>{thread.views}</strong><small>görüntüleme</small></span>
                  </div>
                </article>
              ))}

              {!loading && !error && pagination.totalPages > 1 && (
                <footer className="forum-pagination" aria-label="Forum sayfaları">
                  <button type="button" onClick={() => changePage(page - 1)} disabled={page <= 1}>
                    <ChevronLeft size={16} /> Önceki
                  </button>
                  <span aria-live="polite"><strong>{pagination.page}</strong> / {pagination.totalPages}</span>
                  <button type="button" onClick={() => changePage(page + 1)} disabled={page >= pagination.totalPages}>
                    Sonraki <ChevronRight size={16} />
                  </button>
                </footer>
              )}
            </section>
          </div>

          <aside className="forum-context-rail">
            <section className="forum-side-panel forum-summary-panel">
              <p className="section-kicker">Topluluk özeti</p>
              <h2>Forum bugün açık</h2>
              <div className="forum-summary-list">
                <span><strong>{summary.threadCount}</strong><small>yayınlanan konu</small></span>
                <span><strong>{summary.replyCount}</strong><small>toplam yanıt</small></span>
                <span><strong>{summary.solvedCount}</strong><small>çözülen konu</small></span>
              </div>
              <Link href="/forum/new" className="topbar-primary-button mt-4 w-full justify-center"><Plus size={16} />Konu aç</Link>
            </section>

            <section className="forum-side-panel">
              <p className="section-kicker">Son hareketler</p>
              <h2>Yeni tartışmalar</h2>
              <div className="forum-recent-list">
                {recentThreads.map((thread) => (
                  <Link key={thread.id} href={`/forum/${thread.slug}`} className="forum-side-topic">
                    <strong>
                      {thread.solved && <CheckCircle2 size={13} aria-label="Çözüldü" />}
                      {thread.title}
                    </strong>
                    <small>{forumCategoryLabel(thread.category)} · {thread.replyCount} yanıt · {formatActivity(thread.lastActivityAt)}</small>
                  </Link>
                ))}
                {!loading && recentThreads.length === 0 && <p>Henüz yayınlanmış konu yok.</p>}
              </div>
            </section>

            <p className="forum-moderation-note"><Clock3 size={14} />Yeni konular moderatör onayından sonra yayınlanır.</p>
          </aside>
        </div>
      </section>
    </main>
  );
}
