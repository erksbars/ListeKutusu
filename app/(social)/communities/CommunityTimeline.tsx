"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { CommunityTimelinePage } from "@/lib/communityTimeline";
import type { CommunityNavigation } from "@/lib/communityNavigation";
import { communityRequestStatus } from "@/lib/communityRequest";
import { accountLoginPath } from "@/lib/navigation";
import { CommunityFeedCard } from "@/app/components/CommunityFeedCard";
import { ContentState } from "@/app/components/ui/ContentState";
import { Button } from "@/app/components/ui/Button";
import { communityError, communityFetch } from "./communityFetch";
import { validCommunityTimelinePage } from "@/lib/communityTimelinePayload";

type Snapshot = CommunityTimelinePage & { key: string; generation: number };
type Navigate = (patch: Partial<CommunityNavigation>, replace?: boolean) => void;

export function CommunityTimeline({ slug, viewerId, navigation, navigate, active, refreshKey, returnTo }: { slug: string; viewerId: string | null; navigation: CommunityNavigation; navigate: Navigate; active: boolean; refreshKey: number; returnTo: string }) {
  const { kind, reviewKind, savedOnly, eventFilter, cursor } = navigation;
  const page = kind === "event" ? navigation.eventPage : navigation.page;
  const params = new URLSearchParams({ kind, reviewKind: kind === "review" ? reviewKind : "all", saved: savedOnly ? "1" : "0", eventFilter });
  const baseApi = `/api/communities/${encodeURIComponent(slug)}/timeline?${params}`;
  const context = `${viewerId}:${baseApi}`, key = `${context}:${page}:${cursor}`;
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [loading, setLoading] = useState(true), [error, setError] = useState("");
  const [status, setStatus] = useState<number | null>(null), [retry, setRetry] = useState(0);
  const [restoring, setRestoring] = useState<number | null>(null);
  const positions = useRef<{ context: string; cursors: Map<number, string | null> }>({ context, cursors: new Map([[1, null]]) });
  const navigateRef = useRef(navigate); navigateRef.current = navigate;
  const generation = useRef(0);
  const current = snapshot?.key === key ? snapshot : null;
  useEffect(() => {
    if (!active) return;
    if (positions.current.context !== context) positions.current = { context, cursors: new Map([[1, null]]) };
    const controller = new AbortController();
    setLoading(true); setError(""); setStatus(null); setRestoring(null);
    async function read(position: string | null) {
      const result = await communityFetch<CommunityTimelinePage>(`${baseApi}${position ? `&cursor=${encodeURIComponent(position)}` : ""}`, undefined, controller.signal);
      if (!validCommunityTimelinePage(result, slug) || (position !== null && result.nextCursor === position)) throw new Error("Akış yanıtı doğrulanamadı. Yeniden deneyebilirsin.");
      return result;
    }
    async function load() {
      // Resolve old numbered links in small, cancellable cursor batches.
      if (!cursor && page > 1) {
        let reached = Math.max(...[...positions.current.cursors.keys()].filter(value => value <= page));
        for (let step = 0; reached < page && step < 3; step++) {
          const result = await read(positions.current.cursors.get(reached) ?? null);
          if (controller.signal.aborted) return;
          if (!result.nextCursor) { setSnapshot({ key, generation: ++generation.current, items: [], nextCursor: null }); return; }
          positions.current.cursors.set(++reached, result.nextCursor);
        }
        if (reached < page) { setRestoring(reached); return; }
        const resolved = positions.current.cursors.get(page);
        if (resolved) navigateRef.current({ cursor: resolved }, true);
        return;
      }
      const result = await read(cursor);
      if (controller.signal.aborted) return;
      positions.current.cursors.set(page, cursor);
      if (result.nextCursor) positions.current.cursors.set(page + 1, result.nextCursor);
      setSnapshot({ key, generation: ++generation.current, ...result });
    }
    void load().catch(cause => {
      if (controller.signal.aborted) return;
      const code = communityRequestStatus(cause);
      setError(communityError(cause)); setStatus(code);
      if ([401, 403, 404].includes(code ?? 0)) setSnapshot(null);
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [active, baseApi, context, key, cursor, page, refreshKey, retry, slug]);

  function move(nextPage: number, position: string | null) {
    navigate({ cursor: position, ...(kind === "event" ? { eventPage: nextPage } : { page: nextPage }) });
  }
  return <div className="community-stack" aria-label="Topluluk akışı" aria-busy={loading}>
    {loading && <p role="status">Akış yükleniyor…</p>}
    {error && <ContentState kind="error" title={status === 404 ? "Bu topluluk artık görünür değil" : "Akış yüklenemedi"} actions={<Button type="button" disabled={loading} onClick={() => setRetry(value => value + 1)}>Yeniden dene</Button>}><p>{error}</p>{status === 401 && <Link href={accountLoginPath(returnTo)}>Giriş yap</Link>}</ContentState>}
    {restoring !== null && <ContentState kind="empty" title="Eski bağlantıdaki sayfaya dönülüyor" actions={<><Button type="button" onClick={() => setRetry(value => value + 1)}>Devam et</Button><Button type="button" onClick={() => move(1, null)}>Akışın başına dön</Button></>}><p>{restoring}. sayfanın konumu bulundu; hedef {page}. sayfa. Devam etmek sonraki küçük grubu yükler.</p></ContentState>}
    {current && <>
      {!current.items.length && !loading && <ContentState kind="empty" title={savedOnly ? "Bu filtrelerde kaydın yok" : "Bu görünümde paylaşım yok"}><p>İçerik türünü veya zaman filtresini değiştirebilirsin.</p></ContentState>}
      {current.items.map(item => <CommunityFeedCard key={`${item.kind}:${item.id}:${viewerId}`} item={item} viewerId={viewerId} surface="community" refreshKey={current.generation} returnTo={returnTo} onUnsave={savedOnly ? () => setSnapshot(previous => previous?.key === key ? { ...previous, items: previous.items.filter(row => row.id !== item.id || row.kind !== item.kind) } : previous) : undefined} />)}
    </>}
    {(page > 1 || current?.nextCursor) && restoring === null && <nav className="community-actions" aria-label="Topluluk akış sayfaları">
      {page > 1 && <Button type="button" disabled={loading} onClick={() => positions.current.cursors.has(page - 1) ? move(page - 1, positions.current.cursors.get(page - 1) ?? null) : move(1, null)}>{positions.current.cursors.has(page - 1) ? "Önceki paylaşımlar" : "İlk paylaşımlar"}</Button>}
      <span>Sayfa {page}</span>
      {current?.nextCursor && page < 100 && <Button type="button" disabled={loading} onClick={() => move(page + 1, current.nextCursor)}>Sonraki paylaşımlar</Button>}
    </nav>}
  </div>;
}
