import type { CommunityAuthor, CommunityDetail } from "./communityTypes";
export const COMMUNITY_AUDIT_ACTIONS: Record<string, string> = {
  "ban": "Üye uzaklaştırıldı", "unban": "Üye engeli kaldırıldı", "promote": "Moderatör atandı", "demote": "Moderatör yetkisi kaldırıldı",
  "resolve-report": "Bildirim incelendi", "remove-post": "Paylaşım kaldırıldı", "remove-comment": "Yorum kaldırıldı",
  "edit-review": "İnceleme yazarı tarafından düzenlendi",
  "cancel-event": "Etkinlik iptal edildi", "remove-event": "Etkinlik kaldırıldı", "update-event": "Etkinlik yönetimce düzenlendi", "update-discovery": "Keşif bilgileri güncellendi",
  "offer-ownership": "Sahiplik teklifi gönderildi", "accept-ownership": "Sahiplik devri kabul edildi", "decline-ownership": "Sahiplik teklifi reddedildi", "cancel-ownership": "Sahiplik teklifi geri çekildi",
  "archive-community": "Topluluk arşivlendi", "restore-community": "Topluluk yeniden açıldı",
};
export type CommunityManagementView = "reports" | "members" | "history";
export type CommunityManagementData = {
  view: CommunityManagementView; page: number; total: number; hasMore: boolean;
  members: CommunityDetail["members"];
  reports: Array<CommunityDetail["reports"][number] & { status: string; reviewedAt: string | null; reviewedBy: CommunityAuthor | null }>;
  logs: Array<{ id: string; action: string; targetType: string; targetId: string; note: string | null; createdAt: string; actor: CommunityAuthor | null }>;
};
