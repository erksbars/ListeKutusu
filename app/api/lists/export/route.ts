import { NextRequest, NextResponse } from "next/server";
import { exportApprovedListToSpotify } from "@/lib/lists";
import { getAuthenticatedAccountListId } from "@/lib/session";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const listId = typeof body?.listId === "string" ? body.listId.trim() : "";

  if (!listId) {
    return NextResponse.json({ error: "Liste ID gerekli." }, { status: 400 });
  }

  const authedListId = await getAuthenticatedAccountListId();
  if (!authedListId || authedListId !== listId) {
    return NextResponse.json(
      { error: "Bu listeyi yenilemek için hesap girişi gerekli." },
      { status: 401 }
    );
  }

  try {
    const list = await exportApprovedListToSpotify(listId);
    return NextResponse.json({ list });
  } catch (err) {
    console.error("List export failed", err);
    return NextResponse.json(
      {
        error:
          "Spotify senkronu şu anda tamamlanamadı. Şarkıların uygulamadaki listende güvende; biraz sonra yeniden dene.",
        code: "SPOTIFY_SYNC_UNAVAILABLE",
      },
      { status: 502 }
    );
  }
}
