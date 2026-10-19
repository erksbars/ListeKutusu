import { NextRequest, NextResponse } from "next/server";
import { getModerationActor } from "./moderatorAuth";
import { checkRateLimit } from "./rateLimit";
import { readCommunityJson } from "./communityJson";
import { CommunityError } from "./communityError";
import type { PlatformCaseActor } from "./platformCommunityCases";
export async function platformCaseRequest(req: NextRequest, write: boolean, handler: (actor: PlatformCaseActor, body: Record<string, unknown>) => Promise<unknown>) {
  const headers = { "Cache-Control": "private, no-store" };
  try {
    if (write && req.headers.get("origin") !== new URL(process.env.APP_URL || req.url).origin) throw new CommunityError("İstek kaynağı doğrulanamadı.", 403);
    const actor = await getModerationActor();
    if (!actor) throw new CommunityError("Önce platform yönetimine giriş yap.", 401);
    if (actor.kind !== "owner" && actor.role !== "admin") throw new CommunityError("Platform yönetimi yetkin yok.", 403);
    const limited = checkRateLimit(req, { name: "platform-case-review", identifier: actor.id ?? "owner", limit: write ? 40 : 120, windowMs: 60_000 });
    if (!limited.ok) return NextResponse.json({ error: "Çok hızlı işlem yapıyorsun." }, { status: 429, headers: { ...headers, "Retry-After": String(limited.retryAfter) } });
    return NextResponse.json(await handler(actor, write ? await readCommunityJson(req) : {}), { headers });
  } catch (error) {
    return NextResponse.json({ error: error instanceof CommunityError ? error.message : error instanceof SyntaxError ? "Geçersiz JSON." : "Başvuru işlemi tamamlanamadı." }, { status: error instanceof CommunityError ? error.status : error instanceof SyntaxError ? 400 : 500, headers });
  }
}
