import type { Metadata } from "next";
import { prisma } from "@/lib/db";
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
      openGraph: {
        title: `${profile.ownerName} | ListeKutusu`,
        description,
        type: "profile",
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
  return <ProfileClient slug={slug} />;
}
