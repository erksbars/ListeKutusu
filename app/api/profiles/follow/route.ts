import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkRateLimit } from "@/lib/rateLimit";
import { getAuthenticatedAccountListId } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const followerId = await getAuthenticatedAccountListId();
  if (!followerId) {
    return NextResponse.json(
      { error: "Takip etmek için giriş yapmalısın." },
      { status: 401 }
    );
  }

  const limited = checkRateLimit(req, {
    name: "profile-follow",
    limit: 30,
    windowMs: 60_000,
  });

  if (!limited.ok) {
    return NextResponse.json(
      { error: "Çok hızlı işlem yapıyorsun. Biraz sonra tekrar dene." },
      {
        status: 429,
        headers: { "Retry-After": String(limited.retryAfter) },
      }
    );
  }

  const body = await req.json().catch(() => null);
  const profileId = typeof body?.profileId === "string" ? body.profileId.trim() : "";
  if (!profileId) {
    return NextResponse.json({ error: "Profil bilgisi eksik." }, { status: 400 });
  }

  if (profileId === followerId) {
    return NextResponse.json(
      { error: "Kendi profilini takip edemezsin." },
      { status: 400 }
    );
  }

  const profile = await prisma.userList.findFirst({
    where: { id: profileId, status: "active" },
    select: { id: true, notifyFollows: true },
  });
  if (!profile) {
    return NextResponse.json({ error: "Profil bulunamadı." }, { status: 404 });
  }

  const blocked = await prisma.userBlock.findFirst({
    where: {
      OR: [
        { blockerId: followerId, blockedId: profileId },
        { blockerId: profileId, blockedId: followerId },
      ],
    },
    select: { id: true },
  });
  if (blocked) {
    return NextResponse.json({ error: "Bu profille takip etkileşimi kapalı." }, { status: 403 });
  }

  const existing = await prisma.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId,
        followingId: profileId,
      },
    },
  });

  const following = !existing;
  if (existing) {
    await prisma.$transaction([
      prisma.follow.delete({ where: { id: existing.id } }),
      prisma.notification.deleteMany({
        where: {
          userId: profileId,
          actorId: followerId,
          type: "follow",
          postId: null,
        },
      }),
    ]);
  } else {
    const followOperation = prisma.follow.create({
        data: {
          followerId,
          followingId: profileId,
        },
      });
    if (profile.notifyFollows) {
      await prisma.$transaction([
        followOperation,
        prisma.notification.create({
        data: {
          userId: profileId,
          actorId: followerId,
          type: "follow",
        },
        }),
      ]);
    } else {
      await followOperation;
    }
  }

  const followerCount = await prisma.follow.count({
    where: { followingId: profileId },
  });

  return NextResponse.json({ following, followerCount });
}
