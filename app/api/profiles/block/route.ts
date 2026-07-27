import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthenticatedAccountListId } from "@/lib/session";
import { checkRateLimit } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

export async function GET() {
  const blockerId = await getAuthenticatedAccountListId();
  if (!blockerId) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const blocks = await prisma.userBlock.findMany({
    where: { blockerId, blocked: { status: "active" } },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      createdAt: true,
      blocked: {
        select: { id: true, ownerName: true, slug: true, bio: true, profileTheme: true },
      },
    },
  });

  return NextResponse.json({
    users: blocks.map((block) => ({ ...block.blocked, blockedAt: block.createdAt })),
  });
}

export async function POST(req: NextRequest) {
  const blockerId = await getAuthenticatedAccountListId();
  if (!blockerId) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const limited = checkRateLimit(req, {
    name: "profile-block",
    identifier: blockerId,
    limit: 20,
    windowMs: 60_000,
  });
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Çok hızlı işlem yapıyorsun. Biraz sonra tekrar dene." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfter) } }
    );
  }

  const body = await req.json().catch(() => null);
  const profileId = typeof body?.profileId === "string" ? body.profileId.trim() : "";
  if (!profileId || profileId === blockerId) {
    return NextResponse.json({ error: "Geçersiz profil." }, { status: 400 });
  }

  const profile = await prisma.userList.findFirst({
    where: { id: profileId, status: "active" },
    select: { id: true },
  });
  if (!profile) return NextResponse.json({ error: "Profil bulunamadı." }, { status: 404 });

  const existing = await prisma.userBlock.findUnique({
    where: { blockerId_blockedId: { blockerId, blockedId: profileId } },
  });

  if (existing) {
    await prisma.userBlock.delete({ where: { id: existing.id } });
    return NextResponse.json({ blocked: false });
  }

  await prisma.$transaction([
    prisma.userBlock.create({ data: { blockerId, blockedId: profileId } }),
    prisma.follow.deleteMany({
      where: {
        OR: [
          { followerId: blockerId, followingId: profileId },
          { followerId: profileId, followingId: blockerId },
        ],
      },
    }),
    prisma.notification.deleteMany({
      where: {
        type: "follow",
        OR: [
          { userId: blockerId, actorId: profileId },
          { userId: profileId, actorId: blockerId },
        ],
      },
    }),
  ]);

  return NextResponse.json({ blocked: true });
}
