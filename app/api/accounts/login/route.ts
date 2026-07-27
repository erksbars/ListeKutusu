import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { normalizeEmail, verifyPassword } from "@/lib/password";
import { setAccountSessionCookieOnResponse } from "@/lib/session";
import { checkRateLimit } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email =
    typeof body?.email === "string" ? normalizeEmail(body.email) : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const remember = body?.remember === true;

  const limited = checkRateLimit(req, {
    name: "account-login",
    limit: 8,
    windowMs: 15 * 60_000,
    identifier: email || "invalid-email",
  });
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Çok fazla giriş denemesi yapıldı. Biraz sonra tekrar dene." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfter) } }
    );
  }

  if (!email || !password) {
    return NextResponse.json(
      { error: "E-posta ve şifre gerekli." },
      { status: 400 }
    );
  }
  if (email.length > 254 || password.length > 128) {
    return NextResponse.json(
      { error: "E-posta veya şifre hatalı." },
      { status: 401 }
    );
  }

  const list = await prisma.userList.findUnique({ where: { email } });
  if (
    !list?.passwordHash ||
    list.status !== "active" ||
    !(await verifyPassword(password, list.passwordHash))
  ) {
    return NextResponse.json(
      { error: "E-posta veya şifre hatalı." },
      { status: 401 }
    );
  }

  const res = NextResponse.json(
    {
      list: {
        id: list.id,
        ownerName: list.ownerName,
        playlistName: list.playlistName,
        email: list.email,
        submitCode: list.submitCode,
        spotifyExternalUrl: list.spotifyExternalUrl,
      },
    },
    { headers: { "Cache-Control": "no-store" } }
  );
  await setAccountSessionCookieOnResponse(res, list.id, remember);
  return res;
}
