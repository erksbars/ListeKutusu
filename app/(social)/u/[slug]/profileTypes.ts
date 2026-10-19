export type ProfilePost = {
  id: string;
  trackName: string;
  artistName: string;
  albumName: string | null;
  externalUrl: string | null;
  note: string | null;
  tags: string[];
  createdAt: string;
  likeCount: number;
  addCount: number;
  commentCount: number;
};

export type AchievementItem = {
  id: string;
  title: string;
  description: string;
  current: number;
  target: number;
  progress: number;
  unlocked: boolean;
};

export type ProfileForumThread = {
  id: string;
  slug: string;
  title: string;
  category: string;
  categoryLabel: string;
  views: number;
  replyCount: number;
  solved: boolean;
  lastActivityAt: string;
  createdAt: string;
};

export type ProfileGameSession = {
  id: string;
  gameCode: string;
  completedAt: string;
  winner: { id: string; trackName: string; artistName: string } | null;
};

export type Profile = {
  mediaShowcaseEnabled?: boolean;
  mediaShowcase?: import("@/lib/mediaShowcase").MediaShowcaseItem[];
  id: string;
  ownerName: string;
  playlistName: string | null;
  bio: string | null;
  profileStatus: string | null;
  universityName?: string | null;
  pinnedFeedPostId: string | null;
  showcaseModules: Array<"featured" | "identity" | "recent" | "forum">;
  favoriteGenres: string[];
  sharedGenres: string[];
  relatedProfiles: Array<{
    id: string;
    ownerName: string;
    slug: string;
    bio: string | null;
    profileTheme: string;
    sharedGenres: string[];
    followerCount: number;
    postCount: number;
  }>;
  profileTheme: string;
  profileDensity: "comfortable" | "compact";
  profileBanner: "line" | "band" | "split";
  slug: string;
  createdAt: string;
  isMe: boolean;
  following: boolean;
  blockedByMe: boolean;
  hasBlockedMe: boolean;
  followerCount: number;
  followingCount: number;
  postCount: number;
  totalLikes: number;
  totalAdds: number;
  forumThreadCount: number;
  completedGameCount: number;
  achievements: AchievementItem[];
  featuredAchievement: AchievementItem | null;
  forumThreads: ProfileForumThread[];
  games: ProfileGameSession[];
  nextAchievement: AchievementItem | null;
  posts: ProfilePost[];
  nextPostCursor: string | null;
};

export type ConnectionUser = {
  id: string;
  ownerName: string;
  slug: string;
  bio: string | null;
  profileTheme: string;
  isMe: boolean;
  following: boolean;
};

export type ProfileTab = "posts" | "activity" | "about" | "achievements";

export type ViewerAccount = {
  ownerName: string;
  email: string | null;
  slug: string;
  role?: string | null;
};
