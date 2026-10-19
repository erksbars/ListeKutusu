import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { communityPage } from "@/lib/communities";
import { createCommunityEvents } from "@/lib/communityEvents";
import { communityRequest } from "@/lib/communityHttp";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ slug: string }> };
export async function GET(req: NextRequest, context: Context) {
  const { slug } = await context.params;
  return communityRequest(req, false, userId => createCommunityEvents(prisma).list(slug, userId, communityPage(req.nextUrl.searchParams.get("page")), req.nextUrl.searchParams.get("filter") ?? "upcoming"));
}
export async function POST(req: NextRequest, context: Context) {
  const { slug } = await context.params;
  return communityRequest(req, true, (userId, body) => createCommunityEvents(prisma).create(slug, userId!, body), true, "event");
}
