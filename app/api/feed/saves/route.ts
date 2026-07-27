import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkRateLimit } from "@/lib/rateLimit";
import { getAuthenticatedAccountListId } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const userId = await getAuthenticatedAccountListId();
  if (!userId) {
    return NextResponse.json(
      { error: "Gönderi kaydetmek için giriş yapmalısın." },
      { status: 401 }
    );
  }

  const limited = checkRateLimit(req, {
    name: "feed-save",
    identifier: userId,
    limit: 60,
    windowMs: 60_000,
  });
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Çok hızlı işlem yapıyorsun. Biraz sonra tekrar dene." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfter) } }
    );
  }

  const body = await req.json().catch(() => null);
  const postId = typeof body?.postId === "string" ? body.postId.trim() : "";
  if (!postId) {
    return NextResponse.json({ error: "Gönderi bilgisi eksik." }, { status: 400 });
  }

  const post = await prisma.feedPost.findFirst({
    where: { id: postId, status: "published" },
    select: { id: true },
  });
  if (!post) {
    return NextResponse.json({ error: "Gönderi bulunamadı." }, { status: 404 });
  }

  const existing = await prisma.feedSave.findUnique({
    where: { postId_userId: { postId, userId } },
  });
  if (existing) {
    await prisma.feedSave.delete({ where: { id: existing.id } });
    return NextResponse.json({ saved: false });
  }

  await prisma.$transaction([
    prisma.feedSave.create({ data: { postId, userId } }),
    prisma.feedHide.deleteMany({ where: { postId, userId } }),
  ]);
  return NextResponse.json({ saved: true });
}
