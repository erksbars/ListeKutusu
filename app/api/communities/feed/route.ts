import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { communityGeneralFeed } from "@/lib/communityGeneralFeed";
import { communityRequest } from "@/lib/communityHttp";

export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  return communityRequest(req, false, userId => communityGeneralFeed(prisma, userId, req.nextUrl.searchParams.get("cursor"), req.nextUrl.searchParams.get("filter") ?? "all"));
}
