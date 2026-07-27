import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rateLimit";
import { searchTracks } from "@/lib/spotify";

export async function GET(req: NextRequest) {
  const limited = checkRateLimit(req, {
    name: "search",
    limit: 40,
    windowMs: 60_000,
  });

  if (!limited.ok) {
    return NextResponse.json(
      { error: "Çok fazla arama yapıldı. Biraz sonra tekrar dene." },
      {
        status: 429,
        headers: { "Retry-After": String(limited.retryAfter) },
      }
    );
  }

  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    const results = await searchTracks(q);
    return NextResponse.json({ results });
  } catch (err) {
    console.error("Spotify search route failed", err);
    return NextResponse.json(
      { error: "Arama başarısız oldu." },
      { status: 502 }
    );
  }
}
