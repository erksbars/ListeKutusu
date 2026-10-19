import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { createCommunityEvents } from "@/lib/communityEvents";
import { communityRequest } from "@/lib/communityHttp";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ slug: string; eventId: string }> };
export async function GET(req: NextRequest, context: Context) {
  const { slug, eventId } = await context.params;
  return communityRequest(req, false, userId => createCommunityEvents(prisma).detail(slug, eventId, userId));
}
export async function POST(req: NextRequest, context: Context) {
  const { slug, eventId } = await context.params;
  return communityRequest(req, true, (userId, body) => {
    const service = createCommunityEvents(prisma);
    if (body.action === "rsvp") return service.respond(slug, eventId, userId!, body.status);
    if (body.action === "report") return service.report(slug, eventId, userId!, body.reason);
    return service.manage(slug, eventId, userId!, body.action, body.moderationNote);
  });
}
export async function PATCH(req: NextRequest, context: Context) {
  const { slug, eventId } = await context.params;
  return communityRequest(req, true, (userId, body) => createCommunityEvents(prisma).update(slug, eventId, userId!, body));
}
