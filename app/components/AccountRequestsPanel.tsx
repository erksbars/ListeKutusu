"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, CheckCheck, ChevronDown, Inbox, Music2, Search, Trash2, X } from "lucide-react";
import { Button, buttonClassName } from "./ui";

export type AccountSuggestion = {
  id: string;
  trackName: string;
  artistName: string;
  suggestedBy: string | null;
  status: string;
};

export type DecisionFilter = "all" | "approved" | "rejected" | "removed";
export type SuggestionAction = "approve" | "reject" | "remove";

type AccountRequestsPanelProps = {
  pending: AccountSuggestion[];
  decided: AccountSuggestion[];
  filter: DecisionFilter;
  search: string;
  loading: boolean;
  onFilterChange: (filter: DecisionFilter) => void;
  onSearchChange: (value: string) => void;
  onDecide: (id: string, action: SuggestionAction) => void;
  onDecideAll: (action: Exclude<SuggestionAction, "remove">) => void;
};

const FILTERS: Array<[DecisionFilter, string]> = [
  ["all", "Tümü"],
  ["approved", "Onaylı"],
  ["rejected", "Red"],
  ["removed", "Çıkarıldı"],
];

function decisionLabel(status: string) {
  if (status === "approved") return "Onaylandı";
  if (status === "removed") return "Çıkarıldı";
  return "Reddedildi";
}

export function AccountRequestsPanel({
  pending,
  decided,
  filter,
  search,
  loading,
  onFilterChange,
  onSearchChange,
  onDecide,
  onDecideAll,
}: AccountRequestsPanelProps) {
  const [pendingLimit, setPendingLimit] = useState(8);
  const [decisionLimit, setDecisionLimit] = useState(10);
  const visiblePending = pending.slice(0, pendingLimit);
  const visibleDecided = decided.slice(0, decisionLimit);

  useEffect(() => {
    setDecisionLimit(10);
  }, [filter, search]);

  return (
    <div className="grid gap-6">
      <section className="account-content-panel">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="section-kicker">Onay bekleyenler ({pending.length})</h2>
            <p className="mt-1 text-sm text-slate-500">
              Gelen istekleri Spotify listene eklemeden önce kontrol et.
            </p>
          </div>
          {pending.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => onDecideAll("approve")}
                disabled={loading}
                size="sm"
                variant="primary"
                leadingIcon={<CheckCheck size={16} />}
              >
                Tümünü onayla
              </Button>
              <Button
                onClick={() => onDecideAll("reject")}
                disabled={loading}
                size="sm"
                variant="danger"
                leadingIcon={<X size={16} />}
              >
                Tümünü reddet
              </Button>
            </div>
          )}
        </div>
        {pending.length === 0 && (
          <div className="account-empty-state mt-4">
            <span className="account-empty-icon"><Inbox size={21} /></span>
            <p className="text-base font-black text-navy">Kuyruk temiz</p>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Yeni bir şarkı isteği geldiğinde burada görünecek. Bu sırada keşif akışına göz atabilirsin.
            </p>
            <Link
              href="/"
              className={buttonClassName({ variant: "secondary", size: "sm", className: "mt-4" })}
            >
              <span>Keşif akışına git</span> <ArrowRight size={15} />
            </Link>
          </div>
        )}
        <ul className="mt-4 grid gap-3">
          {visiblePending.map((suggestion) => (
            <li
              key={suggestion.id}
              className="track-card account-request-row"
            >
              <span className="account-request-icon" aria-hidden="true"><Music2 size={17} /></span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-navy">
                  {suggestion.trackName} - {suggestion.artistName}
                </p>
                <p className="text-xs text-slate-500">Öneren: {suggestion.suggestedBy || "İsimsiz"}</p>
              </div>
              <div className="flex w-full shrink-0 gap-2 sm:w-auto">
                <Button
                  onClick={() => onDecide(suggestion.id, "approve")}
                  disabled={loading}
                  size="sm"
                  variant="primary"
                  className="flex-1 sm:flex-none"
                  leadingIcon={<Check size={15} />}
                >
                  {loading ? "İşleniyor..." : "Onayla"}
                </Button>
                <Button
                  onClick={() => onDecide(suggestion.id, "reject")}
                  disabled={loading}
                  size="sm"
                  variant="secondary"
                  className="flex-1 sm:flex-none"
                  leadingIcon={<X size={15} />}
                >
                  Reddet
                </Button>
              </div>
            </li>
          ))}
        </ul>
        {pending.length > visiblePending.length && (
          <button
            type="button"
            className="account-list-reveal mt-3"
            onClick={() => setPendingLimit((current) => current + 8)}
          >
            <ChevronDown size={16} aria-hidden="true" />
            Daha fazla istek
            <strong>{pending.length - visiblePending.length}</strong>
          </button>
        )}
      </section>

      <section className="account-content-panel">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="section-kicker">Son kararlar</h2>
            <p className="mt-1 text-sm text-slate-500">Onaylanan ve reddedilen şarkıları hızlıca bul.</p>
          </div>
          <div className="account-filter-tabs">
            {FILTERS.map(([value, label]) => (
              <Button
                key={value}
                onClick={() => onFilterChange(value)}
                aria-pressed={filter === value}
                size="sm"
                variant={filter === value ? "primary" : "ghost"}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>
        <label htmlFor="decision-search" className="sr-only">Kararlarda ara</label>
        <label className="account-search mt-4" htmlFor="decision-search"><Search size={17} /><input id="decision-search" type="search" placeholder="Şarkı, sanatçı veya öneren ara..." value={search} onChange={(event) => onSearchChange(event.target.value)} /></label>
        <ul className="mt-3 grid gap-3">
          {decided.length === 0 && (
            <li className="track-card rounded-2xl p-4 text-sm text-slate-500">
              Bu filtreye uygun karar bulunamadı.
            </li>
          )}
          {visibleDecided.map((suggestion) => (
            <li
              key={suggestion.id}
              className="track-card account-decision-row"
            >
              <span className="account-request-icon" aria-hidden="true"><Music2 size={16} /></span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-navy">{suggestion.trackName}</p>
                <p className="truncate text-xs text-slate-500">{suggestion.artistName}</p>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <span
                  className={`status-pill ${
                    suggestion.status === "approved" ? "status-pill-success" : "status-pill-danger"
                  }`}
                >
                  {decisionLabel(suggestion.status)}
                </span>
                {suggestion.status === "approved" && (
                  <Button
                    onClick={() => onDecide(suggestion.id, "remove")}
                    disabled={loading}
                    size="sm"
                    variant="danger"
                    leadingIcon={<Trash2 size={14} />}
                  >
                    Çıkar
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
        {decided.length > visibleDecided.length && (
          <button
            type="button"
            className="account-list-reveal mt-3"
            onClick={() => setDecisionLimit((current) => current + 10)}
          >
            <ChevronDown size={16} aria-hidden="true" />
            Daha fazla karar
            <strong>{decided.length - visibleDecided.length}</strong>
          </button>
        )}
      </section>
    </div>
  );
}
