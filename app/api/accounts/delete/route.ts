import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { checkRateLimit } from "@/lib/rateLimit";
import { clearAccountSessionCookieOnResponse, getAuthenticatedAccountListId } from "@/lib/session";
import { clearPlaylistItems, updateOwnerPlaylistDetails } from "@/lib/spotify";
import { deleteAccountData } from "@/lib/accountDeletion";
import { CommunityError } from "@/lib/communityError";

async function deletionBody(req: NextRequest): Promise<Record<string, unknown>> {
  if (!req.headers.get("content-type")?.toLowerCase().startsWith("application/json")) throw new CommunityError("JSON içerik gerekli.", 415);
  const reader = req.body?.getReader(); if (!reader) throw new CommunityError("İstek gövdesi eksik.");
  const chunks: Uint8Array[] = []; let size = 0;
  while (true) {
    const { done, value } = await reader.read(); if (done) break;
    size += value.byteLength; if (size > 16_384) { await reader.cancel(); throw new CommunityError("İstek çok büyük.", 413); }
    chunks.push(value);
  }
  const parsed = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new CommunityError("Geçersiz istek.");
  return parsed;
}
export async function DELETE(req: NextRequest) {
  const headers = { "Cache-Control": "private, no-store" };
  try {
    if (req.headers.get("origin") !== new URL(process.env.APP_URL || req.url).origin) throw new CommunityError("İstek kaynağı doğrulanamadı.", 403);
    const listId = await getAuthenticatedAccountListId();
    if (!listId) throw new CommunityError("Yetkisiz.", 401);
    const limited = checkRateLimit(req, { name: "account-delete", limit: 5, windowMs: 30 * 60_000, identifier: listId });
    if (!limited.ok) return NextResponse.json({ error: "Çok fazla silme denemesi yapıldı. Daha sonra tekrar dene." }, { status: 429, headers: { ...headers, "Retry-After": String(limited.retryAfter) } });
    const body = await deletionBody(req);
    if (body.confirmation !== "HESABIMI SİL") throw new CommunityError("Onay metnini tam olarak yazmalısın.");
    if (body.archiveOwnedCommunities !== undefined && typeof body.archiveOwnedCommunities !== "boolean") throw new CommunityError("Arşivleme tercihi geçersiz.");
    const password = typeof body.password === "string" ? body.password : "";
    if (password.length > 128) throw new CommunityError("Şifre hatalı.", 403);
    const account = await prisma.userList.findFirst({ where: { id: listId, status: "active" }, select: { passwordHash: true } });
    if (!account?.passwordHash || !await verifyPassword(password, account.passwordHash)) throw new CommunityError("Şifre hatalı.", 403);
    const result = await deleteAccountData(prisma, listId, account.passwordHash, body.archiveOwnedCommunities === true);
    if (result.spotifyPlaylistId) {
      try {
        await clearPlaylistItems(result.spotifyPlaylistId);
        await updateOwnerPlaylistDetails(result.spotifyPlaylistId, "ListeKutusu - Kullanıma hazır", "Yeni bir ListeKutusu listesi için ayrılmış boş playlist.");
      } catch { console.error("Deleted account playlist cleanup failed"); }
    }
    const response = NextResponse.json({ deleted: true }, { headers });
    clearAccountSessionCookieOnResponse(response); return response;
  } catch (error) {
    return NextResponse.json({ error: error instanceof CommunityError ? error.message : error instanceof SyntaxError ? "Geçersiz JSON." : "Hesap silinemedi. Tekrar dene." }, { status: error instanceof CommunityError ? error.status : error instanceof SyntaxError ? 400 : 500, headers });
  }
}
