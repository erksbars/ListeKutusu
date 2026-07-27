import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthenticatedAccountListId } from "@/lib/session";

export const dynamic = "force-dynamic";

type ConnectionProfile = {
  id: string;
  ownerName: string;
  slug: string;
  bio: string | null;
  profileTheme: string;
  followers?: { id: string }[];
};

type ConnectionItem = {
  follower?: ConnectionProfile;
  following?: ConnectionProfile;
};

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug")?.trim();
  const type = req.nextUrl.searchParams.get("type");
  if (!slug || (type !== "followers" && type !== "following")) {
    return NextResponse.json({ error: "Bağlantı bilgisi eksik." }, { status: 400 });
  }

  const profile = await prisma.userList.findFirst({
    where: { slug, status: "active" },
    select: { id: true, ownerName: true },
  });
  if (!profile) {
    return NextResponse.json({ error: "Profil bulunamadı." }, { status: 404 });
  }

  const viewerId = await getAuthenticatedAccountListId();
  const follows = await prisma.follow.findMany({
    where: type === "followers" ? { followingId: profile.id } : { followerId: profile.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: type === "followers"
      ? {
          follower: {
            select: {
              id: true,
              ownerName: true,
              slug: true,
              bio: true,
              profileTheme: true,
              followers: viewerId
                ? { where: { followerId: viewerId }, select: { id: true }, take: 1 }
                : false,
            },
          },
        }
      : {
          following: {
            select: {
              id: true,
              ownerName: true,
              slug: true,
              bio: true,
              profileTheme: true,
              followers: viewerId
                ? { where: { followerId: viewerId }, select: { id: true }, take: 1 }
                : false,
            },
          },
        },
  });

  const users = (follows as ConnectionItem[]).flatMap((item) => {
    const user = item.follower ?? item.following;
    if (!user) return [];
    return {
      id: user.id,
      ownerName: user.ownerName,
      slug: user.slug,
      bio: user.bio,
      profileTheme: user.profileTheme,
      isMe: viewerId === user.id,
      following: Boolean(user.followers?.length),
    };
  });

  return NextResponse.json({ profile: { id: profile.id, ownerName: profile.ownerName }, type, users });
}
