import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { communityRequest } from "@/lib/communityHttp";
import { listReviewReferences } from "@/lib/communityReferences";
export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  return communityRequest(req, false, userId => listReviewReferences(prisma, userId, req.nextUrl.searchParams.get("kind"), req.nextUrl.searchParams.get("q")?.trim() ?? ""));
}
