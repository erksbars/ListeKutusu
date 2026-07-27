import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkRateLimit } from "@/lib/rateLimit";
import { getAuthenticatedAccountListId } from "@/lib/session";

export async function GET(req: NextRequest) {
  const limited = checkRateLimit(req, {
    name: "suggest-history",
    limit: 30,
    windowMs: 60_000,
  });

  if (!limited.ok) {
    return NextResponse.json(
      { error: "Çok fazla sorgu yapıldı. Biraz sonra tekrar dene." },
      {
        status: 429,
        headers: { "Retry-After": String(limited.retryAfter) },
      }
    );
  }

  const accountId = await getAuthenticatedAccountListId();
  if (!accountId) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }

  const listId = req.nextUrl.searchParams.get("listId")?.trim() || "";
  const where = {
    suggestedById: accountId,
    ...(listId ? { listId } : {}),
  };

  const suggestions = await prisma.suggestion.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 30,
    select: {
      id: true,
      listId: true,
      trackId: true,
      trackName: true,
      artistName: true,
      status: true,
      createdAt: true,
      decidedAt: true,
    },
  });

  return NextResponse.json({ suggestions });
}
