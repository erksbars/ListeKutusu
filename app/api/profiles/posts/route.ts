import { NextRequest, NextResponse } from "next/server";
import { parseOffsetCursor } from "@/lib/pagination";
import { getPublicProfilePosts } from "@/lib/publicProfile";
import { getAuthenticatedAccountListId } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug")?.trim();
  if (!slug) {
    return NextResponse.json({ error: "Profil bilgisi eksik." }, { status: 400 });
  }

  const offset = parseOffsetCursor(req.nextUrl.searchParams.get("cursor"), 10_000);
  const viewerId = await getAuthenticatedAccountListId();
  const result = await getPublicProfilePosts(slug, viewerId, offset);
  if (!result) {
    return NextResponse.json({ error: "Profil bulunamadı." }, { status: 404 });
  }

  return NextResponse.json(result);
}
