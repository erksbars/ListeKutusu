import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { createCommunities, communityPage } from "@/lib/communities";
import { communityRequest } from "@/lib/communityHttp";
export const dynamic = "force-dynamic";
export async function GET(req: NextRequest, context: { params: Promise<{ slug: string; postId: string }> }) {
  const { slug, postId } = await context.params;
  return communityRequest(req, false, userId => createCommunities(prisma).post(slug, postId, userId, communityPage(req.nextUrl.searchParams.get("page"))));
}
