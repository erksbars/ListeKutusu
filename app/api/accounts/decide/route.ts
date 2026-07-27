import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { addSuggestionToSpotifyList } from "@/lib/lists";
import { getAuthenticatedAccountListId } from "@/lib/session";
import { replacePlaylistTracks } from "@/lib/spotify";

export async function POST(req: NextRequest) {
  const listId = await getAuthenticatedAccountListId();
  if (!listId) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }

  const { id, action } = await req.json();
  if (!id || !["approve", "reject", "remove"].includes(action)) {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const suggestion = await prisma.suggestion.findFirst({
    where: {
      id,
      listId,
      ...(action === "remove"
        ? { status: "approved" }
        : { status: "pending" }),
    },
    include: { list: true },
  });

  if (!suggestion) {
    return NextResponse.json({ error: "Öneri bulunamadı." }, { status: 404 });
  }

  if (action === "approve") {
    const updated = await prisma.suggestion.update({
      where: { id },
      data: {
        status: "approved",
        decidedAt: new Date(),
      },
    });

    try {
      await addSuggestionToSpotifyList(suggestion.id);
      return NextResponse.json({ suggestion: updated, spotifySynced: true });
    } catch (err) {
      console.error("Account approve failed", err);
      return NextResponse.json({
        suggestion: updated,
        spotifySynced: false,
        warning:
          "Şarkı onaylandı ve listende saklandı. Spotify senkronu şu anda tamamlanamadı; Listem bölümünden yeniden deneyebilirsin.",
      });
    }
  }

  if (action === "remove") {
    const updated = await prisma.suggestion.update({
      where: { id },
      data: {
        status: "removed",
        decidedAt: new Date(),
      },
    });

    if (!suggestion.list?.spotifyPlaylistId) {
      return NextResponse.json({ suggestion: updated, spotifySynced: false });
    }

    try {
      const remaining = await prisma.suggestion.findMany({
        where: {
          listId,
          status: "approved",
        },
        orderBy: { decidedAt: "asc" },
        select: { trackUri: true },
      });
      const snapshotId = await replacePlaylistTracks(
        suggestion.list.spotifyPlaylistId,
        remaining.map((item) => item.trackUri)
      );
      await prisma.userList.update({
        where: { id: listId },
        data: {
          spotifySnapshotId: snapshotId ?? suggestion.list.spotifySnapshotId,
          lastExportedAt: new Date(),
        },
      });
      return NextResponse.json({ suggestion: updated, spotifySynced: true });
    } catch (err) {
      console.error("Account remove failed", err);
      return NextResponse.json({
        suggestion: updated,
        spotifySynced: false,
        warning:
          "Şarkı panelden çıkarıldı. Spotify senkronu tamamlanamadı; Spotify bağlantısını yenileyip listeyi tekrar senkronla.",
      });
    }
  }

  const updated = await prisma.suggestion.update({
    where: { id },
    data: {
      status: "rejected",
      decidedAt: new Date(),
    },
  });

  return NextResponse.json({ suggestion: updated });
}
