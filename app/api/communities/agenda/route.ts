import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { communityPage } from "@/lib/communities";
import { communityAgenda } from "@/lib/communityAgenda";
import { communityRequest } from "@/lib/communityHttp";
export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  return communityRequest(req, false, userId => communityAgenda(prisma, userId, communityPage(req.nextUrl.searchParams.get("page")), req.nextUrl.searchParams.get("view") ?? "upcoming", req.nextUrl.searchParams.get("role") ?? "all"));
}
