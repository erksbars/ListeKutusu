"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Toast } from "./components/Toast";
import { ConfirmDialog } from "./components/ConfirmDialog";
import { FeedComposer } from "./components/FeedComposer";
import { FeedEmptyState } from "./components/FeedEmptyState";
import { FeedLoadSentinel } from "./components/FeedLoadSentinel";
import { FeedSkeletons } from "./components/FeedSkeletons";
import { LeaderboardSidebar } from "./components/LeaderboardSidebar";
import { FeedPostCard } from "./components/FeedPostCard";
import { FeedCommunityPulse } from "./components/FeedCommunityPulse";
import { HomeSidebar } from "./components/HomeSidebar";
import { MobileDock } from "./components/MobileDock";
import { GettingStarted, type OnboardingState } from "./components/GettingStarted";
import { DiscoverySession } from "./components/DiscoverySession";
import { HomeTopbar } from "./components/HomeTopbar";
import {
  FeedSectionHeader,
  isFeedScope,
  type FeedScope,
} from "./components/FeedSectionHeader";
import { FeedEditDialog, FeedReportDialog } from "./components/FeedPostDialogs";
import type { FeedPost } from "./hooks/feedTypes";
import { useFeedComposer } from "./hooks/useFeedComposer";
import { useFeedInteractions } from "./hooks/useFeedInteractions";
import { useFeedTopics } from "./hooks/useFeedTopics";
import { useInfiniteScroll } from "./hooks/useInfiniteScroll";
import { clearAccountSessionCache, loadAccountSession } from "@/lib/clientAccountSession";

const SIDEBAR_COLLAPSED_STORAGE_KEY = "listekutusu-sidebar-collapsed";
type Account = {
  id: string;
  slug: string;
  ownerName: string;
  email?: string | null;
  role?: string | null;
  onboarding?: OnboardingState;
};

type LeaderboardUser = {
  id: string;
  rank: number;
  ownerName: string;
  playlistName: string | null;
  spotifyExternalUrl: string | null;
  score: number;
  approved: number;
  rejected: number;
  socialLikes: number;
  socialAdds: number;
  total: number;
  approvalRate: number;
};

type Leaderboard = {
  rules: {
    socialLike?: number;
    socialAdd?: number;
  };
  period: {
    startsAt: string;
    label: string;
  };
  totals: {
    score: number;
    approved: number;
    rejected: number;
    socialLikes?: number;
    socialAdds?: number;
    participants: number;
  };
  users: LeaderboardUser[];
  tracks: {
    trackId: string;
    trackName: string;
    artistName: string;
    externalUrl: string | null;
    postId: string;
    adds: number;
    likes: number;
    rank: number;
  }[];
};

export default function HomePage() {
  const router = useRouter();
  const [account, setAccount] = useState<Account | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [leaderboard, setLeaderboard] = useState<Leaderboard | null>(null);
  const [feedPosts, setFeedPosts] = useState<FeedPost[]>([]);
  const [feedNextCursor, setFeedNextCursor] = useState<string | null>(null);
  const [feedPageLoading, setFeedPageLoading] = useState(true);
  const [feedLoadingMore, setFeedLoadingMore] = useState(false);
  const [feedLoadMoreError, setFeedLoadMoreError] = useState<string | null>(null);
  const [feedScope, setFeedScope] = useState<FeedScope>("all");
  const [feedEmptyReason, setFeedEmptyReason] = useState<string | null>(null);

  const currentRank = useMemo(() => {
    if (!account || !leaderboard) return null;
    return leaderboard.users.find((item) => item.id === account.id) ?? null;
  }, [account, leaderboard]);

  const { activeTopic: activeFeedTopic, setActiveTopic: setActiveFeedTopic,
    topics: feedTopics, visiblePosts: visibleFeedPosts } = useFeedTopics(feedPosts);

  const feedComposer = useFeedComposer({
    authenticated: Boolean(account),
    setFeedPosts,
    setMessage,
    onAuthRequired: () => router.push("/account?mode=login&next=%2F%23feed-composer"),
  });

  const loadFeed = useCallback(async (
    scope: FeedScope,
    options: { append?: boolean; cursor?: string | null } = {}
  ) => {
    const append = Boolean(options.append && options.cursor);
    if (append) {
      setFeedLoadingMore(true);
      setFeedLoadMoreError(null);
    } else {
      setFeedPageLoading(true);
      setFeedLoadMoreError(null);
    }

    try {
      const params = new URLSearchParams({ take: "10" });
      if (scope !== "all") params.set("scope", scope);
      if (append && options.cursor) params.set("cursor", options.cursor);

      const res = await fetch(`/api/feed?${params.toString()}`);
      const data = await res.json().catch(() => null);
      if (!res.ok || !Array.isArray(data?.posts)) {
        const errorMessage = data?.error || "Keşif akışı yüklenemedi.";
        if (append) setFeedLoadMoreError(errorMessage);
        else setMessage(errorMessage);
        return;
      }

      setFeedPosts((current) => {
        if (!append) return data.posts;
        const existingIds = new Set(current.map((post) => post.id));
        return [...current, ...data.posts.filter((post: FeedPost) => !existingIds.has(post.id))];
      });
      setFeedNextCursor(data.nextCursor ?? null);
      setFeedEmptyReason(data.emptyReason ?? null);
    } catch {
      const errorMessage = "Keşif akışına ulaşılamadı. Bağlantını kontrol edip tekrar dene.";
      if (append) setFeedLoadMoreError(errorMessage);
      else setMessage(errorMessage);
    } finally {
      if (append) setFeedLoadingMore(false);
      else setFeedPageLoading(false);
    }
  }, []);

  const feedLoadMoreRef = useInfiniteScroll({
    enabled: Boolean(feedNextCursor) && !feedLoadMoreError,
    loading: feedLoadingMore,
    onLoadMore: () => loadFeed(feedScope, { append: true, cursor: feedNextCursor }),
  });

  const {
    feedAddingIds,
    feedLikeBusyIds,
    feedFollowBusyIds,
    feedSaveBusyIds,
    deletePostId,
    deleteBusy,
    reportPostId,
    reportSubmitting,
    reportReason,
    reportDetails,
    activePostMenuId,
    editingPost,
    editSaving,
    feedDialogRef,
    setDeletePostId,
    setReportPostId,
    setReportReason,
    setReportDetails,
    setActivePostMenuId,
    setEditingPost,
    toggleFeedLike,
    toggleFeedSave,
    hideFeedPost,
    addFeedPostToList,
    toggleFeedAuthorFollow,
    deleteFeedPost,
    submitReport,
    savePostEdit,
  } = useFeedInteractions({
    account,
    feedScope,
    setFeedPosts,
    setMessage,
    loadFeed,
    loadLeaderboard,
    onAuthRequired: () => router.push("/account?mode=login"),
  });

  useEffect(() => {
    window.localStorage.removeItem("playlist_submitter_name");
    window.localStorage.removeItem("playlist_user_list_id");
    window.localStorage.removeItem("playlist_submit_code");

    const params = new URLSearchParams(window.location.search);
    const inviteCode = params.get("code")?.trim().toUpperCase() || "";
    if (inviteCode) {
      router.replace(`/suggest?code=${encodeURIComponent(inviteCode)}`);
      return;
    }

    const requestedScope = params.get("scope");
    if (requestedScope === "trending") setFeedScope("trending");

    loadAccountSession()
      .then((nextAccount) => {
        if (!nextAccount) return;
        setAccount(nextAccount as Account);
        if (isFeedScope(requestedScope)) setFeedScope(requestedScope);
      })
      .catch(() => null);

    if (params.get("list")) {
      setMessage("Bu eski liste bağlantısı artık kullanılmıyor. Liste sahibinden yeni davet bağlantısını iste.");
    }
    loadLeaderboard();
  }, [router]);

  useEffect(() => {
    try {
      setSidebarCollapsed(window.localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY) === "true");
    } catch {
      setSidebarCollapsed(false);
    }
  }, []);

  useEffect(() => {
    loadFeed(feedScope);
  }, [feedScope, loadFeed]);

  useEffect(() => {
    function syncScopeFromHistory() {
      const requested = new URLSearchParams(window.location.search).get("scope");
      const valid = isFeedScope(requested) ? requested : "all";
      const protectedScope = valid === "following" || valid === "personalized" || valid === "saved";
      setFeedScope(protectedScope && !account ? "all" : valid);
    }
    window.addEventListener("popstate", syncScopeFromHistory);
    return () => window.removeEventListener("popstate", syncScopeFromHistory);
  }, [account]);

  async function logoutAccount() {
    try {
      await fetch("/api/accounts/logout", { method: "POST" });
      clearAccountSessionCache();
      setAccount(null);
      setFeedScope("all");
      setMessage("Çıkış yapıldı.");
    } catch {
      setMessage("Çıkış işlemi tamamlanamadı. Bağlantını kontrol edip tekrar dene.");
    }
  }

  async function loadLeaderboard() {
    try {
      const res = await fetch("/api/leaderboard");
      const data = await res.json().catch(() => null);
      if (res.ok && data) setLeaderboard(data);
    } catch {
      // Liderlik alanı ikincildir; ana akışı kesintiye uğratmamalı.
    }
  }

  function selectFeedScope(scope: FeedScope) {
    if ((scope === "following" || scope === "personalized" || scope === "saved") && !account) {
      router.push("/account?mode=login");
      return;
    }
    setActiveFeedTopic(null);
    setFeedScope(scope);
    const url = new URL(window.location.href);
    if (scope !== "all") url.searchParams.set("scope", scope);
    else url.searchParams.delete("scope");
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  }

  function changeSidebarCollapsed(collapsed: boolean) {
    setSidebarCollapsed(collapsed);
    try {
      window.localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, String(collapsed));
    } catch {
      // Depolama kapalıysa tercih yalnız bu oturumda korunur.
    }
  }

  function openFeedComposer() {
    window.dispatchEvent(new Event("feed-composer:open"));
    document.getElementById("feed-composer")?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => document.getElementById("feed-track-search")?.focus(), 350);
  }

  return (
    <main id="main-content" tabIndex={-1} className="stage-shell min-h-screen bg-app text-white">
      <Toast message={message} onClose={() => setMessage(null)} />
      <ConfirmDialog
        open={Boolean(deletePostId)}
        title="Paylaşım silinsin mi?"
        body="Bu paylaşım akıştan ve profilinden kalıcı olarak kaldırılır. Bu işlem geri alınamaz."
        confirmLabel="Paylaşımı sil"
        tone="danger"
        busy={deleteBusy}
        onCancel={() => setDeletePostId(null)}
        onConfirm={deleteFeedPost}
      />
      <FeedReportDialog
        open={Boolean(reportPostId)}
        dialogRef={feedDialogRef}
        reason={reportReason}
        details={reportDetails}
        submitting={reportSubmitting}
        onReasonChange={setReportReason}
        onDetailsChange={setReportDetails}
        onCancel={() => setReportPostId(null)}
        onSubmit={submitReport}
      />
      <FeedEditDialog
        value={editingPost}
        dialogRef={feedDialogRef}
        saving={editSaving}
        onChange={setEditingPost}
        onCancel={() => setEditingPost(null)}
        onSave={savePostEdit}
      />
      <section className="home-app-shell desktop-density-comfortable relative min-h-screen w-full px-4 pb-28 sm:px-6 xl:pb-12">
        <HomeTopbar account={account} onLogout={() => void logoutAccount()} />
        <MobileDock authenticated={Boolean(account)} profileSlug={account?.slug} />
        <section
              id="main-feed"
              className={`home-grid mt-5 grid scroll-mt-24 items-start gap-5 ${
                sidebarCollapsed ? "home-grid-sidebar-collapsed" : ""
              }`}
            >
              <HomeSidebar
                authenticated={Boolean(account)}
                profileSlug={account?.slug}
                rank={currentRank?.rank}
                score={currentRank?.score}
                collapsed={sidebarCollapsed}
                onCollapsedChange={changeSidebarCollapsed}
                onMessage={setMessage}
              />
              <div className="min-w-0">
                <FeedSectionHeader
                  value={feedScope}
                  loading={feedPageLoading}
                  topics={feedTopics}
                  activeTopic={activeFeedTopic}
                  onChange={selectFeedScope}
                  onTopicChange={setActiveFeedTopic}
                  onRefresh={() => loadFeed(feedScope)}
                />

                {account?.onboarding && <GettingStarted initial={account.onboarding} />}

                <FeedComposer
                  account={account}
                  query={feedComposer.query}
                  results={feedComposer.results}
                  selectedTrack={feedComposer.selectedTrack}
                  note={feedComposer.note}
                  tags={feedComposer.tags}
                  searching={feedComposer.searching}
                  posting={feedComposer.posting}
                  onQueryChange={feedComposer.changeQuery}
                  onSelectTrack={feedComposer.selectTrack}
                  onClearTrack={feedComposer.clearTrack}
                  onNoteChange={feedComposer.setNote}
                  onTagsChange={feedComposer.setTags}
                  onSubmit={feedComposer.createPost}
                />
                <DiscoverySession authenticated={Boolean(account)} onMessage={setMessage} variant="feed" />
                <div
                  id="feed-posts"
                  role="tabpanel"
                  aria-live="polite"
                  aria-busy={feedPageLoading || feedLoadingMore}
                  aria-labelledby={`feed-tab-${feedScope}`}
                  className="mt-5 grid scroll-mt-24 gap-3"
                >
                  {feedPageLoading && <FeedSkeletons />}
                  {!feedPageLoading &&
                    visibleFeedPosts.map((post, index) => (
                      <div className="contents" key={post.id}>
                      <FeedPostCard
                        post={post}
                        tone={index % 3 === 1 ? "accent" : index % 3 === 2 ? "secondary" : "primary"}
                        liking={feedLikeBusyIds.includes(post.id)}
                        adding={feedAddingIds.includes(post.id)}
                        following={feedFollowBusyIds.includes(post.author.id)}
                        saving={feedSaveBusyIds.includes(post.id)}
                        menuOpen={activePostMenuId === post.id}
                        onToggleFollow={() => toggleFeedAuthorFollow(post.author.id)}
                        onAddToList={() => addFeedPostToList(post.id)}
                        onToggleLike={() => toggleFeedLike(post.id)}
                        onToggleSave={() => toggleFeedSave(post.id)}
                        onHide={() => hideFeedPost(post.id)}
                        onToggleMenu={() =>
                          setActivePostMenuId((current) =>
                            current === post.id ? null : post.id
                          )
                        }
                        onEdit={() => {
                          setEditingPost({
                            id: post.id,
                            note: post.note || "",
                            tags: post.tags.join(", "),
                          });
                          setActivePostMenuId(null);
                        }}
                        onDelete={() => {
                          setDeletePostId(post.id);
                          setActivePostMenuId(null);
                        }}
                        onReport={() => {
                          setReportPostId(post.id);
                          setActivePostMenuId(null);
                        }}
                      />
                      {index === 3 && !activeFeedTopic && ["all", "trending"].includes(feedScope) && <FeedCommunityPulse />}
                      </div>
                    ))}
                  {!feedPageLoading && feedPosts.length > 0 && visibleFeedPosts.length === 0 && (
                    <FeedEmptyState
                      scope={feedScope}
                      authenticated={Boolean(account)}
                      topicFiltered
                      onClearTopic={() => setActiveFeedTopic(null)}
                      onSelectAll={() => selectFeedScope("all")}
                      onCompose={openFeedComposer}
                    />
                  )}
                  {!feedPageLoading && feedPosts.length === 0 && (
                    <FeedEmptyState
                      scope={feedScope}
                      authenticated={Boolean(account)}
                      reason={feedEmptyReason}
                      onSelectAll={() => selectFeedScope("all")}
                      onCompose={openFeedComposer}
                    />
                  )}
                  {!feedPageLoading && feedNextCursor && (
                    <FeedLoadSentinel
                      sentinelRef={feedLoadMoreRef}
                      loading={feedLoadingMore}
                      error={feedLoadMoreError}
                      onRetry={() => loadFeed(feedScope, { append: true, cursor: feedNextCursor })}
                    />
                  )}
                </div>
              </div>
              <LeaderboardSidebar
                leaderboard={leaderboard}
                onRefresh={loadLeaderboard}
                authenticated={Boolean(account)}
              />
        </section>
      </section>
    </main>
  );
}
