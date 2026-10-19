import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { communityRequest } from "@/lib/communityHttp";
import { createCommunityLifecycle } from "@/lib/communityLifecycle";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ slug: string }> };
export async function GET(req: NextRequest, context: Context) {
  const { slug } = await context.params;
  return communityRequest(req, false, userId => createCommunityLifecycle(prisma).read(slug, userId));
}
export async function POST(req: NextRequest, context: Context) {
  const { slug } = await context.params;
  return communityRequest(req, true, (userId, body) => createCommunityLifecycle(prisma).mutate(slug, userId!, body));
}
