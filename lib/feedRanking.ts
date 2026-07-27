export type PersonalizationSignals = {
  favoriteGenres: string[];
  likedTags: string[];
  addedTags: string[];
  likedArtists: string[];
  addedArtists: string[];
  followingIds: string[];
};

export type RankableFeedPost = {
  id: string;
  authorId: string;
  artistName: string;
  tags: string[];
  createdAt: Date;
  likeCount: number;
  addCount: number;
  addedByMe?: boolean;
};

type DiversifiableFeedPost = Pick<RankableFeedPost, "authorId" | "artistName">;

type ScoredFeedPost<T extends DiversifiableFeedPost> = {
  post: T;
  score: number;
  reason: string;
};

function normalize(value: string) {
  return value.trim().toLocaleLowerCase("tr-TR");
}

function normalizedSet(values: string[]) {
  return new Set(values.map(normalize).filter(Boolean));
}

function matchingTag(tags: string[], signals: Set<string>) {
  return tags.find((tag) => {
    const normalizedTag = normalize(tag);
    return [...signals].some(
      (signal) => normalizedTag.includes(signal) || signal.includes(normalizedTag)
    );
  });
}

export function diversifyFeedRanking<T extends DiversifiableFeedPost>(
  items: ScoredFeedPost<T>[],
  limit = items.length
) {
  const remaining = [...items];
  const selected: ScoredFeedPost<T>[] = [];
  const authorFrequency = new Map<string, number>();
  const artistFrequency = new Map<string, number>();

  while (remaining.length > 0 && selected.length < limit) {
    let bestIndex = 0;
    let bestAdjustedScore = Number.NEGATIVE_INFINITY;

    remaining.forEach((item, index) => {
      const authorPenalty = (authorFrequency.get(item.post.authorId) ?? 0) * 5;
      const artistPenalty = (artistFrequency.get(normalize(item.post.artistName)) ?? 0) * 4;
      const adjustedScore = item.score - authorPenalty - artistPenalty;

      if (adjustedScore > bestAdjustedScore) {
        bestAdjustedScore = adjustedScore;
        bestIndex = index;
      }
    });

    const [next] = remaining.splice(bestIndex, 1);
    selected.push(next);
    authorFrequency.set(next.post.authorId, (authorFrequency.get(next.post.authorId) ?? 0) + 1);
    const artist = normalize(next.post.artistName);
    artistFrequency.set(artist, (artistFrequency.get(artist) ?? 0) + 1);
  }

  return selected;
}

export function rankPersonalizedFeed<T extends RankableFeedPost>(
  posts: T[],
  signals: PersonalizationSignals,
  now = new Date()
) {
  const favoriteGenres = normalizedSet(signals.favoriteGenres);
  const likedTags = normalizedSet(signals.likedTags);
  const addedTags = normalizedSet(signals.addedTags);
  const likedArtists = normalizedSet(signals.likedArtists);
  const addedArtists = normalizedSet(signals.addedArtists);
  const followingIds = new Set(signals.followingIds);

  const scored = posts
    .map((post) => {
      const artist = normalize(post.artistName);
      const favoriteMatch = matchingTag(post.tags, favoriteGenres);
      const addedTagMatch = matchingTag(post.tags, addedTags);
      const likedTagMatch = matchingTag(post.tags, likedTags);
      const addedArtist = addedArtists.has(artist);
      const likedArtist = likedArtists.has(artist);
      const following = followingIds.has(post.authorId);
      const ageHours = Math.max(0, (now.getTime() - post.createdAt.getTime()) / 3_600_000);
      const freshness = Math.max(0, 72 - ageHours) / 18;
      const engagement = Math.min(18, post.addCount * 4 + post.likeCount * 1.5);

      let score = freshness + engagement;
      if (favoriteMatch) score += 9;
      if (addedTagMatch) score += 7;
      if (likedTagMatch) score += 4;
      if (addedArtist) score += 10;
      if (likedArtist) score += 6;
      if (following) score += 5;
      if (post.addedByMe) score -= 12;

      const reason = addedArtist
        ? "Daha önce eklediğin sanatçı"
        : favoriteMatch
          ? `${favoriteMatch} zevkine yakın`
          : likedArtist
            ? "Beğendiğin sanatçı"
            : following
              ? "Takip ettiğin profil"
              : addedTagMatch
                ? `${addedTagMatch} ilgine yakın`
                : likedTagMatch
                  ? `${likedTagMatch} ilgine yakın`
                  : "Toplulukta yükseliyor";

      return { post, score, reason };
    });

  return diversifyFeedRanking(scored);
}
