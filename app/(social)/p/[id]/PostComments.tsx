"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { Flag, MessageCircle, Reply, Send, Trash2 } from "lucide-react";
import { accountLoginPath } from "@/lib/navigation";
import { FEED_COMMENT_MAX_LENGTH } from "@/lib/feedComments";
import { Button, TextAreaField } from "@/app/components/ui";
import { ModalPortal } from "@/app/components/ModalPortal";
import { ConfirmDialog } from "@/app/components/ConfirmDialog";
import { CommunityReadFeedback } from "@/app/components/CommunityReadFeedback";
import { ContentState } from "@/app/components/ui/ContentState";
import { useDraftNavigationGuard } from "@/app/components/DraftNavigationProvider";
import { communityError, communityFetch, communityRequestStatus } from "@/lib/communityRequest";
import { commentReplyTransition, removeCommentFromList } from "@/lib/commentDraft";
import { isFeedComment, parseFeedCommentList, type FeedCommentItem as CommentItem } from "@/lib/feedCommentPayload";
import { COMMENT_HANDOFF_KEY, parseCommentHandoff } from "@/lib/commentHandoff";

type Viewer = { id: string; role: string } | null;

const dateFormatter = new Intl.DateTimeFormat("tr-TR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export function PostComments({
  postId,
  viewer,
  onMessage,
  loginReturnTo,
}: {
  postId: string;
  viewer: Viewer;
  onMessage: (message: string) => void;
  loginReturnTo?: string;
}) {
  const router = useRouter();
  const [comments, setComments] = useState<CommentItem[]>([]);
  const loginHref = accountLoginPath(loginReturnTo ?? `/p/${postId}#comments`);
  const [total, setTotal] = useState<number | null>(null);
  const [readStatus, setReadStatus] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [body, setBody] = useState("");
  const [replyingTo, setReplyingTo] = useState<{ id: string; author: { ownerName: string } } | null>(null);
  const [sending, setSending] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [reporting, setReporting] = useState<CommentItem | null>(null);
  const [reportReason, setReportReason] = useState("spam");
  const [reportDetails, setReportDetails] = useState("");
  const [reportBusy, setReportBusy] = useState(false);
  const [targetChange, setTargetChange] = useState<{ item: CommentItem | null } | null>(null);
  const [removeTarget, setRemoveTarget] = useState<CommentItem | null>(null);
  const [writeError, setWriteError] = useState(""), [removeError, setRemoveError] = useState("");
  const [loginRequired, setLoginRequired] = useState(false);
  const request = useRef<AbortController | null>(null), input = useRef<HTMLTextAreaElement>(null);
  const posting = useRef(false), removing = useRef(false);
  const busy = sending || Boolean(deletingId) || reportBusy;
  const replyMissing = Boolean(replyingTo && !loading && !comments.some(comment => comment.id === replyingTo.id));
  useDraftNavigationGuard({ dirty: Boolean(body), busy });

  useEffect(() => {
    if (!viewer) return;
    try {
      const raw = sessionStorage.getItem(COMMENT_HANDOFF_KEY);
      sessionStorage.removeItem(COMMENT_HANDOFF_KEY);
      const draft = parseCommentHandoff(raw, viewer.id, postId);
      if (!draft) return;
      setBody(draft.body);
      setReplyingTo(draft.reply ? { id: draft.reply.id, author: { ownerName: draft.reply.ownerName } } : null);
      onMessage("Yorum taslağın geri getirildi. Kontrol edip kendin gönderebilirsin.");
    } catch { /* Storage may be disabled; keep the current editor usable. */ }
  }, [viewer, postId, onMessage]);

  function continueToLogin() {
    if (!viewer || busy) return;
    try {
      sessionStorage.setItem(COMMENT_HANDOFF_KEY, JSON.stringify({ viewerId: viewer.id, postId, body, createdAt: Date.now(),
        reply: replyingTo ? { id: replyingTo.id, ownerName: replyingTo.author.ownerName } : null }));
      router.push(loginHref);
    } catch { setWriteError("Tarayıcı taslağı saklayamadı. Metnini kopyalayıp giriş yapabilirsin; taslağın burada korunuyor."); }
  }

  function changeReply(next: CommentItem | null) {
    const transition = commentReplyTransition(replyingTo?.id ?? null, next?.id ?? null, body, busy);
    if (transition === "blocked" || transition === "unchanged") return;
    if (transition === "confirm") { setTargetChange({ item: next }); return; }
    applyReply(next);
  }
  function applyReply(next: CommentItem | null) {
    setReplyingTo(next); setBody(""); setWriteError(""); setTargetChange(null);
    window.requestAnimationFrame(() => input.current?.focus());
  }

  const loadComments = useCallback(async () => {
    const controller = new AbortController(); request.current?.abort(); request.current = controller;
    setLoading(true);
    setLoadError(null); setReadStatus(null); setTotal(null); setComments([]);
    try {
      const data = await communityFetch<{ comments: CommentItem[]; total: number }>(`/api/feed/${encodeURIComponent(postId)}/comments`, undefined, controller.signal);
      const parsed = parseFeedCommentList(data, postId);
      if (!parsed) throw new Error("Yorum yanıtı doğrulanamadı. Yeniden deneyebilirsin.");
      if (controller.signal.aborted) return;
      setComments(parsed.comments);
      setTotal(parsed.total); setReadStatus(200);
    } catch (error) {
      if (!controller.signal.aborted) { setLoadError(communityError(error)); setReadStatus(communityRequestStatus(error)); }
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [postId]);

  useEffect(() => { void loadComments(); return () => request.current?.abort(); }, [loadComments]);

  async function submitComment(event: FormEvent) {
    event.preventDefault();
    if (!viewer) {
      window.location.href = loginHref;
      return;
    }
    if (posting.current || busy || loading || loadError || replyMissing || body.trim().length < 2) return;
    posting.current = true; setSending(true); setWriteError(""); setLoginRequired(false);
    try {
      const response = await fetch(`/api/feed/${encodeURIComponent(postId)}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body, parentId: replyingTo?.id || null }),
      });
      const data = await response.json().catch(() => ({}));
      if (response.status === 401) setLoginRequired(true);
      if (!response.ok) throw new Error(typeof data?.error === "string" ? data.error : "Yorum gönderilemedi.");
      if (!isFeedComment(data?.comment, true) || data.comment.authorId !== viewer.id
        || data.comment.postId !== postId || data.comment.parentId !== (replyingTo?.id ?? null)
        || comments.some(item => item.id === data.comment.id || item.replies.some(reply => reply.id === data.comment.id))) {
        throw new Error("Yorum yanıtı doğrulanamadı. Taslağın korunuyor; tekrar göndermeden önce yorumları yenileyerek kontrol et.");
      }
      if (replyingTo) {
        setComments((current) => current.map((comment) =>
          comment.id === replyingTo.id
            ? { ...comment, replies: [...comment.replies, data.comment] }
            : comment
        ));
      } else {
        setComments((current) => [...current, data.comment]);
      }
      setTotal((current) => current === null ? null : current + 1);
      setBody("");
      setReplyingTo(null);
      onMessage(replyingTo ? "Yanıtın yayınlandı." : "Yorumun yayınlandı.");
    } catch (error) {
      setWriteError(communityError(error));
    } finally {
      posting.current = false; setSending(false);
    }
  }

  async function removeComment(commentId: string) {
    if (removing.current || busy) return;
    removing.current = true;
    setDeletingId(commentId); setRemoveError("");
    try {
      const response = await fetch(`/api/feed/comments/${encodeURIComponent(commentId)}`, { method: "DELETE" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(typeof data?.error === "string" ? data.error : "Yorum kaldırılamadı.");
      if (data?.removed !== true || data.postId !== postId) throw new Error("Silme yanıtı doğrulanamadı. Yorumları yenileyerek kontrol et.");
      const { removedCount, comments: remaining } = removeCommentFromList(comments, commentId);
      setComments(remaining);
      setTotal((current) => current === null ? null : Math.max(0, current - removedCount));
      setRemoveTarget(null);
      onMessage("Yorum kaldırıldı.");
    } catch (error) {
      setRemoveError(communityError(error));
    } finally {
      removing.current = false; setDeletingId(null);
    }
  }

  function canRemove(item: CommentItem) {
    return viewer?.id === item.authorId || viewer?.role === "admin" || viewer?.role === "moderator";
  }

  async function submitReport() {
    if (!reporting || reportBusy) return;
    setReportBusy(true);
    try {
      const response = await fetch(`/api/feed/comments/${encodeURIComponent(reporting.id)}/reports`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reportReason, details: reportDetails }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Şikâyet gönderilemedi.");
      setReporting(null);
      setReportReason("spam");
      setReportDetails("");
      onMessage("Şikâyet moderasyon ekibine iletildi.");
    } catch (error) {
      onMessage(error instanceof Error ? error.message : "Şikâyet gönderilemedi.");
    } finally {
      setReportBusy(false);
    }
  }

  function renderComment(item: CommentItem, reply = false) {
    return (
      <article key={item.id} className={reply ? "post-comment post-comment-reply" : "post-comment"}>
        <Link href={`/u/${item.author.slug}`} className="nav-avatar post-comment-avatar" aria-label={`${item.author.ownerName} profilini aç`}>
          {item.author.ownerName.slice(0, 1).toUpperCase()}
        </Link>
        <div className="post-comment-content">
          <header>
            <Link href={`/u/${item.author.slug}`}>{item.author.ownerName}</Link>
            <time dateTime={item.createdAt}>{dateFormatter.format(new Date(item.createdAt))}</time>
          </header>
          <p>{item.body}</p>
          <div className="post-comment-actions">
            {!reply && viewer && (
              <button type="button" disabled={busy} onClick={() => changeReply(item)}>
                <Reply size={14} /> Yanıtla
              </button>
            )}
            {canRemove(item) && (
              <button type="button" disabled={busy} onClick={() => { setRemoveError(""); setRemoveTarget(item); }} className="post-comment-remove">
                <Trash2 size={14} /> {deletingId === item.id ? "Kaldırılıyor" : "Kaldır"}
              </button>
            )}
            {viewer && viewer.id !== item.authorId && (
              <button type="button" disabled={busy} onClick={() => setReporting(item)}>
                <Flag size={14} /> Şikâyet et
              </button>
            )}
          </div>
        </div>
      </article>
    );
  }

  return (
    <section id="comments" className="post-comments scroll-mt-24" aria-labelledby="post-comments-title">
      <ConfirmDialog open={targetChange !== null} title="Yanıt hedefini değiştir?" body="Yeni hedefe geçersen yazdığın yorum veya yanıt temizlenecek. İptal edersen mevcut hedef ve metin korunur." confirmLabel="Taslağı bırak ve geç" onCancel={() => setTargetChange(null)} onConfirm={() => targetChange && applyReply(targetChange.item)} />
      <ConfirmDialog open={Boolean(removeTarget)} title="Yorum kaldırılsın mı?" body={`Bu yorum${removeTarget?.replies.length ? ` ve ${removeTarget.replies.length} yanıtı` : ""} görünümden kaldırılacak.${removeError ? ` ${removeError}` : ""}`} confirmLabel="Yorumu kaldır" tone="danger" busy={Boolean(deletingId)} onCancel={() => setRemoveTarget(null)} onConfirm={() => removeTarget && void removeComment(removeTarget.id)} />
      <div className="post-comments-heading">
        <div>
          <p className="section-kicker">Topluluk</p>
          <h2 id="post-comments-title"><MessageCircle size={20} /> Yorumlar <span>{total ?? "—"}</span></h2>
        </div>
      </div>

      <form onSubmit={submitComment} className="post-comment-composer">
        {replyingTo && (
          <div className="post-comment-replying">
            <span><strong>{replyingTo.author.ownerName}</strong> kullanıcısına yanıt veriyorsun</span>
            <button type="button" disabled={busy} onClick={() => changeReply(null)}>Vazgeç</button>
          </div>
        )}
        <TextAreaField
          ref={input}
          label={replyingTo ? "Yanıtın" : "Yorumun"}
          labelMeta={`${body.length}/${FEED_COMMENT_MAX_LENGTH}`}
          value={body}
          maxLength={FEED_COMMENT_MAX_LENGTH}
          rows={3}
          placeholder={viewer ? "Bu parça hakkında ne düşünüyorsun?" : "Yorum yapmak için giriş yap"}
          disabled={!viewer || busy || loading || Boolean(loadError)}
          onChange={(event) => setBody(event.target.value)}
        />
        {writeError && <p role="alert">{writeError}</p>}
        {(writeError || removeError) && <Button type="button" disabled={busy || loading} onClick={() => { setWriteError(""); setRemoveError(""); void loadComments(); }}>Yorumları yenile</Button>}
        {loginRequired && <Button type="button" disabled={busy} onClick={continueToLogin}>Taslağı koruyarak giriş yap</Button>}
        {replyMissing && <p role="status">Yanıtladığın yorum artık görünmüyor. Metnin korunuyor; başka hedefe geçmeden önce taslağı gözden geçir.</p>}
        <div className="post-comment-submit">
          {!viewer && <Link href={loginHref}>Tartışmaya katılmak için giriş yap</Link>}
          <Button type="submit" variant="primary" loading={sending} disabled={!viewer || busy || loading || Boolean(loadError) || replyMissing || body.trim().length < 2} leadingIcon={<Send size={16} />}>
            {replyingTo ? "Yanıtla" : "Yorum yap"}
          </Button>
        </div>
      </form>

      <CommunityReadFeedback loading={loading} error={loadError ?? ""} status={readStatus} loadingLabel="Yorumlar yükleniyor" errorTitle="Yorumlar yüklenemedi" loginHref={loginHref} onRetry={() => void loadComments()} />
      {!loading && !loadError && comments.length === 0 && (
        <ContentState kind="empty" title="Henüz yorum yok"><p>İlk fikri sen bırakabilirsin.</p></ContentState>
      )}
      {!loading && !loadError && comments.length > 0 && (
        <div className="post-comment-list">
          {comments.map((comment) => (
            <div key={comment.id}>
              {renderComment(comment)}
              {comment.replies.length > 0 && (
                <div className="post-comment-replies">
                  {comment.replies.map((reply) => renderComment(reply, true))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {reporting && (
        <ModalPortal onEscape={() => setReporting(null)} busy={reportBusy}><div className="modal-backdrop" role="presentation" onMouseDown={() => { if (!reportBusy) setReporting(null); }}>
          <section className="confirm-card" role="dialog" aria-modal="true" aria-labelledby="comment-report-title" onMouseDown={(event) => event.stopPropagation()}>
            <p className="section-kicker">Topluluk güvenliği</p>
            <h2 id="comment-report-title" className="mt-2 text-xl font-black text-white">Yorumu şikâyet et</h2>
            <p className="mt-2 text-sm leading-6 text-cyan-50/68">Şikâyetin yorum sahibine gösterilmez.</p>
            <label htmlFor="comment-report-reason" className="ui-form-label mt-5 block">Şikâyet nedeni</label>
            <select id="comment-report-reason" value={reportReason} onChange={(event) => setReportReason(event.target.value)} className="ui-field mt-2">
              <option value="spam">Spam veya tekrar</option>
              <option value="abuse">Taciz veya nefret</option>
              <option value="misleading">Yanıltıcı içerik</option>
              <option value="other">Diğer</option>
            </select>
            <TextAreaField fieldClassName="mt-3" label="Açıklama" labelMeta={`${reportDetails.length}/300`} value={reportDetails} maxLength={300} rows={3} onChange={(event) => setReportDetails(event.target.value)} placeholder="İsteğe bağlı kısa açıklama" />
            <div className="mt-5 grid grid-cols-2 gap-2">
              <Button type="button" variant="secondary" disabled={reportBusy} onClick={() => setReporting(null)}>Vazgeç</Button>
              <Button type="button" variant="danger" loading={reportBusy} onClick={() => void submitReport()}>Şikâyeti gönder</Button>
            </div>
          </section>
        </div></ModalPortal>
      )}
    </section>
  );
}
