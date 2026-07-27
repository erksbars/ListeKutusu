"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CheckCircle2, Clock3, Eye, LockKeyhole, LogIn, MessageSquareText, Send, Trash2 } from "lucide-react";
import { Toast } from "@/app/components/Toast";
import { ConfirmDialog } from "@/app/components/ConfirmDialog";
import { AccountMenu } from "@/app/components/AccountMenu";
import { MobileDock } from "@/app/components/MobileDock";
import { PageTopbar } from "@/app/components/PageTopbar";
import { useSessionNavigation } from "@/app/hooks/useSessionNavigation";

type ForumAuthor = {
  id: string;
  ownerName: string;
  slug: string;
  profileTheme: string;
  createdAt: string;
};

type ForumReply = {
  id: string;
  authorId: string;
  body: string;
  createdAt: string;
  author: ForumAuthor;
};

type ForumThread = {
  id: string;
  slug: string;
  authorId: string;
  category: string;
  categoryLabel: string;
  categoryGroupLabel: string;
  title: string;
  body: string;
  status: string;
  views: number;
  createdAt: string;
  locked: boolean;
  isAuthor: boolean;
  canReply: boolean;
  acceptedReplyId: string | null;
  acceptedAt: string | null;
  author: ForumAuthor;
  replies: ForumReply[];
};

type Account = {
  ownerName: string;
  email: string | null;
  slug: string;
  role?: string | null;
};

const dateFormatter = new Intl.DateTimeFormat("tr-TR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function statusLabel(status: string) {
  if (status === "pending") return "Moderatör onayı bekliyor";
  if (status === "rejected") return "Yayınlanmadı";
  if (status === "removed") return "Kaldırıldı";
  return null;
}

export default function ForumThreadPage() {
  const params = useParams<{ slug: string }>();
  const { goToLogin, logoutToHome } = useSessionNavigation();
  const [thread, setThread] = useState<ForumThread | null>(null);
  const [viewerId, setViewerId] = useState<string | null>(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [deleteReplyId, setDeleteReplyId] = useState<string | null>(null);
  const [deletingReplyId, setDeletingReplyId] = useState<string | null>(null);
  const [acceptingReplyId, setAcceptingReplyId] = useState<string | null>(null);
  const [account, setAccount] = useState<Account | null>(null);

  const loadThread = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/forum/${encodeURIComponent(params.slug)}`);
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error || "Konu yüklenemedi.");
      setThread(data.thread);
      setViewerId(data.viewerId || null);
      setAuthenticated(Boolean(data.authenticated));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Konu yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }, [params.slug]);

  useEffect(() => { void loadThread(); }, [loadThread]);

  useEffect(() => {
    fetch("/api/accounts/me")
      .then(async (response) => {
        if (!response.ok) return;
        const data = await response.json();
        setAccount(data.list || null);
      })
      .catch(() => null);
  }, []);

  async function logoutAccount() {
    try {
      await logoutToHome();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Çıkış işlemi tamamlanamadı.");
    }
  }

  async function submitReply(event: FormEvent) {
    event.preventDefault();
    if (sending || !reply.trim()) return;
    setSending(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/forum/${encodeURIComponent(params.slug)}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: reply }),
      });
      const data = await response.json().catch(() => null);
      if (response.status === 401) {
        goToLogin(`/forum/${params.slug}`);
        return;
      }
      if (!response.ok) throw new Error(data?.error || "Yanıt gönderilemedi.");
      setReply("");
      setMessage("Yanıtın yayınlandı.");
      await loadThread();
    } catch (submitError) {
      setMessage(submitError instanceof Error ? submitError.message : "Yanıt gönderilemedi.");
    } finally {
      setSending(false);
    }
  }

  async function removeReply(id: string) {
    if (deletingReplyId) return;
    setDeleteReplyId(null);
    setDeletingReplyId(id);
    setMessage(null);
    try {
      const response = await fetch(`/api/forum/replies/${id}`, { method: "DELETE" });
      const data = await response.json().catch(() => null);
      if (response.status === 401) {
        goToLogin(`/forum/${params.slug}`);
        return;
      }
      if (!response.ok) throw new Error(data?.error || "Yanıt kaldırılamadı.");
      setMessage("Yanıt kaldırıldı.");
      await loadThread();
    } catch (removeError) {
      setMessage(removeError instanceof Error ? removeError.message : "Yanıt kaldırılamadı.");
    } finally {
      setDeletingReplyId(null);
    }
  }

  async function toggleAcceptedReply(id: string) {
    if (acceptingReplyId) return;
    setAcceptingReplyId(id);
    setMessage(null);
    try {
      const response = await fetch(`/api/forum/replies/${id}/accept`, {
        method: "POST",
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setMessage(data?.error || "Çözüm durumu güncellenemedi.");
        return;
      }
      setThread((current) =>
        current
          ? {
              ...current,
              acceptedReplyId: data.acceptedReplyId ?? null,
              acceptedAt: data.acceptedAt ?? null,
            }
          : current
      );
      setMessage(data.accepted ? "Yanıt çözüm olarak işaretlendi." : "Çözüm işareti kaldırıldı.");
    } catch {
      setMessage("Çözüm durumu güncellenemedi. Bağlantını kontrol edip tekrar dene.");
    } finally {
      setAcceptingReplyId(null);
    }
  }

  const orderedReplies = thread
    ? [...thread.replies].sort((left, right) => {
        if (left.id === thread.acceptedReplyId) return -1;
        if (right.id === thread.acceptedReplyId) return 1;
        return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
      })
    : [];

  return (
    <main id="main-content" tabIndex={-1} className="stage-shell min-h-screen bg-app px-4 pb-24 text-white sm:px-6">
      <Toast message={message} onClose={() => setMessage(null)} />
      <MobileDock authenticated={Boolean(account)} profileSlug={account?.slug} active="forum" />
      <ConfirmDialog
        open={Boolean(deleteReplyId)}
        title="Yanıt kaldırılsın mı?"
        body="Yanıtın tartışmadan kaldırılacak. Bu işlem geri alınamaz."
        confirmLabel="Yanıtı kaldır"
        tone="danger"
        onCancel={() => setDeleteReplyId(null)}
        onConfirm={() => deleteReplyId && void removeReply(deleteReplyId)}
      />
      <section className="ui-page-frame relative mx-auto">
        <PageTopbar
          title="Müzik forumu"
          subtitle="Konu ve yanıtlar"
          icon={<MessageSquareText size={19} />}
          backHref="/forum"
          backLabel="Foruma dön"
          actions={account ? (
            <AccountMenu
              ownerName={account.ownerName}
              email={account.email}
              profileSlug={account.slug}
              role={account.role}
              onLogout={() => void logoutAccount()}
            />
          ) : (
            <Link href={`/account?mode=login&next=/forum/${params.slug}`} className="topbar-primary-button">
              <LogIn size={16} />
              <span>Giriş yap</span>
            </Link>
          )}
        />

        {loading && (
          <div className="forum-detail-skeleton mt-6" role="status" aria-live="polite" aria-label="Konu yükleniyor">
            <section><i /><i /><i /><b /><b /><b /></section>
          </div>
        )}
        {!loading && error && (
          <section className="forum-detail-error mt-6">
            <p>{error}</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <button type="button" onClick={() => void loadThread()} className="primary-action inline-flex h-10 items-center rounded-xl px-4 text-sm font-bold">Tekrar dene</button>
              <Link href="/forum" className="secondary-action inline-flex h-10 items-center rounded-xl px-4 text-sm font-bold">Forum ana sayfası</Link>
            </div>
          </section>
        )}

        {!loading && thread && (
          <div className="forum-conversation mt-6">
            <div className="min-w-0">
              <article className="forum-post forum-post-topic">
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/forum?category=${encodeURIComponent(thread.category)}`} className="forum-category-badge">{thread.categoryGroupLabel} / {thread.categoryLabel}</Link>
                  {statusLabel(thread.status) && <span className="forum-status-badge">{statusLabel(thread.status)}</span>}
                  {thread.acceptedReplyId && <span className="forum-solved-badge"><CheckCircle2 size={13} /> Çözüldü</span>}
                  {thread.locked && <span className="forum-status-badge"><LockKeyhole size={12} /> Kilitli</span>}
                </div>
                <h1 className="mt-3 text-2xl font-bold leading-tight text-white sm:text-3xl">{thread.title}</h1>
                <div className="forum-topic-author">
                  <Link href={`/u/${thread.author.slug}`} className="nav-avatar forum-topic-author-avatar" aria-label={`${thread.author.ownerName} profilini aç`}>
                    {thread.author.ownerName.slice(0, 1).toUpperCase()}
                  </Link>
                  <div className="min-w-0">
                    <Link href={`/u/${thread.author.slug}`} className="forum-topic-author-name">{thread.author.ownerName}</Link>
                    <p>
                      <span><Clock3 size={12} />{dateFormatter.format(new Date(thread.createdAt))}</span>
                      <span><Eye size={12} />{thread.views} görüntülenme</span>
                    </p>
                  </div>
                </div>
                <div className="forum-post-body mt-6 whitespace-pre-wrap text-[15px] leading-7 text-cyan-50/88">{thread.body}</div>
              </article>

              <div className="mt-5 flex items-center justify-between gap-3">
                <h2 className="text-base font-bold text-white">Yanıtlar <span className="text-cyan-200/75">({thread.replies.length})</span></h2>
              </div>
              <div className="mt-3 grid gap-3">
                {thread.replies.length === 0 && <div className="forum-empty-row">Henüz yanıt yok. İlk katkıyı sen yapabilirsin.</div>}
                {orderedReplies.map((item) => {
                  const accepted = thread.acceptedReplyId === item.id;
                  return (
                  <article key={item.id} aria-busy={deletingReplyId === item.id || acceptingReplyId === item.id} className={accepted ? "forum-post forum-post-solution" : "forum-post"}>
                    {accepted && (
                      <div className="forum-solution-heading">
                        <CheckCircle2 size={17} aria-hidden="true" />
                        <strong>Konu sahibinin kabul ettiği çözüm</strong>
                      </div>
                    )}
                    <div className="forum-reply-header">
                      <Link href={`/u/${item.author.slug}`} className="flex min-w-0 items-center gap-3">
                        <span className="nav-avatar h-9 w-9 shrink-0">{item.author.ownerName.slice(0, 1).toUpperCase()}</span>
                        <span className="min-w-0"><strong className="block truncate text-sm text-white">{item.author.ownerName}</strong><small className="text-cyan-50/70">{dateFormatter.format(new Date(item.createdAt))}</small></span>
                      </Link>
                      <div className="forum-reply-actions">
                        {thread.isAuthor && viewerId !== item.authorId && (
                          <button
                            type="button"
                            onClick={() => void toggleAcceptedReply(item.id)}
                            disabled={Boolean(acceptingReplyId)}
                            aria-pressed={accepted}
                            aria-label={accepted ? "Çözüm işaretini kaldır" : "Yanıtı çözüm olarak işaretle"}
                            title={accepted ? "Çözüm işaretini kaldır" : "Yanıtı çözüm olarak işaretle"}
                            className={accepted ? "forum-solution-action forum-solution-action-active" : "forum-solution-action"}
                          >
                            <CheckCircle2 size={15} />
                            <span>{acceptingReplyId === item.id ? "İşleniyor..." : accepted ? "Çözümü kaldır" : "Çözüm olarak işaretle"}</span>
                          </button>
                        )}
                        {viewerId === item.authorId && (
                          <button type="button" disabled={Boolean(deletingReplyId)} onClick={() => setDeleteReplyId(item.id)} className="forum-icon-action" title="Yanıtı kaldır" aria-label="Yanıtı kaldır"><Trash2 size={15} /></button>
                        )}
                      </div>
                    </div>
                    <div className="forum-post-body mt-4 whitespace-pre-wrap text-sm leading-7 text-cyan-50/82">{item.body}</div>
                  </article>
                  );
                })}
              </div>

              {thread.status === "published" && (
                <section className="forum-reply-box mt-5">
                  <h2 className="text-base font-bold text-white">Yanıt yaz</h2>
                  {!authenticated ? (
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-cyan-50/72">
                      <span>Tartışmaya katılmak için hesabına giriş yap.</span>
                      <Link href={`/account?mode=login&next=/forum/${thread.slug}`} className="topbar-primary-button">Giriş yap</Link>
                    </div>
                  ) : thread.locked ? (
                    <p className="mt-3 text-sm text-amber-100/74">Bu konu moderatör tarafından yeni yanıtlara kapatıldı.</p>
                  ) : (
                    <form onSubmit={submitReply} className="mt-3">
                      <label htmlFor="forum-reply" className="mb-2 block text-xs font-bold text-cyan-50/75">Yanıtın</label>
                      <textarea id="forum-reply" value={reply} onChange={(event) => setReply(event.target.value.slice(0, 3000))} minLength={2} required rows={5} aria-describedby="forum-reply-help" placeholder="Deneyimini veya çözüm önerini yaz..." className="forum-reply-input" />
                      <div className="mt-3 flex items-center justify-between gap-3">
                        <span id="forum-reply-help" className="text-xs text-cyan-50/70">{reply.trim().length === 1 ? "Yanıt en az 2 karakter olmalı." : `${reply.length}/3000`}</span>
                        <button type="submit" disabled={sending || reply.trim().length < 2} className="topbar-primary-button disabled:opacity-50"><Send size={15} />{sending ? "Gönderiliyor..." : "Yanıtla"}</button>
                      </div>
                    </form>
                  )}
                </section>
              )}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
