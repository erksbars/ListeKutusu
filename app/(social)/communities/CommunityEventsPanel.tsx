"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { CommunityEventDetail, CommunityEventSummary } from "@/lib/communityTypes";
import { Button } from "@/app/components/ui/Button";
import { SelectField, TextAreaField, TextField } from "@/app/components/ui/Field";
import { ConfirmDialog } from "@/app/components/ConfirmDialog";
import { communityError, communityFetch } from "./communityFetch";
import { CommunityEventEditor } from "./CommunityEventEditor";
import { CommunityEventReport } from "./CommunityEventReport";
import { useCommunityRead } from "./useCommunityRead";
import { CommunityDistributionField } from "@/app/components/CommunityDistributionField";
import type { CommunityNavigation } from "@/lib/communityNavigation";
import { useDraftNavigationGuard } from "@/app/components/DraftNavigationProvider";

type EventList = { events: CommunityEventSummary[]; page: number; hasMore: boolean };
const when = (event: CommunityEventSummary) => new Intl.DateTimeFormat("tr-TR", { dateStyle: "long", timeStyle: "short", timeZone: event.timeZone }).format(new Date(event.startsAt));
function EventFacts({ event }: { event: CommunityEventSummary }) {
  return <div className="community-stack"><p><time dateTime={event.startsAt}>{when(event)}</time> · Türkiye saati</p><p>{event.city} · {event.venue}</p><p>Kapasite: {event.capacity === null ? "Sınır belirtilmedi" : `${event.capacity} kişi`}</p><p>{event.attendingCount} katılacak · {event.interestedCount} ilgileniyor{event.capacity !== null ? ` · ${Math.max(0, event.capacity - event.attendingCount)} yer kaldı` : ""}</p><Link href={`/u/${event.organizer.slug}`}>Düzenleyen: {event.organizer.ownerName}</Link>{event.status === "cancelled" && <p className="community-error">Etkinlik iptal edildi.</p>}</div>;
}
export function CommunityEventsPanel({ slug, canCreate, active, navigation, navigate, onModerationChange, refreshKey = 0, embeddedTimeline = false }: { slug: string; canCreate: boolean; active: boolean; navigation: CommunityNavigation; navigate: (patch: Partial<CommunityNavigation>, replace?: boolean) => void; onModerationChange?: () => void; refreshKey?: number; embeddedTimeline?: boolean }) {
  const api = `/api/communities/${encodeURIComponent(slug)}/events`;
  const { eventFilter: filter, eventPage: page, eventId: selectedId } = navigation;
  const [revision, setRevision] = useState(0);
  const [editing, setEditing] = useState(false);
  const readRevision = JSON.stringify([revision, refreshKey]);
  const { data, loading, error } = useCommunityRead<EventList>(`${api}?${new URLSearchParams({ filter, page: String(page) })}`, readRevision, active && !selectedId && !embeddedTimeline);
  const { data: detail, loading: detailLoading, error: detailError } = useCommunityRead<CommunityEventDetail>(selectedId ? `${api}/${encodeURIComponent(selectedId)}` : null, readRevision, active);
  const [writeError, setWriteError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [createDirty, setCreateDirty] = useState(false);
  const createForm = useRef<HTMLFormElement>(null);
  const requestPageExit = useDraftNavigationGuard({ dirty: canCreate && createDirty, busy,
    discard: () => { createForm.current?.reset(); setCreateDirty(false); }, preserveOnLocalNavigation: true });
  const requestDraftExit = (proceed: () => void) => requestPageExit(proceed, true);
  const busyRef = useRef(false);
  const [confirm, setConfirm] = useState<"cancel" | "remove" | null>(null);
  useEffect(() => { setEditing(false); setConfirm(null); setWriteError(""); }, [selectedId]);
  async function write(url: string, body: Record<string, unknown>, after: () => void, method: "POST" | "PATCH" = "POST") {
    if (busyRef.current) return;
    busyRef.current = true; setBusy(true); setWriteError(""); setMessage("");
    try {
      await communityFetch(url, body, undefined, method); after(); setRevision(value => value + 1);
      setMessage(body.action === "rsvp" ? "Katılım tercihin kaydedildi." : body.action === "report" ? "Bildirim topluluk yönetimine gönderildi." : "Etkinlik işlemi tamamlandı.");
      if (body.action === "report" || body.action === "remove" || url === api) onModerationChange?.();
    }
    catch (error) { setWriteError(communityError(error)); if (body.action === "rsvp") setRevision(value => value + 1); }
    finally { busyRef.current = false; setBusy(false); setConfirm(null); }
  }
  return <section className="community-stack" aria-label="Topluluk etkinlikleri" aria-busy={loading || detailLoading} hidden={!active}>
    {(!embeddedTimeline || selectedId) && <><h2 className="ui-section-title">Etkinlikler</h2><p>Etkinlik duyuruları herkese açık okunur. Aktif topluluk üyeleri katılım tercihini belirtebilir; ilgileniyorum koltuk tüketmez.</p></>}
    {message && <p role="status">{message}</p>}{writeError && <p role="alert" className="community-error">{writeError}</p>}
    <ConfirmDialog open={active && Boolean(confirm && detail)} title={confirm === "remove" ? "Etkinliği kaldır?" : "Etkinliği iptal et?"} body={confirm === "remove" ? "Duyuru artık herkese açık görünmeyecek." : "Duyuru iptal edildi olarak görünmeye devam edecek."} confirmLabel="Onayla" tone="danger" busy={busy} onCancel={() => setConfirm(null)} onConfirm={() => detail && confirm && void write(`${api}/${detail.event.id}`, { action: confirm }, () => { if (confirm === "remove") navigate({ eventId: null }, true); })} />
    {selectedId ? <><Button type="button" disabled={busy || editing} onClick={() => { navigate({ eventId: null }); setWriteError(""); }}>Etkinlik listesine dön</Button>
      {detailLoading && <p role="status">Etkinlik yükleniyor…</p>}{detailError && <div className="community-stack" role="alert"><p>{detailError}</p><Button type="button" onClick={() => setRevision(value => value + 1)}>Etkinliği yeniden yükle</Button></div>}
      {detail && <article className="ui-card community-stack"><h3 className="ui-section-title">{detail.event.title}</h3><EventFacts event={detail.event} /><p>{detail.event.distribution === "general" ? "Genel akışta da gösteriliyor" : "Yalnız topluluk akışında dağıtılıyor"}</p><p className="community-body">{detail.event.description}</p>
        <Link href={`/communities/${encodeURIComponent(slug)}?section=events&event=${encodeURIComponent(detail.event.id)}`}>Etkinlik bağlantısı ↗</Link>
        <p>Tercihin: {detail.event.viewerStatus === "attending" ? "Katılacağım" : detail.event.viewerStatus === "interested" ? "İlgileniyorum" : detail.event.viewerStatus === "withdrawn" ? "Vazgeçtim" : "Henüz belirtilmedi"}</p>
        {detail.canRespond && !editing && <><p>Katılacağını belirttiğinde profil adın düzenleyen ve topluluk yöneticileri tarafından görülebilir. Bu bir rezervasyon veya doğrulanmış fiziksel katılım değildir.</p><div className="community-actions">
          <Button type="button" aria-pressed={detail.event.viewerStatus === "attending"} disabled={busy || (detail.event.capacity !== null && detail.event.attendingCount >= detail.event.capacity && detail.event.viewerStatus !== "attending")} onClick={() => void write(`${api}/${selectedId}`, { action: "rsvp", status: "attending" }, () => {})}>Katılacağım</Button>
          <Button type="button" aria-pressed={detail.event.viewerStatus === "interested"} disabled={busy} onClick={() => void write(`${api}/${selectedId}`, { action: "rsvp", status: "interested" }, () => {})}>İlgileniyorum</Button>
        </div>{detail.event.capacity !== null && detail.event.attendingCount >= detail.event.capacity && <p>Etkinlik dolu. İlgileniyorum seçebilirsin; bekleme listesi yoktur.</p>}</>}
        {detail.canWithdraw && !editing && <Button type="button" disabled={busy} onClick={() => void write(`${api}/${selectedId}`, { action: "rsvp", status: "withdrawn" }, () => {})}>Vazgeçtim</Button>}
        {!detail.canRespond && <p>Yeni katılım için giriş ve aktif topluluk üyeliği gerekir. İptal edilen veya başlangıcı geçmiş etkinliklere yeni katılım kapalıdır.</p>}
        {detail.canReport && !editing && <CommunityEventReport key={detail.event.id} busy={busy} submit={(reason, done) => void write(`${api}/${selectedId}`, { action: "report", reason }, done)} />}
        {detail.reportStatus && <p role="status">{detail.reportStatus === "pending" ? "Bu etkinlik için bildirimin topluluk yönetiminin incelemesini bekliyor." : "Bu etkinlik için bildirimin topluluk yönetimi tarafından incelendi."}</p>}
        {detail.canManage && <section className="community-stack" aria-label="Etkinlik katılımcıları"><h4>Katılacağını belirtenler</h4><p>İlk 200 profil; engelleme filtreleri uygulanır. Katılım tercihidir, gerçekleşmiş katılım kaydı değildir.</p>{!detail.participants.length && <p>Görünür katılımcı yok.</p>}{detail.participants.map(person => <Link key={person.id} href={`/u/${person.slug}`}>{person.ownerName}</Link>)}</section>}
        {detail.canManage && !editing && <div className="community-actions">{detail.event.status === "scheduled" && new Date(detail.event.startsAt) > new Date() && <><Button type="button" disabled={busy} onClick={() => requestDraftExit(() => { setEditing(true); setWriteError(""); })}>Etkinliği düzenle</Button><Button type="button" disabled={busy} onClick={() => setConfirm("cancel")}>Etkinliği iptal et</Button></>}<Button type="button" disabled={busy} onClick={() => setConfirm("remove")}>Etkinliği kaldır</Button></div>}
        {editing && detail.canManage && <><CommunityEventEditor key={`${detail.event.id}:${detail.event.contentVersion}`} event={detail.event} busy={busy} onCancel={() => { setEditing(false); setWriteError(""); }} onSave={payload => void write(`${api}/${selectedId}`, payload, () => setEditing(false), "PATCH")} />{writeError && <Button type="button" disabled={busy} onClick={() => requestDraftExit(() => { setEditing(false); setWriteError(""); setRevision(value => value + 1); })}>Formu kapatıp güncel etkinliği yükle</Button>}</>}
      </article>}
    </> : !embeddedTimeline && <>
      <SelectField label="Etkinlik filtresi" value={filter} disabled={busy} onChange={event => navigate({ eventFilter: event.target.value as CommunityNavigation["eventFilter"], eventPage: 1 })}><option value="upcoming">Yaklaşan</option><option value="past">Başlangıcı geçmiş</option><option value="cancelled">İptal edilen</option></SelectField>
      {loading && <p role="status">Etkinlikler yükleniyor…</p>}{error && <div role="alert" className="community-stack"><p>{error}</p><Button type="button" onClick={() => setRevision(value => value + 1)}>Etkinlikleri yeniden yükle</Button></div>}
      {!loading && data && !data.events.length && <p>Bu görünümde etkinlik yok.</p>}
      {data?.events.map(event => <article className="ui-card community-stack" key={event.id}><h3>{event.title}</h3><EventFacts event={event} /><Button type="button" disabled={busy || loading} onClick={() => { navigate({ eventId: event.id }); setMessage(""); }}>Etkinlik detayını aç</Button></article>)}
      {data && <div className="community-actions"><Button type="button" disabled={page === 1 || busy || loading} onClick={() => navigate({ eventPage: page - 1 })}>Önceki etkinlikler</Button><span>Sayfa {data.page}</span><Button type="button" disabled={!data.hasMore || page >= 100 || busy || loading} onClick={() => navigate({ eventPage: page + 1 })}>Sonraki etkinlikler</Button></div>}
    </>}
    {canCreate && <details hidden={Boolean(selectedId)} className="ui-panel community-stack"><summary>Etkinlik oluştur</summary><form ref={createForm} className="community-stack" onChange={event => {
      const fields = new FormData(event.currentTarget);
      setCreateDirty([...fields.entries()].some(([name, value]) => name === "distribution" ? value !== "community" : String(value).length > 0));
    }} onSubmit={event => {
      event.preventDefault(); const form = event.currentTarget; const fields = new FormData(form);
      const capacity = String(fields.get("capacity") ?? "");
      void write(api, { title: fields.get("title"), description: fields.get("description"), localStart: fields.get("localStart"), timeZone: "Europe/Istanbul", city: fields.get("city"), venue: fields.get("venue"), capacity: capacity === "" ? null : Number(capacity), distribution: fields.get("distribution"), publicLocationConfirmed: fields.get("publicLocationConfirmed") === "on" }, () => { form.reset(); setCreateDirty(false); navigate({ eventFilter: "upcoming", eventPage: 1, cursor: null }, true); });
    }}><h3 className="ui-section-title">Etkinlik oluştur</h3><fieldset disabled={busy || loading} className="community-fieldset community-stack">
      <TextField label="Etkinlik başlığı" name="title" minLength={3} maxLength={120} required />
      <TextAreaField label="Etkinlik açıklaması" name="description" minLength={20} maxLength={5000} rows={4} required />
      <TextField label="Başlangıç tarihi ve saati" name="localStart" type="datetime-local" required hint="Türkiye saati (Europe/Istanbul). Gelecekte, en fazla bir yıl içinde." />
      <TextField label="Şehir" name="city" minLength={2} maxLength={80} required />
      <TextField label="Mekân" name="venue" minLength={3} maxLength={160} required hint="Kamusal bir mekân yaz. Ev adresi veya hassas konum paylaşma." />
      <TextField label="Katılımcı kapasitesi (isteğe bağlı)" name="capacity" type="number" min={2} max={200} step={1} hint="2–200 kişi. Katılacağım koltuk kullanır; ilgileniyorum kullanmaz. Düzenleyen otomatik dahil edilmez." />
      <label className="community-check"><input type="checkbox" name="publicLocationConfirmed" required />Etkinlik ve mekân bilgilerinin herkese açık olduğunu biliyorum.</label>
      <CommunityDistributionField />
      <Button type="submit" variant="primary" loading={busy}>Etkinliği yayınla</Button>
    </fieldset></form></details>}
    {!canCreate && !embeddedTimeline && <p>Etkinlik oluşturmak için giriş yapıp topluluğa katılmalısın; uzaklaştırılan üyeler oluşturamaz.</p>}
  </section>;
}
