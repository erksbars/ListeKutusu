import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getPublicProfile } from "@/lib/publicProfile";
import { getAuthenticatedAccountListId } from "@/lib/session";
import ProfileClient from "./ProfileClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  try {
    const profile = await prisma.userList.findFirst({
      where: { slug, status: "active" },
      select: { ownerName: true, bio: true, playlistName: true },
    });

    if (!profile) {
      return { title: "Profil bulunamadı", robots: { index: false, follow: false } };
    }

    const description =
      profile.bio?.trim() ||
      `${profile.ownerName} kullanıcısının müzik keşifleri ve ${profile.playlistName || "kişisel listesi"}.`;

    return {
      title: profile.ownerName,
      description,
      alternates: {
        canonical: `/u/${slug}`,
      },
      openGraph: {
        title: `${profile.ownerName} | ListeKutusu`,
        description,
        type: "profile",
        url: `/u/${slug}`,
      },
      twitter: {
        card: "summary",
        title: `${profile.ownerName} | ListeKutusu`,
        description,
      },
    };
  } catch {
    return { title: "Kullanıcı profili" };
  }
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const viewerId = await getAuthenticatedAccountListId();
  const [profile, viewer] = await Promise.all([
    getPublicProfile(slug, viewerId),
    viewerId
      ? prisma.userList.findUnique({
          where: { id: viewerId },
          select: { ownerName: true, email: true, slug: true, role: true },
        })
      : null,
  ]);
  if (!profile) notFound();
  return <ProfileClient slug={slug} initialProfile={profile} initialViewer={viewer} />;
}
