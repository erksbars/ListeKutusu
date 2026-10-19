export const PLATFORM_CASE_KINDS = { community: "Topluluk yönetimi / güvenlik bildirimi", report_appeal: "İncelenen şikâyetime itiraz", ban_appeal: "Uzaklaştırılmama itiraz" } as const;
export const PLATFORM_CASE_STATUSES = { pending: "İnceleme bekliyor", resolved: "Sonuçlandırıldı", dismissed: "İşleme alınmadı" } as const;
export type PlatformCaseRow = { id: string; kind: string; reason: string; status: string; response: string | null; version: number; createdAt: string; reviewedAt: string | null; community: { slug: string; name: string } };
export type PlatformCaseList = { cases: PlatformCaseRow[]; page: number; total: number; hasMore: boolean };
export type OwnPlatformCases = PlatformCaseList & { context: { slug: string; name: string; canAppealBan: boolean; reports: Array<{ id: string; targetType: string; reviewedAt: string | null }> } | null };
