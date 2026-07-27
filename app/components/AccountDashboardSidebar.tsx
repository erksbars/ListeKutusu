"use client";

import {
  Database,
  Inbox,
  KeyRound,
  ListMusic,
  ShieldBan,
  Trophy,
  UserRound,
} from "lucide-react";

export type PanelTab = "requests" | "list" | "profile" | "security" | "privacy" | "data";

export const panelTabs = [
  { value: "requests", label: "Gelen öneriler", description: "Bekleyen şarkıları incele ve karar geçmişini yönet.", icon: Inbox },
  { value: "list", label: "Listem", description: "Liste adını, aktarımı ve Spotify senkronunu yönet.", icon: ListMusic },
  { value: "profile", label: "Profil", description: "Topluluk profilinin açıklamasını, türlerini ve temasını düzenle.", icon: UserRound },
  { value: "security", label: "Güvenlik", description: "Şifreni ve hesabının açık olduğu oturumları yönet.", icon: KeyRound },
  { value: "privacy", label: "Gizlilik", description: "Engellediğin hesapları ve etkileşim sınırlarını yönet.", icon: ShieldBan },
  { value: "data", label: "Veri ve hesap", description: "Verilerini indir veya hesabınla ilgili kalıcı işlemleri yönet.", icon: Database },
] as const;

export const panelGroups = [
  { label: "Liste yönetimi", values: ["requests", "list", "profile"] as PanelTab[] },
  { label: "Hesap", values: ["security", "privacy", "data"] as PanelTab[] },
] as const;

export function isPanelTab(value: string | null): value is PanelTab {
  return panelTabs.some((tab) => tab.value === value);
}

type AccountDashboardSidebarProps = {
  ownerName: string;
  playlistName: string | null;
  initials: string;
  activeTab: PanelTab;
  pendingCount: number;
  approvedCount: number;
  listDirty: boolean;
  profileDirty: boolean;
  scoreSummary: { rank: number; score: number } | null;
  onTabChange: (tab: PanelTab) => void;
};

export function AccountDashboardSidebar({
  ownerName,
  playlistName,
  initials,
  activeTab,
  pendingCount,
  approvedCount,
  listDirty,
  profileDirty,
  scoreSummary,
  onTabChange,
}: AccountDashboardSidebarProps) {
  return (
    <aside className="account-side-panel lg:sticky lg:top-24">
      <div className="flex items-center gap-3 px-2 pb-5">
        <span className="nav-profile-avatar h-11 w-11 text-sm">{initials}</span>
        <div className="min-w-0">
          <p className="truncate text-sm font-black text-white">{ownerName}</p>
          <p className="mt-0.5 truncate text-xs text-cyan-50/72">{playlistName || "Kişisel liste"}</p>
        </div>
      </div>
      <nav aria-label="Hesap paneli bölümleri" className="account-side-navigation">
        {panelGroups.map((group) => (
          <div key={group.label} className="account-nav-group">
            <p className="account-nav-group-label">{group.label}</p>
            <div className="grid gap-1">
              {panelTabs
                .filter((tab) => group.values.includes(tab.value))
                .map(({ value, label, icon: Icon }) => {
                  const count = value === "requests" ? pendingCount : value === "list" ? approvedCount : null;
                  const dirty = (value === "list" && listDirty) || (value === "profile" && profileDirty);
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => onTabChange(value)}
                      aria-current={activeTab === value ? "page" : undefined}
                      className={`account-side-nav flex min-h-11 items-center gap-3 rounded-xl px-3 text-left text-sm font-bold ${
                        activeTab === value ? "account-side-nav-active" : ""
                      }`}
                    >
                      <Icon size={18} strokeWidth={2.2} aria-hidden="true" />
                      <span className="flex-1">{label}</span>
                      {dirty ? (
                        <span
                          className="account-dirty-dot"
                          title="Kaydedilmemiş değişiklik"
                          aria-label="Kaydedilmemiş değişiklik"
                        />
                      ) : typeof count === "number" && count > 0 ? (
                        <span className="min-w-6 rounded-full bg-white/10 px-1.5 py-0.5 text-center text-xs font-black text-cyan-100">
                          {count}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
            </div>
          </div>
        ))}
      </nav>
      <div className="account-score-card mt-5 rounded-2xl p-4">
        <div className="flex items-center gap-2 text-cyan-100/72">
          <Trophy size={17} aria-hidden="true" />
          <p className="text-xs font-black uppercase tracking-[0.12em]">Bu ay</p>
        </div>
        <p className="mt-3 text-2xl font-black text-white">{scoreSummary?.score ?? 0} puan</p>
        <p className="mt-1 text-xs leading-5 text-cyan-50/72">
          {scoreSummary ? `Toplulukta #${scoreSummary.rank} sıradasın` : "Henüz sıralama oluşmadı"}
        </p>
      </div>
    </aside>
  );
}

type AccountStatusStripProps = {
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  removedCount: number;
};

export function AccountStatusStrip({ pendingCount, approvedCount, rejectedCount, removedCount }: AccountStatusStripProps) {
  return (
    <section className="account-summary-grid account-status-strip mt-4 grid sm:grid-cols-3" aria-label="Liste durumu">
      <div className="account-stat-card">
        <p>Bekleyen</p>
        <strong>{pendingCount}</strong>
        <span>onay bekliyor</span>
      </div>
      <div className="account-stat-card">
        <p>Listemde</p>
        <strong>{approvedCount}</strong>
        <span>onaylı şarkı</span>
      </div>
      <div className="account-stat-card">
        <p>Kararlar</p>
        <strong>{rejectedCount + removedCount}</strong>
        <span>{rejectedCount} red · {removedCount} çıkarıldı</span>
      </div>
    </section>
  );
}
