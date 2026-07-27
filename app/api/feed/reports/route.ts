import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkRateLimit } from "@/lib/rateLimit";
import { getAuthenticatedAccountListId } from "@/lib/session";

const reasons = new Set(["spam", "abuse", "misleading", "copyright", "other"]);

export async function POST(req: NextRequest) {
  const reporterId = await getAuthenticatedAccountListId();
  if (!reporterId) {
    return NextResponse.json({ error: "Şikâyet etmek için giriş yapmalısın." }, { status: 401 });
  }

  const limited = checkRateLimit(req, { name: "post-report", limit: 10, windowMs: 60_000 });
  if (!limited.ok) {
    return NextResponse.json({ error: "Çok hızlı işlem yapıyorsun." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const postId = typeof body?.postId === "string" ? body.postId.trim() : "";
  const reason = reasons.has(body?.reason) ? body.reason : "other";
  const details = typeof body?.details === "string" ? body.details.trim().slice(0, 300) : "";

  const post = await prisma.feedPost.findFirst({
    where: { id: postId, status: "published" },
    select: { id: true, authorId: true },
  });
  if (!post) return NextResponse.json({ error: "Paylaşım bulunamadı." }, { status: 404 });
  if (post.authorId === reporterId) {
    return NextResponse.json({ error: "Kendi paylaşımını şikâyet edemezsin." }, { status: 400 });
  }

  try {
    const report = await prisma.postReport.create({
      data: { reporterId, postId, reason, details: details || null },
    });
    return NextResponse.json({ report }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Bu paylaşımı daha önce bildirdin." }, { status: 409 });
  }
}
