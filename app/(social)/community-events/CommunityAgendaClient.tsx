"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CalendarDays } from "lucide-react";
import { AGENDA_ROLES, AGENDA_VIEWS, type AgendaRole, type AgendaView } from "@/lib/communityAgendaFilters";
import type { CommunityAgendaPage } from "@/lib/communityAgenda";
import { PageTopbar } from "@/app/components/PageTopbar";
import { ConfirmDialog } from "@/app/components/ConfirmDialog";
import { Button, buttonClassName } from "@/app/components/ui/Button";
import { SelectField } from "@/app/components/ui/Field";
import { useCommunityRead } from "../communities/useCommunityRead";
import { communityError, communityFetch } from "../communities/communityFetch";
import { CommunityReadFeedback } from "@/app/components/CommunityReadFeedback";
import { ContentState } from "@/app/components/ui/ContentState";
import { accountLoginPath } from "@/lib/navigation";

export function CommunityAgendaClient({ page, view, role }: { page: number; view: AgendaView; role: AgendaRole }) {
  const router = useRouter(), [revision, setRevision] = useState(0), [busy, setBusy] = useState(false), pending = useRef(false);
  const [writeError, setWriteError] = useState("");
  const [confirm, setConfirm] = useState<{ id: string; slug: string; key: string } | null>(null);
  const query = new URLSearchParams({ page: String(page), view, role }).toString(), api = `/api/communities/agenda?${query}`;
  const { data, error, loading, status: readStatus } = useCommunityRead<CommunityAgendaPage>(api, revision);
  const key = `${api}:${revision}`;
  const latestKey = useRef(key); latestKey.current = key;
  useEffect(() => { setConfirm(null); setWriteError(""); }, [api]);
  const current = confirm?.key === key ? data?.items.find(item => item.id === confirm.id && item.community.slug === confirm.slug && item.canWithdraw) : null;
  function href(patch: { page?: number; view?: string; role?: string } = {}) { return `/community-events?${new URLSearchParams({ page: String(patch.page ?? page), view: patch.view ?? view, role: patch.role ?? role })}`; }
  async function withdraw() {
    if (!current || pending.current) return;
    const item = current;
    pending.current = true; setBusy(true); setWriteError("");
    try {
      await communityFetch(`/api/communities/${encodeURIComponent(item.community.slug)}/events/${encodeURIComponent(item.id)}`, { action: "rsvp", status: "withdrawn" });
      setConfirm(null);
      if (latestKey.current !== key) { setRevision(value => value + 1); return; }
      if (view === "upcoming" && (role === "responded" || !item.isOrganizer) && data?.items.length === 1 && page > 1) router.replace(href({ page: page - 1 }));
      else setRevision(value => value + 1);
    } catch (cause) { if (latestKey.current === key) setWriteError(communityError(cause)); setConfirm(null); }
    finally { pending.current = false; setBusy(false); }
  }
  return <main id="main-content" className="stage-shell min-h-screen bg-app"><section className="ui-page-frame community-page relative mx-auto">
    <PageTopbar title="Etkinliklerim" subtitle="Katılım tercihlerin ve düzenlediğin etkinlikler · yalnız sana özel" icon={<CalendarDays size={22} aria-hidden="true" />} backHref="/" actions={<Link className={buttonClassName()} href="/?kind=event">Etkinlikleri keşfet ↗</Link>} />
    <div className="community-intro"><p>Yaklaşanlarda aktif katılım tercihlerin ve düzenlediklerin gösterilir. Geçmiş ve iptal edilenlerde geri çekilmiş tercihlerin de bulunabilir; bu, fiziksel katılım kaydı değildir.</p><p>Engellenen, kaldırılan veya pasif düzenleyene ait içerikler görünmez. Başkalarının katılım tercihleri bu ekranda paylaşılmaz.</p></div>
    <section className="community-stack" aria-label="Kişisel etkinlik listesi" aria-busy={loading || busy}>
      <div className="community-actions"><SelectField label="Etkinlik zamanı" value={view} disabled={busy} onChange={event => { setConfirm(null); setWriteError(""); router.push(href({ view: event.target.value, page: 1 })); }}>{Object.entries(AGENDA_VIEWS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</SelectField>
        <SelectField label="Etkinlikle ilişkim" value={role} disabled={busy} onChange={event => { setConfirm(null); setWriteError(""); router.push(href({ role: event.target.value, page: 1 })); }}>{Object.entries(AGENDA_ROLES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</SelectField>
        <Button type="button" disabled={loading || busy} onClick={() => { setConfirm(null); setWriteError(""); setRevision(value => value + 1); }}>Etkinliklerimi yenile</Button></div>
      <CommunityReadFeedback loading={loading} error={error} status={readStatus} loadingLabel="Etkinliklerin yükleniyor…" errorTitle="Etkinliklerin yüklenemedi" loginHref={accountLoginPath(href())} onRetry={() => setRevision(value => value + 1)} />
      {writeError && <p role="alert" className="community-error">{writeError}</p>}
      {data && <><p>Sayfa {page} · {data.items.length} görünür etkinlik</p>{!data.items.length && <ContentState kind="empty" title="Bu görünümde etkinliğin yok"><p>Filtrelerini değiştirebilir veya topluluk etkinliklerini keşfedebilirsin. Bu liste fiziksel katılım kaydı değildir.</p></ContentState>}
        {data.items.map(item => <article key={item.id} className="ui-card community-stack"><Link href={`/communities/${encodeURIComponent(item.community.slug)}`}>{item.community.name}{item.community.status === "archived" ? " · Arşivde" : ""}</Link><h2 className="ui-section-title">{item.title}</h2>
          <p><time dateTime={item.startsAt}>{new Intl.DateTimeFormat("tr-TR", { dateStyle: "long", timeStyle: "short", timeZone: item.timeZone }).format(new Date(item.startsAt))}</time> · Türkiye saati</p><p>{item.city} · {item.venue}</p>
          <p>{item.status === "cancelled" ? "Etkinlik iptal edildi." : view === "past" ? "Etkinliğin başlangıcı geçmiş." : "Etkinlik yaklaşıyor."}{item.isOrganizer ? " Düzenleyen sensin; katılımın otomatik sayılmaz." : ` Düzenleyen: ${item.organizer.ownerName}`}</p>
          <p>Tercihin: {item.viewerStatus === "attending" ? "Katılacağım" : item.viewerStatus === "interested" ? "İlgileniyorum" : item.viewerStatus === "withdrawn" ? "Geri çekildi / vazgeçtim" : "Henüz belirtilmedi"}</p>
          <div className="community-actions"><Link className={buttonClassName()} href={`/communities/${encodeURIComponent(item.community.slug)}?section=events&event=${encodeURIComponent(item.id)}`}>Etkinlik detayını aç ↗</Link>{item.canWithdraw && <Button type="button" disabled={busy} onClick={() => { setWriteError(""); setConfirm({ id: item.id, slug: item.community.slug, key }); }}>Katılım tercihimi geri çek</Button>}</div>
        </article>)}
        <nav className="community-actions" aria-label="Kişisel etkinlik sayfaları">{page > 1 && <Link aria-disabled={busy} className={buttonClassName()} href={href({ page: page - 1 })} onClick={event => { if (busy) event.preventDefault(); }}>Önceki etkinlikler</Link>}{data.hasMore && <Link aria-disabled={busy} className={buttonClassName()} href={href({ page: page + 1 })} onClick={event => { if (busy) event.preventDefault(); }}>Sonraki etkinlikler</Link>}</nav>
      </>}
    </section>
    <ConfirmDialog open={Boolean(current)} title="Katılım tercihini geri çek?" body="Katılacağım dediysen koltuğun boşalır. Yeniden katılım, üyelik ve o andaki kapasiteye bağlıdır. Bu işlem düzenlediğin etkinliği iptal etmez." confirmLabel="Tercihimi geri çek" busy={busy} onCancel={() => setConfirm(null)} onConfirm={() => void withdraw()} />
  </section></main>;
}
