"use client";

import { CheckCircle2, ListMusic, ShieldCheck, TriangleAlert } from "lucide-react";
import { Button } from "../ui";
import type { AdminSettings } from "./adminTypes";

type AdminOverviewProps = {
  pendingTotal: number;
  listTotal: number;
  pendingReports: number;
  settings: AdminSettings | null;
  exportedListCount: number;
  reconnecting: boolean;
  onReconnect: () => void;
};

export function AdminOverview({
  pendingTotal,
  listTotal,
  pendingReports,
  settings,
  exportedListCount,
  reconnecting,
  onReconnect,
}: AdminOverviewProps) {
  return (
    <>
      <section className="admin-summary mb-6" aria-label="Yönetim özeti">
        <div className="admin-summary-item"><TriangleAlert size={18} /><span><strong>{pendingTotal}</strong><small>Bekleyen karar</small></span></div>
        <div className="admin-summary-item"><ListMusic size={18} /><span><strong>{listTotal}</strong><small>Kullanıcı listesi</small></span></div>
        <div className="admin-summary-item"><ShieldCheck size={18} /><span><strong>{pendingReports}</strong><small>Şikâyet</small></span></div>
        <div className="admin-summary-item"><CheckCircle2 size={18} /><span><strong>{settings?.spotifyUserId ? "Bağlı" : "Bekliyor"}</strong><small>Spotify durumu</small></span></div>
      </section>

      <section className="panel-surface rounded-2xl p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-sky-700">Spotify bağlantı sağlığı</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Durum: {settings?.spotifyUserId ? "bağlı" : "yeniden bağlantı gerekli"}.
              {settings?.spotifyUserId
                ? ` ${exportedListCount} liste Spotify'a aktarılmış.`
                : " Playlist oluşturma ve güncelleme için Spotify izinleri onaylanmalı."}
            </p>
          </div>
          <Button onClick={onReconnect} loading={reconnecting} className="shrink-0">
            Spotify&apos;ı yeniden bağla
          </Button>
        </div>
      </section>
    </>
  );
}
