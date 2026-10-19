"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Bell, CheckCheck, Settings2, X } from "lucide-react";
import {
  groupNotifications,
  messageForNotificationGroup,
  targetForNotification,
  type NotificationPresentationItem,
} from "@/lib/notificationPresentation";
import { Checkbox } from "./ui";
import { FeedLoadSentinel } from "./FeedLoadSentinel";
import { useInfiniteScroll } from "@/app/hooks/useInfiniteScroll";
import { useNotifications } from "@/app/hooks/useNotifications";
import { CommunityReadFeedback } from "./CommunityReadFeedback";
import { ContentState } from "./ui/ContentState";
import { accountLoginPath } from "@/lib/navigation";

const timeFormatter = new Intl.DateTimeFormat("tr-TR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const { items, unreadCount, loading, error: loadError, status, actionError, markingRead, savingPreferences, nextCursor, loadingMore, historyError, preferences, load: loadNotifications, updatePreference, markRead } = useNotifications();
  const ready = !loading && !loadError && status === 200;
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);

  const notificationSentinelRef = useInfiniteScroll({
    enabled: open && ready && Boolean(nextCursor) && !historyError,
    loading: loadingMore,
    onLoadMore: () => {
      if (nextCursor) void loadNotifications(false, nextCursor, true);
    },
  });

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

  function targetFor(item: NotificationPresentationItem) {
    return targetForNotification(item);
  }

  const visibleItems = filter === "unread" ? items.filter((item) => !item.readAt) : items;
  const visibleGroups = useMemo(() => groupNotifications(visibleItems), [visibleItems]);

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        data-testid="notification-trigger"
        aria-label={(unreadCount ?? 0) > 0 ? `${unreadCount} okunmamış bildirim` : "Bildirimler"}
        title="Bildirimler"
        aria-expanded={open}
        aria-controls="notification-panel"
        onClick={() => setOpen((current) => !current)}
        className="topbar-icon-button relative"
      >
        <Bell size={18} aria-hidden="true" />
        {unreadCount !== null && unreadCount > 0 && (
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
            {ready && unreadCount !== null && unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markRead()}
                disabled={markingRead || savingPreferences}
                className="notification-mark-all"
              >
                <CheckCheck size={14} /> <span>{markingRead ? "İşleniyor..." : "Tümünü okundu yap"}</span>
              </button>
            )}
            <button type="button" disabled={!ready} onClick={() => setSettingsOpen((current) => !current)} className={settingsOpen ? "notification-icon-action is-active" : "notification-icon-action"} aria-label="Bildirim tercihleri" aria-expanded={ready && settingsOpen}><Settings2 size={16} /></button>
            <button type="button" onClick={() => { setOpen(false); triggerRef.current?.focus(); }} className="notification-icon-action" aria-label="Bildirimleri kapat"><X size={16} /></button>
            </div>
          </div>

          <div className="notification-filters">
            <button type="button" onClick={() => setFilter("all")} className={filter === "all" ? "notification-filter-active" : ""}>Tümü</button>
            <button type="button" onClick={() => setFilter("unread")} className={filter === "unread" ? "notification-filter-active" : ""}>Okunmamış <span>{unreadCount ?? "—"}</span></button>
          </div>

          {ready && settingsOpen && (
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
                  disabled={savingPreferences || markingRead}
                  onChange={() => void updatePreference(key)}
                />
              ))}
            </div>
          )}

          <div className="notification-list">
            {actionError && <ContentState kind="error" title="İşlem tamamlanamadı"><p>{actionError}</p></ContentState>}
            <CommunityReadFeedback loading={loading} error={loadError} status={status} loadingLabel="Bildirimler yükleniyor" errorTitle="Bildirimler yüklenemedi" loginHref={accountLoginPath(typeof window === "undefined" ? "/" : `${window.location.pathname}${window.location.search}`)} onRetry={() => void loadNotifications()} />
            {!loading && !loadError && visibleGroups.length === 0 && (
              <ContentState kind="empty" title={filter === "unread" ? "Okunmamış bildirimin yok" : "Şimdilik sessiz"}>
                <p>
                  {filter === "unread" ? "Yeni hareketler geldiğinde burada görebilirsin." : "Takip, beğeni ve listeye ekleme hareketleri burada görünecek."}
                </p>
              </ContentState>
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
            {ready && (nextCursor || loadingMore || historyError) && (
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
