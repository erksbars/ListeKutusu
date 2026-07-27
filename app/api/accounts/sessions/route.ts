import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthenticatedAccountSession } from "@/lib/session";
import { checkRateLimit } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

export async function GET() {
  const current = await getAuthenticatedAccountSession();
  if (!current) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const sessions = await prisma.accountSession.findMany({
    where: {
      userId: current.userId,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { lastSeenAt: "desc" },
    select: {
      id: true,
      persistent: true,
      createdAt: true,
      lastSeenAt: true,
      expiresAt: true,
    },
  });

  return NextResponse.json({
    sessions: sessions.map((session) => ({ ...session, current: session.id === current.id })),
  });
}

export async function DELETE(req: NextRequest) {
  const current = await getAuthenticatedAccountSession();
  if (!current) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const limited = checkRateLimit(req, {
    name: "account-sessions-revoke",
    identifier: current.userId,
    limit: 20,
    windowMs: 60_000,
  });
  if (!limited.ok) {
    return NextResponse.json({ error: "Çok fazla oturum işlemi yapıldı." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const id = typeof body?.id === "string" ? body.id.trim() : "";
  const allOthers = body?.allOthers === true;
  if (!id && !allOthers) return NextResponse.json({ error: "Oturum seçilmedi." }, { status: 400 });
  if (id === current.id) return NextResponse.json({ error: "Geçerli oturum buradan kapatılamaz." }, { status: 400 });

  const result = await prisma.accountSession.updateMany({
    where: {
      userId: current.userId,
      id: allOthers ? { not: current.id } : id,
      revokedAt: null,
    },
    data: { revokedAt: new Date() },
  });

  return NextResponse.json({ revoked: result.count });
}
