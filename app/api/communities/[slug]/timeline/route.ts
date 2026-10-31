import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { CommunityError } from "@/lib/communityError";
import { communityRequest } from "@/lib/communityHttp";
import { communityTimeline } from "@/lib/communityTimeline";

export const dynamic = "force-dynamic";
type Context = { params: Promise<{ slug: string }> };

export async function GET(req: NextRequest, context: Context) {
  const { slug } = await context.params;
  return communityRequest(req, false, userId => {
    const params = req.nextUrl.searchParams, saved = params.get("saved");
    if (saved !== null && saved !== "0" && saved !== "1") throw new CommunityError("Geçersiz kayıt filtresi.");
    return communityTimeline(prisma, slug, userId, { kind: params.get("kind") ?? "all", reviewKind: params.get("reviewKind") ?? "all", eventFilter: params.get("eventFilter") ?? "upcoming", savedOnly: saved === "1", cursor: params.get("cursor") });
  });
}
