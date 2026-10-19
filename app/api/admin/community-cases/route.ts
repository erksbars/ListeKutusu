import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { platformCaseRequest } from "@/lib/platformCaseHttp";
import { createPlatformCommunityCases } from "@/lib/platformCommunityCases";
export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  return platformCaseRequest(req, false, actor => createPlatformCommunityCases(prisma).queue(actor, req.nextUrl.searchParams.get("page") ?? undefined, req.nextUrl.searchParams.get("status") ?? "pending"));
}
export async function PATCH(req: NextRequest) {
  return platformCaseRequest(req, true, (actor, body) => createPlatformCommunityCases(prisma).review(actor, body));
}
