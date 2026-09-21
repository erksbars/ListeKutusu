export type TrackResult = {
  id: string;
  uri: string;
  name: string;
  artist: string;
  album: string;
  imageUrl: string | null;
  externalUrl: string | null;
  durationMs: number;
};

export type FeedPost = {
  id: string;
  trackId: string;
  trackName: string;
  artistName: string;
  albumName: string | null;
  durationMs: number | null;
  externalUrl: string | null;
  source: string;
  note: string | null;
  tags: string[];
  createdAt: string;
  likeCount: number;
  addCount: number;
  commentCount: number;
  likedByMe: boolean;
  addedByMe: boolean;
  savedByMe: boolean;
  followingAuthor: boolean;
  isMine: boolean;
  recommendationReason: string | null;
  author: {
    id: string;
    ownerName: string;
    playlistName: string | null;
    slug: string;
  };
};
