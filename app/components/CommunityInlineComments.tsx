"use client";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { MessageCircle } from "lucide-react";
import type { CommunityPostDetail } from "@/lib/communityTypes";
import { accountLoginPath } from "@/lib/navigation";
import { communityRequestStatus } from "@/lib/communityRequest";
import { useCommunityRead } from "../(social)/communities/useCommunityRead";
import { communityError, communityFetch } from "../(social)/communities/communityFetch";
import { useDraftNavigationGuard } from "./DraftNavigationProvider";
import { Button } from "./ui/Button";
import { TextAreaField } from "./ui/Field";
import { ConfirmDialog } from "./ConfirmDialog";
import styles from "./CommunityInlineComments.module.css";

export function CommunityInlineComments({ slug, postId, viewerId, spoiler, returnTo }: { slug: string; postId: string; viewerId: string | null; spoiler: boolean; returnTo: string }) {
  const [open, setOpen] = useState(false), [revealed, setRevealed] = useState(false);
  const [page, setPage] = useState(1), [revision, setRevision] = useState(0);
  const [body, setBody] = useState(""), [busy, setBusy] = useState(false), [error, setError] = useState("");
  const [notice, setNotice] = useState(""), [denied, setDenied] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const pending = useRef(false), mounted = useRef(true), panelId = useId();
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const api = `/api/communities/${encodeURIComponent(slug)}`;
  const readable = open && (!spoiler || revealed);
  const read = useCommunityRead<CommunityPostDetail>(`${api}/posts/${encodeURIComponent(postId)}?page=${page}`, `${revision}:${viewerId}`, readable);
  const canWrite = Boolean(viewerId && read.data?.post.canSave && !denied);
  useDraftNavigationGuard({ dirty: Boolean(body), busy, discard: () => setBody("") });
  useEffect(() => {
    if ([403, 404].includes(read.status ?? 0) || (read.data && !read.data.post.canSave)) setBody("");
  }, [read.status, read.data]);
  async function submit(action: "comment" | "join") {
    if (pending.current || read.loading || !viewerId || (action === "comment" && (!canWrite || body.trim().length < 2))) return;
    pending.current = true; setBusy(true); setError(""); setNotice("");
    try {
      const result = await communityFetch<{ ok: boolean }>(api, { action, ...(action === "comment" ? { postId, body } : {}) });
      if (result?.ok !== true) throw new Error("Yanıt doğrulanamadı. Tekrar göndermeden önce yorumları yenileyerek kontrol et.");
      if (!mounted.current) return;
      if (action === "comment") setBody("");
      setDenied(false); setNotice(action === "comment" ? "Yorumun eklendi." : "Topluluğa katıldın. Artık yorum yazabilirsin."); setRevision(value => value + 1);
    } catch (cause) {
      if (!mounted.current) return;
      setError(communityError(cause));
      if ([403, 404].includes(communityRequestStatus(cause) ?? 0)) { setBody(""); setDenied(true); setRevision(value => value + 1); }
    } finally { pending.current = false; if (mounted.current) setBusy(false); }
  }
  const showComments = readable && read.data && (!read.data.post.spoiler || revealed);
  return <div className={styles.root}>
    <Button type="button" disabled={busy} aria-expanded={open} aria-controls={open ? panelId : undefined} onClick={() => { if (open && body) setConfirmClose(true); else { setOpen(!open); setRevealed(false); } }}><MessageCircle size={16} aria-hidden="true" />{open ? "Yorumları kapat" : "Yorumlar"}</Button>
    <ConfirmDialog open={confirmClose} title="Yorum taslağını kapat?" body="Yazdığın yorum henüz gönderilmedi. Bu taslağı silerek yorumları kapatabilirsin." confirmLabel="Yorumu sil ve kapat" onCancel={() => setConfirmClose(false)} onConfirm={() => { setBody(""); setOpen(false); setRevealed(false); setConfirmClose(false); }} />
    {open && <section id={panelId} className={styles.panel} aria-label="Paylaşım yorumları">
      {(spoiler || read.data?.post.spoiler) && !revealed ? <div className={styles.warning}><p>Bu incelemenin yorumları spoiler içerebilir.</p><Button type="button" onClick={() => setRevealed(true)}>Yorumları göster</Button></div> : <>
        <div className={styles.heading}><h3>Yorumlar</h3><Button type="button" variant="ghost" disabled={busy || read.loading} onClick={() => setRevision(value => value + 1)}>Yenile</Button></div>
        {read.loading && <p role="status">Yorumlar yükleniyor…</p>}
        {read.error && <div role="alert"><p>{read.error}</p><Button type="button" disabled={busy} onClick={() => setRevision(value => value + 1)}>Yeniden dene</Button></div>}
        {showComments && read.data && <>
          {!read.data.comments.length && <p>Henüz yorum yok. Sohbeti sen başlat.</p>}
          <div className={styles.comments}>{read.data.comments.map(comment => <article key={comment.id} className={styles.comment}><Link href={`/u/${encodeURIComponent(comment.author.slug)}`}>{comment.author.ownerName}</Link><time dateTime={comment.createdAt}>{new Date(comment.createdAt).toLocaleDateString("tr-TR")}</time><p>{comment.body}</p></article>)}</div>
          {(page > 1 || read.data.hasMore) && <div className={styles.pager}><Button type="button" disabled={busy || page === 1} onClick={() => setPage(value => value - 1)}>Önceki yorumlar</Button><span>Sayfa {page}</span><Button type="button" disabled={busy || !read.data.hasMore || page >= 100} onClick={() => setPage(value => value + 1)}>Sonraki yorumlar</Button></div>}
          {!viewerId ? <Link href={accountLoginPath(returnTo)}>Yorum yapmak için giriş yap →</Link> : !canWrite && <div className={styles.warning}><p>Yorum yazmak için bu topluluğun aktif üyesi olmalısın.</p><Button type="button" disabled={busy || denied} onClick={() => void submit("join")}>Topluluğa katıl</Button><Link href={`/communities/${encodeURIComponent(slug)}`}>Topluluğu aç →</Link></div>}
        </>}
        {viewerId && (canWrite || body) && <form className={styles.form} onSubmit={event => { event.preventDefault(); void submit("comment"); }}><TextAreaField label="Yorumun" value={body} onChange={event => setBody(event.target.value)} minLength={2} maxLength={800} rows={3} required disabled={busy || !canWrite || read.loading} /><Button type="submit" variant="primary" loading={busy} disabled={!canWrite || read.loading || body.trim().length < 2}>Yorum gönder</Button></form>}
        {error && <p role="alert">{error}</p>}{notice && <p role="status">{notice}</p>}
      </>}
    </section>}
  </div>;
}
