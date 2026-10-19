import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getFeedPostDetail } from "@/lib/feedPostDetail";
import { getAuthenticatedAccountListId } from "@/lib/session";
import PostDetailClient from "@/app/(social)/p/[id]/PostDetailClient";
import { feedReturnPath } from "@/lib/feedNavigation";

type PageProps = { params: Promise<{ id: string }>; searchParams: Promise<{ from?: string | string[] }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const post = await prisma.feedPost.findFirst({
    where: { id, status: "published", author: { status: "active" } },
    select: { trackName: true, artistName: true, note: true },
  });

  if (!post) {
    return { title: "Paylaşım bulunamadı", robots: { index: false, follow: false } };
  }

  const title = `${post.trackName} - ${post.artistName}`;
  const description = post.note?.trim() || `${post.artistName} tarafından ${post.trackName} için topluluk paylaşımı.`;
  return {
    title,
    description,
    openGraph: { title: `${title} | ListeKutusu`, description, type: "article" },
  };
}

export default async function PostDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const query = await searchParams;
  const viewerId = await getAuthenticatedAccountListId();
  const [post, viewer] = await Promise.all([
    getFeedPostDetail(id, viewerId),
    viewerId
      ? prisma.userList.findUnique({
          where: { id: viewerId },
          select: { id: true, ownerName: true, email: true, slug: true, role: true },
        })
      : null,
  ]);

  if (!post) notFound();
  return <PostDetailClient initialPost={post} viewer={viewer} returnTo={feedReturnPath(typeof query.from === "string" ? query.from : null)} />;
}
