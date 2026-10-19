import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { communityRequest } from "@/lib/communityHttp";
import { communityManagement } from "@/lib/communityManagement";
export const dynamic = "force-dynamic";
export async function GET(req: NextRequest, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  return communityRequest(req, false, userId => communityManagement(prisma, slug, userId, Object.fromEntries(req.nextUrl.searchParams)));
}
