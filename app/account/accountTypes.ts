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
  favoriteGenres: string | null;
  profileTheme: string;
  role?: string | null;
  email: string | null;
  submitCode: string | null;
  spotifyPlaylistId: string | null;
  spotifyExternalUrl: string | null;
  lastExportedAt: string | null;
  suggestions: Suggestion[];
};

export type ScoreSummary = {
  rank: number;
  score: number;
  socialLikes: number;
  socialAdds: number;
};
