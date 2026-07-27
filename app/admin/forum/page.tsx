"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import {
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  ExternalLink,
  Eye,
  LockKeyhole,
  MessageSquareText,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  Trash2,
  UnlockKeyhole,
  X,
} from "lucide-react";
import { forumCategoryLabel } from "@/lib/forum";
import { Toast } from "@/app/components/Toast";
import { ConfirmDialog } from "@/app/components/ConfirmDialog";
import { PageTopbar } from "@/app/components/PageTopbar";

type AdminReply = {
  id: string;
  body: string;
  status: string;
  createdAt: string;
  author: { ownerName: string; slug: string };
};

type AdminThread = {
  id: string;
  slug: string;
  category: string;
  title: string;
  body: string;
  status: string;
  createdAt: string;
  lastActivityAt: string;
  views: number;
  lockedAt: string | null;
  acceptedReplyId: string | null;
  author: { ownerName: string; slug: string };
  replies: AdminReply[];
  _count: { replies: number };
};

type Status = "pending" | "published" | "rejected" | "removed";
type PendingModeration = {
  id: string;
  action: "reject" | "remove" | "remove-reply";
  title: string;
  body: string;
  confirmLabel: string;
};

const dateFormatter = new Intl.DateTimeFormat("tr-TR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const STATUS_OPTIONS: Array<{ value: Status; label: string; heading: string }> = [
  { value: "pending", label: "Bekleyen", heading: "Yayın onayı bekleyen konular" },
  { value: "published", label: "Yayında", heading: "Yayındaki konular" },
  { value: "rejected", label: "Reddedilen", heading: "Reddedilen konular" },
  { value: "removed", label: "Kaldırılan", heading: "Forumdan kaldırılan konular" },
];

export default function AdminForumPage() {
  const [status, setStatus] = useState<Status>("pending");
  const [threads, setThreads] = useState<AdminThread[]>([]);
  const [stats, setStats] = useState({ pending: 0, published: 0, rejected: 0, removed: 0 });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [unauthorized, setUnauthorized] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [pendingModeration, setPendingModeration] = useState<PendingModeration | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filtersReady, setFiltersReady] = useState(false);
  const [actorLabel, setActorLabel] = useState<string | null>(null);
  const [visibleLimit, setVisibleLimit] = useState(12);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const response = await fetch(`/api/admin/forum?status=${status}`);
      if (response.status === 401) {
        setUnauthorized(true);
        return;
      }
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error || "Forum moderasyonu yüklenemedi.");
      setUnauthorized(false);
      setActorLabel(data.actor?.label || null);
      setThreads(data.threads || []);
      setStats(data.stats || { pending: 0, published: 0, rejected: 0, removed: 0 });
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Forum moderasyonu yüklenemedi.");
      setThreads([]);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    const requestedStatus = new URLSearchParams(window.location.search).get("status");
    if (requestedStatus && STATUS_OPTIONS.some((item) => item.value === requestedStatus)) {
      setStatus(requestedStatus as Status);
    }
    setFiltersReady(true);
  }, []);

  useEffect(() => {
    if (!filtersReady) return;
    const url = new URL(window.location.href);
    if (status === "pending") url.searchParams.delete("status");
    else url.searchParams.set("status", status);
    window.history.replaceState(null, "", `${url.pathname}${url.search}`);
    void load();
  }, [filtersReady, load, status]);

  async function moderate(id: string, action: string) {
    const operationId = `${id}:${action}`;
    if (busyAction) return;
    setBusyAction(operationId);
    try {
      const response = await fetch("/api/admin/forum", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error || "Moderasyon işlemi tamamlanamadı.");
      const labels: Record<string, string> = {
        approve: "Konu yayınlandı.", reject: "Konu reddedildi.", remove: "Konu kaldırıldı.",
        lock: "Konu kilitlendi.", unlock: "Konu yeniden açıldı.", "remove-reply": "Yanıt kaldırıldı.",
      };
      setMessage(labels[action] || "İşlem tamamlandı.");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Moderasyon işlemi tamamlanamadı.");
    } finally {
      setBusyAction(null);
    }
  }

  const filteredThreads = useMemo(() => {
    const normalized = search.trim().toLocaleLowerCase("tr-TR");
    if (!normalized) return threads;
    return threads.filter((thread) =>
      [
        thread.title,
        thread.body,
        thread.author.ownerName,
        forumCategoryLabel(thread.category),
      ].some((value) => value.toLocaleLowerCase("tr-TR").includes(normalized))
    );
  }, [search, threads]);
  const visibleThreads = filteredThreads.slice(0, visibleLimit);

  useEffect(() => {
    setVisibleLimit(12);
  }, [search, status]);

  const activeStatus = STATUS_OPTIONS.find((item) => item.value === status) || STATUS_OPTIONS[0];

  function handleStatusKeyDown(event: ReactKeyboardEvent<HTMLButtonElement>, index: number) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const lastIndex = STATUS_OPTIONS.length - 1;
    const nextIndex = event.key === "Home" ? 0 : event.key === "End" ? lastIndex : event.key === "ArrowRight" ? (index + 1) % STATUS_OPTIONS.length : (index - 1 + STATUS_OPTIONS.length) % STATUS_OPTIONS.length;
    const next = STATUS_OPTIONS[nextIndex].value;
    setStatus(next);
    setSearch("");
    document.getElementById(`admin-forum-tab-${next}`)?.focus();
  }

  return (
    <main id="main-content" tabIndex={-1} className="stage-shell min-h-screen bg-app px-4 pb-16 text-white sm:px-6">
      <Toast message={message} onClose={() => setMessage(null)} />
      <ConfirmDialog
        open={Boolean(pendingModeration)}
        title={pendingModeration?.title || ""}
        body={pendingModeration?.body || ""}
        confirmLabel={pendingModeration?.confirmLabel}
        tone="danger"
        onCancel={() => setPendingModeration(null)}
        onConfirm={() => {
          const action = pendingModeration;
          setPendingModeration(null);
          if (action) void moderate(action.id, action.action);
        }}
      />
      <section className="ui-page-frame relative mx-auto">
        <PageTopbar
          title="Forum moderasyonu"
          subtitle="Konu ve yanıt denetimi"
          icon={<ShieldCheck size={18} />}
          backHref="/forum"
          backLabel="Foruma dön"
          actions={<Link href="/forum" className="topbar-text-button" aria-label="Forumu aç" title="Forumu aç"><ExternalLink size={15} /><span className="hidden sm:inline">Forumu aç</span></Link>}
        />

        {unauthorized ? (
          <section className="admin-forum-auth-state mt-6">
            <ShieldCheck size={28} />
            <h2>Moderatör oturumu gerekli</h2>
            <p>Yetkili kullanıcı hesabınla giriş yap veya tam yönetici oturumunu aç.</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link href="/account?mode=login&next=%2Fadmin%2Fforum" className="primary-action inline-flex h-11 items-center rounded-xl px-5 text-sm font-black">Hesapla giriş yap</Link>
              <Link href="/admin" className="secondary-action inline-flex h-11 items-center rounded-xl px-5 text-sm font-black">Yönetici girişi</Link>
            </div>
          </section>
        ) : (
          <>
            {actorLabel && <p className="admin-forum-actor mt-6">Moderatör: <strong>{actorLabel}</strong></p>}
            <div className="admin-forum-tabs mt-3" role="tablist" aria-label="Moderasyon durumu">
              {STATUS_OPTIONS.map((item, index) => (
                <button
                  key={item.value}
                  id={`admin-forum-tab-${item.value}`}
                  type="button"
                  role="tab"
                  aria-selected={status === item.value}
                  aria-controls="admin-forum-queue"
                  tabIndex={status === item.value ? 0 : -1}
                  onKeyDown={(event) => handleStatusKeyDown(event, index)}
                  onClick={() => {
                    setStatus(item.value);
                    setSearch("");
                  }}
                  className={`admin-forum-tab ${status === item.value ? "admin-forum-tab-active" : ""}`}
                >
                  <span>{item.label}</span>
                  <strong>{stats[item.value]}</strong>
                </button>
              ))}
            </div>

            <section id="admin-forum-queue" role="tabpanel" aria-labelledby={`admin-forum-tab-${status}`} aria-busy={loading} className="admin-forum-queue mt-5">
              <div className="admin-forum-queue-heading">
                <div>
                  <p>Moderasyon kuyruğu</p>
                  <h2>{activeStatus.heading}</h2>
                </div>
                <span aria-live="polite">
                  {loading ? "Yükleniyor" : `${filteredThreads.length} / ${threads.length} konu`}
                </span>
              </div>
              <div className="admin-forum-toolbar">
                <label className="admin-forum-search" htmlFor="admin-forum-search">
                  <Search size={16} aria-hidden="true" />
                  <input
                    id="admin-forum-search"
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value.slice(0, 80))}
                    placeholder="Başlık, içerik, kullanıcı veya kategori ara"
                  />
                  {search && <button type="button" onClick={() => setSearch("")} aria-label="Aramayı temizle"><X size={14} /></button>}
                </label>
                <button type="button" onClick={() => void load()} disabled={loading} className="admin-forum-refresh">
                  <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
                  <span>Yenile</span>
                </button>
              </div>

              {loading && (
                <div className="admin-forum-loading" role="status" aria-live="polite" aria-label="Konular yükleniyor" aria-busy="true">
                  {Array.from({ length: 3 }).map((_, index) => <div key={index}><i /><i /><i /><b /></div>)}
                </div>
              )}
              {!loading && loadError && (
                <div className="forum-state-message forum-state-message-error m-4" role="alert">
                  <RefreshCw size={23} />
                  <strong>Kuyruk yüklenemedi</strong>
                  <p>{loadError}</p>
                  <button type="button" onClick={() => void load()} className="secondary-action">Tekrar dene</button>
                </div>
              )}
              {!loading && !loadError && filteredThreads.length === 0 && (
                <div className="forum-empty-row m-4">
                  {search ? `"${search}" aramasına uyan konu yok.` : "Bu bölümde konu yok."}
                </div>
              )}
              {!loading && !loadError && visibleThreads.map((thread) => (
                <article key={thread.id} className="admin-forum-thread" aria-busy={busyAction?.startsWith(thread.id)}>
                  <div className="admin-forum-thread-main">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="forum-category-badge">{forumCategoryLabel(thread.category)}</span>
                      {thread.acceptedReplyId && <span className="forum-solved-badge"><CheckCircle2 size={12} /> Çözüldü</span>}
                      {thread.lockedAt && <span className="forum-status-badge"><LockKeyhole size={12} /> Kilitli</span>}
                    </div>
                    <h3>{thread.title}</h3>
                    <p className="admin-forum-thread-meta">
                      <span>{thread.author.ownerName}</span>
                      <span><Clock3 size={12} />{dateFormatter.format(new Date(thread.createdAt))}</span>
                      <span><MessageSquareText size={12} />{thread._count.replies} yanıt</span>
                      <span><Eye size={12} />{thread.views} görüntülenme</span>
                    </p>
                    <p className="admin-forum-preview">{thread.body}</p>
                    <details className="admin-forum-content">
                      <summary><span>İçeriği incele</span><ChevronDown size={15} /></summary>
                      <div className="admin-forum-body">{thread.body}</div>
                      {thread.replies.length > 0 && status === "published" && (
                        <div className="admin-forum-replies">
                          <p>Son yanıtlar</p>
                          {thread.replies.map((reply) => (
                            <div key={reply.id} className="admin-forum-reply">
                              <p>
                                <strong>{reply.author.ownerName}:</strong> {reply.body}
                                {thread.acceptedReplyId === reply.id && <span><CheckCircle2 size={12} /> Kabul edilen çözüm</span>}
                              </p>
                              <button
                                type="button"
                                onClick={() => setPendingModeration({
                                  id: reply.id,
                                  action: "remove-reply",
                                  title: "Yanıt kaldırılsın mı?",
                                  body: `${reply.author.ownerName} tarafından yazılan yanıt tartışmadan kaldırılacak.`,
                                  confirmLabel: "Yanıtı kaldır",
                                })}
                                className="forum-icon-action"
                                title="Yanıtı kaldır"
                                aria-label="Yanıtı kaldır"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </details>
                  </div>
                  <div className="admin-forum-actions">
                    {status === "pending" && <button type="button" disabled={Boolean(busyAction)} onClick={() => void moderate(thread.id, "approve")} className="admin-forum-action admin-forum-approve"><Check size={15} />Yayınla</button>}
                    {status === "pending" && <button type="button" disabled={Boolean(busyAction)} onClick={() => setPendingModeration({ id: thread.id, action: "reject", title: "Konu reddedilsin mi?", body: `"${thread.title}" yayınlanmadan reddedilecek.`, confirmLabel: "Konuyu reddet" })} className="admin-forum-action"><X size={15} />Reddet</button>}
                    {status === "published" && <Link href={`/forum/${thread.slug}`} className="admin-forum-action"><ExternalLink size={15} />Görüntüle</Link>}
                    {status === "published" && <button type="button" disabled={Boolean(busyAction)} onClick={() => void moderate(thread.id, thread.lockedAt ? "unlock" : "lock")} className="admin-forum-action">{thread.lockedAt ? <UnlockKeyhole size={15} /> : <LockKeyhole size={15} />}{thread.lockedAt ? "Kilidi aç" : "Kilitle"}</button>}
                    {status === "published" && <button type="button" disabled={Boolean(busyAction)} onClick={() => setPendingModeration({ id: thread.id, action: "remove", title: "Konu kaldırılsın mı?", body: `"${thread.title}" forumdan kaldırılacak ve kullanıcılar artık konuya erişemeyecek.`, confirmLabel: "Konuyu kaldır" })} className="admin-forum-action admin-forum-danger"><Trash2 size={15} />Kaldır</button>}
                    {(status === "rejected" || status === "removed") && <button type="button" disabled={Boolean(busyAction)} onClick={() => void moderate(thread.id, "approve")} className="admin-forum-action admin-forum-approve"><RotateCcw size={15} />Yeniden yayınla</button>}
                  </div>
                </article>
              ))}
              {!loading && !loadError && visibleThreads.length < filteredThreads.length && (
                <button
                  type="button"
                  className="list-reveal admin-forum-reveal"
                  onClick={() => setVisibleLimit((current) => current + 12)}
                >
                  <ChevronDown size={16} aria-hidden="true" />
                  Daha fazla konu
                  <strong>{filteredThreads.length - visibleThreads.length}</strong>
                </button>
              )}
            </section>
          </>
        )}
      </section>
    </main>
  );
}
