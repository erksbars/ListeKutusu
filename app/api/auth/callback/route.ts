import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { exchangeCodeForToken, getSpotifyProfile } from "@/lib/spotify";
import { setOwnerSessionCookieOnResponse } from "@/lib/session";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const savedState = req.cookies.get("spotify_oauth_state")?.value;
  const error = url.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(new URL(`/?error=${error}`, req.url));
  }

  if (!code || !state || state !== savedState) {
    return NextResponse.redirect(new URL("/?error=state_mismatch", req.url));
  }

  try {
    const tokenData = await exchangeCodeForToken(code);
    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);
    const profile = await getSpotifyProfile(tokenData.access_token);

    await prisma.settings.upsert({
      where: { id: 1 },
      create: {
        id: 1,
        spotifyUserId: profile.id,
        spotifyAccessToken: tokenData.access_token,
        spotifyRefreshToken: tokenData.refresh_token,
        spotifyExpiresAt: expiresAt,
      },
      update: {
        spotifyUserId: profile.id,
        spotifyAccessToken: tokenData.access_token,
        spotifyRefreshToken: tokenData.refresh_token,
        spotifyExpiresAt: expiresAt,
      },
    });

    const res = NextResponse.redirect(new URL("/admin", req.url));
    setOwnerSessionCookieOnResponse(res);
    res.cookies.delete("spotify_oauth_state");
    return res;
  } catch (err) {
    console.error("Spotify callback failed", err);
    return NextResponse.redirect(
      new URL("/admin?error=spotify_callback_failed", req.url)
    );
  }
}
