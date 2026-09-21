import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthenticatedAccountListId } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const listId = await getAuthenticatedAccountListId();
  if (!listId) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }

  const account = await prisma.userList.findUnique({
    where: { id: listId },
    select: {
      ownerName: true,
      playlistName: true,
      email: true,
      slug: true,
      bio: true,
      profileStatus: true,
      pinnedFeedPostId: true,
      profileShowcase: true,
      favoriteGenres: true,
      profileTheme: true,
      profileDensity: true,
      profileBanner: true,
      featuredAchievementId: true,
      role: true,
      notifyFollows: true,
      notifyLikes: true,
      notifyAdds: true,
      spotifyExternalUrl: true,
      createdAt: true,
      updatedAt: true,
      suggestions: {
        orderBy: { createdAt: "asc" },
        select: {
          trackName: true,
          artistName: true,
          status: true,
          suggestedBy: true,
          createdAt: true,
          decidedAt: true,
        },
      },
      feedPosts: {
        orderBy: { createdAt: "asc" },
        select: {
          trackName: true,
          artistName: true,
          albumName: true,
          note: true,
          tags: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      feedLikes: {
        orderBy: { createdAt: "asc" },
        select: {
          createdAt: true,
          post: { select: { trackName: true, artistName: true } },
        },
      },
      feedAdds: {
        orderBy: { createdAt: "asc" },
        select: {
          createdAt: true,
          post: { select: { trackName: true, artistName: true } },
        },
      },
      feedSaves: {
        orderBy: { createdAt: "asc" },
        select: {
          createdAt: true,
          post: { select: { trackName: true, artistName: true } },
        },
      },
      feedHides: {
        orderBy: { createdAt: "asc" },
        select: {
          createdAt: true,
          post: { select: { trackName: true, artistName: true } },
        },
      },
      following: {
        orderBy: { createdAt: "asc" },
        select: {
          createdAt: true,
          following: { select: { ownerName: true, slug: true } },
        },
      },
      followers: {
        orderBy: { createdAt: "asc" },
        select: {
          createdAt: true,
          follower: { select: { ownerName: true, slug: true } },
        },
      },
      blocksInitiated: {
        orderBy: { createdAt: "asc" },
        select: {
          createdAt: true,
          blocked: { select: { ownerName: true, slug: true } },
        },
      },
      reportsMade: {
        orderBy: { createdAt: "asc" },
        select: {
          reason: true,
          details: true,
          status: true,
          createdAt: true,
          reviewedAt: true,
          post: { select: { trackName: true, artistName: true } },
        },
      },
      forumThreads: {
        orderBy: { createdAt: "asc" },
        select: {
          category: true,
          title: true,
          body: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          approvedAt: true,
          acceptedAt: true,
          acceptedReply: {
            select: {
              body: true,
              author: { select: { ownerName: true, slug: true } },
            },
          },
        },
      },
      forumReplies: {
        orderBy: { createdAt: "asc" },
        select: {
          body: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          thread: { select: { title: true, slug: true } },
        },
      },
      notifications: {
        orderBy: { createdAt: "asc" },
        select: {
          type: true,
          readAt: true,
          createdAt: true,
          actor: { select: { ownerName: true, slug: true } },
        },
      },
      sessions: {
        orderBy: { createdAt: "asc" },
        select: {
          persistent: true,
          createdAt: true,
          lastSeenAt: true,
          expiresAt: true,
          revokedAt: true,
        },
      },
    },
  });

  if (!account) {
    return NextResponse.json({ error: "Hesap bulunamadı." }, { status: 404 });
  }

  const payload = JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      account,
    },
    null,
    2
  );
  const filename = `listekutusu-${account.slug}-verilerim.json`;

  return new NextResponse(payload, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
