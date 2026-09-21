"use client";

import Link from "next/link";
import { KeyboardEvent as ReactKeyboardEvent, useCallback, useEffect, useRef, useState } from "react";
import { Activity, Award, Gamepad2, LogIn, MoreHorizontal, Music2, Settings2, Share2, ShieldBan, UserPlus, UserRound } from "lucide-react";
import { Toast } from "@/app/components/Toast";
import { ConfirmDialog } from "@/app/components/ConfirmDialog";
import { AccountMenu } from "@/app/components/AccountMenu";
import { MobileDock } from "@/app/components/MobileDock";
import { PageTopbar } from "@/app/components/PageTopbar";
import { FeedLoadSentinel } from "@/app/components/FeedLoadSentinel";
import { ProfileTabPanels } from "@/app/components/profile/ProfileTabPanels";
import { ProfileHeroV3 } from "@/app/components/profile/ProfileHeroV3";
import { ProfileIdentityRail } from "@/app/components/profile/ProfileIdentityRail";
import { useInfiniteScroll } from "@/app/hooks/useInfiniteScroll";
import { useSessionNavigation } from "@/app/hooks/useSessionNavigation";
import type { ConnectionUser, Profile, ProfileTab, ViewerAccount } from "@/app/(social)/u/[slug]/profileTypes";


const profileTabs = [
  ["posts", "Vitrin", Music2],
  ["activity", "Aktivite", Activity],
  ["about", "Hakkında", UserRound],
  ["achievements", "Rozetler", Award],
] as const;

type ProfileClientProps = {
  slug: string;
  initialProfile: Profile;
  initialViewer: ViewerAccount | null;
};

export default function ProfileClient({ slug, initialProfile, initialViewer }: ProfileClientProps) {
  const { goToLogin, logoutToHome } = useSessionNavigation();
  const [profile, setProfile] = useState<Profile | null>(initialProfile);
  const [message, setMessage] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [connectionType, setConnectionType] = useState<"followers" | "following" | null>(null);
  const [connectionUsers, setConnectionUsers] = useState<ConnectionUser[]>([]);
  const [connectionsLoading, setConnectionsLoading] = useState(false);
  const [connectionsError, setConnectionsError] = useState<string | null>(null);
  const [connectionsCursor, setConnectionsCursor] = useState<string | null>(null);
  const [confirmBlock, setConfirmBlock] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [profileTab, setProfileTab] = useState<ProfileTab>("posts");
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsError, setPostsError] = useState<string | null>(null);
  const viewer = initialViewer;
  const connectionsDialogRef = useRef<HTMLElement>(null);
  const connectionsCloseRef = useRef<HTMLButtonElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const loadMorePosts = useCallback(async () => {
    if (!profile?.nextPostCursor || postsLoading) return;
    setPostsLoading(true);
    setPostsError(null);
    try {
      const params = new URLSearchParams({
        slug,
        cursor: profile.nextPostCursor,
      });
      const res = await fetch(`/api/profiles/posts?${params.toString()}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !Array.isArray(data.posts)) {
        setPostsError(data.error || "Paylaşımlar yüklenemedi.");
        return;
      }
      setProfile((current) => current ? {
        ...current,
        posts: [
          ...current.posts,
          ...data.posts.filter(
            (post: Profile["posts"][number]) =>
              !current.posts.some((currentPost) => currentPost.id === post.id)
          ),
        ],
        nextPostCursor: data.nextCursor ?? null,
      } : current);
    } catch {
      setPostsError("Paylaşımlar yüklenirken bağlantı kesildi.");
    } finally {
      setPostsLoading(false);
    }
  }, [postsLoading, profile?.nextPostCursor, slug]);

  const postsSentinelRef = useInfiniteScroll({
    enabled: profileTab === "posts" && Boolean(profile?.nextPostCursor) && !postsError,
    loading: postsLoading,
    onLoadMore: loadMorePosts,
  });

  const connectionsSentinelRef = useInfiniteScroll({
    enabled: Boolean(connectionType && connectionsCursor) && !connectionsError,
    loading: connectionsLoading,
    onLoadMore: () => {
      if (connectionType && connectionsCursor) {
        void loadConnections(connectionType, connectionsCursor, true);
      }
    },
  });

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch(`/api/profiles?slug=${encodeURIComponent(slug)}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.profile) {
        setLoadError(data.error || "Profil bulunamadı.");
        setProfile(null);
        return;
      }
      setProfile(data.profile);
    } catch {
      setLoadError("Profil yüklenirken bağlantı kesildi. Lütfen tekrar dene.");
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    setProfile(initialProfile);
    setLoadError(null);
    setLoading(false);
    setPostsError(null);
    setPostsLoading(false);
  }, [initialProfile]);

  useEffect(() => {
    const requestedTab = new URLSearchParams(window.location.search).get("tab");
    if (requestedTab === "posts" || requestedTab === "activity" || requestedTab === "about" || requestedTab === "achievements") {
      setProfileTab(requestedTab);
    }
  }, []);

  useEffect(() => {
    if (!connectionType) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    connectionsCloseRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setConnectionType(null);
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = connectionsDialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled])'
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [connectionType]);

  useEffect(() => {
    if (!profileMenuOpen) return;

    function closeMenu(event: MouseEvent) {
      if (!profileMenuRef.current?.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    }

    function closeWithEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setProfileMenuOpen(false);
    }

    document.addEventListener("mousedown", closeMenu);
    document.addEventListener("keydown", closeWithEscape);
    return () => {
      document.removeEventListener("mousedown", closeMenu);
      document.removeEventListener("keydown", closeWithEscape);
    };
  }, [profileMenuOpen]);

  async function toggleFollow() {
    if (!profile || profile.isMe || busy) return;
    setBusy(true);
    try {
    const res = await fetch("/api/profiles/follow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileId: profile.id }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401) {
      goToLogin(`/u/${slug}`);
      return;
    }
    if (!res.ok) {
      setMessage(data.error || "Takip işlemi tamamlanamadı.");
      return;
    }
    setProfile((current) =>
      current
        ? { ...current, following: data.following, followerCount: data.followerCount }
        : current
    );
    setMessage(data.following ? "Profil takip edildi." : "Takip bırakıldı.");
    } catch {
      setMessage("Takip işlemi doğrulanamadı. Bağlantını kontrol edip tekrar dene.");
    } finally {
      setBusy(false);
    }
  }

  async function loadConnections(
    type: "followers" | "following",
    cursor: string | null = null,
    append = false
  ) {
    if (connectionsLoading) return;
    setConnectionsLoading(true);
    setConnectionsError(null);
    const params = new URLSearchParams({ slug, type });
    if (cursor) params.set("cursor", cursor);
    try {
      const res = await fetch(
        `/api/profiles/connections?${params.toString()}`
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setConnectionsError(data.error || "Kullanıcılar yüklenemedi.");
        return;
      }
      const nextUsers = Array.isArray(data.users) ? data.users : [];
      setConnectionUsers((current) => append
        ? [...current, ...nextUsers.filter(
            (user: ConnectionUser) => !current.some((item) => item.id === user.id)
          )]
        : nextUsers);
      setConnectionsCursor(data.nextCursor ?? null);
    } catch {
      setConnectionsError("Kullanıcılar yüklenirken bağlantı kesildi.");
    } finally {
      setConnectionsLoading(false);
    }
  }

  function openConnections(type: "followers" | "following") {
    setConnectionType(type);
    setConnectionUsers([]);
    setConnectionsCursor(null);
    setConnectionsError(null);
    void loadConnections(type);
  }

  async function toggleBlock() {
    if (!profile || profile.isMe || busy) return;
    setBusy(true);
    try {
    const res = await fetch("/api/profiles/block", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileId: profile.id }),
    });
    const data = await res.json().catch(() => ({}));
    setConfirmBlock(false);
    if (res.status === 401) {
      goToLogin(`/u/${slug}`);
      return;
    }
    if (!res.ok) {
      setMessage(data.error || "Engelleme işlemi tamamlanamadı.");
      return;
    }
    setMessage(data.blocked ? "Kullanıcı engellendi." : "Kullanıcı engeli kaldırıldı.");
    await loadProfile();
    } catch {
      setMessage("Engelleme işlemi doğrulanamadı. Bağlantını kontrol edip tekrar dene.");
    } finally {
      setBusy(false);
    }
  }

  async function logoutViewer() {
    try {
      await logoutToHome();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Çıkış işlemi tamamlanamadı.");
    }
  }

  async function copyProfileLink() {
    if (!profile) return;
    const profileUrl = `${window.location.origin}/u/${profile.slug}`;
    try {
      await navigator.clipboard.writeText(profileUrl);
      setMessage("Profil bağlantısı kopyalandı.");
    } catch {
      const input = document.createElement("textarea");
      input.value = profileUrl;
      input.style.position = "fixed";
      input.style.opacity = "0";
      document.body.appendChild(input);
      input.select();
      const copied = document.execCommand("copy");
      input.remove();
      setMessage(copied ? "Profil bağlantısı kopyalandı." : "Profil bağlantısı kopyalanamadı.");
    }
  }

  function selectProfileTab(value: ProfileTab) {
    setProfileTab(value);
    const url = new URL(window.location.href);
    if (value === "posts") url.searchParams.delete("tab");
    else url.searchParams.set("tab", value);
    window.history.replaceState(null, "", `${url.pathname}${url.search}`);
  }

  function handleProfileTabKeyDown(event: ReactKeyboardEvent<HTMLButtonElement>, current: ProfileTab) {
    const currentIndex = profileTabs.findIndex(([value]) => value === current);
    let nextIndex = currentIndex;
    if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % profileTabs.length;
    else if (event.key === "ArrowLeft") nextIndex = (currentIndex - 1 + profileTabs.length) % profileTabs.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = profileTabs.length - 1;
    else return;
    event.preventDefault();
    const nextTab = profileTabs[nextIndex][0];
    selectProfileTab(nextTab);
    event.currentTarget.parentElement
      ?.querySelector<HTMLButtonElement>(`[data-profile-tab="${nextTab}"]`)
      ?.focus();
  }


  return (
    <main id="main-content" tabIndex={-1} className="stage-shell min-h-screen bg-app px-4 pb-28 text-white sm:px-6 xl:pb-12">
      <Toast message={message} onClose={() => setMessage(null)} />
      <MobileDock authenticated={Boolean(viewer)} profileSlug={viewer?.slug} active="profile" />
      <ConfirmDialog
        open={confirmBlock}
        title="Kullanıcı engellensin mi?"
        body="Birbirinizin paylaşımlarını göremez ve birbirinizi takip edemezsiniz. Engeli daha sonra kaldırabilirsin."
        confirmLabel="Engelle"
        tone="danger"
        onCancel={() => setConfirmBlock(false)}
        onConfirm={toggleBlock}
      />
      {connectionType && (
        <div className="modal-backdrop" role="presentation" onClick={() => setConnectionType(null)}>
          <section
            ref={connectionsDialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="connections-dialog-title"
            className="sticky-panel w-[min(520px,100%)] overflow-hidden rounded-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="profile-connections-header">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-100/68">
                  {profile?.ownerName}
                </p>
                <h2 id="connections-dialog-title" className="mt-1 text-xl font-bold text-white">
                  {connectionType === "followers" ? "Takipçiler" : "Takip edilenler"}
                </h2>
              </div>
              <button
                ref={connectionsCloseRef}
                type="button"
                aria-label="Kapat"
                onClick={() => setConnectionType(null)}
                className="toast-close h-10 w-10"
              >
                ×
              </button>
            </div>
            <div className="profile-connections-list">
              {connectionsLoading && (
                <p role="status" aria-live="polite" className="profile-connections-state">
                  Yükleniyor...
                </p>
              )}
              {!connectionsLoading && !connectionsError && connectionUsers.length === 0 && (
                <p className="profile-connections-state">
                  Bu liste henüz boş.
                </p>
              )}
              {!connectionsLoading &&
                connectionUsers.map((user) => (
                  <Link
                    key={user.id}
                    href={`/u/${user.slug}`}
                    onClick={() => setConnectionType(null)}
                    className="profile-connection-row"
                  >
                    <span className="nav-avatar h-11 w-11">
                      {user.ownerName.slice(0, 1).toUpperCase()}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-black text-white">
                        {user.ownerName}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-cyan-50/72">
                        {user.bio || `@${user.slug}`}
                      </span>
                    </span>
                    {(user.isMe || user.following) && (
                      <span className="profile-connection-badge">
                        {user.isMe ? "Sen" : "Takipte"}
                      </span>
                    )}
                  </Link>
                ))}
              {(connectionsError || (connectionUsers.length > 0 && (connectionsCursor || connectionsLoading))) && (
                <FeedLoadSentinel
                  sentinelRef={connectionsSentinelRef}
                  loading={connectionsLoading}
                  error={connectionsError}
                  loadingLabel="Kullanıcılar yükleniyor..."
                  onRetry={() => {
                    if (connectionType) {
                      void loadConnections(connectionType, connectionsCursor, connectionUsers.length > 0);
                    }
                  }}
                />
              )}
            </div>
          </section>
        </div>
      )}
      <section className="ui-page-frame relative mx-auto">
        <PageTopbar
          title="Profil"
          subtitle={loading ? "Yükleniyor..." : profile ? "Müzik kimliği ve topluluk vitrini" : "Profil bulunamadı"}
          icon={<Music2 size={18} />}
          backLabel="Ana akışa dön"
          className="profile-topbar mb-6"
          titleAs="div"
          showPrimaryNavigation
          actions={viewer ? (
            <AccountMenu
              ownerName={viewer.ownerName}
              email={viewer.email}
              profileSlug={viewer.slug}
              role={viewer.role}
              onLogout={() => void logoutViewer()}
            />
          ) : (
            <Link href={`/account?mode=login&next=${encodeURIComponent(`/u/${slug}`)}`} aria-label="Giriş yap" title="Giriş yap" className="topbar-primary-button">
              <LogIn size={16} />
              <span>Giriş yap</span>
            </Link>
          )}
        />

        {loading && (
          <div className="profile-loading-state" role="status" aria-live="polite" aria-label="Profil yükleniyor" aria-busy="true">
            <section><span /><div><i /><i /><i /></div></section>
            <nav><i /><i /><i /></nav>
            <div><b /><b /><b /></div>
          </div>
        )}

        {!loading && loadError && (
          <section className="profile-load-error" role="alert">
            <UserRound size={25} />
            <h2>Profil görüntülenemedi</h2>
            <p>{loadError}</p>
            <div>
              <button type="button" onClick={() => void loadProfile()} className="primary-action">Tekrar dene</button>
              <Link href="/" className="secondary-action">Ana akışa dön</Link>
            </div>
          </section>
        )}

        {profile && (
          <>
            <ProfileHeroV3
              profile={profile}
              onOpenConnections={openConnections}
              actions={(
                <>
                    {!profile.isMe && !profile.hasBlockedMe && !profile.blockedByMe && (
                      <>
                        <button
                          type="button"
                          onClick={toggleFollow}
                          disabled={busy}
                          className={profile.following ? "secondary-action h-11 rounded-xl px-5 text-sm font-black" : "primary-action h-11 rounded-xl px-5 text-sm font-black"}
                        >
                          <UserPlus size={16} /> <span>{busy ? "İşleniyor..." : profile.following ? "Takip ediliyor" : "Takip et"}</span>
                        </button>
                        <Link
                          href={viewer
                            ? `/games/elimination/new?opponent=${encodeURIComponent(profile.slug)}`
                            : `/account?mode=login&next=${encodeURIComponent(`/games/elimination/new?opponent=${profile.slug}`)}`}
                          className="secondary-action h-11 rounded-xl px-5 text-sm font-black"
                        >
                          <Gamepad2 size={16} /> <span>Özel oyun oluştur</span>
                        </Link>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => void copyProfileLink()}
                      className="secondary-action h-11 rounded-xl px-5 text-sm font-black"
                    >
                      <Share2 size={16} /> <span>Profili paylaş</span>
                    </button>
                    {!profile.isMe && !profile.hasBlockedMe && (
                      <div ref={profileMenuRef} className="relative">
                        <button
                          type="button"
                          onClick={() => setProfileMenuOpen((open) => !open)}
                          aria-label="Profil işlemleri"
                          aria-expanded={profileMenuOpen}
                          className="topbar-icon-button h-11 w-11"
                        >
                          <MoreHorizontal size={18} />
                        </button>
                        {profileMenuOpen && (
                          <div className="profile-action-menu">
                            <button
                              type="button"
                              onClick={() => {
                                setProfileMenuOpen(false);
                                if (profile.blockedByMe) void toggleBlock();
                                else setConfirmBlock(true);
                              }}
                              disabled={busy}
                              className="profile-action-menu-danger"
                            >
                              <span className="flex items-center gap-2">
                                <ShieldBan size={15} />
                                {profile.blockedByMe ? "Engeli kaldır" : "Engelle"}
                              </span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                    {profile.isMe && (
                      <Link href="/account?tab=profile" className="secondary-action flex h-11 items-center rounded-xl px-5 text-sm font-black">
                        <Settings2 size={16} /> <span>Profili düzenle</span>
                      </Link>
                    )}
                </>
              )}
            />

            {(profile.blockedByMe || profile.hasBlockedMe) && (
              <div className="profile-v3-block-notice">
                {profile.blockedByMe
                  ? "Bu kullanıcıyı engelledin. Paylaşımlar karşılıklı olarak gizlendi."
                  : "Bu profille etkileşim kullanılamıyor."}
              </div>
            )}

            <div className="profile-v3-workspace">
              <ProfileIdentityRail profile={profile} />
              <div className="profile-v3-main">
            <nav className="profile-tabs profile-v3-tabs" role="tablist" aria-label="Profil bölümleri">
              {profileTabs.map(([value, label, Icon]) => {
                const count = value === "posts"
                  ? profile.postCount
                  : value === "activity"
                    ? profile.posts.length + profile.forumThreads.length + profile.games.length
                    : value === "achievements"
                      ? profile.achievements.length
                      : null;
                return (
                <button
                  key={value}
                  id={`profile-tab-${value}`}
                  type="button"
                  role="tab"
                  aria-selected={profileTab === value}
                  aria-controls={`profile-panel-${value}`}
                  tabIndex={profileTab === value ? 0 : -1}
                  data-profile-tab={value}
                  onKeyDown={(event) => handleProfileTabKeyDown(event, value)}
                  onClick={() => selectProfileTab(value)}
                  className={profileTab === value ? "profile-tab profile-tab-active" : "profile-tab"}
                >
                  <Icon size={16} />
                  <span>{label}</span>
                  {typeof count === "number" && <em>{count}</em>}
                </button>
                );
              })}
            </nav>

            <ProfileTabPanels
              profile={profile}
              activeTab={profileTab}
              postsLoading={postsLoading}
              postsError={postsError}
              postsSentinelRef={postsSentinelRef}
              onRetryPosts={() => void loadMorePosts()}
            />
              </div>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
