"use client";
import { useEffect, useState } from "react";
import type { LibraryReviewReference } from "@/lib/communityTypes";
import { Button } from "@/app/components/ui/Button";
import { SelectField, TextField } from "@/app/components/ui/Field";
import { communityError, communityFetch } from "./communityFetch";
import { TVmazeAttribution } from "@/app/components/TVmazeAttribution";

export function LibraryReferencePicker({ kind, selected, onSelect }: { kind: string; selected: LibraryReviewReference | null; onSelect: (reference: LibraryReviewReference | null) => void }) {
  const [query, setQuery] = useState("");
  const [references, setReferences] = useState<LibraryReviewReference[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(""); setReferences([]);
    const timer = setTimeout(() => {
      communityFetch<{ references: LibraryReviewReference[] }>(`/api/communities/references?${new URLSearchParams({ kind, q: query.trim() })}`, undefined, controller.signal)
        .then(data => { if (!controller.signal.aborted) setReferences(data.references); })
        .catch(error => { if (!controller.signal.aborted) setError(communityError(error)); })
        .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    }, 350);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [kind, query, retry]);
  const options = selected && !references.some(item => item.id === selected.id) ? [selected, ...references] : references;
  return <div className="community-stack">
    <TextField label="Kitaplığında ara" value={query} maxLength={100} onChange={event => setQuery(event.target.value)} />
    {loading && <p role="status">Kitaplığın yükleniyor…</p>}
    {error && <div role="alert" className="community-stack community-error"><p>{error}</p><Button type="button" onClick={() => setRetry(value => value + 1)}>Kitaplığı yeniden yükle</Button></div>}
    {!loading && !error && !references.length && <p>Bu aramada kayıt yok. Kitaplığından eser ekleyebilir veya elle girişe dönebilirsin.</p>}
    <SelectField label="Kitaplığından eser seç" value={selected?.id ?? ""} required disabled={loading || Boolean(error)} onChange={event => onSelect(options.find(item => item.id === event.target.value) ?? null)}>
      <option value="">Bir eser seç</option>{options.map(item => <option key={item.id} value={item.id}>{item.title} · {item.provider}</option>)}
    </SelectField>
    <p>İlk 20 kayıt gösterilir; arayarak daraltabilirsin. Müzikte yalnız onaylı parçalar seçilebilir.</p>
    {selected && <><p>Seçildi: {selected.title} · {selected.provider}</p><p>Yayınlayınca yalnız bu eserin adı ve kaynak bağlantısı herkesçe görülebilir. Özel kitaplığının tamamı ve okuma/izleme durumu paylaşılmaz.</p></>}
    {selected?.provider === "tvmaze" && <p><TVmazeAttribution /></p>}
  </div>;
}
