export type AdminSettings = {
  spotifyUserId: string | null;
  playlistId: string | null;
  playlistName: string | null;
};

export type AdminSuggestion = {
  id: string;
  trackName: string;
  artistName: string;
  suggestedBy: string | null;
  status: string;
  createdAt: string;
  list: {
    ownerName: string;
    spotifyExternalUrl: string | null;
  } | null;
};

export type AdminUserList = {
  id: string;
  ownerName: string;
  email: string | null;
  role: "member" | "moderator" | "admin";
  playlistName: string | null;
  slug: string;
  status: string;
  spotifyExternalUrl: string | null;
  createdAt: string;
  updatedAt: string;
  lastExportedAt: string | null;
  suggestionCount: number;
  pendingCount: number;
  approvedCount: number;
};

export type AdminPostReport = {
  targetType: "post" | "comment";
  id: string;
  reason: string;
  details: string | null;
  createdAt: string;
  reviewedAt: string | null;
  status: "pending" | "resolved" | "dismissed";
  reportCount: number;
  reasons: string[];
  reporters: Array<{ ownerName: string; slug: string }>;
  reporter: { ownerName: string; slug: string };
  post: {
    id: string;
    trackName: string;
    artistName: string;
    note: string | null;
    author: { ownerName: string; slug: string };
  };
  comment: { id: string; body: string; author: { ownerName: string; slug: string } } | null;
};

export type AdminReportFilter = AdminPostReport["status"];
export type AdminListFilter = "all" | "ready" | "waiting";

export type AdminActivitySummary = {
  newAccounts: number;
  suggestions: number;
  approvedSuggestions: number;
  rejectedSuggestions: number;
  feedPosts: number;
  forumThreads: number;
  reports: number;
  auditEvents: number;
};

export type AdminAuditLog = {
  id: string;
  action: string;
  targetType: string;
  targetId: string | null;
  targetLabel: string | null;
  metadata: Record<string, string | number | boolean | null> | null;
  createdAt: string;
};

export const activityKinds = [
  { value: "all", label: "Tüm işlemler" },
  { value: "suggestion", label: "Şarkı kararları" },
  { value: "report", label: "Şikâyetler" },
  { value: "forum", label: "Forum" },
  { value: "user", label: "Kullanıcılar" },
  { value: "settings", label: "Ayarlar" },
] as const;

export type ActivityKind = (typeof activityKinds)[number]["value"];

export const auditActionLabels: Record<string, string> = {
  "suggestion.approve": "Şarkı önerisi onaylandı",
  "suggestion.reject": "Şarkı önerisi reddedildi",
  "report.resolve": "Şikâyet çözüldü",
  "report.dismiss": "Şikâyet reddedildi",
  "report.remove_post": "Paylaşım kaldırıldı",
  "report.remove_comment": "Yorum kaldırıldı",
  "forum.approve": "Forum konusu yayınlandı",
  "forum.reject": "Forum konusu reddedildi",
  "forum.remove": "Forum konusu kaldırıldı",
  "forum.lock": "Forum konusu kilitlendi",
  "forum.unlock": "Forum konusu açıldı",
  "forum.remove_reply": "Forum yanıtı kaldırıldı",
  "user.role_change": "Kullanıcı rolü değiştirildi",
  "settings.playlist_update": "Spotify liste ayarı güncellendi",
};

export const adminDateFormatter = new Intl.DateTimeFormat("tr-TR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function dateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function reportDateRange(days: number) {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - (days - 1));
  return { from: dateInputValue(from), to: dateInputValue(to) };
}

export const defaultActivityRange = reportDateRange(30);

export const emptyActivitySummary: AdminActivitySummary = {
  newAccounts: 0,
  suggestions: 0,
  approvedSuggestions: 0,
  rejectedSuggestions: 0,
  feedPosts: 0,
  forumThreads: 0,
  reports: 0,
  auditEvents: 0,
};
