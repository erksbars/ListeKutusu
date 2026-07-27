"use client";

import { Button, Checkbox } from "../ui";
import type { AdminSuggestion } from "./adminTypes";

type AdminSuggestionQueueProps = {
  pending: AdminSuggestion[];
  pendingTotal: number;
  recent: AdminSuggestion[];
  selectedIds: string[];
  busyAction: string | null;
  onSelectionChange: (ids: string[]) => void;
  onDecision: (id: string, action: "approve" | "reject") => void;
  onBulkDecision: (action: "approve" | "reject") => void;
};

export function AdminSuggestionQueue({
  pending,
  pendingTotal,
  recent,
  selectedIds,
  busyAction,
  onSelectionChange,
  onDecision,
  onBulkDecision,
}: AdminSuggestionQueueProps) {
  const allSelected = pending.length > 0 && pending.every((item) => selectedIds.includes(item.id));
  const busy = Boolean(busyAction);

  return (
    <>
      <section className="mt-10" aria-labelledby="admin-pending-title">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 id="admin-pending-title" className="text-sm font-semibold uppercase tracking-wide text-cyan-100/90">Onay bekleyenler ({pendingTotal})</h2>
            {selectedIds.length > 0 && <p className="mt-1 text-xs text-cyan-50/70">{selectedIds.length} öneri seçildi</p>}
            {pendingTotal > pending.length && <p className="mt-1 text-xs text-cyan-50/60">En eski {pending.length} kayıt gösteriliyor; karar verdikçe kuyruk yenilenir.</p>}
          </div>
          {pending.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <Checkbox
                label="Tümünü seç"
                checked={allSelected}
                onChange={(event) => onSelectionChange(event.target.checked ? pending.map((item) => item.id) : [])}
                containerClassName="ui-check-field-framed"
              />
              <Button size="sm" variant="primary" loading={busyAction === "bulk:approve"} disabled={selectedIds.length === 0 || busy} onClick={() => onBulkDecision("approve")}>Seçilenleri onayla</Button>
              <Button size="sm" variant="danger" loading={busyAction === "bulk:reject"} disabled={selectedIds.length === 0 || busy} onClick={() => onBulkDecision("reject")}>Seçilenleri reddet</Button>
            </div>
          )}
        </div>

        {pending.length === 0 && <p className="panel-surface mt-3 rounded-xl p-4 text-sm text-slate-500">Bekleyen öneri yok.</p>}
        <ul className="mt-3 grid gap-3">
          {pending.map((suggestion) => (
            <li key={suggestion.id} className="track-card flex flex-col gap-4 rounded-2xl p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-start gap-3">
                <Checkbox
                  checked={selectedIds.includes(suggestion.id)}
                  onChange={(event) => onSelectionChange(event.target.checked ? [...new Set([...selectedIds, suggestion.id])] : selectedIds.filter((id) => id !== suggestion.id))}
                  aria-label={`${suggestion.trackName} önerisini seç`}
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-navy">{suggestion.trackName} - {suggestion.artistName}</p>
                  <p className="text-xs text-slate-500">
                    {suggestion.list?.ownerName || suggestion.suggestedBy || "İsimsiz"}{suggestion.suggestedBy ? ` - ekleyen: ${suggestion.suggestedBy}` : ""}
                  </p>
                </div>
              </div>
              <div className="flex w-full shrink-0 gap-2 sm:w-auto">
                <Button
                  size="sm"
                  variant="primary"
                  className="flex-1 sm:flex-none"
                  loading={busyAction === `decision:${suggestion.id}`}
                  disabled={busy}
                  onClick={() => onDecision(suggestion.id, "approve")}
                >
                  Onayla
                </Button>
                <Button size="sm" variant="danger" className="flex-1 sm:flex-none" disabled={busy} onClick={() => onDecision(suggestion.id, "reject")}>Reddet</Button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12" aria-labelledby="admin-recent-title">
        <h2 id="admin-recent-title" className="text-sm font-semibold uppercase tracking-wide text-cyan-100/90">Son kararlar</h2>
        {recent.length === 0 ? (
          <p className="panel-surface mt-3 rounded-xl p-4 text-sm text-slate-500">Henüz sonuçlanmış karar yok.</p>
        ) : (
          <ul className="mt-3 grid gap-3">
            {recent.map((suggestion) => (
              <li key={suggestion.id} className="track-card flex items-center justify-between gap-4 rounded-2xl p-4">
                <p className="min-w-0 truncate text-sm text-navy">
                  {suggestion.trackName} - {suggestion.artistName}{suggestion.list?.ownerName ? ` / ${suggestion.list.ownerName}` : ""}
                </p>
                <span className={`status-pill shrink-0 ${suggestion.status === "approved" ? "status-pill-success" : "status-pill-danger"}`}>
                  {suggestion.status === "approved" ? "Onaylandı" : suggestion.status === "removed" ? "Çıkarıldı" : "Reddedildi"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
