import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isOwnerAuthenticated } from "@/lib/session";
import { writeAdminAuditLog } from "@/lib/adminAudit";

export async function GET() {
  if (!(await isOwnerAuthenticated())) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }

  const settings = await prisma.settings.findUnique({
    where: { id: 1 },
    select: {
      spotifyUserId: true,
      playlistId: true,
      playlistName: true,
    },
  });

  return NextResponse.json({ settings });
}

export async function POST(req: NextRequest) {
  if (!(await isOwnerAuthenticated())) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const playlistId =
    typeof body?.playlistId === "string" ? body.playlistId.trim() : "";
  const playlistName =
    typeof body?.playlistName === "string" ? body.playlistName.trim() : "";

  if (!playlistId) {
    return NextResponse.json({ error: "Playlist ID gerekli." }, { status: 400 });
  }

  const settings = await prisma.settings.upsert({
    where: { id: 1 },
    create: {
      id: 1,
      playlistId,
      playlistName: playlistName || null,
    },
    update: {
      playlistId,
      playlistName: playlistName || null,
    },
    select: {
      spotifyUserId: true,
      playlistId: true,
      playlistName: true,
    },
  });

  await writeAdminAuditLog({
    action: "settings.playlist_update",
    targetType: "settings",
    targetId: "1",
    targetLabel: playlistName || playlistId,
    metadata: { playlistId },
  });

  return NextResponse.json({ settings });
}
