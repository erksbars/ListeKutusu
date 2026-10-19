import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { communityPage } from "@/lib/communities";
import { communitySavedPosts } from "@/lib/communitySavedPosts";
import { communityRequest } from "@/lib/communityHttp";
export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  return communityRequest(req, false, userId => communitySavedPosts(prisma, userId, communityPage(req.nextUrl.searchParams.get("page")), req.nextUrl.searchParams.get("postType") ?? "all", req.nextUrl.searchParams.get("reviewKind") ?? "all"));
}
