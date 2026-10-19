import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { communityRequest } from "@/lib/communityHttp";
import { createPlatformCommunityCases } from "@/lib/platformCommunityCases";
export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  return communityRequest(req, false, userId => createPlatformCommunityCases(prisma).own(userId, req.nextUrl.searchParams.get("page") ?? undefined, req.nextUrl.searchParams.get("community") ?? ""));
}
export async function POST(req: NextRequest) {
  return communityRequest(req, true, (userId, body) => createPlatformCommunityCases(prisma).submit(userId!, body), true, "platform-case");
}
