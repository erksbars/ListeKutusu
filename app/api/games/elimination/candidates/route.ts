import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthenticatedAccountListId } from "@/lib/session";
import { getPersonalGameCandidates } from "@/lib/games/candidates";

export async function GET() {
  const userId = await getAuthenticatedAccountListId();
  if (!userId) return NextResponse.json({ error: "Oynamak için giriş yapmalısın." }, { status: 401 });
  const [candidates, account] = await Promise.all([
    getPersonalGameCandidates(prisma, userId),
    prisma.userList.findUnique({ where: { id: userId }, select: { ownerName: true, email: true, slug: true, role: true } }),
  ]);
  return NextResponse.json({ candidates, account }, { headers: { "Cache-Control": "no-store" } });
}
