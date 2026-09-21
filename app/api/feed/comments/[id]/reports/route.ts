import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkRateLimit } from "@/lib/rateLimit";
import { getAuthenticatedAccountListId } from "@/lib/session";

const reasons = new Set(["spam", "abuse", "misleading", "other"]);

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const reporterId = await getAuthenticatedAccountListId();
  if (!reporterId) return NextResponse.json({ error: "Şikâyet etmek için giriş yapmalısın." }, { status: 401 });
  const limited = checkRateLimit(req, { name: "comment-report", identifier: reporterId, limit: 10, windowMs: 60_000 });
  if (!limited.ok) return NextResponse.json({ error: "Çok hızlı işlem yapıyorsun." }, { status: 429 });

  const { id: commentId } = await context.params;
  const body = await req.json().catch(() => null);
  const reason = reasons.has(body?.reason) ? body.reason : "other";
  const details = typeof body?.details === "string" ? body.details.trim().slice(0, 300) : "";
  const comment = await prisma.feedComment.findFirst({
    where: { id: commentId, status: "published", post: { status: "published" } },
    select: { authorId: true },
  });
  if (!comment) return NextResponse.json({ error: "Yorum bulunamadı." }, { status: 404 });
  if (comment.authorId === reporterId) return NextResponse.json({ error: "Kendi yorumunu şikâyet edemezsin." }, { status: 400 });

  try {
    await prisma.commentReport.create({ data: { reporterId, commentId, reason, details: details || null } });
    return NextResponse.json({ reported: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Bu yorumu daha önce bildirdin." }, { status: 409 });
  }
}
