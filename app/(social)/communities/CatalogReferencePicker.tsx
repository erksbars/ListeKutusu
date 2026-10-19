"use client";
import { useEffect, useRef, useState } from "react";
import type { CatalogItem } from "@/lib/mediaCatalog";
import { Button } from "@/app/components/ui/Button";
import { SelectField, TextField } from "@/app/components/ui/Field";
import { TVmazeAttribution } from "@/app/components/TVmazeAttribution";
import { communityError, communityFetch } from "./communityFetch";

export type CatalogReviewSelection = CatalogItem & { selectionToken: string };
export function CatalogReferencePicker({ kind, selected, onSelect }: { kind: string; selected: CatalogReviewSelection | null; onSelect: (item: CatalogReviewSelection | null) => void }) {
  const [query, setQuery] = useState(""), [results, setResults] = useState<CatalogReviewSelection[]>([]);
  const [loading, setLoading] = useState(false), [searched, setSearched] = useState(false), [error, setError] = useState("");
  const request = useRef<AbortController | null>(null), pending = useRef(false);
  useEffect(() => () => request.current?.abort(), []);
  function changeQuery(value: string) {
    request.current?.abort(); pending.current = false; setLoading(false); setQuery(value); setResults([]); setSearched(false); setError("");
  }
  async function search() {
    if (pending.current || query.trim().length < 2) return;
    request.current?.abort(); const controller = new AbortController(); request.current = controller;
    pending.current = true; setLoading(true); setError(""); setSearched(false); setResults([]);
    try {
      const data = await communityFetch<{ results: CatalogReviewSelection[] }>(`/api/catalog/search?${new URLSearchParams({ kind, q: query.trim() })}`, undefined, controller.signal);
      if (!controller.signal.aborted) { setResults(data.results); setSearched(true); onSelect(null); }
    } catch (cause) { if (!controller.signal.aborted) setError(communityError(cause)); }
    finally { if (!controller.signal.aborted) { setLoading(false); pending.current = false; } }
  }
  const options = selected && !results.some(item => item.id === selected.id) ? [selected, ...results] : results;
  return <div className="community-stack">
    <TextField label="Katalogda eser ara" value={query} maxLength={120} onChange={event => changeQuery(event.target.value)} onKeyDown={event => { if (event.key === "Enter") { event.preventDefault(); void search(); } }} hint="2–120 karakter. Arama yalnız Ara düğmesi veya Enter ile başlar; özel bilgilerini arama metnine yazma." />
    <div className="community-actions"><Button type="button" disabled={loading || query.trim().length < 2} onClick={() => void search()}>{loading ? "Aranıyor…" : "Katalogda ara"}</Button></div>
    {loading && <p role="status">Katalog sonuçları yükleniyor…</p>}
    {error && <p role="alert" className="community-error">{error} Metnini kaybetmeden tekrar arayabilir, kitaplık veya elle girişi kullanabilirsin.</p>}
    {searched && !results.length && <p>Bu aramada eser bulunamadı. Başka bir adla ara veya elle girişe dön.</p>}
    <SelectField label="Katalogdan eser seç" value={selected?.id ?? ""} required disabled={loading || !options.length} onChange={event => onSelect(options.find(item => item.id === event.target.value) ?? null)}>
      <option value="">Bir eser seç</option>{options.map(item => <option key={item.id} value={item.id}>{item.title}{item.year ? ` · ${item.year}` : ""}{item.creators.length ? ` · ${item.creators.join(", ")}` : ""} · {item.provider}</option>)}
    </SelectField>
    <p>En fazla 20 sonuç. Seçim 30 dakika geçerlidir; süresi dolarsa aynı eseri yeniden arayıp seç. Bu işlem kitaplığına eser eklemez.</p>
    {selected && <><p>Seçildi: {selected.title} · {selected.provider}</p><p>Yayınlayınca eserin adı ve kaynak bağlantısı incelemede herkesçe görülebilir. Okuma/izleme durumu veya arama metni paylaşılmaz.</p></>}
    {(kind === "tv" && (searched || selected)) && <p><TVmazeAttribution /></p>}
  </div>;
}
