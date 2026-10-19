"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AccountListPanel } from "@/app/components/AccountListPanel";
import { Toast } from "@/app/components/Toast";
import { Button } from "@/app/components/ui/Button";
import { useAccountListActions } from "@/app/account/useAccountListActions";
import type { AccountList } from "@/app/account/accountTypes";

export function MusicLibrarySettings({ onChanged }: { onChanged: () => Promise<void> }) {
  const [list, setList] = useState<AccountList | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [editingPlaylistName, setEditingPlaylistName] = useState("");
  const [friendCode, setFriendCode] = useState("");
  const loadMe = useCallback(async () => {
    const response = await fetch("/api/accounts/me", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok || !data.list) throw new Error(data.error || "Liste ayarları yüklenemedi.");
    setList(data.list); setEditingPlaylistName(data.list.playlistName || data.list.ownerName || ""); setError("");
  }, []);
  const reload = useCallback(async () => {
    setLoading(true);
    try { await loadMe(); } catch { setError("Liste ayarları yüklenemedi. Tekrar dene."); }
    finally { setLoading(false); }
  }, [loadMe]);
  useEffect(() => { void reload(); }, [reload]);
  const actions = useAccountListActions({
    list, pending: [], loading, editingPlaylistName, friendCode,
    // Profile actions are not exposed by this panel; shared music actions retain their existing behavior.
    profileBio: "", profileStatus: "", pinnedFeedPostId: "", profileShowcaseModules: [],
    profileGenres: "", profileTheme: "aurora", profileDensity: "comfortable", profileBanner: "line", featuredAchievementId: "",
    setList, setLoading, setMessage,
    loadMe: async () => { await loadMe(); await onChanged(); },
    onUnauthorized: () => { setList(null); setError("Oturumun sona erdi. Yeniden giriş yap."); },
  });
  return <div className="library-music-settings">
    <Toast message={message} onClose={() => setMessage(null)} />
    {error && <div role="alert" className="library-error"><p>{error}</p><Button type="button" onClick={() => void reload()} disabled={loading}>Tekrar dene</Button><Link href="/account?mode=login&next=%2Flibrary%3Ftype%3Dmusic">Giriş yap</Link></div>}
    {!list && loading && <p role="status">Liste ayarları yükleniyor…</p>}
    {list && <AccountListPanel
      spotifyPlaylistId={list.spotifyPlaylistId} spotifyExternalUrl={list.spotifyExternalUrl} submitCode={list.submitCode}
      copyServiceUrl={list.spotifyExternalUrl ? `https://www.tunemymusic.com/transfer?source=spotify&url=${encodeURIComponent(list.spotifyExternalUrl)}` : ""}
      rejectedCount={list.suggestions.filter(item => item.status === "rejected").length}
      playlistName={editingPlaylistName} playlistDirty={editingPlaylistName.trim() !== (list.playlistName || list.ownerName || "").trim()}
      friendCode={friendCode} loading={loading} onPlaylistNameChange={setEditingPlaylistName} onFriendCodeChange={setFriendCode}
      onExportList={actions.exportList} onSavePlaylistName={actions.savePlaylistName} onCopyInviteLink={actions.copyInviteLink}
      onRotateInviteCode={actions.rotateInviteCode} onOpenFriendInvite={actions.openFriendInvite}
      onImportComplete={async text => { setMessage(text); await loadMe(); await onChanged(); }}
    />}
    <Link href="/account?tab=requests">Bekleyen arkadaş önerilerini yönet ↗</Link>
  </div>;
}
