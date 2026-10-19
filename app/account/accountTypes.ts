export type Suggestion = {
  id: string;
  trackName: string;
  artistName: string;
  suggestedBy: string | null;
  status: string;
};

export type AccountList = {
  id: string;
  slug: string;
  ownerName: string;
  playlistName: string | null;
  bio: string | null;
  profileStatus: string | null;
  universityName?: string | null;
  universityPublic?: boolean;
  pinnedFeedPostId: string | null;
  profileShowcase: string | null;
  favoriteGenres: string | null;
  profileTheme: string;
  profileDensity: string;
  profileBanner: string;
  featuredAchievementId: string | null;
  profileAchievements: Array<{ id: string; title: string; description: string }>;
  role?: string | null;
  email: string | null;
  submitCode: string | null;
  spotifyPlaylistId: string | null;
  spotifyExternalUrl: string | null;
  lastExportedAt: string | null;
  suggestions: Suggestion[];
  profilePosts: Array<{ id: string; trackName: string; artistName: string }>;
};

export type ScoreSummary = {
  rank: number;
  score: number;
  socialLikes: number;
  socialAdds: number;
};
