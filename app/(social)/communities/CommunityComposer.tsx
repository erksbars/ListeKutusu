"use client";
import { useState } from "react";
import { REVIEW_KINDS, type LibraryReviewReference } from "@/lib/communityTypes";
import { Button } from "@/app/components/ui/Button";
import { SelectField, TextAreaField, TextField } from "@/app/components/ui/Field";
import { LibraryReferencePicker } from "./LibraryReferencePicker";
import { CommunityDistributionField } from "@/app/components/CommunityDistributionField";
import { CatalogReferencePicker, type CatalogReviewSelection } from "./CatalogReferencePicker";
import { useDraftNavigationGuard } from "@/app/components/DraftNavigationProvider";

export function CommunityComposer({ disabled, publish }: { disabled: boolean; publish: (payload: Record<string, unknown>, reset: () => void) => void }) {
  const [type, setType] = useState("discussion");
  const [distribution, setDistribution] = useState("community");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [kind, setKind] = useState("movie");
  const [subject, setSubject] = useState("");
  const [rating, setRating] = useState("8");
  const [source, setSource] = useState("");
  const [spoiler, setSpoiler] = useState(false);
  const [selectionMode, setSelectionMode] = useState("manual");
  const [reference, setReference] = useState<LibraryReviewReference | null>(null);
  const [catalogSelection, setCatalogSelection] = useState<CatalogReviewSelection | null>(null);
  const libraryMode = selectionMode === "library";
  const catalogMode = selectionMode === "catalog";
  const manualMode = selectionMode === "manual";
  const supportsLibrary = kind !== "game" && kind !== "boardgame";
  const review = type === "review";
  const missingSelection = review && ((libraryMode && !reference) || (catalogMode && !catalogSelection));
  const dirty = Boolean(title || body || subject || source || spoiler || reference || catalogSelection || distribution !== "community" || (review && rating !== "8"));
  useDraftNavigationGuard({ dirty, busy: dirty && disabled, discard: reset, preserveOnLocalNavigation: true });
  function reset() { setTitle(""); setBody(""); setSubject(""); setSource(""); setSpoiler(false); setReference(null); setCatalogSelection(null); setDistribution("community"); setRating("8"); }
  return <form className="ui-panel community-stack" onSubmit={event => {
    event.preventDefault();
    if (missingSelection) return;
    publish({ action: "create-post", type, title, body, distribution, ...(review ? { reviewKind: kind, ...(manualMode ? { subjectTitle: subject, sourceUrl: source.trim() } : {}), rating: Number(rating), spoiler, ...(libraryMode ? { reference: { id: reference!.id } } : {}), ...(catalogMode ? { catalogSelection: catalogSelection!.selectionToken } : {}) } : {}) }, reset);
  }}>
    <h2 className="ui-section-title">{review ? "İnceleme yaz" : "Sohbet başlat"}</h2>
    <fieldset disabled={disabled} className="community-fieldset community-stack">
      <SelectField label="Paylaşım türü" value={type} onChange={event => setType(event.target.value)}><option value="discussion">Sohbet</option><option value="review">İnceleme</option></SelectField>
      {review && <>
        <SelectField label="İnceleme türü" value={kind} onChange={event => { setKind(event.target.value); setReference(null); setCatalogSelection(null); if (event.target.value === "game" || event.target.value === "boardgame" || (event.target.value === "music" && catalogMode)) setSelectionMode("manual"); }}>{Object.entries(REVIEW_KINDS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</SelectField>
        <SelectField label="Eser seçimi" value={selectionMode} onChange={event => { setSelectionMode(event.target.value); setReference(null); setCatalogSelection(null); }}><option value="manual">Elle gir</option><option value="library" disabled={!supportsLibrary}>Kitaplığımdan seç</option><option value="catalog" disabled={!supportsLibrary || kind === "music"}>Katalogda ara</option></SelectField>
        {libraryMode ? <LibraryReferencePicker key={kind} kind={kind} selected={reference} onSelect={setReference} /> : catalogMode ? <CatalogReferencePicker key={kind} kind={kind} selected={catalogSelection} onSelect={setCatalogSelection} /> : <TextField label="Eser adı" value={subject} onChange={event => setSubject(event.target.value)} required minLength={1} maxLength={160} hint="Film, dizi, kitap, müzik veya oyunun adı. Başlık elle girilir." />}
        <SelectField label="Puanın" value={rating} onChange={event => setRating(event.target.value)}>{Array.from({ length: 10 }, (_, index) => <option key={index} value={index + 1}>{index + 1}/10</option>)}</SelectField>
        {manualMode && <TextField label="Eser bağlantısı (isteğe bağlı)" type="url" value={source} onChange={event => setSource(event.target.value)} maxLength={2000} hint="Spotify, TVmaze, Wikidata, Open Library, Steam veya BoardGameGeek HTTPS bağlantısı. Katalog doğrulaması yapılmaz." />}
        <label className="community-check"><input type="checkbox" checked={spoiler} onChange={event => setSpoiler(event.target.checked)} />Spoiler içeriyor</label>
        <p>Spoiler seçildiğinde metin ve yorumlar okuyucu açana kadar gizlenir. Eser adı ve paylaşım başlığı görünür kalır; başlığa spoiler yazma.</p>
      </>}
      <TextField label="Paylaşım başlığı" value={title} onChange={event => setTitle(event.target.value)} minLength={3} maxLength={120} required />
      <TextAreaField label={review ? "İncelemen" : "Paylaşımın"} value={body} onChange={event => setBody(event.target.value)} minLength={review ? 20 : 2} maxLength={5000} rows={5} required />
      <CommunityDistributionField value={distribution} onChange={setDistribution} />
      <Button type="submit" variant="primary" disabled={missingSelection}>{review ? "İncelemeyi yayınla" : "Paylaş"}</Button>
    </fieldset>
  </form>;
}
