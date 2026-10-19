import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { createCommunities, communityPage, CommunityError } from "@/lib/communities";
import { communityRequest } from "@/lib/communityHttp";
import { discoverCommunityEvents } from "@/lib/communityDiscovery";
export const dynamic = "force-dynamic";
const service = createCommunities(prisma);
export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams;
  return communityRequest(req, false, userId => {
    const filters = { q: query.get("q")?.trim() ?? "", category: query.get("category") ?? "", university: query.get("university"), city: query.get("city"), interest: query.get("interest"), mine: query.get("mine") === "true" };
    const page = communityPage(query.get("page"));
    if (query.get("view") === "events") return discoverCommunityEvents(prisma, userId, filters, page);
    if (query.has("view") && query.get("view") !== "communities") throw new CommunityError("Geçersiz keşif görünümü.");
    return service.directory(userId, filters.q, filters.category, page, filters.mine, filters);
  });
}
export async function POST(req: NextRequest) {
  return communityRequest(req, true, (userId, body) => service.create(userId!, body), true);
}
