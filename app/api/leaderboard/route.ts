import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const SOCIAL_LIKE_POINTS = 1;
const SOCIAL_ADD_POINTS = 5;

function monthStart(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export async function GET() {
  const start = monthStart();

  const posts = await prisma.feedPost.findMany({
    where: {
      status: "published",
      createdAt: { gte: start },
    },
    include: {
      author: {
        select: {
          id: true,
          ownerName: true,
          playlistName: true,
          spotifyExternalUrl: true,
        },
      },
      _count: { select: { likes: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const feedAdds = await prisma.feedListAdd.findMany({
    where: {
      createdAt: { gte: start },
    },
    include: {
      post: {
        select: {
          authorId: true,
          id: true,
          trackId: true,
          trackName: true,
          artistName: true,
          externalUrl: true,
          author: {
            select: {
              id: true,
              ownerName: true,
              playlistName: true,
              spotifyExternalUrl: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const byUser = new Map<
    string,
    {
      id: string;
      ownerName: string;
      playlistName: string | null;
      spotifyExternalUrl: string | null;
      score: number;
      socialLikes: number;
      socialAdds: number;
      total: number;
    }
  >();

  for (const item of posts) {
    const current =
      byUser.get(item.author.id) ??
      {
        id: item.author.id,
        ownerName: item.author.ownerName,
        playlistName: item.author.playlistName,
        spotifyExternalUrl: item.author.spotifyExternalUrl,
        score: 0,
        socialLikes: 0,
        socialAdds: 0,
        total: 0,
      };

    current.score += item._count.likes * SOCIAL_LIKE_POINTS;
    current.socialLikes += item._count.likes;
    current.total += item._count.likes;
    byUser.set(item.author.id, current);
  }

  for (const item of feedAdds) {
    if (item.userId === item.post.authorId) continue;
    const author = item.post.author;
    const current =
      byUser.get(author.id) ??
      {
        id: author.id,
        ownerName: author.ownerName,
        playlistName: author.playlistName,
        spotifyExternalUrl: author.spotifyExternalUrl,
        score: 0,
        socialLikes: 0,
        socialAdds: 0,
        total: 0,
      };

    current.score += SOCIAL_ADD_POINTS;
    current.socialAdds += 1;
    current.total += 1;
    byUser.set(author.id, current);
  }

  const users = [...byUser.values()]
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.socialAdds !== a.socialAdds) return b.socialAdds - a.socialAdds;
      return b.socialLikes - a.socialLikes;
    })
    .map((item, index) => ({
      ...item,
      approved: 0,
      rejected: 0,
      approvalRate: 0,
      rank: index + 1,
    }));

  const byTrack = new Map<
    string,
    {
      trackId: string;
      trackName: string;
      artistName: string;
      externalUrl: string | null;
      postId: string;
      adds: number;
      likes: number;
    }
  >();

  for (const post of posts) {
    const current = byTrack.get(post.trackId) ?? {
      trackId: post.trackId,
      trackName: post.trackName,
      artistName: post.artistName,
      externalUrl: post.externalUrl,
      postId: post.id,
      adds: 0,
      likes: 0,
    };
    current.likes += post._count.likes;
    byTrack.set(post.trackId, current);
  }

  const uniqueTrackAdds = new Set<string>();
  for (const add of feedAdds) {
    const uniqueKey = `${add.userId}:${add.post.trackId}`;
    if (uniqueTrackAdds.has(uniqueKey)) continue;
    uniqueTrackAdds.add(uniqueKey);

    const current = byTrack.get(add.post.trackId) ?? {
      trackId: add.post.trackId,
      trackName: add.post.trackName,
      artistName: add.post.artistName,
      externalUrl: add.post.externalUrl,
      postId: add.post.id,
      adds: 0,
      likes: 0,
    };
    current.adds += 1;
    byTrack.set(add.post.trackId, current);
  }

  const tracks = [...byTrack.values()]
    .filter((track) => track.adds > 0)
    .sort((a, b) => {
      if (b.adds !== a.adds) return b.adds - a.adds;
      if (b.likes !== a.likes) return b.likes - a.likes;
      return a.trackName.localeCompare(b.trackName, "tr");
    })
    .slice(0, 6)
    .map((track, index) => ({ ...track, rank: index + 1 }));

  const totals = users.reduce(
    (acc, item) => {
      acc.score += item.score;
      acc.socialLikes += item.socialLikes;
      acc.socialAdds += item.socialAdds;
      acc.participants += 1;
      return acc;
    },
    {
      score: 0,
      approved: 0,
      rejected: 0,
      socialLikes: 0,
      socialAdds: 0,
      participants: 0,
    }
  );

  return NextResponse.json(
    {
      rules: {
        socialLike: SOCIAL_LIKE_POINTS,
        socialAdd: SOCIAL_ADD_POINTS,
      },
      period: {
        startsAt: start.toISOString(),
        label: new Intl.DateTimeFormat("tr-TR", {
          month: "long",
          year: "numeric",
        }).format(start),
      },
      totals,
      users: users.slice(0, 12),
      tracks,
    },
    {
      headers: {
        "Cache-Control": "public, max-age=15, stale-while-revalidate=45",
      },
    }
  );
}
