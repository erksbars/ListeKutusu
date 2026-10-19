import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthenticatedAccountListId } from "@/lib/session";
import { checkRateLimit } from "@/lib/rateLimit";
import { createMediaLibrary } from "@/lib/mediaLibrary";
import { createLibraryHandler } from "@/lib/mediaLibraryApi";

export const dynamic = "force-dynamic";
const handle = createLibraryHandler({
  library: createMediaLibrary(prisma),
  authenticate: getAuthenticatedAccountListId,
  rateLimit: (req, userId) => checkRateLimit(req as NextRequest, { name: "media-library", identifier: userId, limit: 60, windowMs: 60_000 }),
  enabled: () => process.env.MEDIA_CATALOG_ENABLED === "true",
  appUrl: () => process.env.APP_URL,
});
export const GET = handle;
export const POST = handle;
export const PATCH = handle;
export const DELETE = handle;
