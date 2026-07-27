import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const startedAt = Date.now();

  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json(
      {
        status: "ok",
        database: "available",
        responseTimeMs: Date.now() - startedAt,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Health check database query failed", error);
    return NextResponse.json(
      {
        status: "degraded",
        database: "unavailable",
      },
      {
        status: 503,
        headers: { "Cache-Control": "no-store" },
      }
    );
  }
}
