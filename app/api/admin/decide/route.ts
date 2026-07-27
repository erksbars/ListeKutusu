import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isOwnerAuthenticated } from "@/lib/session";
import { addSuggestionToSpotifyList } from "@/lib/lists";
import { isTrackInOwnerPlaylist } from "@/lib/spotify";
import { writeAdminAuditLog } from "@/lib/adminAudit";

export async function POST(req: NextRequest) {
  if (!(await isOwnerAuthenticated())) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }

  const { id, action } = await req.json();
  if (!id || !["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const suggestion = await prisma.suggestion.findUnique({ where: { id } });
  if (!suggestion || suggestion.status !== "pending") {
    return NextResponse.json({ error: "Öneri bulunamadı." }, { status: 404 });
  }

  if (action === "approve") {
    try {
      if (!suggestion.listId) {
        try {
          if (await isTrackInOwnerPlaylist(suggestion.trackId)) {
            const updated = await prisma.suggestion.update({
              where: { id },
              data: { status: "approved", decidedAt: new Date() },
            });
            await writeAdminAuditLog({
              action: "suggestion.approve",
              targetType: "suggestion",
              targetId: suggestion.id,
              targetLabel: `${suggestion.trackName} - ${suggestion.artistName}`,
              metadata: { alreadyInPlaylist: true, listId: suggestion.listId },
            });
            return NextResponse.json({
              suggestion: updated,
              alreadyInPlaylist: true,
            });
          }
        } catch (duplicateErr) {
          console.warn("Approve duplicate check skipped", duplicateErr);
        }
      }

      await addSuggestionToSpotifyList(suggestion.id);
    } catch (err) {
      console.error("Admin approve failed", err);
      return NextResponse.json(
        { error: "Şarkı Spotify listesine eklenemedi." },
        { status: 502 }
      );
    }
  }

  const updated = await prisma.suggestion.update({
    where: { id },
    data: {
      status: action === "approve" ? "approved" : "rejected",
      decidedAt: new Date(),
    },
  });

  await writeAdminAuditLog({
    action: action === "approve" ? "suggestion.approve" : "suggestion.reject",
    targetType: "suggestion",
    targetId: suggestion.id,
    targetLabel: `${suggestion.trackName} - ${suggestion.artistName}`,
    metadata: { listId: suggestion.listId, suggestedBy: suggestion.suggestedBy },
  });

  return NextResponse.json({ suggestion: updated });
}
