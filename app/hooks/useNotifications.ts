"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { communityError, communityFetch, communityRequestStatus } from "@/lib/communityRequest";
import type { NotificationPresentationItem } from "@/lib/notificationPresentation";

type Preferences = { follows: boolean; likes: boolean; adds: boolean };
type Payload = { notifications: NotificationPresentationItem[]; unreadCount: number; nextCursor?: string | null; preferences?: Preferences };

export function useNotifications() {
  const [items, setItems] = useState<NotificationPresentationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true), [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(""), [status, setStatus] = useState<number | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null), [actionError, setActionError] = useState("");
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<Preferences>({ follows: true, likes: true, adds: true });
  const [markingRead, setMarkingRead] = useState(false), [savingPreferences, setSavingPreferences] = useState(false);
  const readRequest = useRef<AbortController | null>(null), actionRequest = useRef<AbortController | null>(null);
  const hasSnapshot = useRef(false);
  const alive = useRef(true);

  const clearPrivate = useCallback((cause: unknown) => {
    readRequest.current?.abort();
    hasSnapshot.current = false;
    setItems([]); setUnreadCount(null); setNextCursor(null); setHistoryError(null);
    setPreferences({ follows: true, likes: true, adds: true });
    setStatus(communityRequestStatus(cause)); setError(communityError(cause)); setActionError("");
    setLoading(false); setLoadingMore(false);
  }, []);

  const load = useCallback(async (silent = false, cursor: string | null = null, append = false) => {
    if (actionRequest.current || (silent && readRequest.current)) return;
    const controller = new AbortController(); readRequest.current?.abort(); readRequest.current = controller;
    if (append) { setLoadingMore(true); setHistoryError(null); }
    else { setLoadingMore(false); if (!silent) setLoading(true); }
    try {
      const data = await communityFetch<Payload>(`/api/notifications${cursor ? `?${new URLSearchParams({ cursor })}` : ""}`, undefined, controller.signal);
      if (controller.signal.aborted) return;
      if (!Array.isArray(data.notifications) || !Number.isInteger(data.unreadCount) || data.unreadCount < 0 || (data.nextCursor != null && typeof data.nextCursor !== "string")) throw new Error("Bildirim yanıtı doğrulanamadı. Yeniden deneyebilirsin.");
      if (data.notifications.some(item => !item || typeof item.id !== "string" || typeof item.type !== "string" || !Number.isFinite(Date.parse(item.createdAt))) || (data.preferences && [data.preferences.follows, data.preferences.likes, data.preferences.adds].some(value => typeof value !== "boolean"))) throw new Error("Bildirim yanıtı doğrulanamadı. Yeniden deneyebilirsin.");
      setItems(current => append ? [...current, ...data.notifications.filter(item => !current.some(saved => saved.id === item.id))] : silent ? [...data.notifications, ...current.filter(saved => !saved.type.startsWith("community_event_") && !data.notifications.some(item => item.id === saved.id))] : data.notifications);
      if (!silent || append || !hasSnapshot.current) setNextCursor(data.nextCursor ?? null);
      hasSnapshot.current = true;
      setUnreadCount(data.unreadCount);
      if (data.preferences) setPreferences(data.preferences);
      setStatus(200); setError("");
    } catch (cause) {
      if (controller.signal.aborted) return;
      if ([401, 403].includes(communityRequestStatus(cause) ?? 0)) clearPrivate(cause);
      else if (append) setHistoryError(communityError(cause));
      else { setStatus(communityRequestStatus(cause)); setError(communityError(cause)); setUnreadCount(null); }
    } finally {
      if (!controller.signal.aborted) { setLoading(false); setLoadingMore(false); }
      if (readRequest.current === controller) readRequest.current = null;
    }
  }, [clearPrivate]);

  useEffect(() => {
    alive.current = true;
    void load();
    const refresh = () => { if (document.visibilityState === "visible") void load(true); };
    const timer = window.setInterval(refresh, 60_000);
    document.addEventListener("visibilitychange", refresh);
    // A notification link may navigate immediately; let its explicit PATCH finish.
    return () => { alive.current = false; window.clearInterval(timer); document.removeEventListener("visibilitychange", refresh); readRequest.current?.abort(); };
  }, [load]);

  function startAction() {
    if (actionRequest.current || loading || error || status !== 200) return null;
    readRequest.current?.abort(); readRequest.current = null; setLoadingMore(false);
    const controller = new AbortController(); actionRequest.current = controller;
    setActionError("");
    return controller;
  }

  async function updatePreference(key: keyof Preferences) {
    const controller = startAction(); if (!controller) return;
    const next = { ...preferences, [key]: !preferences[key] };
    setPreferences(next); setSavingPreferences(true);
    try {
      await communityFetch("/api/notifications", { preferences: next }, controller.signal, "PATCH");
    } catch (cause) {
      if (alive.current && !controller.signal.aborted) {
        setPreferences(preferences);
        if ([401, 403].includes(communityRequestStatus(cause) ?? 0)) clearPrivate(cause);
        else setActionError("Bildirim tercihi kaydedilemedi. Önceki tercihin korundu. Yeniden deneyebilirsin.");
      }
    } finally {
      if (alive.current && !controller.signal.aborted) setSavingPreferences(false);
      if (actionRequest.current === controller) actionRequest.current = null;
    }
  }

  async function markRead(ids?: string[]) {
    const controller = startAction(); if (!controller) return;
    const targetIds = ids?.filter(Boolean) ?? [], targets = new Set(targetIds);
    const count = targetIds.length ? items.filter(item => targets.has(item.id) && !item.readAt).length : unreadCount ?? 0;
    setMarkingRead(true);
    try {
      await communityFetch("/api/notifications", targetIds.length ? { ids: targetIds } : {}, controller.signal, "PATCH");
      if (controller.signal.aborted || !alive.current) return;
      setItems(current => current.map(item => !targetIds.length || targets.has(item.id) ? { ...item, readAt: item.readAt || new Date().toISOString() } : item));
      setUnreadCount(current => current === null ? null : targetIds.length ? Math.max(0, current - count) : 0);
    } catch (cause) {
      if (alive.current && !controller.signal.aborted) {
        if ([401, 403].includes(communityRequestStatus(cause) ?? 0)) clearPrivate(cause);
        else setActionError("Bildirim okundu olarak işaretlenemedi. Yeniden deneyebilirsin.");
      }
    } finally {
      if (alive.current && !controller.signal.aborted) setMarkingRead(false);
      if (actionRequest.current === controller) actionRequest.current = null;
    }
  }

  return { items, unreadCount, loading, error, status, historyError, actionError, nextCursor, loadingMore, preferences, markingRead, savingPreferences, load, updatePreference, markRead };
}
