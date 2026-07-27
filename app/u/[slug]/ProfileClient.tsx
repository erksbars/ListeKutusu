"use client";

import Link from "next/link";
import { KeyboardEvent as ReactKeyboardEvent, useCallback, useEffect, useRef, useState } from "react";
import { Award, CalendarDays, LogIn, MoreHorizontal, Music2, Settings2, ShieldBan, UserPlus, UserRound } from "lucide-react";
import { Toast } from "../../components/Toast";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { AccountMenu } from "../../components/AccountMenu";
import { MobileDock } from "../../components/MobileDock";
import { PageTopbar } from "../../components/PageTopbar";
import { ProfileTabPanels } from "../../components/profile/ProfileTabPanels";
import { useSessionNavigation } from "../../hooks/useSessionNavigation";
import type { ConnectionUser, Profile, ProfileTab, ViewerAccount } from "./profileTypes";

const themeClasses: Record<string, string> = {
  aurora: "from-cyan-300 via-blue-500 to-violet-500",
  violet: "from-fuchsia-400 via-violet-500 to-indigo-500",
  emerald: "from-emerald-300 via-teal-500 to-cyan-500",
  sunset: "from-rose-400 via-orange-400 to-violet-500",
};

const profileTabs = [
  ["posts", "Paylaşımlar", Music2],
  ["about", "Hakkında", UserRound],
  ["achievements", "Rozetler", Award],
] as const;

export default function ProfileClient({ slug }: { slug: string }) {
  const { goToLogin, logoutToHome } = useSessionNavigation();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [connectionType, setConnectionType] = useState<"followers" | "following" | null>(null);
  const [connectionUsers, setConnectionUsers] = useState<ConnectionUser[]>([]);
  const [connectionsLoading, setConnectionsLoading] = useState(false);
  const [confirmBlock, setConfirmBlock] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [profileTab, setProfileTab] = useState<ProfileTab>("posts");
  const [viewer, setViewer] = useState<ViewerAccount | null>(null);
  const connectionsDialogRef = useRef<HTMLElement>(null);
  const connectionsCloseRef = useRef<HTMLButtonElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

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
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    const requestedTab = new URLSearchParams(window.location.search).get("tab");
    if (requestedTab === "posts" || requestedTab === "about" || requestedTab === "achievements") {
      setProfileTab(requestedTab);
    }
  }, []);

  useEffect(() => {
    fetch("/api/accounts/me")
      .then(async (response) => {
        if (!response.ok) return;
        const data = await response.json();
        setViewer(data.list || null);
      })
      .catch(() => null);
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
    const res = await fetch("/api/profiles/follow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileId: profile.id }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
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
  }

  async function openConnections(type: "followers" | "following") {
    setConnectionType(type);
    setConnectionUsers([]);
    setConnectionsLoading(true);
    const res = await fetch(
      `/api/profiles/connections?slug=${encodeURIComponent(slug)}&type=${type}`
    );
    const data = await res.json().catch(() => ({}));
    setConnectionsLoading(false);
    if (!res.ok) {
      setMessage(data.error || "Kullanıcılar yüklenemedi.");
      setConnectionType(null);
      return;
    }
    setConnectionUsers(data.users || []);
  }

  async function toggleBlock() {
    if (!profile || profile.isMe) return;
    setBusy(true);
    const res = await fetch("/api/profiles/block", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileId: profile.id }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
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
  }

  async function logoutViewer() {
    try {
      await logoutToHome();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Çıkış işlemi tamamlanamadı.");
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

  const initial = (profile?.ownerName || "M").slice(0, 1).toUpperCase();
  const stats: Array<{
    label: string;
    value: number;
    connection?: "followers" | "following";
  }> = profile
    ? [
        { label: "Takipçi", value: profile.followerCount, connection: "followers" },
        { label: "Takip", value: profile.followingCount, connection: "following" },
        { label: "Paylaşım", value: profile.postCount },
        { label: "Listeye ekleme", value: profile.totalAdds },
        { label: "Beğeni", value: profile.totalLikes },
      ]
    : [];
  const theme = themeClasses[profile?.profileTheme || "aurora"] || themeClasses.aurora;

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
            <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
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
            <div className="max-h-[520px] overflow-y-auto p-3">
              {connectionsLoading && (
                <p role="status" aria-live="polite" className="rounded-xl bg-white/[0.06] p-4 text-sm text-cyan-50/72">
                  Yükleniyor...
                </p>
              )}
              {!connectionsLoading && connectionUsers.length === 0 && (
                <p className="rounded-xl bg-white/[0.06] p-4 text-sm text-cyan-50/72">
                  Bu liste henüz boş.
                </p>
              )}
              {!connectionsLoading &&
                connectionUsers.map((user) => (
                  <Link
                    key={user.id}
                    href={`/u/${user.slug}`}
                    onClick={() => setConnectionType(null)}
                    className="mb-1 grid grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-3 rounded-xl p-3 hover:bg-white/10"
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
                      <span className="rounded-full border border-cyan-200/16 bg-cyan-200/10 px-2.5 py-1 text-xs font-black text-cyan-50/76">
                        {user.isMe ? "Sen" : "Takipte"}
                      </span>
                    )}
                  </Link>
                ))}
            </div>
          </section>
        </div>
      )}
      <section className="ui-page-frame relative mx-auto">
        <PageTopbar
          title="Kullanıcı profili"
          subtitle={loading ? "Yükleniyor..." : profile ? `@${profile.slug}` : "Profil bulunamadı"}
          icon={<Music2 size={18} />}
          backLabel="Ana akışa dön"
          className="profile-topbar mb-6"
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
            <section className="profile-overview profile-overview-v2 overflow-hidden">
              <div className={`profile-accent bg-gradient-to-r ${theme}`} />
              <div className="p-5 sm:p-6">
                <div className="profile-hero-layout">
                  <div className="flex min-w-0 items-center gap-4">
                    <span className={`profile-avatar bg-gradient-to-br ${theme}`}>
                      {initial}
                    </span>
                    <div className="min-w-0">
                      <h1 className="truncate text-2xl font-black sm:text-3xl">{profile.ownerName}</h1>
                      <p className="mt-1 text-sm text-cyan-50/68">@{profile.slug}</p>
                      <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-cyan-50/72">
                        <CalendarDays size={14} /> {new Date(profile.createdAt).toLocaleDateString("tr-TR")} tarihinde katıldı
                      </p>
                      {profile.bio && <p className="profile-hero-bio">{profile.bio}</p>}
                    </div>
                  </div>
                  <div className="profile-hero-actions">
                    {!profile.isMe && !profile.hasBlockedMe && !profile.blockedByMe && (
                      <button
                        type="button"
                        onClick={toggleFollow}
                        disabled={busy}
                        className={profile.following ? "secondary-action h-11 rounded-xl px-5 text-sm font-black" : "primary-action h-11 rounded-xl px-5 text-sm font-black"}
                      >
                        <UserPlus size={16} /> <span>{busy ? "İşleniyor..." : profile.following ? "Takip ediliyor" : "Takip et"}</span>
                      </button>
                    )}
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
                      <Link href="/account" className="secondary-action flex h-11 items-center rounded-xl px-5 text-sm font-black">
                        <Settings2 size={16} /> <span>Hesap paneli</span>
                      </Link>
                    )}
                  </div>
                </div>

                {(profile.blockedByMe || profile.hasBlockedMe) && (
                  <div className="mt-6 rounded-xl border border-rose-300/20 bg-rose-300/[0.08] p-4 text-sm leading-6 text-rose-50/82">
                    {profile.blockedByMe
                      ? "Bu kullanıcıyı engelledin. Paylaşımlar karşılıklı olarak gizlendi."
                      : "Bu profille etkileşim kullanılamıyor."}
                  </div>
                )}

                <div className="profile-stats mt-6">
                  {stats.map((stat) => (
                    <button
                      key={stat.label}
                      type="button"
                      disabled={!stat.connection}
                      aria-label={stat.connection ? `${stat.label} listesini aç` : stat.label}
                      onClick={() => stat.connection && openConnections(stat.connection)}
                      className={`profile-stat ${
                        stat.connection ? "hover:bg-white/8" : "cursor-default"
                      }`}
                    >
                      <span className="block text-xs font-bold uppercase tracking-wide text-cyan-100/70">
                        {stat.label}
                      </span>
                      <span className="mt-1 block text-2xl font-black text-white">{stat.value}</span>
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <nav className="profile-tabs mt-5" role="tablist" aria-label="Profil bölümleri">
              {profileTabs.map(([value, label, Icon]) => {
                const count = value === "posts" ? profile.posts.length : value === "achievements" ? profile.achievements.length : null;
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

            <ProfileTabPanels profile={profile} activeTab={profileTab} />
          </>
        )}
      </section>
    </main>
  );
}
