"use client";

import { Activity, CalendarDays, Download, RefreshCw } from "lucide-react";
import {
  activityKinds,
  adminDateFormatter,
  auditActionLabels,
  dateInputValue,
  type ActivityKind,
  type AdminActivitySummary,
  type AdminAuditLog,
} from "./adminTypes";

type AdminActivityReportProps = {
  from: string;
  to: string;
  kind: ActivityKind;
  summary: AdminActivitySummary;
  logs: AdminAuditLog[];
  loading: boolean;
  exporting: boolean;
  page: number;
  totalPages: number;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
  onKindChange: (value: ActivityKind) => void;
  onPreset: (days: number) => void;
  onApply: (page?: number) => void;
  onExport: () => void;
};

const summaryItems: Array<[keyof AdminActivitySummary, string]> = [
  ["newAccounts", "Yeni hesap"],
  ["suggestions", "Yeni öneri"],
  ["approvedSuggestions", "Onaylanan"],
  ["rejectedSuggestions", "Reddedilen"],
  ["feedPosts", "Akış paylaşımı"],
  ["forumThreads", "Forum konusu"],
  ["reports", "Şikâyet"],
  ["auditEvents", "Yönetim işlemi"],
];

export function AdminActivityReport({
  from,
  to,
  kind,
  summary,
  logs,
  loading,
  exporting,
  page,
  totalPages,
  onFromChange,
  onToChange,
  onKindChange,
  onPreset,
  onApply,
  onExport,
}: AdminActivityReportProps) {
  const rangeInvalid = !from || !to || from > to;

  return (
    <section className="admin-activity-report mt-6" aria-busy={loading}>
      <div className="admin-activity-heading">
        <div>
          <p className="section-kicker"><Activity size={14} /> Yönetim raporu</p>
          <h2>Dönem görünümü ve işlem geçmişi</h2>
          <p>Topluluk hareketlerini seçtiğin tarih aralığında izle, kritik yönetim kararlarını denetlenebilir biçimde dışa aktar.</p>
        </div>
        <button type="button" onClick={onExport} disabled={exporting || loading} className="admin-export-button">
          {exporting ? <RefreshCw size={16} className="animate-spin" /> : <Download size={16} />}
          <span>{exporting ? "Hazırlanıyor" : "CSV indir"}</span>
        </button>
      </div>

      <div className="admin-activity-toolbar">
        <div className="admin-range-presets" aria-label="Hızlı tarih aralığı">
          {[7, 30, 90].map((days) => (
            <button key={days} type="button" onClick={() => onPreset(days)} disabled={loading}>{days} gün</button>
          ))}
        </div>
        <label>
          <span>Başlangıç</span>
          <input type="date" value={from} max={to} onChange={(event) => onFromChange(event.target.value)} />
        </label>
        <label>
          <span>Bitiş</span>
          <input type="date" value={to} min={from} max={dateInputValue(new Date())} onChange={(event) => onToChange(event.target.value)} />
        </label>
        <label>
          <span>İşlem türü</span>
          <select value={kind} onChange={(event) => onKindChange(event.target.value as ActivityKind)}>
            {activityKinds.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </label>
        <button type="button" onClick={() => onApply(1)} disabled={loading || rangeInvalid} className="admin-activity-apply">
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          <span>{loading ? "Yükleniyor" : "Raporu uygula"}</span>
        </button>
      </div>

      <div
        className="admin-period-summary"
        aria-live="polite"
        tabIndex={0}
        aria-label="Seçilen dönemin yönetim özeti. Dar ekranlarda yatay kaydırılabilir."
      >
        {summaryItems.map(([key, label]) => (
          <div key={key}><strong>{summary[key]}</strong><span>{label}</span></div>
        ))}
      </div>

      <div className="admin-audit-panel">
        <div className="admin-audit-title">
          <div><CalendarDays size={17} /><span>{from} / {to}</span></div>
          <strong>{summary.auditEvents} kayıt</strong>
        </div>
        {loading ? (
          <div className="admin-audit-loading" role="status"><RefreshCw size={18} className="animate-spin" /> İşlem geçmişi hazırlanıyor...</div>
        ) : logs.length === 0 ? (
          <div className="admin-audit-empty">Bu aralıkta seçilen türde yönetim işlemi bulunmuyor.</div>
        ) : (
          <ol className="admin-audit-list" tabIndex={0} aria-label="Yönetim işlem geçmişi">
            {logs.map((log) => (
              <li key={log.id}>
                <span className="admin-audit-mark" aria-hidden="true" />
                <div>
                  <strong>{auditActionLabels[log.action] || log.action}</strong>
                  <p>{log.targetLabel || "Sistem kaydı"}</p>
                </div>
                <time dateTime={log.createdAt}>{adminDateFormatter.format(new Date(log.createdAt))}</time>
              </li>
            ))}
          </ol>
        )}
        {totalPages > 1 && !loading && (
          <nav className="admin-pagination" aria-label="İşlem geçmişi sayfaları">
            <button type="button" disabled={page <= 1} onClick={() => onApply(page - 1)}>Önceki</button>
            <span>{page} / {totalPages}</span>
            <button type="button" disabled={page >= totalPages} onClick={() => onApply(page + 1)}>Sonraki</button>
          </nav>
        )}
      </div>
    </section>
  );
}
