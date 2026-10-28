import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthenticatedAccountListId } from "@/lib/session";
import { socialSearch } from "@/lib/socialSearch";
import { searchScope } from "@/lib/socialSearchTypes";

export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams, q = params.get("q") ?? "", rawPage = params.get("page") ?? "1";
  const headers = { "Cache-Control": "private, no-store", Vary: "Cookie" };
  if (q.length > 100 || /\p{Cc}/u.test(q) || !/^[1-9]\d?$/u.test(rawPage) || Number(rawPage) > 50) return NextResponse.json({ error: "Arama en fazla 100 karakter ve sayfa 1–50 olmalı." }, { status: 400, headers });
  try {
    const data = await socialSearch(prisma, await getAuthenticatedAccountListId(), q, searchScope(params.get("type")), Number(rawPage), params.get("preview") === "1");
    return NextResponse.json(data, { headers });
  } catch {
    return NextResponse.json({ error: "Arama şu anda yüklenemedi. Yeniden deneyebilirsin." }, { status: 503, headers });
  }
}
