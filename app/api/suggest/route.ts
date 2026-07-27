import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkRateLimit } from "@/lib/rateLimit";
import { getTrack } from "@/lib/spotify";
import { getAuthenticatedAccountListId } from "@/lib/session";

export async function POST(req: NextRequest) {
  const accountListId = await getAuthenticatedAccountListId();
  if (!accountListId) {
    return NextResponse.json(
      { error: "Şarkı önermek için giriş yapmalısın." },
      { status: 401 }
    );
  }

  const limited = checkRateLimit(req, {
    name: "suggest",
    limit: 8,
    windowMs: 60_000,
  });

  if (!limited.ok) {
    return NextResponse.json(
      { error: "Çok fazla öneri gönderildi. Biraz sonra tekrar dene." },
      {
        status: 429,
        headers: { "Retry-After": String(limited.retryAfter) },
      }
    );
  }

  const body = await req.json().catch(() => null);
  const trackId = typeof body?.trackId === "string" ? body.trackId.trim() : "";
  const code =
    typeof body?.code === "string" ? body.code.trim().toUpperCase() : "";

  if (!trackId) {
    return NextResponse.json({ error: "Şarkı bilgisi eksik." }, { status: 400 });
  }

  if (!/^EKLE-[A-F0-9]{8}$/.test(code)) {
    return NextResponse.json({ error: "Davet kodu geçersiz." }, { status: 400 });
  }

  const [submitter, list] = await Promise.all([
    prisma.userList.findFirst({
      where: { id: accountListId, status: "active" },
      select: { id: true, ownerName: true },
    }),
    prisma.userList.findFirst({
      where: { submitCode: code, status: "active" },
      select: { id: true },
    }),
  ]);

  if (!submitter) {
    return NextResponse.json({ error: "Hesap bulunamadı." }, { status: 404 });
  }
  if (!list) {
    return NextResponse.json(
      { error: "Davet koduna ait aktif liste bulunamadı." },
      { status: 404 }
    );
  }

  let track;
  try {
    track = await getTrack(trackId);
  } catch (err) {
    console.error("Suggestion track verification failed", err);
    return NextResponse.json(
      { error: "Şarkı şu anda Spotify tarafında doğrulanamadı. Biraz sonra tekrar dene." },
      { status: 502 }
    );
  }

  const existing = await prisma.suggestion.findFirst({
    where: {
      trackId: track.id,
      listId: list.id,
      status: { in: ["pending", "approved"] },
    },
  });
  if (existing) {
    return NextResponse.json(
      { error: "Bu şarkı zaten listede veya onay bekliyor." },
      { status: 409 }
    );
  }

  const suggestion = await prisma.suggestion.create({
    data: {
      listId: list.id,
      trackId: track.id,
      trackUri: track.uri,
      trackName: track.name,
      artistName: track.artist,
      durationMs: track.durationMs,
      suggestedBy: submitter.ownerName,
      suggestedById: submitter.id,
      status: "pending",
    },
  });

  return NextResponse.json({ status: "pending", suggestion });
}
