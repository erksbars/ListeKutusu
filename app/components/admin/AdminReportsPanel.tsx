"use client";

import { RefreshCw } from "lucide-react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { Button } from "../ui";
import { adminDateFormatter, type AdminPostReport, type AdminReportFilter } from "./adminTypes";

const reportReasonLabels: Record<string, string> = {
  spam: "Spam",
  abuse: "Taciz / kötüye kullanım",
  misleading: "Yanıltıcı içerik",
  copyright: "Telif hakkı",
  other: "Diğer",
};

const reportFilters: Array<{ value: AdminReportFilter; label: string }> = [
  { value: "pending", label: "Bekleyen" },
  { value: "resolved", label: "Çözülen" },
  { value: "dismissed", label: "Reddedilen" },
];

type AdminReportsPanelProps = {
  reports: AdminPostReport[];
  filter: AdminReportFilter;
  stats: Record<AdminReportFilter, number>;
  loading: boolean;
  busyAction: string | null;
  onFilterChange: (filter: AdminReportFilter) => void;
  onRefresh: () => void;
  onModerate: (id: string, action: "dismiss" | "resolve") => void;
  onRequestRemove: (id: string) => void;
};

export function AdminReportsPanel({
  reports,
  filter,
  stats,
  loading,
  busyAction,
  onFilterChange,
  onRefresh,
  onModerate,
  onRequestRemove,
}: AdminReportsPanelProps) {
  function handleFilterKeyDown(event: ReactKeyboardEvent<HTMLButtonElement>, index: number) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const lastIndex = reportFilters.length - 1;
    const nextIndex = event.key === "Home"
      ? 0
      : event.key === "End"
        ? lastIndex
        : event.key === "ArrowRight"
          ? (index + 1) % reportFilters.length
          : (index - 1 + reportFilters.length) % reportFilters.length;
    const next = reportFilters[nextIndex].value;
    onFilterChange(next);
    requestAnimationFrame(() => document.getElementById(`admin-report-tab-${next}`)?.focus());
  }

  return (
    <section className="mt-10" aria-labelledby="admin-moderation-title">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="section-kicker">Topluluk güvenliği</p>
          <h2 id="admin-moderation-title" className="mt-1 text-2xl font-black text-white">Moderasyon merkezi</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="admin-report-filters" role="tablist" aria-label="Şikâyet durumu">
            {reportFilters.map(({ value, label }, index) => (
              <button
                key={value}
                id={`admin-report-tab-${value}`}
                type="button"
                role="tab"
                aria-selected={filter === value}
                aria-controls="admin-report-panel"
                tabIndex={filter === value ? 0 : -1}
                onKeyDown={(event) => handleFilterKeyDown(event, index)}
                onClick={() => onFilterChange(value)}
                className={filter === value ? "admin-report-filter-active" : ""}
              >
                {label}<span>{stats[value]}</span>
              </button>
            ))}
          </div>
          <Button size="sm" onClick={onRefresh} loading={loading} leadingIcon={<RefreshCw size={15} />}>
            Yenile
          </Button>
        </div>
      </div>

      <div id="admin-report-panel" role="tabpanel" aria-labelledby={`admin-report-tab-${filter}`} aria-busy={loading}>
        {!loading && reports.length === 0 && (
          <p className="entry-card mt-4 rounded-2xl p-5 text-sm text-cyan-50/68">
            {filter === "pending" ? "İncelenmeyi bekleyen şikâyet yok." : "Bu durumda moderasyon kaydı yok."}
          </p>
        )}
        <div className="mt-4 grid gap-3">
          {reports.map((report) => (
            <article key={report.id} className="panel-surface rounded-2xl p-4 sm:p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {report.reasons.map((reason) => <span key={reason} className="status-pill status-pill-danger">{reportReasonLabels[reason] || reason}</span>)}
                    {report.reportCount > 1 && <span className="status-pill border border-amber-200 bg-amber-50 text-amber-800">{report.reportCount} bildirim</span>}
                    <span className="text-xs font-semibold text-slate-500">
                      Bildiren: {report.reporters.slice(0, 2).map((item) => item.ownerName).join(", ")}{report.reporters.length > 2 ? ` +${report.reporters.length - 2}` : ""}
                    </span>
                  </div>
                  <h3 className="mt-3 text-lg font-black text-navy">{report.post.trackName} - {report.post.artistName}</h3>
                  <p className="mt-1 text-sm text-slate-500">Paylaşan: {report.post.author.ownerName}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-400">
                    {report.status === "pending" ? "İlk bildirim" : "Karar"}: {adminDateFormatter.format(new Date(report.status === "pending" ? report.createdAt : report.reviewedAt || report.createdAt))}
                  </p>
                  {(report.details || report.post.note) && (
                    <div className="mt-3 rounded-xl bg-sky-50/70 p-3 text-sm leading-6 text-slate-600">
                      {report.details && <p><strong>Şikâyet notu:</strong> {report.details}</p>}
                      {report.post.note && <p><strong>Paylaşım notu:</strong> {report.post.note}</p>}
                    </div>
                  )}
                </div>
                {report.status === "pending" ? (
                  <div className="flex shrink-0 flex-wrap gap-2" aria-busy={busyAction === `report:${report.id}`}>
                    <Button size="sm" disabled={Boolean(busyAction)} onClick={() => onModerate(report.id, "dismiss")}>Raporu reddet</Button>
                    <Button size="sm" disabled={Boolean(busyAction)} onClick={() => onModerate(report.id, "resolve")}>Çözüldü</Button>
                    <Button size="sm" variant="danger" disabled={Boolean(busyAction)} onClick={() => onRequestRemove(report.id)}>Paylaşımı kaldır</Button>
                  </div>
                ) : (
                  <span className={report.status === "resolved" ? "status-pill status-pill-success" : "status-pill border border-slate-200 bg-slate-100 text-slate-600"}>
                    {report.status === "resolved" ? "Çözüldü" : "Reddedildi"}
                  </span>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
