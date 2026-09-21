"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Bell, BellOff, CheckCheck, RefreshCw, Settings2, X } from "lucide-react";
import {
  groupNotifications,
  messageForNotificationGroup,
  type NotificationPresentationItem,
} from "@/lib/notificationPresentation";
import { Checkbox } from "./ui";
import { FeedLoadSentinel } from "./FeedLoadSentinel";
import { useInfiniteScroll } from "@/app/hooks/useInfiniteScroll";

type NotificationPreferences = { follows: boolean; likes: boolean; adds: boolean };

const timeFormatter = new Intl.DateTimeFormat("tr-TR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationPresentationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [actionError, setActionError] = useState(false);
  const [markingRead, setMarkingRead] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<NotificationPreferences>({ follows: true, likes: true, adds: true });
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);

  const notificationSentinelRef = useInfiniteScroll({
    enabled: open && Boolean(nextCursor) && !historyError,
    loading: loadingMore,
    onLoadMore: () => {
      if (nextCursor) void loadNotifications(false, nextCursor, true);
    },
  });

  useEffect(() => {
    loadNotifications();

    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") loadNotifications(true);
    };
    const timer = window.setInterval(() => loadNotifications(true), 60_000);
    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const focusFrame = window.requestAnimationFrame(() => panelRef.current?.focus());

    function closeOnOutsideInteraction(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("mousedown", closeOnOutsideInteraction);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("mousedown", closeOnOutsideInteraction);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  async function loadNotifications(silent = false, cursor: string | null = null, append = false) {
    if (append) setLoadingMore(true);
    else if (!silent) setLoading(true);
    if (append) setHistoryError(null);
    else setLoadError(false);
    try {
      const params = new URLSearchParams();
      if (cursor) params.set("cursor", cursor);
      const res = await fetch(`/api/notifications${params.size ? `?${params.toString()}` : ""}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (append) setHistoryError("Eski bildirimler yüklenemedi.");
        else setLoadError(true);
        return;
      }
      const incoming = Array.isArray(data.notifications) ? data.notifications : [];
      setItems((current) => {
        if (append) {
          return [...current, ...incoming.filter(
            (item: NotificationPresentationItem) => !current.some((saved) => saved.id === item.id)
          )];
        }
        if (silent) {
          return [...incoming, ...current.filter(
            (saved) => !incoming.some((item: NotificationPresentationItem) => item.id === saved.id)
          )];
        }
        return incoming;
      });
      if (!silent || append) setNextCursor(data.nextCursor ?? null);
      setUnreadCount(data.unreadCount || 0);
      if (data.preferences) setPreferences(data.preferences);
    } catch {
      if (append) setHistoryError("Eski bildirimler yüklenirken bağlantı kesildi.");
      else setLoadError(true);
    } finally {
      if (append) setLoadingMore(false);
      else if (!silent) setLoading(false);
    }
  }

  async function updatePreference(key: keyof NotificationPreferences) {
    if (savingPreferences) return;
    const next = { ...preferences, [key]: !preferences[key] };
    setPreferences(next);
    setSavingPreferences(true);
    setActionError(false);
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferences: next }),
      });
      if (!res.ok) {
        setPreferences(preferences);
        setActionError(true);
      }
    } catch {
      setPreferences(preferences);
      setActionError(true);
    } finally {
      setSavingPreferences(false);
    }
  }

  async function markRead(ids?: string[]) {
    if (markingRead) return;
    const targetIds = ids?.filter(Boolean) ?? [];
    const targetIdSet = new Set(targetIds);
    const newlyReadCount = targetIds.length
      ? items.filter((item) => targetIdSet.has(item.id) && !item.readAt).length
      : unreadCount;
    setMarkingRead(true);
    setActionError(false);
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(targetIds.length ? { ids: targetIds } : {}),
      });
      if (!res.ok) {
        setActionError(true);
        return;
      }
      setItems((current) =>
        current.map((item) =>
          !targetIds.length || targetIdSet.has(item.id)
            ? { ...item, readAt: item.readAt || new Date().toISOString() }
            : item
        )
      );
      setUnreadCount((current) =>
        targetIds.length ? Math.max(0, current - newlyReadCount) : 0
      );
    } catch {
      setActionError(true);
    } finally {
      setMarkingRead(false);
    }
  }

  function targetFor(item: NotificationPresentationItem) {
    if (item.forumThread) return `/forum/${item.forumThread.slug}`;
    if (item.post) return `/p/${item.post.id}`;
    return item.actor ? `/u/${item.actor.slug}` : "/";
  }

  const visibleItems = filter === "unread" ? items.filter((item) => !item.readAt) : items;
  const visibleGroups = useMemo(() => groupNotifications(visibleItems), [visibleItems]);

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        data-testid="notification-trigger"
        aria-label={unreadCount > 0 ? `${unreadCount} okunmamış bildirim` : "Bildirimler"}
        title="Bildirimler"
        aria-expanded={open}
        aria-controls="notification-panel"
        onClick={() => setOpen((current) => !current)}
        className="topbar-icon-button relative"
      >
        <Bell size={18} aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="notification-count-badge absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full border-2 bg-cyan-300 px-1 text-xs font-black text-navy">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <section
          ref={panelRef}
          tabIndex={-1}
          id="notification-panel"
          data-testid="notification-panel"
          aria-label="Bildirimler"
          className="sticky-panel absolute right-0 top-full z-40 mt-3 w-[min(420px,calc(100vw-32px))] overflow-hidden rounded-2xl text-left"
        >
          <div className="notification-panel-header">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-100/68">
                Hareketler
              </p>
              <h2 className="mt-1 text-lg font-black text-white">Bildirimler</h2>
            </div>
            <div className="notification-panel-actions">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markRead()}
                disabled={markingRead}
                className="notification-mark-all"
              >
                <CheckCheck size={14} /> <span>{markingRead ? "İşleniyor..." : "Tümünü okundu yap"}</span>
              </button>
            )}
            <button type="button" onClick={() => setSettingsOpen((current) => !current)} className={settingsOpen ? "notification-icon-action is-active" : "notification-icon-action"} aria-label="Bildirim tercihleri" aria-expanded={settingsOpen}><Settings2 size={16} /></button>
            <button type="button" onClick={() => { setOpen(false); triggerRef.current?.focus(); }} className="notification-icon-action" aria-label="Bildirimleri kapat"><X size={16} /></button>
            </div>
          </div>

          <div className="notification-filters">
            <button type="button" onClick={() => setFilter("all")} className={filter === "all" ? "notification-filter-active" : ""}>Tümü</button>
            <button type="button" onClick={() => setFilter("unread")} className={filter === "unread" ? "notification-filter-active" : ""}>Okunmamış <span>{unreadCount}</span></button>
          </div>

          {settingsOpen && (
            <div className="notification-preferences">
              {([
                ["follows", "Yeni takipçiler"],
                ["likes", "Paylaşım beğenileri"],
                ["adds", "Listeye eklemeler"],
              ] as const).map(([key, label]) => (
                <Checkbox
                  key={key}
                  variant="switch"
                  label={label}
                  checked={preferences[key]}
                  disabled={savingPreferences}
                  onChange={() => void updatePreference(key)}
                />
              ))}
            </div>
          )}

          <div className="notification-list">
            {actionError && (
              <p className="mb-2 rounded-lg border border-rose-300/20 bg-rose-300/10 px-3 py-2 text-xs font-semibold text-rose-100">
                Bildirim güncellenemedi. Lütfen tekrar dene.
              </p>
            )}
            {loading && <p className="notification-state" role="status">Yükleniyor...</p>}
            {!loading && loadError && (
              <div className="notification-state notification-state-error">
                <p className="text-sm font-black text-white">Bildirimler yüklenemedi</p>
                <p className="mt-1 text-xs leading-5 text-rose-100/72">
                  Bağlantını kontrol edip yeniden deneyebilirsin.
                </p>
                <button
                  type="button"
                  onClick={() => loadNotifications()}
                  className="secondary-action ui-button-sm mt-3"
                >
                  <RefreshCw size={14} /> <span>Tekrar dene</span>
                </button>
              </div>
            )}
            {!loading && !loadError && visibleGroups.length === 0 && (
              <div className="notification-state notification-state-empty">
                <BellOff size={22} className="mx-auto text-cyan-100/72" />
                <p className="text-sm font-black text-white">{filter === "unread" ? "Okunmamış bildirimin yok" : "Şimdilik sessiz"}</p>
                <p className="mt-1 text-xs leading-5 text-cyan-50/74">
                  {filter === "unread" ? "Yeni hareketler geldiğinde burada görebilirsin." : "Takip, beğeni ve listeye ekleme hareketleri burada görünecek."}
                </p>
              </div>
            )}
            {!loading && !loadError &&
              visibleGroups.map((group) => {
                const item = group.primary;
                return (
                <Link
                  key={group.key}
                  href={targetFor(item)}
                  onClick={() => {
                    if (group.unreadIds.length) void markRead(group.unreadIds);
                    setOpen(false);
                  }}
                  className={`notification-item mb-1 grid grid-cols-[40px_minmax(0,1fr)] gap-3 rounded-xl p-3 ${
                    group.unreadIds.length ? "notification-item-unread" : ""
                  }`}
                >
                  <span className="nav-avatar notification-item-avatar h-10 w-10">
                    {(item.actor?.ownerName || "M").slice(0, 1).toUpperCase()}
                    {group.items.length > 1 && (
                      <span className="notification-group-count" aria-label={`${group.items.length} benzer bildirim`}>
                        {group.items.length > 9 ? "9+" : group.items.length}
                      </span>
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="notification-item-message block text-sm font-semibold leading-5">
                      {messageForNotificationGroup(group)}
                    </span>
                    <span className="notification-item-time mt-1 block text-xs">
                      {timeFormatter.format(new Date(item.createdAt))}
                    </span>
                  </span>
                </Link>
                );
              })}
            {(nextCursor || loadingMore || historyError) && (
              <FeedLoadSentinel
                sentinelRef={notificationSentinelRef}
                loading={loadingMore}
                error={historyError}
                loadingLabel="Eski bildirimler yükleniyor..."
                onRetry={() => {
                  if (nextCursor) void loadNotifications(false, nextCursor, true);
                }}
              />
            )}
          </div>
        </section>
      )}
    </div>
  );
}
