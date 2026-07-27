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

export type Profile = {
  id: string;
  ownerName: string;
  playlistName: string | null;
  bio: string | null;
  favoriteGenres: string[];
  profileTheme: string;
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
  achievements: AchievementItem[];
  nextAchievement: AchievementItem | null;
  posts: ProfilePost[];
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

export type ProfileTab = "posts" | "about" | "achievements";

export type ViewerAccount = {
  ownerName: string;
  email: string | null;
  slug: string;
  role?: string | null;
};
