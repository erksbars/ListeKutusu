import { NextRequest, NextResponse } from "next/server";
import { getPublicProfile } from "@/lib/publicProfile";
import { getAuthenticatedAccountListId } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug")?.trim();
  if (!slug) {
    return NextResponse.json({ error: "Profil bilgisi eksik." }, { status: 400 });
  }

  const viewerId = await getAuthenticatedAccountListId();
  const profile = await getPublicProfile(slug, viewerId);
  if (!profile) {
    return NextResponse.json({ error: "Profil bulunamadı." }, { status: 404 });
  }

  return NextResponse.json({ profile });
}
