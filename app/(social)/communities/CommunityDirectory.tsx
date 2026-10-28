"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Users } from "lucide-react";
import { COMMUNITY_CATEGORIES, type CommunityCard } from "@/lib/communityTypes";
import { PageTopbar } from "@/app/components/PageTopbar";
import { Button } from "@/app/components/ui/Button";
import { SelectField, TextAreaField, TextField } from "@/app/components/ui/Field";
import { communityFetch, communityError } from "./communityFetch";
import { COMMUNITY_INTERESTS, EMPTY_DISCOVERY_FILTERS, discoveryFiltersFromParams, discoveryParams, type DiscoveryFilters, type DiscoveredEvent } from "@/lib/communityDiscoveryTypes";
import { CommunityDiscoveryFields, CommunityDiscoveryLabelsView } from "./CommunityDiscoveryFields";
import { CommunityOwnershipInbox } from "./CommunityOwnershipInbox";
import { useDraftNavigationGuard } from "@/app/components/DraftNavigationProvider";
import { formDraftChanged } from "@/lib/formDraft";

type Directory = { communities?: CommunityCard[]; events?: DiscoveredEvent[]; page: number; hasMore: boolean; authenticated: boolean; total: number };
export function CommunityDirectory({ initialFilters = EMPTY_DISCOVERY_FILTERS }: { initialFilters?: DiscoveryFilters }) {
  const router = useRouter();
  const [data, setData] = useState<Directory | null>(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [draft, setDraft] = useState(initialFilters);
  const [filter, setFilter] = useState(initialFilters);
  const [retry, setRetry] = useState(0);
  const [error, setError] = useState("");
  const [createError, setCreateError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const createForm = useRef<HTMLFormElement>(null);
  const [createDirty, setCreateDirty] = useState(false);
  useDraftNavigationGuard({ dirty: authenticated && createDirty, busy: saving,
    discard: () => { createForm.current?.reset(); setCreateDirty(false); }, preserveOnLocalNavigation: true });
  function applyFilters(value: DiscoveryFilters) {
    setFilter(value); setDraft(value);
    const query = discoveryParams(value).toString();
    window.history.pushState(window.history.state, "", `/communities${query ? `?${query}` : ""}`);
  }
  useEffect(() => {
    const sync = () => { const value = discoveryFiltersFromParams(new URLSearchParams(window.location.search)); setFilter(current => JSON.stringify(current) === JSON.stringify(value) ? current : value); setDraft(value); };
    sync();
    window.addEventListener("popstate", sync); return () => window.removeEventListener("popstate", sync);
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError("");
    communityFetch<Directory>(`/api/communities?${discoveryParams(filter)}`, undefined, controller.signal)
      .then(result => { if (!controller.signal.aborted) { setData(result); setAuthenticated(result.authenticated); } })
      .catch(error => { if (!controller.signal.aborted) { setError(communityError(error)); setData(null); } })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [filter, retry]);
  return <main id="main-content" className="stage-shell min-h-screen bg-app"><section className="ui-page-frame community-page relative mx-auto">
    <PageTopbar title="Topluluklar" subtitle="Ortak meraklarını paylaşacak insanları bul." icon={<Users size={22} />} />
    <div className="community-intro"><p className="section-kicker">Birlikte keşfet</p><h2 className="ui-section-title">Bir konu, bir topluluk, yeni bağlantılar.</h2><p>İlgi alanlarına, üniversitelere ve yaşadığın yere ait sohbetlere katıl.</p></div>
    <div className="community-columns">
      <section className="community-stack" aria-label="Topluluk keşfi">
        {authenticated && <CommunityOwnershipInbox />}
        {authenticated && <Link href="/community-cases">Platform başvurularım ↗</Link>}
        {authenticated && <Link href="/community-saved">Topluluk kayıtlarım ↗</Link>}
        {authenticated && <Link href="/community-events">Etkinliklerim ↗</Link>}
        <div className="community-actions" role="group" aria-label="Keşif türü"><Button type="button" variant={filter.view === "communities" ? "primary" : "secondary"} aria-pressed={filter.view === "communities"} onClick={() => applyFilters({ ...draft, view: "communities", page: 1 })}>Toplulukları keşfet</Button><Button type="button" variant={filter.view === "events" ? "primary" : "secondary"} aria-pressed={filter.view === "events"} onClick={() => applyFilters({ ...draft, view: "events", page: 1 })}>Etkinlikleri keşfet</Button></div>
        <form className="ui-panel community-stack" aria-label="Keşif filtreleri" onSubmit={event => { event.preventDefault(); applyFilters({ ...draft, q: draft.q.trim(), university: draft.university.trim(), city: draft.city.trim(), page: 1 }); }}>
          <p>İsim veya içerik aramak için üstteki ortak arama kutusunu kullan.</p>
          <div className="community-discovery-filter-grid">
            <TextField label="Üniversite filtresi" value={draft.university} maxLength={120} onChange={event => setDraft(value => ({ ...value, university: event.target.value }))} hint="Topluluğun açık üniversite etiketi; özel profiller kullanılmaz." />
            <TextField label="Şehir filtresi" value={draft.city} maxLength={80} onChange={event => setDraft(value => ({ ...value, city: event.target.value }))} hint="Etkinliklerde etkinliğin kendi şehrine bakılır." />
            <SelectField label="Topluluk türü" value={draft.category} onChange={event => setDraft(value => ({ ...value, category: event.target.value }))}><option value="">Tüm topluluklar</option>{Object.entries(COMMUNITY_CATEGORIES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</SelectField>
            <SelectField label="İlgi alanı filtresi" value={draft.interest} onChange={event => setDraft(value => ({ ...value, interest: event.target.value }))}><option value="">Tüm ilgi alanları</option>{Object.entries(COMMUNITY_INTERESTS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</SelectField>
          </div>
          <div className="community-actions"><label className="community-check"><input type="checkbox" checked={draft.mine} disabled={!authenticated} onChange={event => setDraft(value => ({ ...value, mine: event.target.checked }))} />Topluluklarım</label><Button type="submit" disabled={loading}>Filtreleri uygula</Button><Button type="button" disabled={loading} onClick={() => applyFilters({ ...EMPTY_DISCOVERY_FILTERS, view: filter.view })}>Filtreleri temizle</Button></div>
        </form>
        {filter.view === "events" && <p>Genel akışa açılmış yaklaşan etkinlikler · En yakın tarih önce. İptal edilen ve yalnız toplulukta dağıtılan duyurular keşfe çıkmaz. Katılım aktif topluluk üyeliği gerektirir.</p>}
        {loading && <p role="status">Keşif yükleniyor…</p>}
        {error && <div role="alert" className="community-error"><p>{error}</p><Button type="button" onClick={() => setRetry(value => value + 1)}>Yeniden dene</Button></div>}
        {!loading && data && <><p>{data.total} {filter.view === "events" ? "etkinlik" : "topluluk"}</p>{!(data.communities?.length || data.events?.length) && <div className="ui-card community-stack"><h3>{data.total ? "Bu sayfada sonuç yok." : filter.view === "events" ? "Bu filtrelerde yaklaşan etkinlik bulunamadı." : "Henüz bir topluluk bulunamadı."}</h3><p>{data.total ? "Önceki sayfaya dönebilir veya filtreleri temizleyebilirsin." : "Filtreleri temizleyebilir veya farklı bir arama yapabilirsin."}</p></div>}
          {data.communities?.map(item => <article key={item.id} className="ui-card community-stack"><span className="section-kicker">{COMMUNITY_CATEGORIES[item.category as keyof typeof COMMUNITY_CATEGORIES]}{item.status === "archived" ? " · Arşiv" : ""}</span><h3><Link href={`/communities/${item.slug}`}>{item.name}</Link></h3><p>{item.description}</p><CommunityDiscoveryLabelsView values={item} /><span>{item.memberCount} üye · Herkese açık</span></article>)}
          {data.events?.map(item => <article key={item.id} className="ui-card community-stack"><Link href={`/communities/${item.community.slug}`}>{item.community.name}</Link><h3><Link href={`/communities/${item.community.slug}?section=events&event=${item.id}`}>{item.title}</Link></h3><p><time dateTime={item.startsAt}>{new Intl.DateTimeFormat("tr-TR", { dateStyle: "long", timeStyle: "short", timeZone: item.timeZone }).format(new Date(item.startsAt))}</time> · Türkiye saati</p><p>{item.city} · {item.venue}</p><CommunityDiscoveryLabelsView values={item.community} /><p>Kapasite: {item.capacity === null ? "Sınır belirtilmedi" : `${item.capacity} kişi`}. Güncel doluluk detayda gösterilir.</p><Link href={`/u/${item.organizer.slug}`}>Düzenleyen: {item.organizer.ownerName}</Link><Link href={`/communities/${item.community.slug}?section=events&event=${item.id}`}>Etkinlik detayını aç ↗</Link></article>)}
          <div className="community-actions"><Button type="button" disabled={filter.page === 1} onClick={() => applyFilters({ ...filter, page: filter.page - 1 })}>Önceki</Button><span>Sayfa {data.page}</span><Button type="button" disabled={!data.hasMore || filter.page >= 100} onClick={() => applyFilters({ ...filter, page: filter.page + 1 })}>Sonraki</Button></div></>}
      </section>
      <aside className="ui-panel community-stack"><h2 className="ui-section-title">Topluluğunu kur</h2><p>Bir ilgi alanı, kampüs veya şehir etrafında sohbet başlat. Oluşturduğun topluluğun kurucusu olursun.</p>
        {authenticated ? <form ref={createForm} className="community-stack" aria-label="Topluluk oluşturma" onChange={event => setCreateDirty(formDraftChanged(new FormData(event.currentTarget), { name: "", category: "interest", universityName: "", city: "", interest: "", description: "", rules: "" }))} onSubmit={async event => {
          event.preventDefault(); if (savingRef.current) return;
          const fields = new FormData(event.currentTarget);
          savingRef.current = true; setSaving(true); setCreateError("");
          try { const result = await communityFetch<{ slug: string }>("/api/communities", Object.fromEntries(fields.entries())); if (typeof result?.slug !== "string" || !/^[a-zA-Z0-9_-]{1,100}$/u.test(result.slug)) throw new Error("Topluluk yanıtı doğrulanamadı. Formun korunuyor; yeniden oluşturmadan önce topluluklarını kontrol et."); setCreateDirty(false); router.push(`/communities/${result.slug}`); }
          catch (error) { setCreateError(communityError(error)); }
          finally { savingRef.current = false; setSaving(false); }
        }}><fieldset disabled={saving} className="community-fieldset community-stack">
          <TextField label="Topluluk adı" name="name" minLength={3} maxLength={60} required />
          <SelectField label="Kategori" name="category">{Object.entries(COMMUNITY_CATEGORIES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</SelectField>
          <CommunityDiscoveryFields />
          <TextAreaField label="Açıklama" name="description" minLength={10} maxLength={600} rows={3} required />
          <TextAreaField label="Topluluk kuralları" name="rules" minLength={10} maxLength={2000} rows={4} required hint="Katılımcılardan beklediğin davranışları açıkça yaz." />
          {createError && <p role="alert" className="community-error">{createError}</p>}<Button type="submit" variant="primary" loading={saving}>Topluluk oluştur</Button>
        </fieldset></form> : <Link href="/account?mode=login&next=%2Fcommunities">Topluluk oluşturmak için giriş yap ↗</Link>}
        <Link href="/forum">Mevcut forum konularına göz at ↗</Link>
      </aside>
    </div>
  </section></main>;
}
