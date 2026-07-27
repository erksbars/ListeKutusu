import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { isAdminLoginKeyValid } from "@/lib/adminAuth";
import { isOwnerAuthenticated } from "@/lib/session";
import { getAuthUrl } from "@/lib/spotify";
import { checkRateLimit } from "@/lib/rateLimit";

function buildSpotifyLoginResponse() {
  const state = crypto.randomBytes(16).toString("hex");
  const url = getAuthUrl(state);
  const res = NextResponse.json(
    { url },
    { headers: { "Cache-Control": "no-store" } }
  );

  res.cookies.set("spotify_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 600,
    path: "/",
  });

  return res;
}

export async function POST(req: NextRequest) {
  const limited = checkRateLimit(req, {
    name: "admin-login",
    limit: 8,
    windowMs: 15 * 60_000,
  });
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Çok fazla yönetici giriş denemesi yapıldı." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfter) } }
    );
  }

  const { key } = await req.json().catch(() => ({ key: null }));

  if (!(await isOwnerAuthenticated()) && !isAdminLoginKeyValid(key)) {
    return NextResponse.json(
      { error: "Yönetici anahtarı geçersiz." },
      { status: 401 }
    );
  }

  return buildSpotifyLoginResponse();
}

export async function GET() {
  if (!(await isOwnerAuthenticated())) {
    return NextResponse.json(
      { error: "Yönetici oturumu gerekli." },
      { status: 401 }
    );
  }

  const state = crypto.randomBytes(16).toString("hex");
  const url = getAuthUrl(state);
  const res = NextResponse.redirect(url);

  res.cookies.set("spotify_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 600,
    path: "/",
  });

  return res;
}
