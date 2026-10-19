"use client";

import Link from "next/link";
import { TVmazeAttribution } from "@/app/components/TVmazeAttribution";
import { useCallback, useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { Toast } from "@/app/components/Toast";
import { Button } from "@/app/components/ui/Button";
import { SelectField, TextField } from "@/app/components/ui/Field";
import { ContentState } from "@/app/components/ui/ContentState";
import { MEDIA_STATUSES } from "@/lib/mediaLibrary";
import type { CatalogItem, MediaKind } from "@/lib/mediaCatalog";

type Selection = CatalogItem & { selectionToken: string };
type Entry = Omit<CatalogItem, "id"> & { id: string; catalogId: string; status: string; showcasedAt: string | null };
const detail = (item: Pick<CatalogItem, "year" | "creators">) => [item.year, ...item.creators].filter(Boolean).join(" · ") || "Ek bilgi bulunmuyor";
const errorMessage = (error: unknown, fallback: string) => error instanceof Error && !(error instanceof TypeError) && !(error instanceof SyntaxError) ? error.message : fallback;

export function LibraryClient({ kind }: { kind: MediaKind }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Selection[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [searchRetry, setSearchRetry] = useState(0);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [access, setAccess] = useState<"ready" | "login" | "disabled" | "unknown">("unknown");
  const [busy, setBusy] = useState<string | null>(null);
  const busyRef = useRef(false);
  const listVersion = useRef(0);
  const [removeId, setRemoveId] = useState<string | null>(null);
  const [publishId, setPublishId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");

  const load = useCallback(async (after?: string) => {
    const version = ++listVersion.current;
    setLoading(true); setListError("");
    try {
      const params = new URLSearchParams({ kind, ...(after ? { after } : {}) });
      const response = await fetch(`/api/library?${params}`, { cache: "no-store" });
      const data = await response.json();
      if (version !== listVersion.current) return;
      if (!response.ok) {
        if (response.status === 401 || response.status === 503) {
          setAccess(response.status === 401 ? "login" : "disabled"); setEntries([]); setCursor(null);
        }
        throw new Error(data.error || "Kitaplık yüklenemedi.");
      }
      setAccess("ready");
      setEntries(previous => after ? [...previous, ...data.entries.filter((entry: Entry) => !previous.some(existing => existing.id === entry.id))] : data.entries);
      setCursor(data.nextCursor);
    } catch (error) {
      if (version === listVersion.current) setListError(errorMessage(error, "Kitaplık yüklenemedi. Bağlantını kontrol edip tekrar dene."));
    } finally {
      if (version === listVersion.current) setLoading(false);
    }
  }, [kind]);

  useEffect(() => {
    const versionRef = listVersion;
    setEntries([]); setCursor(null); setRemoveId(null); setActionError("");
    void load();
    return () => { versionRef.current++; };
  }, [load]);

  useEffect(() => {
    const controller = new AbortController();
    setResults([]); setSearchError(""); setSearchLoading(false);
    if (query.trim().length < 2 || access !== "ready") return;
    setSearchLoading(true);
    const timeout = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/catalog/search?${new URLSearchParams({ kind, q: query.trim() })}`, { signal: controller.signal, cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Arama tamamlanamadı.");
        if (!controller.signal.aborted) setResults(data.results);
      } catch (error) {
        if (!controller.signal.aborted) setSearchError(errorMessage(error, "Arama tamamlanamadı. Bağlantını kontrol edip tekrar dene."));
      } finally {
        if (!controller.signal.aborted) setSearchLoading(false);
      }
    }, 500);
    return () => { window.clearTimeout(timeout); controller.abort(); };
  }, [kind, query, access, searchRetry]);

  async function mutate(key: string, method: string, body: object, success: string) {
    if (busyRef.current) return;
    busyRef.current = true; setBusy(key); setActionError("");
    try {
      const response = await fetch("/api/library", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "İşlem tamamlanamadı.");
      if (method === "POST") {
        setEntries(previous => [data.entry, ...previous.filter(entry => entry.id !== data.entry.id)]);
      } else if (method === "PATCH") {
        setEntries(previous => previous.map(entry => entry.id === data.id ? { ...entry, ...data } : entry));
        setPublishId(null);
      } else {
        setEntries(previous => previous.filter(entry => entry.id !== key)); setRemoveId(null);
        // A deleted record may be the current pagination boundary.
        await load();
      }
      setMessage(success);
    } catch (error) {
      setActionError(errorMessage(error, "İşlem tamamlanamadı. Bağlantını kontrol et."));
    } finally { busyRef.current = false; setBusy(null); }
  }

  return <div>
      <Toast message={message} tone="success" onClose={() => setMessage(null)} />
      <p className="library-source">Bu liste özel. Yalnız vitrine aldığın eserler profilinde herkese görünür; son 6 seçimin gösterilir.</p>
      {actionError && <p className="library-error" role="alert">{actionError}</p>}
      <div className="library-columns">
        <section className="library-search" aria-labelledby="catalog-heading">
          <h2 id="catalog-heading" className="ui-section-title">Yeni bir keşif ekle</h2>
          <TextField label={kind === "book" ? "Kitap veya yazar ara" : kind === "tv" ? "Dizi ara" : "Film ara"} type="search" value={query} maxLength={120} disabled={access !== "ready" || Boolean(busy)} leadingIcon={<Search size={17} />} onChange={event => setQuery(event.target.value)} hint="En az 2 karakter yaz; sonuçlar kısa bir beklemeden sonra gelir." />
          <div aria-live="polite" aria-busy={searchLoading}>
            {searchLoading ? <p className="library-empty">Katalog aranıyor…</p> : searchError ? <div className="library-error" role="alert"><p>{searchError}</p><Button type="button" onClick={() => setSearchRetry(value => value + 1)}>Aramayı tekrar dene</Button></div> : query.trim().length < 2 ? <p className="library-empty">Bir isimle başla. Beğendiğin sonucu kitaplığına ekle.</p> : access === "ready" && results.length === 0 ? <p className="library-empty">Sonuç bulunamadı. Farklı bir isim deneyebilirsin.</p> : null}
          </div>
          <div className="library-cards">{results.map(item => {
            const saved = entries.some(entry => entry.catalogId === item.id);
            return <article className="ui-card library-card" key={item.id}>
              <h3>{item.title}</h3><p>{detail(item)}</p>
              <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer">{item.provider === "wikidata" ? "Wikidata" : item.provider === "tvmaze" ? "TVmaze" : item.provider === "tmdb" ? "TMDB" : "Open Library"} kaydı ↗</a>
              <Button type="button" disabled={Boolean(busy) || saved || loading} loading={busy === item.id} onClick={() => void mutate(item.id, "POST", { selectionToken: item.selectionToken, status: kind === "book" ? "to_read" : "to_watch" }, "Kitaplığına eklendi.")}>{saved ? "Kitaplıkta" : "Kitaplığıma ekle"}</Button>
            </article>;
          })}</div>
          <p className="library-source">{kind === "tv" ? <TVmazeAttribution /> : kind === "book" ? <>Kitap verileri: <a href="https://openlibrary.org" target="_blank" rel="noopener noreferrer">Open Library</a>.</> : <>Film verileri: <a href="https://www.wikidata.org" target="_blank" rel="noopener noreferrer">Wikidata</a> (CC0).</>} Kapak ve oynatma bu sürümde bulunmuyor.</p>
        </section>
        <section aria-labelledby="library-heading" aria-busy={loading}>
          <div className="library-heading"><h2 id="library-heading" className="ui-section-title">Kayıtlı {kind === "book" ? "kitaplarım" : kind === "tv" ? "dizilerim" : "filmlerim"}</h2><span>{access === "ready" && (!listError || entries.length > 0) ? `${entries.length}${cursor ? "+" : ""} kayıt` : "—"}</span></div>
          {listError && <ContentState kind={access === "login" ? "login" : access === "disabled" ? "unavailable" : "error"} title={access === "login" ? "Kitaplığın için giriş yap" : access === "disabled" ? "Kitaplık şu anda kullanılamıyor" : "Kitaplık yüklenemedi"} actions={access === "login" ? <Link className="ui-button ui-button-primary ui-button-md" href={`/account?mode=login&next=${encodeURIComponent(`/library?type=${kind}`)}`}>Giriş yap</Link> : <Button type="button" disabled={loading || Boolean(busy)} onClick={() => void load()}>Yeniden dene</Button>}><p>{listError}</p></ContentState>}
          {loading && <ContentState kind="loading" title="Kitaplık yükleniyor…" />}
          {!loading && !listError && !entries.length && <ContentState kind="empty" title="Bu raf henüz boş."><p>Soldan bir keşif ekleyerek başlayabilirsin. Kayıtların profilinde paylaşılmaz.</p></ContentState>}
          <div className="library-cards">{entries.map(entry => <article className="ui-card library-card" key={entry.id}>
            <h3>{entry.title}</h3><p>{detail(entry)}</p><p>{entry.showcasedAt ? "Profil vitrini için seçildi · Herkese açık" : "Özel kayıt · Yalnız sen görebilirsin"}</p><a href={entry.sourceUrl} target="_blank" rel="noopener noreferrer">Kaynak kaydı ↗</a>
            {entry.showcasedAt ? <Button type="button" disabled={Boolean(busy) || loading} onClick={() => void mutate(entry.id, "PATCH", { id: entry.id, showcase: false }, "Eser vitrinden kaldırıldı; kitaplığında özel kaldı.")}>Vitrinden kaldır</Button> : publishId === entry.id ? <div className="library-confirm"><p>Bu eserin adı, yılı, yazarı ve kaynak bağlantısı profilinde herkese görünecek. Okuma/izleme durumun özel kalır.</p><Button type="button" disabled={Boolean(busy) || loading} onClick={() => void mutate(entry.id, "PATCH", { id: entry.id, showcase: true }, "Eser profil vitrinin için seçildi.")}>Herkese açık vitrine ekle</Button><Button type="button" disabled={Boolean(busy)} onClick={() => setPublishId(null)}>Paylaşmaktan vazgeç</Button></div> : <Button type="button" disabled={Boolean(busy) || loading} onClick={() => setPublishId(entry.id)}>Profil vitrinine ekle</Button>}
            <SelectField label={`${entry.title} durumu`} value={entry.status} disabled={Boolean(busy) || loading} onChange={event => void mutate(entry.id, "PATCH", { id: entry.id, status: event.target.value }, "Durum güncellendi.")}>{Object.entries(MEDIA_STATUSES[entry.kind]).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</SelectField>
            {removeId === entry.id ? <div className="library-confirm"><p>Bu kaydı kitaplığından kaldırmak istiyor musun?</p><Button type="button" variant="danger" disabled={Boolean(busy) || loading} onClick={() => void mutate(entry.id, "DELETE", { id: entry.id }, "Kitaplığından kaldırıldı.")}>Kaldırmayı onayla</Button><Button type="button" disabled={Boolean(busy)} onClick={() => setRemoveId(null)}>Vazgeç</Button></div> : <Button type="button" variant="ghost" disabled={Boolean(busy) || loading} onClick={() => setRemoveId(entry.id)}>Kitaplıktan kaldır</Button>}
          </article>)}</div>
          {cursor && <Button type="button" loading={loading} disabled={Boolean(busy)} onClick={() => void load(cursor)}>Daha fazla göster</Button>}
        </section>
      </div>
  </div>;
}
