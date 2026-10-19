import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { communityRequest } from "@/lib/communityHttp";
import { createCommunityLifecycle } from "@/lib/communityLifecycle";
export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  return communityRequest(req, false, userId => createCommunityLifecycle(prisma).incoming(userId));
}
