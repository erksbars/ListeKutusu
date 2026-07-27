"use client";

import Link from "next/link";
import { ExternalLink, RefreshCw, ShieldCheck } from "lucide-react";
import { Button, buttonClassName } from "../ui";
import type { AdminListFilter, AdminUserList } from "./adminTypes";

type RoleChangeRequest = {
  id: string;
  ownerName: string;
  role: "member" | "moderator";
};

type AdminUserListsPanelProps = {
  lists: AdminUserList[];
  total: number;
  search: string;
  filter: AdminListFilter;
  loading: boolean;
  busy: boolean;
  page: number;
  totalPages: number;
  onSearchChange: (value: string) => void;
  onFilterChange: (filter: AdminListFilter) => void;
  onLoad: (page: number) => void;
  onClearFilters: () => void;
  onRequestRoleChange: (change: RoleChangeRequest) => void;
};

const listFilters: Array<{ value: AdminListFilter; label: string }> = [
  { value: "all", label: "Tümü" },
  { value: "ready", label: "Hazır" },
  { value: "waiting", label: "Bekleyen" },
];

export function AdminUserListsPanel({
  lists,
  total,
  search,
  filter,
  loading,
  busy,
  page,
  totalPages,
  onSearchChange,
  onFilterChange,
  onLoad,
  onClearFilters,
  onRequestRoleChange,
}: AdminUserListsPanelProps) {
  const filtered = Boolean(search.trim()) || filter !== "all";

  return (
    <section className="mt-10" aria-labelledby="admin-user-lists-title">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <h2 id="admin-user-lists-title" className="text-sm font-semibold uppercase tracking-wide text-cyan-100/90">Kullanıcı listeleri ({total})</h2>
        <form className="flex flex-col gap-2 sm:flex-row sm:items-center" onSubmit={(event) => { event.preventDefault(); onLoad(1); }}>
          <input
            type="search"
            aria-label="Liste veya hesap ara"
            placeholder="Hesap, liste veya e-posta ara..."
            value={search}
            onChange={(event) => onSearchChange(event.target.value.slice(0, 80))}
            className="ghost-input h-11 rounded-xl px-3 text-sm outline-none"
          />
          <div className="admin-report-filters" role="group" aria-label="Liste durumu">
            {listFilters.map(({ value, label }) => (
              <button key={value} type="button" aria-pressed={filter === value} onClick={() => onFilterChange(value)} className={filter === value ? "admin-report-filter-active" : ""}>{label}</button>
            ))}
          </div>
          <Button type="submit" size="sm" loading={loading} leadingIcon={<RefreshCw size={14} />}>Ara</Button>
        </form>
      </div>

      {!loading && lists.length === 0 && !filtered && (
        <p className="panel-surface mt-3 rounded-xl p-4 text-sm text-slate-500">Henüz kullanıcı listesi yok. Yeni üyeler hesap açtığında listeleri burada görünecek.</p>
      )}

      {lists.length > 0 && (
        <ul className="mt-3 grid gap-3">
          {lists.map((list) => (
            <li key={list.id} className="track-card grid gap-3 rounded-2xl p-4 md:grid-cols-[minmax(0,1fr)_auto]">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-semibold text-navy">{list.playlistName || list.ownerName}</p>
                  <span className="status-pill border border-sky-200 bg-sky-50 text-sky-800">{list.status === "active" ? "Aktif" : "Devredildi"}</span>
                  {list.role === "moderator" && <span className="status-pill border border-violet-200 bg-violet-50 text-violet-800">Moderatör</span>}
                  {list.role === "admin" && <span className="status-pill border border-amber-200 bg-amber-50 text-amber-800">Sistem rolü</span>}
                  <span className={list.spotifyExternalUrl ? "status-pill status-pill-success" : "status-pill"}>{list.spotifyExternalUrl ? "Spotify hazır" : "Spotify bekliyor"}</span>
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  Hesap: {list.ownerName}{list.email ? ` · ${list.email}` : ""} / {list.suggestionCount} toplam / {list.pendingCount} bekleyen / {list.approvedCount} onaylı
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 md:justify-end">
                {list.role !== "admin" && (
                  <Button
                    size="sm"
                    disabled={busy}
                    leadingIcon={<ShieldCheck size={14} />}
                    onClick={() => onRequestRoleChange({ id: list.id, ownerName: list.ownerName, role: list.role === "moderator" ? "member" : "moderator" })}
                  >
                    {list.role === "moderator" ? "Yetkiyi kaldır" : "Moderatör yap"}
                  </Button>
                )}
                {list.spotifyExternalUrl && (
                  <a href={list.spotifyExternalUrl} target="_blank" rel="noreferrer" className={buttonClassName({ variant: "primary", size: "sm" })}>
                    <ExternalLink size={14} /> Spotify&apos;da aç
                  </a>
                )}
                <Link href={`/u/${list.slug}`} className={buttonClassName({ size: "sm" })}>Profili aç</Link>
              </div>
            </li>
          ))}
        </ul>
      )}

      {!loading && lists.length === 0 && filtered && (
        <div className="panel-surface mt-3 rounded-xl p-5 text-sm text-slate-500">
          <strong className="block text-navy">Bu filtreyle eşleşen liste yok</strong>
          <p className="mt-1">Arama metnini veya durum filtresini temizleyerek yeniden dene.</p>
          <Button size="sm" className="mt-3" onClick={onClearFilters}>Filtreleri temizle</Button>
        </div>
      )}

      {totalPages > 1 && !loading && (
        <nav className="admin-pagination mt-4" aria-label="Kullanıcı listesi sayfaları">
          <button type="button" disabled={page <= 1} onClick={() => onLoad(page - 1)}>Önceki</button>
          <span>{page} / {totalPages}</span>
          <button type="button" disabled={page >= totalPages} onClick={() => onLoad(page + 1)}>Sonraki</button>
        </nav>
      )}
    </section>
  );
}
