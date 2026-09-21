"use client";

import type { Dispatch, SetStateAction } from "react";
import { useRouter } from "next/navigation";
import type { AccountList, Suggestion } from "./accountTypes";
import type { ProfileShowcaseModule } from "@/lib/profileShowcase";
import type { ProfileBanner, ProfileDensity } from "@/lib/profileAppearance";

type AccountListActionsOptions = {
  list: AccountList | null;
  pending: Suggestion[];
  loading: boolean;
  editingPlaylistName: string;
  friendCode: string;
  profileBio: string;
  profileStatus: string;
  pinnedFeedPostId: string;
  profileShowcaseModules: ProfileShowcaseModule[];
  profileGenres: string;
  profileTheme: string;
  profileDensity: ProfileDensity;
  profileBanner: ProfileBanner;
  featuredAchievementId: string;
  setList: Dispatch<SetStateAction<AccountList | null>>;
  setLoading: Dispatch<SetStateAction<boolean>>;
  setMessage: Dispatch<SetStateAction<string | null>>;
  loadMe: () => Promise<void>;
  onUnauthorized: () => void;
};

export function useAccountListActions({
  list,
  pending,
  loading,
  editingPlaylistName,
  friendCode,
  profileBio,
  profileStatus,
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
  onUnauthorized,
}: AccountListActionsOptions) {
  const router = useRouter();
  async function runDecision(id: string, action: "approve" | "reject" | "remove") {
    if (loading) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/accounts/decide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        onUnauthorized();
        return;
      }
      if (!res.ok) {
        setMessage(data.error || "İşlem tamamlanamadı.");
        return;
      }
      setMessage(
        data.warning
          ? data.warning
          : action === "approve"
            ? "Şarkı onaylandı."
            : action === "remove"
              ? "Şarkı listeden çıkarıldı."
              : "Şarkı reddedildi."
      );
      await loadMe();
    } catch {
      setMessage("Bağlantı kurulamadı. İşlemi biraz sonra tekrar dene.");
    } finally {
      setLoading(false);
    }
  }

  async function runDecideAll(action: "approve" | "reject") {
    if (pending.length === 0 || loading) return;

    setLoading(true);
    setMessage(null);
    let success = 0;
    let failed = 0;
    try {
      for (const item of pending) {
        try {
          const res = await fetch("/api/accounts/decide", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: item.id, action }),
          });
          if (res.status === 401) {
            onUnauthorized();
            return;
          }
          if (res.ok) success += 1;
          else failed += 1;
        } catch {
          failed += 1;
        }
      }
      await loadMe();
      setMessage(
        failed > 0
          ? `${success} işlem tamamlandı, ${failed} işlem başarısız. Başarısız olanları tekrar deneyebilirsin.`
          : action === "approve"
            ? `${success} şarkı onaylandı.`
            : `${success} şarkı reddedildi.`
      );
    } finally {
      setLoading(false);
    }
  }

  async function exportList() {
    if (!list || loading) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/lists/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listId: list.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        onUnauthorized();
        return;
      }
      if (!res.ok || !data.list) {
        setMessage(data.error || "Spotify listesi yenilenemedi.");
        return;
      }
      await loadMe();
      setMessage("Spotify listesi yenilendi.");
    } catch {
      setMessage("Spotify senkronuna ulaşılamadı. Biraz sonra yeniden dene.");
    } finally {
      setLoading(false);
    }
  }

  async function savePlaylistName() {
    if (!editingPlaylistName.trim()) {
      setMessage("Liste adı boş olamaz.");
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/accounts/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playlistName: editingPlaylistName }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        onUnauthorized();
        return;
      }
      if (!res.ok || !data.list) throw new Error(data.error || "Liste adı kaydedilemedi.");
      await loadMe();
      setMessage("Liste adı güncellendi.");
    } catch (saveError) {
      setMessage(
        saveError instanceof Error
          ? saveError.message
          : "Liste adı kaydedilemedi. Bağlantını kontrol edip tekrar dene."
      );
    } finally {
      setLoading(false);
    }
  }

  async function copyInviteLink() {
    if (!list?.submitCode) return;
    const url = `${window.location.origin}/suggest?code=${encodeURIComponent(list.submitCode)}`;
    try {
      await navigator.clipboard.writeText(url);
      setMessage("Arkadaş öneri bağlantısı kopyalandı.");
    } catch {
      setMessage(`Bağlantı: ${url}`);
    }
  }

  async function rotateInviteCode() {
    if (loading) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/accounts/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "rotate-code" }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        onUnauthorized();
        return;
      }
      if (!res.ok || !data.list) {
        setMessage(data.error || "Davet kodu yenilenemedi.");
        return;
      }
      setList((current) => (current ? { ...current, ...data.list } : current));
      setMessage("Davet kodu yenilendi. Eski bağlantı artık çalışmaz.");
    } catch {
      setMessage("Davet kodu yenilenemedi. Biraz sonra tekrar dene.");
    } finally {
      setLoading(false);
    }
  }

  function openFriendInvite() {
    const code = friendCode.trim().toUpperCase();
    if (!code) {
      setMessage("Arkadaşının davet kodunu gir.");
      return;
    }
    router.push(`/suggest?code=${encodeURIComponent(code)}`);
  }

  async function saveProfile() {
    const favoriteGenres = profileGenres
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 6);

    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/accounts/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update-profile",
          bio: profileBio,
          profileStatus,
          pinnedFeedPostId,
          profileShowcase: profileShowcaseModules,
          favoriteGenres,
          profileTheme,
          profileDensity,
          profileBanner,
          featuredAchievementId,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        onUnauthorized();
        return;
      }
      if (!res.ok || !data.list) throw new Error(data.error || "Profil kaydedilemedi.");
      setList((current) => (current ? { ...current, ...data.list } : current));
      setMessage("Profil görünümü güncellendi.");
    } catch (profileError) {
      setMessage(
        profileError instanceof Error
          ? profileError.message
          : "Profil kaydedilemedi. Bağlantını kontrol edip tekrar dene."
      );
    } finally {
      setLoading(false);
    }
  }

  return {
    runDecision,
    runDecideAll,
    exportList,
    savePlaylistName,
    copyInviteLink,
    rotateInviteCode,
    openFriendInvite,
    saveProfile,
  };
}
