import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkRateLimit } from "@/lib/rateLimit";
import { getAuthenticatedAccountListId } from "@/lib/session";

export async function GET(req: NextRequest) {
  const viewerId = await getAuthenticatedAccountListId();
  if (!viewerId) {
    return NextResponse.json(
      { error: "Liste kodunu kullanmak için giriş yapmalısın." },
      { status: 401 }
    );
  }

  const limited = checkRateLimit(req, {
    name: "resolve-submit-code",
    limit: 20,
    windowMs: 60_000,
    identifier: viewerId,
  });
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Çok fazla kod denendi. Biraz sonra tekrar dene." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfter) } }
    );
  }

  const code = req.nextUrl.searchParams.get("code")?.trim().toUpperCase() || "";
  if (!/^EKLE-[A-F0-9]{8}$/.test(code)) {
    return NextResponse.json({ error: "Davet kodu geçersiz." }, { status: 400 });
  }

  const list = await prisma.userList.findFirst({
    where: { submitCode: code, status: "active" },
    select: {
      id: true,
      ownerName: true,
      playlistName: true,
      slug: true,
      spotifyExternalUrl: true,
    },
  });

  if (!list) {
    return NextResponse.json(
      { error: "Bu davet koduna ait aktif liste bulunamadı." },
      { status: 404 }
    );
  }

  return NextResponse.json(
    { list },
    { headers: { "Cache-Control": "no-store" } }
  );
}
