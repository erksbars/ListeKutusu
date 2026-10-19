import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { createCommunities, communityPage } from "@/lib/communities";
import { communityRequest } from "@/lib/communityHttp";
import { CommunityError } from "@/lib/communityError";
export const dynamic = "force-dynamic";
const service = createCommunities(prisma);
type Context = { params: Promise<{ slug: string }> };
export async function GET(req: NextRequest, context: Context) {
  const { slug } = await context.params;
  return communityRequest(req, false, userId => {
    const saved = req.nextUrl.searchParams.get("saved");
    if (saved !== null && saved !== "0" && saved !== "1") throw new CommunityError("Geçersiz kayıt filtresi.");
    return service.detail(slug, userId, communityPage(req.nextUrl.searchParams.get("page")), req.nextUrl.searchParams.get("postType") ?? "all", req.nextUrl.searchParams.get("reviewKind") ?? "all", saved === "1");
  });
}
export async function POST(req: NextRequest, context: Context) {
  const { slug } = await context.params;
  return communityRequest(req, true, (userId, body) => service.mutate(slug, userId!, body));
}
