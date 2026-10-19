export const COMMUNITY_CATEGORIES = { interest: "İlgi alanı", university: "Üniversite", local: "Yerel topluluk" } as const;
export const REVIEW_KINDS = { music: "Müzik", tv: "Dizi", movie: "Film", book: "Kitap", game: "Video oyunu", boardgame: "Kutu oyunu" } as const;
export type CommunityPostAttributes = { type: string; reviewKind: string | null; subjectTitle: string | null; rating: number | null; spoiler: boolean; sourceUrl: string | null; referenceProvider: string | null; editedAt?: string | null };
export type LibraryReviewReference = { id: string; title: string; reviewKind: string; provider: string; sourceUrl: string };
export type CommunityCard = import("./communityDiscoveryTypes").CommunityDiscoveryLabels & { id: string; slug: string; name: string; description: string; category: string; status?: string; memberCount: number };
export type CommunityAuthor = { id: string; ownerName: string; slug: string };
export type CommunityEventSummary = { id: string; distribution: string; title: string; startsAt: string; timeZone: string; city: string; venue: string; capacity: number | null; status: string; contentVersion: number; organizer: CommunityAuthor; attendingCount: number; interestedCount: number; viewerStatus: string | null };
export type CommunityEventDetail = { event: CommunityEventSummary & { description: string }; canManage: boolean; canReport: boolean; reportStatus: string | null; canRespond: boolean; canWithdraw: boolean; participants: CommunityAuthor[] };
export type CommunityPostReactionState = { likeCount: number; viewerLiked: boolean; viewerSaved: boolean; canLike: boolean; canSave: boolean };
export type CommunityPostSummary = CommunityPostAttributes & CommunityPostReactionState & { id: string; distribution: string; title: string; excerpt: string; createdAt: string; author: CommunityAuthor; commentCount: number };
export type CommunityDetail = {
  community: CommunityCard & { rules: string }; viewerId: string | null;
  membership: { role: string; status: string } | null; canModerate: boolean;
  posts: CommunityPostSummary[]; page: number; hasMore: boolean;
  members: Array<{ userId: string; role: string; status: string; user: CommunityAuthor }>;
  reports: Array<{ id: string; targetType: string; targetId: string; postId: string | null; reason: string; createdAt: string }>;
};
export type CommunityPostDetail = { post: CommunityPostAttributes & CommunityPostReactionState & { id: string; distribution: string; title: string; body: string; createdAt: string; revision: number; author: CommunityAuthor };
  comments: Array<{ id: string; body: string; createdAt: string; author: CommunityAuthor }>; page: number; hasMore: boolean };
