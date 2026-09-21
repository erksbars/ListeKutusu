"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { Flag, MessageCircle, Reply, Send, Trash2 } from "lucide-react";
import { accountLoginPath } from "@/lib/navigation";
import { FEED_COMMENT_MAX_LENGTH } from "@/lib/feedComments";
import { Button, TextAreaField } from "@/app/components/ui";

type CommentAuthor = {
  id: string;
  ownerName: string;
  slug: string;
  profileTheme: string;
};

type CommentItem = {
  id: string;
  authorId: string;
  body: string;
  createdAt: string;
  author: CommentAuthor;
  replies: CommentItem[];
};

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
}: {
  postId: string;
  viewer: Viewer;
  onMessage: (message: string) => void;
}) {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [body, setBody] = useState("");
  const [replyingTo, setReplyingTo] = useState<CommentItem | null>(null);
  const [sending, setSending] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [reporting, setReporting] = useState<CommentItem | null>(null);
  const [reportReason, setReportReason] = useState("spam");
  const [reportDetails, setReportDetails] = useState("");
  const [reportBusy, setReportBusy] = useState(false);

  const loadComments = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const response = await fetch(`/api/feed/${encodeURIComponent(postId)}/comments`);
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !Array.isArray(data.comments)) {
        throw new Error(data.error || "Yorumlar yüklenemedi.");
      }
      setComments(data.comments);
      setTotal(data.total || 0);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Yorumlar yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => { void loadComments(); }, [loadComments]);

  async function submitComment(event: FormEvent) {
    event.preventDefault();
    if (!viewer) {
      window.location.href = accountLoginPath(`/p/${postId}`);
      return;
    }
    if (sending || body.trim().length < 2) return;
    setSending(true);
    try {
      const response = await fetch(`/api/feed/${encodeURIComponent(postId)}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body, parentId: replyingTo?.id || null }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.comment) throw new Error(data.error || "Yorum gönderilemedi.");
      if (replyingTo) {
        setComments((current) => current.map((comment) =>
          comment.id === replyingTo.id
            ? { ...comment, replies: [...comment.replies, data.comment] }
            : comment
        ));
      } else {
        setComments((current) => [...current, data.comment]);
      }
      setTotal((current) => current + 1);
      setBody("");
      setReplyingTo(null);
      onMessage(replyingTo ? "Yanıtın yayınlandı." : "Yorumun yayınlandı.");
    } catch (error) {
      onMessage(error instanceof Error ? error.message : "Yorum gönderilemedi.");
    } finally {
      setSending(false);
    }
  }

  async function removeComment(commentId: string) {
    if (deletingId) return;
    setDeletingId(commentId);
    try {
      const response = await fetch(`/api/feed/comments/${encodeURIComponent(commentId)}`, { method: "DELETE" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Yorum kaldırılamadı.");
      const rootComment = comments.find((comment) => comment.id === commentId);
      const removedCount = rootComment ? 1 + rootComment.replies.length : 1;
      setComments((current) => current
        .filter((comment) => comment.id !== commentId)
        .map((comment) => ({
          ...comment,
          replies: comment.replies.filter((reply) => reply.id !== commentId),
        }))
      );
      setTotal((current) => Math.max(0, current - removedCount));
      if (replyingTo?.id === commentId) setReplyingTo(null);
      onMessage("Yorum kaldırıldı.");
    } catch (error) {
      onMessage(error instanceof Error ? error.message : "Yorum kaldırılamadı.");
    } finally {
      setDeletingId(null);
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

  function CommentRow({ item, reply = false }: { item: CommentItem; reply?: boolean }) {
    return (
      <article className={reply ? "post-comment post-comment-reply" : "post-comment"}>
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
            {!reply && (
              <button type="button" onClick={() => { setReplyingTo(item); setBody(""); }}>
                <Reply size={14} /> Yanıtla
              </button>
            )}
            {canRemove(item) && (
              <button type="button" disabled={Boolean(deletingId)} onClick={() => void removeComment(item.id)} className="post-comment-remove">
                <Trash2 size={14} /> {deletingId === item.id ? "Kaldırılıyor" : "Kaldır"}
              </button>
            )}
            {viewer && viewer.id !== item.authorId && (
              <button type="button" onClick={() => setReporting(item)}>
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
      <div className="post-comments-heading">
        <div>
          <p className="section-kicker">Topluluk</p>
          <h2 id="post-comments-title"><MessageCircle size={20} /> Yorumlar <span>{total}</span></h2>
        </div>
      </div>

      <form onSubmit={submitComment} className="post-comment-composer">
        {replyingTo && (
          <div className="post-comment-replying">
            <span><strong>{replyingTo.author.ownerName}</strong> kullanıcısına yanıt veriyorsun</span>
            <button type="button" onClick={() => { setReplyingTo(null); setBody(""); }}>Vazgeç</button>
          </div>
        )}
        <TextAreaField
          label={replyingTo ? "Yanıtın" : "Yorumun"}
          labelMeta={`${body.length}/${FEED_COMMENT_MAX_LENGTH}`}
          value={body}
          maxLength={FEED_COMMENT_MAX_LENGTH}
          rows={3}
          placeholder={viewer ? "Bu parça hakkında ne düşünüyorsun?" : "Yorum yapmak için giriş yap"}
          disabled={!viewer || sending}
          onChange={(event) => setBody(event.target.value)}
        />
        <div className="post-comment-submit">
          {!viewer && <Link href={accountLoginPath(`/p/${postId}`)}>Tartışmaya katılmak için giriş yap</Link>}
          <Button type="submit" variant="primary" loading={sending} disabled={!viewer || body.trim().length < 2} leadingIcon={<Send size={16} />}>
            {replyingTo ? "Yanıtla" : "Yorum yap"}
          </Button>
        </div>
      </form>

      {loading && <div className="post-comments-state" role="status">Yorumlar yükleniyor...</div>}
      {!loading && loadError && (
        <div className="post-comments-state post-comments-error">
          <p>{loadError}</p>
          <Button size="sm" onClick={() => void loadComments()}>Tekrar dene</Button>
        </div>
      )}
      {!loading && !loadError && comments.length === 0 && (
        <div className="post-comments-state">Henüz yorum yok. İlk fikri sen bırakabilirsin.</div>
      )}
      {!loading && !loadError && comments.length > 0 && (
        <div className="post-comment-list">
          {comments.map((comment) => (
            <div key={comment.id}>
              <CommentRow item={comment} />
              {comment.replies.length > 0 && (
                <div className="post-comment-replies">
                  {comment.replies.map((reply) => <CommentRow key={reply.id} item={reply} reply />)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {reporting && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => { if (!reportBusy) setReporting(null); }}>
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
        </div>
      )}
    </section>
  );
}
