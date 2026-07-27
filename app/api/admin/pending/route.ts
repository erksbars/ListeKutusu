import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isOwnerAuthenticated } from "@/lib/session";

export async function GET() {
  if (!(await isOwnerAuthenticated())) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }
  const queueLimit = 100;
  const [pending, pendingTotal, recent] = await Promise.all([
    prisma.suggestion.findMany({
      where: { status: "pending" },
      include: { list: true },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      take: queueLimit,
    }),
    prisma.suggestion.count({ where: { status: "pending" } }),
    prisma.suggestion.findMany({
      where: { status: { in: ["approved", "rejected", "removed"] } },
      include: { list: true },
      orderBy: { decidedAt: "desc" },
      take: 20,
    }),
  ]);
  return NextResponse.json({ pending, recent, queue: { total: pendingTotal, shown: pending.length, limit: queueLimit } });
}
