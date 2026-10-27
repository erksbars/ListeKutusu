"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Toast } from "@/app/components/Toast";
import { ConfirmDialog } from "@/app/components/ConfirmDialog";
import { FeedComposer } from "@/app/components/FeedComposer";
import { FeedEmptyState } from "@/app/components/FeedEmptyState";
import { FeedLoadSentinel } from "@/app/components/FeedLoadSentinel";
import { FeedSkeletons } from "@/app/components/FeedSkeletons";
import { LeaderboardSidebar } from "@/app/components/LeaderboardSidebar";
import { FeedPostCard } from "@/app/components/FeedPostCard";
import { FeedCommunityPulse } from "@/app/components/FeedCommunityPulse";
import { CommunityFeedCard } from "@/app/components/CommunityFeedCard";
import { SelectField } from "@/app/components/ui/Field";
import { Button } from "@/app/components/ui/Button";
import { ContentState } from "@/app/components/ui/ContentState";
import { useHomeFeed } from "@/app/hooks/useHomeFeed";
import { compareTimelineItems } from "@/lib/feedTimelineOrder";
import { HomeCommunitySummary } from "@/app/components/HomeCommunitySummary";
import { MobileDock } from "@/app/components/MobileDock";
import { GettingStarted, type OnboardingState } from "@/app/components/GettingStarted";
import { DiscoverySession } from "@/app/components/DiscoverySession";
import { HomeTopbar } from "@/app/components/HomeTopbar";
import {
  FeedSectionHeader,
  type FeedScope,
} from "@/app/components/FeedSectionHeader";
import { FeedEditDialog, FeedReportDialog } from "@/app/components/FeedPostDialogs";
import { useFeedComposer } from "@/app/hooks/useFeedComposer";
import { useFeedInteractions } from "@/app/hooks/useFeedInteractions";
import { useFeedTopics } from "@/app/hooks/useFeedTopics";
import { useInfiniteScroll } from "@/app/hooks/useInfiniteScroll";
import { clearAccountSessionCache, loadAccountSession } from "@/lib/clientAccountSession";
import { useFeedAnchor, useFeedLocation } from "@/app/hooks/useFeedLocation";
import { feedLocationPath } from "@/lib/feedNavigation";
import { accountLoginPath } from "@/lib/navigation";

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
  const [leaderboard, setLeaderboard] = useState<Leaderboard | null>(null);
  const feedLocation = useFeedLocation();
  const { scope: feedScope, kind: feedKind, topic: activeFeedTopic } = feedLocation.value;
  const mixedScope = feedScope === "all" || feedScope === "following";
  const { feedPosts, setFeedPosts, communityItems, feedNextCursor, feedPageLoading, feedLoadingMore, feedLoadMoreError, feedLoadError, feedEmptyReason, loadFeed } = useHomeFeed({ scope: feedScope, filter: feedKind, viewerId: account?.id ?? null, enabled: feedLocation.ready });

  const currentRank = useMemo(() => {
    if (!account || !leaderboard) return null;
    return leaderboard.users.find((item) => item.id === account.id) ?? null;
  }, [account, leaderboard]);

  const { topics: feedTopics, visiblePosts: visibleFeedPosts } = useFeedTopics(feedPosts, activeFeedTopic);
  const setActiveFeedTopic = (topic: string | null) => feedLocation.update({ ...feedLocation.value, topic });
  const visibleTimeline = useMemo(() => {
    const music = visibleFeedPosts.map(post => ({ kind: "music" as const, id: post.id, createdAt: post.createdAt, post }));
    if (!mixedScope) return music;
    return [...(feedKind === "all" || feedKind === "music" ? music : []), ...communityItems].sort(compareTimelineItems);
  }, [visibleFeedPosts, mixedScope, feedKind, communityItems]);
  useFeedAnchor(feedPageLoading || !feedLocation.ready, visibleTimeline.map(item => `${item.kind}:${item.id}`).join(","));

  const feedComposer = useFeedComposer({
    authenticated: Boolean(account),
    setFeedPosts,
    setMessage,
    onAuthRequired: () => router.push(accountLoginPath(`${feedLocation.path}#feed-composer`)),
    onCreated: () => void loadFeed(feedScope),
  });

  const feedLoadMoreRef = useInfiniteScroll({
    enabled: Boolean(feedNextCursor) && !feedLoadMoreError && !feedPageLoading,
    loading: feedLoadingMore || feedPageLoading,
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
    onAuthRequired: () => router.push(accountLoginPath(feedLocation.path)),
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

    loadAccountSession()
      .then((nextAccount) => {
        if (!nextAccount) return;
        setAccount(nextAccount as Account);
      })
      .catch(() => null);

    if (params.get("list")) {
      setMessage("Bu eski liste bağlantısı artık kullanılmıyor. Liste sahibinden yeni davet bağlantısını iste.");
    }
    loadLeaderboard();
  }, [router]);

  async function logoutAccount() {
    try {
      await fetch("/api/accounts/logout", { method: "POST" });
      clearAccountSessionCache();
      setAccount(null);
      feedLocation.update({ scope: "all", kind: "all", topic: null });
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
      router.push(accountLoginPath(feedLocationPath({ scope, kind: "all", topic: null })));
      return;
    }
    feedLocation.update({ scope, kind: "all", topic: null });
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
        <HomeTopbar account={account} loginHref={accountLoginPath(feedLocation.path)} onLogout={() => void logoutAccount()} />
        <MobileDock authenticated={Boolean(account)} profileSlug={account?.slug} />
        <section
              id="main-feed"
              className="home-grid home-grid-unified mt-5 grid scroll-mt-24 items-start gap-5"
            >
              <div className="min-w-0">
                <FeedSectionHeader
                  value={feedScope}
                  loading={feedPageLoading}
                  topics={!mixedScope || feedKind === "music" ? feedTopics : []}
                  activeTopic={activeFeedTopic}
                  onChange={selectFeedScope}
                  onTopicChange={setActiveFeedTopic}
                  onRefresh={() => loadFeed(feedScope)}
                />

                {account?.onboarding && <GettingStarted initial={account.onboarding} />}
                {mixedScope ? <div className="feed-kind-toolbar mt-3"><SelectField label="Akış içerik türü" value={feedKind} onChange={event => feedLocation.update({ ...feedLocation.value, kind: event.target.value as typeof feedKind, topic: null })} hint="Etkinliklere katılmak için ilgili topluluğa üye olmalısın."><option value="all">Tüm içerikler</option><option value="music">Müzik</option><option value="discussion">Sohbetler</option><option value="review">İncelemeler</option><option value="event">Etkinlikler</option></SelectField></div> : <p className="mt-3 text-sm text-muted">Bu görünüm yalnız müzik paylaşımlarını kapsar. Topluluk içerikleri Yeni ve Takip akışındadır.</p>}

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
                <div
                  id="feed-posts"
                  role="tabpanel"
                  aria-live="polite"
                  aria-busy={feedPageLoading || feedLoadingMore}
                  aria-labelledby={`feed-tab-${feedScope}`}
                  className="mt-5 grid scroll-mt-24 gap-3"
                >
                  {feedPageLoading && <FeedSkeletons />}
                  {feedLoadError && <ContentState kind="error" title="Akış yüklenemedi" actions={<Button type="button" onClick={() => void loadFeed(feedScope)}>Akışı yeniden dene</Button>}><p>{feedLoadError}</p></ContentState>}
                  {!feedPageLoading &&
                    visibleTimeline.map((item, index) => {
                      if (item.kind !== "music") return <CommunityFeedCard key={`${item.kind}:${item.id}`} item={item} viewerId={account?.id ?? null} returnTo={feedLocation.path} />;
                      const post = item.post;
                      return <div className="contents" key={`music:${post.id}`}>
                      <FeedPostCard
                        post={post}
                        returnTo={feedLocation.path}
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
                    })}
                  {!feedPageLoading && !feedLoadError && feedPosts.length > 0 && visibleTimeline.length === 0 && (
                    <FeedEmptyState
                      scope={feedScope}
                      authenticated={Boolean(account)}
                      topicFiltered
                      onClearTopic={() => setActiveFeedTopic(null)}
                      onSelectAll={() => selectFeedScope("all")}
                      onCompose={openFeedComposer}
                    />
                  )}
                  {!feedPageLoading && !feedLoadError && feedPosts.length === 0 && visibleTimeline.length === 0 && (
                    <FeedEmptyState
                      scope={feedScope}
                      authenticated={Boolean(account)}
                      reason={mixedScope && feedKind !== "all" ? "Seçtiğin türde görünür içerik yok. Başka bir tür seçebilir veya toplulukları keşfedebilirsin." : feedEmptyReason}
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
              <div className="home-context-rail grid min-w-0 gap-4">
                <DiscoverySession authenticated={Boolean(account)} onMessage={setMessage} />
                <HomeCommunitySummary authenticated={Boolean(account)} rank={currentRank?.rank} score={currentRank?.score} onMessage={setMessage} />
                <LeaderboardSidebar
                leaderboard={leaderboard}
                onRefresh={loadLeaderboard}
                authenticated={Boolean(account)}
              />
              </div>
        </section>
      </section>
    </main>
  );
}
