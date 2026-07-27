export type DiscoverSourcePost = {
  id: string;
  trackId: string;
  trackName: string;
  artistName: string;
  externalUrl: string | null;
  tags: string[];
  createdAt: Date;
  likeCount: number;
  addCount: number;
  likedByMe?: boolean;
  addedByMe?: boolean;
  author: {
    id: string;
    ownerName: string;
    slug: string;
    profileTheme: string;
  };
};

function normalize(value: string) {
  return value.trim().toLocaleLowerCase("tr-TR");
}

export function buildDiscoverData(posts: DiscoverSourcePost[], now = new Date()) {
  const scored = posts.map((post) => {
    const ageHours = Math.max(0, (now.getTime() - post.createdAt.getTime()) / 3_600_000);
    const freshness = Math.max(0, 168 - ageHours) / 24;
    return {
      ...post,
      score: Number((post.addCount * 5 + post.likeCount * 2 + freshness).toFixed(2)),
    };
  });

  const uniqueTracks = new Map<string, (typeof scored)[number]>();
  for (const post of scored.sort((left, right) => right.score - left.score)) {
    const current = uniqueTracks.get(post.trackId);
    if (!current || post.score > current.score) uniqueTracks.set(post.trackId, post);
  }

  const tagMap = new Map<string, { tag: string; posts: number; engagement: number }>();
  for (const post of posts) {
    for (const rawTag of new Set(post.tags.map(normalize).filter(Boolean))) {
      const current = tagMap.get(rawTag) ?? { tag: rawTag, posts: 0, engagement: 0 };
      current.posts += 1;
      current.engagement += post.likeCount + post.addCount * 3;
      tagMap.set(rawTag, current);
    }
  }

  const curatorMap = new Map<
    string,
    {
      id: string;
      ownerName: string;
      slug: string;
      profileTheme: string;
      posts: number;
      likes: number;
      adds: number;
      score: number;
    }
  >();
  for (const post of posts) {
    const current = curatorMap.get(post.author.id) ?? {
      ...post.author,
      posts: 0,
      likes: 0,
      adds: 0,
      score: 0,
    };
    current.posts += 1;
    current.likes += post.likeCount;
    current.adds += post.addCount;
    current.score += post.likeCount * 2 + post.addCount * 5;
    curatorMap.set(post.author.id, current);
  }

  return {
    tracks: [...uniqueTracks.values()].slice(0, 18),
    tags: [...tagMap.values()]
      .sort(
        (left, right) =>
          right.engagement - left.engagement || right.posts - left.posts || left.tag.localeCompare(right.tag, "tr")
      )
      .slice(0, 16),
    curators: [...curatorMap.values()]
      .sort(
        (left, right) =>
          right.score - left.score || right.adds - left.adds || right.posts - left.posts
      )
      .slice(0, 10),
    totals: {
      posts: posts.length,
      tracks: uniqueTracks.size,
      tags: tagMap.size,
      curators: curatorMap.size,
    },
  };
}
