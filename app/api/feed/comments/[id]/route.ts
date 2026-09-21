import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthenticatedAccountListId } from "@/lib/session";

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const userId = await getAuthenticatedAccountListId();
  if (!userId) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  const { id } = await context.params;
  const viewer = await prisma.userList.findUnique({ where: { id: userId }, select: { role: true } });
  const comment = await prisma.feedComment.findFirst({
    where: {
      id,
      status: "published",
      ...(viewer?.role === "admin" || viewer?.role === "moderator" ? {} : { authorId: userId }),
    },
    select: { id: true, postId: true },
  });
  if (!comment) return NextResponse.json({ error: "Yorum bulunamadı veya yetkin yok." }, { status: 404 });

  await prisma.$transaction([
    prisma.feedComment.update({ where: { id }, data: { status: "removed" } }),
    prisma.feedComment.updateMany({ where: { parentId: id }, data: { status: "removed" } }),
  ]);
  return NextResponse.json({ removed: true, postId: comment.postId });
}
