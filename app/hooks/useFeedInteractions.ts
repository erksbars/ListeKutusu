"use client";

import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import type { FeedEditState } from "../components/FeedPostDialogs";
import type { FeedScope } from "../components/FeedSectionHeader";
import type { FeedPost } from "./feedTypes";

type LoadFeed = (
  scope: FeedScope,
  options?: { append?: boolean; cursor?: string | null }
) => Promise<void>;

type FeedInteractionsOptions = {
  account: { id: string } | null;
  feedScope: FeedScope;
  setFeedPosts: Dispatch<SetStateAction<FeedPost[]>>;
  setMessage: Dispatch<SetStateAction<string | null>>;
  loadFeed: LoadFeed;
  loadLeaderboard: () => Promise<void>;
  onAuthRequired: () => void;
};

export function useFeedInteractions({
  account,
  feedScope,
  setFeedPosts,
  setMessage,
  loadFeed,
  loadLeaderboard,
  onAuthRequired,
}: FeedInteractionsOptions) {
  const [feedAddingIds, setFeedAddingIds] = useState<string[]>([]);
  const [feedLikeBusyIds, setFeedLikeBusyIds] = useState<string[]>([]);
  const [feedFollowBusyIds, setFeedFollowBusyIds] = useState<string[]>([]);
  const [feedSaveBusyIds, setFeedSaveBusyIds] = useState<string[]>([]);
  const [deletePostId, setDeletePostId] = useState<string | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [reportPostId, setReportPostId] = useState<string | null>(null);
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportReason, setReportReason] = useState("spam");
  const [reportDetails, setReportDetails] = useState("");
  const [activePostMenuId, setActivePostMenuId] = useState<string | null>(null);
  const [editingPost, setEditingPost] = useState<FeedEditState | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const feedDialogRef = useRef<HTMLElement>(null);
  const reportDialogOpen = Boolean(reportPostId);
  const editDialogOpen = Boolean(editingPost);

  useEffect(() => {
    if (!reportDialogOpen && !editDialogOpen) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.setTimeout(() => {
      feedDialogRef.current
        ?.querySelector<HTMLElement>("select, input, textarea, button")
        ?.focus();
    }, 0);

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (reportSubmitting || editSaving) return;
        setReportPostId(null);
        setEditingPost(null);
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = feedDialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), select:not([disabled]), input:not([disabled]), textarea:not([disabled]), a[href]'
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
  }, [editDialogOpen, editSaving, reportDialogOpen, reportSubmitting]);

  function requireAccount() {
    if (account) return false;
    onAuthRequired();
    return true;
  }

  async function toggleFeedLike(postId: string) {
    if (requireAccount() || feedLikeBusyIds.includes(postId)) return;
    setFeedLikeBusyIds((current) => [...current, postId]);
    setFeedPosts((current) =>
      current.map((post) =>
        post.id === postId
          ? {
              ...post,
              likedByMe: !post.likedByMe,
              likeCount: Math.max(0, post.likeCount + (post.likedByMe ? -1 : 1)),
            }
          : post
      )
    );

    const rollback = () => {
      setFeedPosts((current) =>
        current.map((post) =>
          post.id === postId
            ? {
                ...post,
                likedByMe: !post.likedByMe,
                likeCount: Math.max(0, post.likeCount + (post.likedByMe ? -1 : 1)),
              }
            : post
        )
      );
    };

    try {
      const res = await fetch("/api/feed/likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        rollback();
        setMessage(data.error || "Beğeni güncellenemedi.");
        return;
      }

      setFeedPosts((current) =>
        current.map((post) =>
          post.id === postId
            ? { ...post, likedByMe: data.liked, likeCount: data.likeCount }
            : post
        )
      );
      window.dispatchEvent(new Event("daily-goals:refresh"));
      window.dispatchEvent(new Event("onboarding:refresh"));
    } catch {
      rollback();
      setMessage("Beğeni güncellenemedi. Bağlantını kontrol edip tekrar dene.");
    } finally {
      setFeedLikeBusyIds((current) => current.filter((id) => id !== postId));
    }
  }

  async function toggleFeedSave(postId: string) {
    if (requireAccount() || feedSaveBusyIds.includes(postId)) return;
    setFeedSaveBusyIds((current) => [...current, postId]);
    setFeedPosts((current) =>
      current.map((post) =>
        post.id === postId ? { ...post, savedByMe: !post.savedByMe } : post
      )
    );

    const rollback = () => {
      setFeedPosts((current) =>
        current.map((post) =>
          post.id === postId ? { ...post, savedByMe: !post.savedByMe } : post
        )
      );
    };

    try {
      const res = await fetch("/api/feed/saves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        rollback();
        setMessage(data.error || "Kayıt durumu güncellenemedi.");
        return;
      }
      setFeedPosts((current) =>
        feedScope === "saved" && !data.saved
          ? current.filter((post) => post.id !== postId)
          : current.map((post) =>
              post.id === postId ? { ...post, savedByMe: data.saved } : post
            )
      );
      setMessage(data.saved ? "Paylaşım kaydedildi." : "Paylaşım kaydedilenlerden çıkarıldı.");
    } catch {
      rollback();
      setMessage("Kayıt durumu güncellenemedi. Bağlantını kontrol edip tekrar dene.");
    } finally {
      setFeedSaveBusyIds((current) => current.filter((id) => id !== postId));
    }
  }

  async function hideFeedPost(postId: string) {
    if (requireAccount()) return;
    try {
      const res = await fetch("/api/feed/hides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage(data.error || "Paylaşım gizlenemedi.");
        return;
      }
      setFeedPosts((current) => current.filter((post) => post.id !== postId));
      setMessage("Bu paylaşımı artık akışında görmeyeceksin.");
    } catch {
      setMessage("Paylaşım gizlenemedi. Bağlantını kontrol edip tekrar dene.");
    }
  }

  async function addFeedPostToList(postId: string) {
    if (requireAccount() || feedAddingIds.includes(postId)) return;
    setFeedAddingIds((current) => [...current, postId]);
    setMessage(null);
    setFeedPosts((current) =>
      current.map((post) =>
        post.id === postId
          ? { ...post, addedByMe: true, addCount: post.addCount + 1 }
          : post
      )
    );

    const rollback = () => {
      setFeedPosts((current) =>
        current.map((post) =>
          post.id === postId
            ? { ...post, addedByMe: false, addCount: Math.max(0, post.addCount - 1) }
            : post
        )
      );
    };

    try {
      const res = await fetch("/api/feed/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok && !data.alreadyExists) {
        rollback();
        setMessage(data.error || "Şarkı listene eklenemedi.");
        return;
      }

      if (data.alreadyExists) {
        setFeedPosts((current) =>
          current.map((post) =>
            post.id === postId
              ? { ...post, addCount: Math.max(0, post.addCount - 1) }
              : post
          )
        );
      }
      setMessage(data.warning || data.message || "Şarkı listene eklendi.");
      window.dispatchEvent(new Event("daily-goals:refresh"));
      window.dispatchEvent(new Event("onboarding:refresh"));
      await loadLeaderboard();
    } catch {
      rollback();
      setMessage("Şarkı listene eklenemedi. Bağlantını kontrol edip tekrar dene.");
    } finally {
      setFeedAddingIds((current) => current.filter((id) => id !== postId));
    }
  }

  async function toggleFeedAuthorFollow(profileId: string) {
    if (requireAccount() || profileId === account?.id || feedFollowBusyIds.includes(profileId)) return;
    setFeedFollowBusyIds((current) => [...current, profileId]);
    setFeedPosts((current) =>
      current.map((post) =>
        post.author.id === profileId
          ? { ...post, followingAuthor: !post.followingAuthor }
          : post
      )
    );

    const rollback = () => {
      setFeedPosts((current) =>
        current.map((post) =>
          post.author.id === profileId
            ? { ...post, followingAuthor: !post.followingAuthor }
            : post
        )
      );
    };

    try {
      const res = await fetch("/api/profiles/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        rollback();
        setMessage(data.error || "Takip işlemi tamamlanamadı.");
        return;
      }

      setFeedPosts((current) =>
        current.map((post) =>
          post.author.id === profileId
            ? { ...post, followingAuthor: data.following }
            : post
        )
      );
      setMessage(data.following ? "Profil takip edildi." : "Takip bırakıldı.");
      window.dispatchEvent(new Event("daily-goals:refresh"));
      if (feedScope === "following" && !data.following) void loadFeed("following");
    } catch {
      rollback();
      setMessage("Takip işlemi tamamlanamadı. Bağlantını kontrol edip tekrar dene.");
    } finally {
      setFeedFollowBusyIds((current) => current.filter((id) => id !== profileId));
    }
  }

  async function deleteFeedPost() {
    if (!deletePostId || deleteBusy) return;
    const targetId = deletePostId;
    setDeleteBusy(true);
    try {
      const res = await fetch(`/api/feed?postId=${encodeURIComponent(targetId)}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage(data.error || "Paylaşım silinemedi.");
        return;
      }
      setFeedPosts((current) => current.filter((post) => post.id !== targetId));
      setDeletePostId(null);
      setMessage("Paylaşım silindi.");
      void loadLeaderboard();
    } catch {
      setMessage("Paylaşım silinemedi. Bağlantını kontrol edip tekrar dene.");
    } finally {
      setDeleteBusy(false);
    }
  }

  async function submitReport() {
    if (!reportPostId || reportSubmitting) return;
    setReportSubmitting(true);
    try {
      const res = await fetch("/api/feed/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: reportPostId, reason: reportReason, details: reportDetails }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage(data.error || "Şikâyet gönderilemedi.");
        return;
      }
      setReportPostId(null);
      setReportReason("spam");
      setReportDetails("");
      setMessage("Şikâyet moderasyon ekibine iletildi.");
    } catch {
      setMessage("Şikâyet gönderilemedi. Bağlantını kontrol edip tekrar dene.");
    } finally {
      setReportSubmitting(false);
    }
  }

  async function savePostEdit() {
    if (!editingPost) return;
    setEditSaving(true);
    try {
      const res = await fetch("/api/feed", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId: editingPost.id,
          tags: editingPost.tags,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.post) {
        setMessage(data.error || "Paylaşım güncellenemedi.");
        return;
      }
      setFeedPosts((current) =>
        current.map((post) =>
          post.id === editingPost.id
            ? { ...post, note: null, tags: data.post.tags || [] }
            : post
        )
      );
      setEditingPost(null);
      setMessage("Paylaşım güncellendi.");
    } catch {
      setMessage("Paylaşım güncellenemedi. Bağlantını kontrol edip tekrar dene.");
    } finally {
      setEditSaving(false);
    }
  }

  return {
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
  };
}
