"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, ChevronDown, Copy, Link2, LoaderCircle, MousePointer2, Upload } from "lucide-react";
import {
  MAX_TRACK_IMPORT_SIZE,
  parseSpotifyTrackReferences,
  TRACK_IMPORT_BATCH_SIZE,
} from "@/lib/track-import";

type ImportSummary = {
  imported: number;
  existing: number;
  failed: number;
};

type BulkTrackImportProps = {
  onImported: (message: string) => void | Promise<void>;
};

export function BulkTrackImport({ onImported }: BulkTrackImportProps) {
  const [input, setInput] = useState("");
  const [importing, setImporting] = useState(false);
  const [processed, setProcessed] = useState(0);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const parsed = useMemo(() => parseSpotifyTrackReferences(input), [input]);

  async function importTracks() {
    if (importing || parsed.ids.length === 0 || parsed.truncatedCount > 0) return;

    setImporting(true);
    setProcessed(0);
    setSummary(null);
    const totals: ImportSummary = { imported: 0, existing: 0, failed: 0 };

    try {
      for (let index = 0; index < parsed.ids.length; index += TRACK_IMPORT_BATCH_SIZE) {
        const trackIds = parsed.ids.slice(index, index + TRACK_IMPORT_BATCH_SIZE);
        const response = await fetch("/api/lists/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ trackIds }),
        });
        const data = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(data?.error || "Aktarım tamamlanamadı.");
        }

        totals.imported += Number(data.imported) || 0;
        totals.existing += Number(data.existing) || 0;
        totals.failed += Array.isArray(data.failed) ? data.failed.length : 0;
        setProcessed(Math.min(index + trackIds.length, parsed.ids.length));
      }

      setSummary(totals);
      setInput("");
      await onImported(
        `${totals.imported} şarkı listene aktarıldı` +
          (totals.existing ? `, ${totals.existing} şarkı zaten vardı` : "") +
          (totals.failed ? `, ${totals.failed} bağlantı doğrulanamadı` : "") +
          "."
      );
    } catch (error) {
      await onImported(
        error instanceof Error ? error.message : "Aktarım sırasında bağlantı kesildi."
      );
    } finally {
      setImporting(false);
    }
  }

  return (
    <details className="account-content-panel account-disclosure lg:col-span-2">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-black text-navy">
        <span className="flex items-center gap-2"><Link2 size={17} /> Toplu şarkı aktarımı</span>
        <ChevronDown size={17} className="account-disclosure-chevron text-slate-500" aria-hidden="true" />
      </summary>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
        Spotify masaüstünde seçtiğin şarkıların bağlantılarını alt alta yapıştır. Şarkılar doğrudan uygulamadaki
        onaylı listene eklenir; Spotify aktarımını daha sonra senkron düğmesiyle başlatırsın.
      </p>

      <ol className="account-import-steps mt-4 grid py-2 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: MousePointer2, title: "Listeyi aç", body: "Spotify masaüstünde kaynak playlisti aç." },
          { icon: MousePointer2, title: "Bir parçaya tıkla", body: "Seçimin şarkı satırlarında olduğundan emin ol." },
          { icon: Copy, title: "Tümünü kopyala", body: "Windows: Ctrl+A, Ctrl+C · Mac: Cmd+A, Cmd+C" },
          { icon: Upload, title: "Buraya yapıştır", body: "Bağlantıları alana bırakıp Listeye aktar'a bas." },
        ].map((step, index) => (
          <li key={step.title} className="flex min-w-0 items-start gap-3 px-2 py-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-navy text-cyan-100">
              <step.icon size={15} aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <strong className="block text-xs font-black text-navy">{index + 1}. {step.title}</strong>
              <span className="mt-1 block text-xs leading-4 text-slate-500">{step.body}</span>
            </span>
          </li>
        ))}
      </ol>

      <label htmlFor="bulk-track-links" className="form-label mt-4">Spotify şarkı bağlantıları</label>
      <p className="form-help">Bağlantıları, Spotify URI’lerini veya yalnızca 22 karakterli şarkı kimliklerini alt alta yapıştırabilirsin.</p>
      <textarea
        id="bulk-track-links"
        value={input}
        onChange={(event) => setInput(event.target.value)}
        disabled={importing}
        rows={7}
        placeholder={"https://open.spotify.com/track/...\nhttps://open.spotify.com/track/..."}
        className="ghost-input mt-2 w-full resize-y rounded-xl px-4 py-3 font-mono text-sm leading-6 outline-none"
      />

      {parsed.ids.length > 0 && (
        <div className="account-import-preview mt-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-black text-navy">Aktarım ön izlemesi</p>
            <span className="text-xs font-bold text-sky-700">{parsed.ids.length} bağlantı hazır</span>
          </div>
          <ul className="mt-2 grid gap-1.5">
            {parsed.ids.slice(0, 5).map((id) => (
              <li key={id} className="account-import-link">
                https://open.spotify.com/track/{id}
              </li>
            ))}
          </ul>
          {parsed.ids.length > 5 && (
            <p className="mt-2 text-xs font-semibold text-slate-500">
              +{parsed.ids.length - 5} bağlantı daha
            </p>
          )}
        </div>
      )}

      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-slate-600" aria-live="polite">
          <span>{parsed.ids.length} benzersiz şarkı</span>
          {parsed.duplicateCount > 0 && <span>{parsed.duplicateCount} tekrar ayıklandı</span>}
          {parsed.invalidLineCount > 0 && <span className="text-amber-700">{parsed.invalidLineCount} satır geçersiz</span>}
          {parsed.truncatedCount > 0 && (
            <span className="text-rose-700">En fazla {MAX_TRACK_IMPORT_SIZE} bağlantı eklenebilir</span>
          )}
          {importing && <span>{processed}/{parsed.ids.length} işlendi</span>}
        </div>
        <button
          type="button"
          onClick={importTracks}
          disabled={importing || parsed.ids.length === 0 || parsed.truncatedCount > 0}
          className="primary-action h-11 shrink-0 rounded-xl px-5 text-sm font-black disabled:cursor-not-allowed disabled:opacity-50"
        >
          {importing ? <LoaderCircle size={16} className="animate-spin" /> : <Upload size={16} />}
          <span>{importing ? "Aktarılıyor" : "Listeye aktar"}</span>
        </button>
      </div>

      {summary && (
        <div className="account-import-summary mt-4">
          <CheckCircle2 size={17} />
          <span>{summary.imported} eklendi, {summary.existing} zaten vardı, {summary.failed} doğrulanamadı.</span>
        </div>
      )}
    </details>
  );
}
