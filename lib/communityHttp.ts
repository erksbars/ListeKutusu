import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedAccountListId } from "@/lib/session";
import { checkRateLimit } from "@/lib/rateLimit";
import { CommunityError } from "@/lib/communities";
import { readCommunityJson } from "./communityJson";

export async function communityRequest(req: NextRequest, write: boolean, handler: (userId: string | null, body: Record<string, unknown>) => Promise<unknown>, create = false, scope: "community" | "event" | "platform-case" = "community") {
  try {
    if (write && req.headers.get("origin") !== new URL(process.env.APP_URL || req.url).origin) throw new CommunityError("İstek kaynağı doğrulanamadı.", 403);
    const userId = await getAuthenticatedAccountListId();
    if (write && !userId) throw new CommunityError("Önce giriş yapmalısın.", 401);
    const limit = checkRateLimit(req, { name: create ? `${scope}-create` : write ? "community-write" : "community-read", identifier: userId ?? undefined, limit: create ? scope === "event" ? 5 : 3 : write ? 40 : 120, windowMs: create ? 3_600_000 : 60_000 });
    if (!limit.ok) return NextResponse.json({ error: "Çok hızlı işlem yapıyorsun. Biraz sonra tekrar dene." }, { status: 429, headers: { "Retry-After": String(limit.retryAfter), "Cache-Control": "private, no-store" } });
    const body = write ? await readCommunityJson(req) : {};
    return NextResponse.json(await handler(userId, body), { status: create ? 201 : 200, headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    const known = error instanceof CommunityError;
    return NextResponse.json({ error: known ? error.message : error instanceof SyntaxError ? "Geçersiz JSON." : "Topluluk işlemi tamamlanamadı." }, { status: known ? error.status : error instanceof SyntaxError ? 400 : 500, headers: { "Cache-Control": "private, no-store" } });
  }
}
