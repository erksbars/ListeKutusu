"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { CommunityManagementData, CommunityManagementView } from "@/lib/communityManagementTypes";
import { COMMUNITY_AUDIT_ACTIONS } from "@/lib/communityManagementTypes";
import { Button } from "@/app/components/ui/Button";
import { SelectField, TextField } from "@/app/components/ui/Field";
import { ConfirmDialog } from "@/app/components/ConfirmDialog";
import { communityError, communityFetch } from "./communityFetch";
import { useDraftNavigationGuard, useDraftNavigationRequest } from "@/app/components/DraftNavigationProvider";
import { communityRequestStatus } from "@/lib/communityRequest";

type Mutate = (payload: Record<string, unknown>, message: string, after?: () => void) => Promise<void>;
const when = (date: string) => new Intl.DateTimeFormat("tr-TR", { dateStyle: "short", timeStyle: "short", timeZone: "Europe/Istanbul" }).format(new Date(date));
const kind = (type: string) => ({ event: "Etkinlik", post: "Paylaşım", comment: "Yorum", member: "Üye", community: "Topluluk" })[type] || type;
function ReportReview({ reportId, disabled, busy, mutate }: { reportId: string; disabled: boolean; busy: boolean; mutate: Mutate }) {
  const [note, setNote] = useState("");
  useDraftNavigationGuard({ dirty: Boolean(note), busy, discard: () => setNote("") });
  return <form className="community-stack" aria-label="Bildirim kararı" onSubmit={event => { event.preventDefault(); void mutate({ action: "resolve-report", reportId, moderationNote: note }, "Bildirim incelendi olarak işaretlendi.", () => setNote("")); }}>
    <TextField label="Karar notu (isteğe bağlı)" value={note} onChange={event => setNote(event.target.value)} maxLength={300} disabled={disabled} hint="Yalnız topluluk yönetimi görür. Hassas bilgi ekleme." />
    <Button type="submit" disabled={disabled}>İncelendi</Button>
  </form>;
}
export function CommunityManagementPanel({ slug, viewerId, owner, disabled, readOnly = false, revision, mutate, openPost }: { slug: string; viewerId: string; owner: boolean; disabled: boolean; readOnly?: boolean; revision: number; mutate: Mutate; openPost: (id: string) => void }) {
  const [open, setOpen] = useState(false), [view, setView] = useState<CommunityManagementView>("reports");
  const [page, setPage] = useState(1), [status, setStatus] = useState("pending"), [type, setType] = useState("all");
  const [query, setQuery] = useState(""), [draft, setDraft] = useState("");
  const [data, setData] = useState<CommunityManagementData | null>(null), [loading, setLoading] = useState(false), [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [operation, setOperation] = useState<{ userId: string; operation: string; name: string } | null>(null);
  const [note, setNote] = useState(""), [confirm, setConfirm] = useState(false);
  useDraftNavigationGuard({ dirty: Boolean(operation), busy: disabled,
    discard: () => { setOperation(null); setNote(""); setConfirm(false); } });
  const requestExit = useDraftNavigationRequest(true);
  useEffect(() => {
    if (!open) return;
    const controller = new AbortController(); setLoading(true); setError("");
    const params = new URLSearchParams({ view, page: String(page), status, type, q: query });
    communityFetch<CommunityManagementData>(`/api/communities/${encodeURIComponent(slug)}/management?${params}`, undefined, controller.signal)
      .then(result => { if (!controller.signal.aborted) setData(result); })
      .catch(error => { if (!controller.signal.aborted) { if ([401, 403, 404].includes(communityRequestStatus(error) ?? 0)) setData(null); setError(communityError(error)); } })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [open, slug, view, page, status, type, query, revision, retry]);
  function changeView(value: CommunityManagementView) {
    if (value === view) return;
    requestExit(() => { setView(value); setPage(1); setStatus(value === "members" ? "active" : "pending"); setType("all"); setQuery(""); setDraft(""); setOperation(null); setNote(""); });
  }
  function choose(userId: string, operation: string, name: string) { setOperation({ userId, operation, name }); setNote(""); }
  async function applyMemberOperation() {
    if (!operation) return;
    let saved = false;
    await mutate({ action: "moderate-member", userId: operation.userId, operation: operation.operation, moderationNote: note }, "Üye işlemi kaydedildi.", () => { saved = true; setConfirm(false); setOperation(null); setNote(""); });
    if (!saved) setConfirm(false); // Show the parent's error without discarding the note.
  }
  const blocked = disabled || loading || readOnly;
  return <details className="ui-panel community-stack" open={open}>
    <summary onClick={event => { event.preventDefault(); requestExit(() => setOpen(value => !value)); }}>Topluluğu yönet</summary>
    {open && <section className="community-stack" aria-label="Topluluk yönetimi">
      <div className="community-actions" role="group" aria-label="Yönetim bölümleri">{(["reports", "members", "history"] as const).map(value => <Button type="button" key={value} variant={view === value ? "primary" : "secondary"} disabled={disabled || Boolean(operation)} aria-pressed={view === value} onClick={() => changeView(value)}>{value === "reports" ? "Bildirimler" : value === "members" ? "Üyeler" : "Karar geçmişi"}</Button>)}</div>
      {view === "reports" && <><p>İncelendi içeriği kaldırmaz. Gerekirse detaydan ayrıca kaldır; bu karar da kaydedilir.</p><SelectField label="Bildirim durumu" value={status} disabled={disabled || loading} onChange={event => { const value = event.target.value; requestExit(() => { setStatus(value); setPage(1); }); }}><option value="pending">Bekleyen</option><option value="reviewed">İncelenen</option><option value="all">Tümü</option></SelectField><SelectField label="Bildirim türü" value={type} disabled={disabled || loading} onChange={event => { const value = event.target.value; requestExit(() => { setType(value); setPage(1); }); }}><option value="all">Tümü</option><option value="post">Paylaşım</option><option value="comment">Yorum</option><option value="event">Etkinlik</option></SelectField></>}
      {view === "members" && <><SelectField label="Üye durumu" value={status} disabled={disabled || Boolean(operation)} onChange={event => { setStatus(event.target.value); setPage(1); }}><option value="active">Aktif</option><option value="banned">Uzaklaştırılan</option><option value="all">Tümü</option></SelectField><form className="community-stack" onSubmit={event => { event.preventDefault(); setQuery(draft.trim()); setPage(1); }}><TextField label="Üye ara" value={draft} disabled={disabled || Boolean(operation)} maxLength={100} onChange={event => setDraft(event.target.value)} /><Button type="submit" disabled={disabled || Boolean(operation)}>Üyelerde ara</Button></form></>}
      {view === "history" && <p>Bu özellik eklendikten sonraki kararlar listelenir. Kaldırılan metinler ve şikâyetçinin kimliği burada kopyalanmaz.</p>}
      {loading && <p role="status">Yönetim yükleniyor…</p>}
      {error && <div role="alert" className="community-error"><p>{error}</p><Button type="button" onClick={() => setRetry(value => value + 1)}>Yönetimi yeniden yükle</Button></div>}
      {data && <div hidden={loading || Boolean(error)}>
        <p>{data.total} kayıt · Sayfa {data.page}</p>
        {!data.total && <p>{view === "reports" && status === "pending" ? "Bekleyen bildirim yok." : "Bu filtrelerde kayıt yok."}</p>}
        {data.total > 0 && !data.members.length && !data.reports.length && !data.logs.length && <p>Bu sayfada kayıt kalmadı. Önceki sayfaya dönebilirsin.</p>}
        {data.reports.map(report => <article className="community-stack community-divider" key={report.id}><p>{kind(report.targetType)} bildirimi: {report.reason}</p><p>{when(report.createdAt)} · {report.status === "pending" ? "Bekleyen" : "İncelenen"}</p>
          {report.reviewedAt && <p>İnceleme: {when(report.reviewedAt)} · {report.reviewedBy?.ownerName ?? "Silinmiş hesap"}</p>}
          {report.status === "reviewed" && !report.reviewedAt && <p>Eski kayıt: inceleyen ve karar tarihi kaydedilmemiş.</p>}
          {report.targetType === "event" && <a href={`/communities/${encodeURIComponent(slug)}?section=events&event=${encodeURIComponent(report.targetId)}`}>Etkinliği incele ↗</a>}
          {report.postId && <Button type="button" disabled={blocked} onClick={() => openPost(report.postId!)}>İçeriği incele</Button>}
          {report.status === "pending" && <ReportReview reportId={report.id} disabled={blocked} busy={disabled} mutate={mutate} />}
        </article>)}
        {data.members.map(item => <article className="community-stack community-divider" key={item.userId}><Link href={`/u/${item.user.slug}`}>{item.user.ownerName}</Link><span>{item.status === "banned" ? "Uzaklaştırıldı" : item.role === "owner" ? "Sahip" : item.role === "moderator" ? "Moderatör" : "Üye"}</span>
          {item.userId !== viewerId && item.role !== "owner" && (owner || item.role !== "moderator") && <div className="community-actions"><Button type="button" disabled={blocked || Boolean(operation)} onClick={() => choose(item.userId, item.status === "banned" ? "unban" : "ban", item.user.ownerName)}>{item.status === "banned" ? "Engeli kaldır" : "Uzaklaştır"}</Button>{owner && item.status === "active" && <Button type="button" disabled={blocked || Boolean(operation)} onClick={() => choose(item.userId, item.role === "moderator" ? "demote" : "promote", item.user.ownerName)}>{item.role === "moderator" ? "Moderatörlüğü kaldır" : "Moderatör yap"}</Button>}</div>}
        </article>)}
        {data.logs.map(log => <article className="community-stack community-divider" key={log.id}><h3>{COMMUNITY_AUDIT_ACTIONS[log.action] || "Yönetim işlemi"}</h3><p>{when(log.createdAt)} · {log.actor?.ownerName ?? "Silinmiş hesap"}</p><p>{kind(log.targetType)} · {log.targetId}</p>{log.note && <p>Not: {log.note}</p>}</article>)}
        <div className="community-actions"><Button type="button" disabled={page === 1 || disabled || loading || Boolean(operation)} onClick={() => requestExit(() => setPage(value => value - 1))}>Önceki yönetim sayfası</Button><Button type="button" disabled={!data.hasMore || page >= 100 || disabled || loading || Boolean(operation)} onClick={() => requestExit(() => setPage(value => value + 1))}>Sonraki yönetim sayfası</Button></div>
      </div>}
      {operation && <form className="community-stack community-divider" onSubmit={event => { event.preventDefault(); setConfirm(true); }}><p>{operation.name}: {COMMUNITY_AUDIT_ACTIONS[operation.operation]}</p><TextField label="Üye işlemi notu (isteğe bağlı)" value={note} onChange={event => setNote(event.target.value)} maxLength={300} disabled={disabled} hint="Yalnız topluluk yönetimi görür. Hassas bilgi ekleme." /><Button type="submit" disabled={blocked}>Üye işlemini onayla</Button><Button type="button" disabled={disabled} onClick={() => requestExit(() => { setOperation(null); setNote(""); })}>Üye işleminden vazgeç</Button></form>}
      <ConfirmDialog open={confirm} title="Üye işlemini uygula?" body={`${operation?.name ?? ""} için seçilen rol/katılım değişikliği kaydedilecek.`} busy={disabled} onCancel={() => setConfirm(false)} onConfirm={() => void applyMemberOperation()} />
    </section>}
  </details>;
}
