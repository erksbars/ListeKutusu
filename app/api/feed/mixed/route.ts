import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { communityRequest } from "@/lib/communityHttp";
import { mixedFeed } from "@/lib/mixedFeed";

export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  return communityRequest(req, false, viewerId => mixedFeed(prisma, viewerId, req.nextUrl.searchParams.get("cursor"), req.nextUrl.searchParams.get("filter") ?? "all", req.nextUrl.searchParams.get("scope") ?? "all"));
}
