"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { useDraftNavigationGuard } from "../components/DraftNavigationProvider";
import { Toast } from "../components/Toast";
import { AccountAuthPanel } from "../components/AccountAuthPanel";
import { AccountSettingsPanel } from "../components/AccountSettingsPanel";
import { AccountProfilePanel } from "../components/AccountProfilePanel";
import { AccountRequestsPanel } from "../components/AccountRequestsPanel";
import { AccountListPanel } from "../components/AccountListPanel";
import { AccountMenu } from "../components/AccountMenu";
import { MobileDock } from "../components/MobileDock";
import { PageTopbar } from "../components/PageTopbar";
import {
  AccountDashboardSidebar,
  AccountStatusStrip,
  isPanelTab,
  panelGroups,
  panelTabs,
  type PanelTab,
} from "../components/AccountDashboardSidebar";
import { Music2, RotateCcw } from "lucide-react";
import type { AccountList, ScoreSummary } from "./accountTypes";
import { useAccountAuthActions } from "./useAccountAuthActions";
import { useAccountListActions } from "./useAccountListActions";
import { useAccountSecurityActions } from "./useAccountSecurityActions";
import { DEFAULT_PROFILE_SHOWCASE, normalizeProfileShowcase, type ProfileShowcaseModule } from "@/lib/profileShowcase";
import { normalizeProfileBanner, normalizeProfileDensity, type ProfileBanner, type ProfileDensity } from "@/lib/profileAppearance";
import { universityDraft } from "@/lib/profileUniversity";
type ConfirmState = {
  title: string;
  body: string;
  confirmLabel?: string;
  tone?: "default" | "danger";
  onConfirm: () => void;
};

function normalizeGenres(value: string) {
  return value.split(",").map(item => item.trim().toLocaleLowerCase("tr-TR")).filter(Boolean).slice(0, 6).join("|");
}
export default function AccountPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "create" | "panel">("login");
  const [list, setList] = useState<AccountList | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [editingPlaylistName, setEditingPlaylistName] = useState("");
  const [profileBio, setProfileBio] = useState("");
  const [profileStatus, setProfileStatus] = useState("");
  const [profileUniversity, setProfileUniversity] = useState(universityDraft());
  const [pinnedFeedPostId, setPinnedFeedPostId] = useState("");
  const [profileShowcaseModules, setProfileShowcaseModules] = useState<ProfileShowcaseModule[]>([...DEFAULT_PROFILE_SHOWCASE]);
  const [profileGenres, setProfileGenres] = useState("");
  const [profileTheme, setProfileTheme] = useState("aurora");
  const [profileDensity, setProfileDensity] = useState<ProfileDensity>("comfortable");
  const [profileBanner, setProfileBanner] = useState<ProfileBanner>("line");
  const [featuredAchievementId, setFeaturedAchievementId] = useState("");
  const [panelTab, setPanelTab] = useState<PanelTab>("requests");
  const [decisionFilter, setDecisionFilter] = useState<
    "all" | "approved" | "rejected" | "removed"
  >("all");
  const [decisionSearch, setDecisionSearch] = useState("");
  const [confirmDialog, setConfirmDialog] = useState<ConfirmState | null>(null);
  const [scoreSummary, setScoreSummary] = useState<ScoreSummary | null>(null);
  const [friendCode, setFriendCode] = useState("");

  const {
    ownerName,
    playlistName,
    loginEmail,
    loginPassword,
    rememberMe,
    registerEmail,
    registerPassword,
    registerPasswordConfirm,
    setOwnerName,
    setPlaylistName,
    setLoginEmail,
    setLoginPassword,
    setRememberMe,
    setRegisterEmail,
    setRegisterPassword,
    setRegisterPasswordConfirm,
    createAccount,
    login,
  } = useAccountAuthActions({ loading, setLoading, setMessage });

  const {
    currentPassword,
    newPassword,
    deletePassword,
    deleteConfirmation,
    deletingAccount,
    setCurrentPassword,
    setNewPassword,
    setDeletePassword,
    setDeleteConfirmation,
    logout,
    changePassword,
    deleteAccount,
  } = useAccountSecurityActions({
    loading,
    setLoading,
    setMessage,
    onUnauthorized: () => {
      setList(null);
      setMode("login");
      setMessage("Oturum geçersiz. Tekrar giriş yap.");
    },
    onSignedOut: (nextMessage) => {
      setList(null);
      setLoginPassword("");
      setMode("login");
      setMessage(nextMessage);
    },
  });

  const suggestions = list?.suggestions ?? [];
  const pending = suggestions.filter((item) => item.status === "pending");
  const decided = suggestions
    .filter((item) => item.status !== "pending")
    .slice(0, 20);
  const filteredDecided = decided.filter((item) => {
    const matchesStatus =
      decisionFilter === "all" || item.status === decisionFilter;
    const needle = decisionSearch.trim().toLowerCase();
    const matchesSearch =
      !needle ||
      `${item.trackName} ${item.artistName} ${item.suggestedBy ?? ""}`
        .toLowerCase()
        .includes(needle);
    return matchesStatus && matchesSearch;
  });
  const approvedCount = suggestions.filter((item) => item.status === "approved").length;
  const rejectedCount = suggestions.filter((item) => item.status === "rejected").length;
  const removedCount = suggestions.filter((item) => item.status === "removed").length;
  const accountInitials = useMemo(() => {
    const source = list?.ownerName || list?.email || "H";
    return source
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("");
  }, [list?.ownerName, list?.email]);
  const savedGenres = useMemo(() => {
    try {
      const genres = JSON.parse(list?.favoriteGenres || "[]");
      return Array.isArray(genres) ? genres.map(String).join(", ") : "";
    } catch {
      return "";
    }
  }, [list?.favoriteGenres]);
  const hasListChanges = Boolean(
    list && editingPlaylistName.trim() !== (list.playlistName || list.ownerName || "").trim()
  );
  const hasProfileChanges = Boolean(
    list &&
      (profileBio !== (list.bio || "") ||
        profileStatus !== (list.profileStatus || "") ||
        profileUniversity.name !== (list.universityName || "") || profileUniversity.public !== Boolean(list.universityPublic) ||
        pinnedFeedPostId !== (list.pinnedFeedPostId || "") ||
        profileShowcaseModules.join("|") !== normalizeProfileShowcase(list.profileShowcase).join("|") ||
        normalizeGenres(profileGenres) !== normalizeGenres(savedGenres) ||
        profileTheme !== (list.profileTheme || "aurora") ||
        profileDensity !== normalizeProfileDensity(list.profileDensity) ||
        profileBanner !== normalizeProfileBanner(list.profileBanner) ||
        featuredAchievementId !== (list.featuredAchievementId || ""))
  );
  const hasUnsavedChanges = hasListChanges || hasProfileChanges;
  const activePanel = panelTabs.find((tab) => tab.value === panelTab) ?? panelTabs[0];
  const activePanelGroup = panelGroups.find((group) => group.values.includes(panelTab));
  const copyServiceUrl = list?.spotifyExternalUrl
    ? `https://www.tunemymusic.com/transfer?source=spotify&url=${encodeURIComponent(
        list.spotifyExternalUrl
      )}`
    : "";

  const loadScore = useCallback(async (listId: string) => {
    try {
      const res = await fetch("/api/leaderboard");
      const data = await res.json().catch(() => null);
      if (!res.ok || !Array.isArray(data?.users)) return;
      const user = data.users.find((item: ScoreSummary & { id: string }) => item.id === listId);
      setScoreSummary(user ?? null);
    } catch {
      setScoreSummary(null);
    }
  }, []);

  const loadMe = useCallback(async (fallbackMode: "login" | "create" = "login") => {
    try {
      const res = await fetch("/api/accounts/me");
      if (!res.ok) {
        setList(null);
        setMode(fallbackMode);
        return;
      }
      const data = await res.json();
      setList(data.list);
      setEditingPlaylistName(data.list?.playlistName || data.list?.ownerName || "");
      setProfileBio(data.list?.bio || "");
      setProfileStatus(data.list?.profileStatus || "");
      setProfileUniversity(universityDraft(data.list));
      setPinnedFeedPostId(data.list?.pinnedFeedPostId || "");
      setProfileShowcaseModules(normalizeProfileShowcase(data.list?.profileShowcase));
      try {
        const genres = JSON.parse(data.list?.favoriteGenres || "[]");
        setProfileGenres(Array.isArray(genres) ? genres.join(", ") : "");
      } catch {
        setProfileGenres("");
      }
      setProfileTheme(data.list?.profileTheme || "aurora");
      setProfileDensity(normalizeProfileDensity(data.list?.profileDensity));
      setProfileBanner(normalizeProfileBanner(data.list?.profileBanner));
      setFeaturedAchievementId(data.list?.featuredAchievementId || "");
      setMode("panel");
      void loadScore(data.list?.id);
    } catch {
      setList(null);
      setMode(fallbackMode);
      setMessage("Oturum bilgisi alınamadı. Bağlantını kontrol edip tekrar dene.");
    } finally {
      setCheckingSession(false);
    }
  }, [loadScore]);

  const {
    runDecision,
    runDecideAll,
    exportList,
    savePlaylistName,
    copyInviteLink,
    rotateInviteCode,
    openFriendInvite,
    saveProfile,
  } = useAccountListActions({
    list,
    pending,
    loading,
    editingPlaylistName,
    friendCode,
    profileBio,
    profileStatus,
    profileUniversity, setProfileUniversity,
    pinnedFeedPostId,
    profileShowcaseModules,
    profileGenres,
    profileTheme,
    profileDensity,
    profileBanner,
    featuredAchievementId,
    setList,
    setLoading,
    setMessage,
    loadMe,
    onUnauthorized: handleUnauthorized,
  });
  const requestDraftExit = useDraftNavigationGuard({
    dirty: hasUnsavedChanges,
    busy: loading,
    save: hasProfileChanges && !hasListChanges ? saveProfile : undefined,
    discard: discardUnsavedChanges,
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedMode = params.get("mode");
    const requestedTab = params.get("tab");
    if (requestedTab === "list") { router.replace("/library?type=music"); return; }
    if (requestedTab === "settings") {
      setPanelTab("security");
    } else if (isPanelTab(requestedTab)) {
      setPanelTab(requestedTab);
    }
    loadMe(requestedMode === "create" ? "create" : "login");
  }, [loadMe, router]);

  function applyPanelTab(value: PanelTab) {
    if (value === "list") { router.push("/library?type=music"); return; }
    setPanelTab(value);
    const url = new URL(window.location.href);
    url.searchParams.delete("mode");
    url.searchParams.set("tab", value);
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}`);
  }
  function discardUnsavedChanges() {
    if (!list || loading) return;
    setEditingPlaylistName(list.playlistName || list.ownerName || "");
    setProfileBio(list.bio || "");
    setProfileStatus(list.profileStatus || "");
    setProfileUniversity(universityDraft(list));
    setPinnedFeedPostId(list.pinnedFeedPostId || "");
    setProfileShowcaseModules(normalizeProfileShowcase(list.profileShowcase));
    setProfileGenres(savedGenres);
    setProfileTheme(list.profileTheme || "aurora");
    setProfileDensity(normalizeProfileDensity(list.profileDensity));
    setProfileBanner(normalizeProfileBanner(list.profileBanner));
    setFeaturedAchievementId(list.featuredAchievementId || "");
  }
  function selectPanelTab(value: PanelTab) {
    if (loading || value === panelTab) return;
    requestDraftExit(() => applyPanelTab(value));
  }
  function requestHome() {
    requestDraftExit(() => router.push("/"));
  }

  function requestLogout() {
    if (!hasUnsavedChanges) {
      void logout();
      return;
    }
    setConfirmDialog({
      title: "Çıkış yapılsın mı?",
      body: "Kaydedilmemiş liste veya profil değişikliklerin silinecek ve oturumun kapatılacak.",
      confirmLabel: "Kaydetmeden çıkış yap",
      tone: "danger",
      onConfirm: () => {
        discardUnsavedChanges();
        setConfirmDialog(null);
        void logout();
      },
    });
  }

  function handleUnauthorized() {
    setList(null);
    setMode("login");
    setMessage("Oturum geçersiz. Tekrar giriş yap.");
  }

  function decide(id: string, action: "approve" | "reject" | "remove") {
    if (action !== "remove") {
      runDecision(id, action);
      return;
    }
    setConfirmDialog({
      title: "Şarkı çıkarılsın mı?",
      body: "Bu şarkı panelden çıkarılır. Spotify senkronu izin durumuna göre ayrıca güncellenir.",
      confirmLabel: "Çıkar",
      tone: "danger",
      onConfirm: () => {
        setConfirmDialog(null);
        runDecision(id, "remove");
      },
    });
  }

  function decideAll(action: "approve" | "reject") {
    if (pending.length === 0) return;
    setConfirmDialog({
      title: action === "approve" ? "Tümünü onayla" : "Tümünü reddet",
      body:
        action === "approve"
          ? `${pending.length} şarkı Spotify listesine eklenmek üzere onaylanacak.`
          : `${pending.length} şarkı reddedilecek ve bekleyenlerden kalkacak.`,
      confirmLabel: action === "approve" ? "Onayla" : "Reddet",
      tone: action === "approve" ? "default" : "danger",
      onConfirm: () => {
        setConfirmDialog(null);
        runDecideAll(action);
      },
    });
  }

  return (
    <main id="main-content" tabIndex={-1} className="stage-shell min-h-screen bg-app pb-28 text-slate-950 xl:pb-0">
      <Toast message={message} onClose={() => setMessage(null)} />
      {mode === "panel" && list && (
        <MobileDock authenticated profileSlug={list.slug} active="profile" />
      )}
      <ConfirmDialog
        open={Boolean(confirmDialog)}
        title={confirmDialog?.title ?? ""}
        body={confirmDialog?.body ?? ""}
        confirmLabel={confirmDialog?.confirmLabel}
        tone={confirmDialog?.tone}
        onCancel={() => setConfirmDialog(null)}
        onConfirm={() => confirmDialog?.onConfirm()}
      />
      <section className={`ui-page-frame relative mx-auto min-h-screen px-4 pb-12 sm:px-6 ${mode === "panel" ? "desktop-density-comfortable" : ""}`}>
        <PageTopbar
          title="Hesap merkezi"
          subtitle={mode === "panel" && list ? list.playlistName || list.ownerName : "Giriş yap veya yeni hesap oluştur"}
          icon={<Music2 size={20} strokeWidth={2.4} />}
          backLabel="Ana akışa dön"
          onBack={mode === "panel" && list ? requestHome : undefined}
          className="account-topbar"
          actions={mode === "panel" && list && (
              <AccountMenu
                ownerName={list.ownerName}
                email={list.email}
                profileSlug={list.slug}
                role={list.role}
                onLogout={requestLogout}
              />
          )}
        />

        {checkingSession && (
          <section
            className="account-session-skeleton ui-panel mx-auto max-w-xl p-6"
            aria-label="Oturum kontrol ediliyor"
            aria-busy="true"
          >
            <div className="animate-pulse" aria-hidden="true">
              <div className="h-3 w-24 rounded-full bg-white/16" />
              <div className="mt-5 h-8 w-52 rounded-lg bg-white/14" />
              <div className="mt-6 h-12 rounded-xl bg-white/12" />
              <div className="mt-3 h-12 rounded-xl bg-white/12" />
              <div className="mt-5 h-12 rounded-xl bg-cyan-300/16" />
            </div>
            <p className="sr-only">Oturum kontrol ediliyor.</p>
          </section>
        )}

        {!checkingSession && mode !== "panel" && (
          <AccountAuthPanel
            mode={mode}
            loading={loading}
            loginEmail={loginEmail}
            loginPassword={loginPassword}
            rememberMe={rememberMe}
            ownerName={ownerName}
            playlistName={playlistName}
            registerEmail={registerEmail}
            registerPassword={registerPassword}
            registerPasswordConfirm={registerPasswordConfirm}
            onModeChange={setMode}
            onLoginEmailChange={setLoginEmail}
            onLoginPasswordChange={setLoginPassword}
            onRememberMeChange={setRememberMe}
            onOwnerNameChange={setOwnerName}
            onPlaylistNameChange={setPlaylistName}
            onRegisterEmailChange={setRegisterEmail}
            onRegisterPasswordChange={setRegisterPassword}
            onRegisterPasswordConfirmChange={setRegisterPasswordConfirm}
            onLogin={login}
            onCreateAccount={createAccount}
          />
        )}

        {!checkingSession && mode === "panel" && list && (
          <div className="account-dashboard-grid mt-5 grid items-start gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
            <AccountDashboardSidebar
              ownerName={list.ownerName}
              playlistName={list.playlistName}
              initials={accountInitials}
              activeTab={panelTab}
              pendingCount={pending.length}
              approvedCount={approvedCount}
              listDirty={hasListChanges}
              profileDirty={hasProfileChanges}
              scoreSummary={scoreSummary}
              onTabChange={selectPanelTab}
            />

            <div className="min-w-0">
              <section className="account-section-heading">
                <p className="section-kicker text-cyan-100/75">{activePanelGroup?.label || "Hesap merkezi"}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <h2>{activePanel.label}</h2>
                  {hasUnsavedChanges && <span>Kaydedilmemiş değişiklikler var</span>}
                </div>
                <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
                  <p className="account-section-description">{activePanel.description}</p>
                  {hasUnsavedChanges && panelTab !== "profile" && (
                    <button type="button" disabled={loading} onClick={discardUnsavedChanges} className="account-reset-changes">
                      <RotateCcw size={14} /> Değişiklikleri geri al
                    </button>
                  )}
                </div>
              </section>

              {(panelTab === "requests" || panelTab === "list") && (
                <AccountStatusStrip
                  pendingCount={pending.length}
                  approvedCount={approvedCount}
                  rejectedCount={rejectedCount}
                  removedCount={removedCount}
                />
              )}

              <section className="mt-4">
              {panelTab === "requests" && (
                <AccountRequestsPanel
                  pending={pending}
                  decided={filteredDecided}
                  filter={decisionFilter}
                  search={decisionSearch}
                  loading={loading}
                  onFilterChange={setDecisionFilter}
                  onSearchChange={setDecisionSearch}
                  onDecide={decide}
                  onDecideAll={decideAll}
                />
              )}

              {panelTab === "list" && (
                <AccountListPanel
                  spotifyPlaylistId={list.spotifyPlaylistId}
                  spotifyExternalUrl={list.spotifyExternalUrl}
                  submitCode={list.submitCode}
                  copyServiceUrl={copyServiceUrl}
                  rejectedCount={rejectedCount}
                  playlistName={editingPlaylistName}
                  playlistDirty={hasListChanges}
                  friendCode={friendCode}
                  loading={loading}
                  onPlaylistNameChange={setEditingPlaylistName}
                  onFriendCodeChange={setFriendCode}
                  onExportList={exportList}
                  onSavePlaylistName={savePlaylistName}
                  onCopyInviteLink={copyInviteLink}
                  onRotateInviteCode={rotateInviteCode}
                  onOpenFriendInvite={openFriendInvite}
                  onImportComplete={async (importMessage) => {
                    setMessage(importMessage);
                    await loadMe();
                  }}
                />
              )}

              {panelTab === "profile" && (
                <AccountProfilePanel
                  ownerName={list.ownerName}
                  slug={list.slug}
                  bio={profileBio}
                  status={profileStatus}
                  university={profileUniversity} onUniversityChange={setProfileUniversity}
                  pinnedPostId={pinnedFeedPostId}
                  showcaseModules={profileShowcaseModules}
                  posts={list.profilePosts || []}
                  genres={profileGenres}
                  theme={profileTheme}
                  density={profileDensity}
                  banner={profileBanner}
                  featuredAchievementId={featuredAchievementId}
                  achievements={list.profileAchievements || []}
                  dirty={hasProfileChanges}
                  loading={loading}
                  onBioChange={setProfileBio}
                  onStatusChange={setProfileStatus}
                  onPinnedPostChange={setPinnedFeedPostId}
                  onShowcaseModulesChange={setProfileShowcaseModules}
                  onGenresChange={setProfileGenres}
                  onThemeChange={setProfileTheme}
                  onDensityChange={setProfileDensity}
                  onBannerChange={setProfileBanner}
                  onFeaturedAchievementChange={setFeaturedAchievementId}
                  onSave={saveProfile} onDiscard={discardUnsavedChanges}
                />
              )}

              {(panelTab === "security" || panelTab === "privacy" || panelTab === "data") && (
                <AccountSettingsPanel
                  view={panelTab}
                  ownerName={list.ownerName}
                  email={list.email}
                  currentPassword={currentPassword}
                  newPassword={newPassword}
                  deletePassword={deletePassword}
                  deleteConfirmation={deleteConfirmation}
                  loading={loading}
                  deletingAccount={deletingAccount}
                  onCurrentPasswordChange={setCurrentPassword}
                  onNewPasswordChange={setNewPassword}
                  onDeletePasswordChange={setDeletePassword}
                  onDeleteConfirmationChange={setDeleteConfirmation}
                  onChangePassword={changePassword}
                  onDeleteAccount={deleteAccount}
                />
              )}
              </section>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
