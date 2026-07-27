import { NextRequest, NextResponse } from "next/server";
import { getUserList } from "@/lib/lists";
import { getAuthenticatedAccountListId } from "@/lib/session";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id")?.trim();
  if (!id) {
    return NextResponse.json({ error: "Liste ID gerekli." }, { status: 400 });
  }

  const authenticatedListId = await getAuthenticatedAccountListId();
  if (!authenticatedListId) {
    return NextResponse.json({ error: "Giriş gerekli." }, { status: 401 });
  }

  if (authenticatedListId !== id) {
    return NextResponse.json({ error: "Bu listeye erişim yetkin yok." }, { status: 403 });
  }

  const list = await getUserList(id);
  if (!list) {
    return NextResponse.json({ error: "Liste bulunamadı." }, { status: 404 });
  }

  return NextResponse.json({
    list: {
      id: list.id,
      ownerName: list.ownerName,
      playlistName: list.playlistName,
      slug: list.slug,
      spotifyExternalUrl: list.spotifyExternalUrl,
      suggestions: list.suggestions,
    },
  });
}

export async function POST() {
  return NextResponse.json(
    { error: "Liste oluşturmak için /account sayfasını kullan." },
    { status: 410 }
  );
}
