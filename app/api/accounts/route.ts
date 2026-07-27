import { NextRequest, NextResponse } from "next/server";
import { createUserList } from "@/lib/lists";
import {
  hashPassword,
  isValidEmail,
  normalizeEmail,
  passwordValidationError,
} from "@/lib/password";
import { setAccountSessionCookieOnResponse } from "@/lib/session";
import { checkRateLimit } from "@/lib/rateLimit";
import { Prisma } from "@prisma/client";

export async function POST(req: NextRequest) {
  const limited = checkRateLimit(req, {
    name: "account-register",
    limit: 5,
    windowMs: 60 * 60_000,
  });
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Çok fazla kayıt denemesi yapıldı. Daha sonra tekrar dene." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfter) } }
    );
  }

  const body = await req.json().catch(() => null);
  const ownerName =
    typeof body?.ownerName === "string" ? body.ownerName.trim() : "";
  const playlistName =
    typeof body?.playlistName === "string" ? body.playlistName.trim() : "";
  const email =
    typeof body?.email === "string" ? normalizeEmail(body.email) : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (ownerName.length < 2 || ownerName.length > 40) {
    return NextResponse.json(
      { error: "Hesap adı 2–40 karakter arasında olmalı." },
      { status: 400 }
    );
  }
  if (playlistName.length > 80) {
    return NextResponse.json(
      { error: "Liste adı en fazla 80 karakter olabilir." },
      { status: 400 }
    );
  }
  if (!isValidEmail(email)) {
    return NextResponse.json(
      { error: "Geçerli bir e-posta gir." },
      { status: 400 }
    );
  }
  const passwordError = passwordValidationError(password);
  if (passwordError) {
    return NextResponse.json(
      { error: passwordError },
      { status: 400 }
    );
  }

  try {
    const list = await createUserList(ownerName, playlistName || ownerName, {
      email,
      passwordHash: await hashPassword(password),
    });
    const res = NextResponse.json(
      {
        list: {
          id: list.id,
          ownerName: list.ownerName,
          playlistName: list.playlistName,
          email: list.email,
          submitCode: list.submitCode,
          spotifyExternalUrl: list.spotifyExternalUrl,
          suggestions: [],
        },
      },
      { headers: { "Cache-Control": "no-store" } }
    );
    await setAccountSessionCookieOnResponse(res, list.id);
    return res;
  } catch (err: unknown) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json(
        { error: "Bu e-posta ile zaten hesap var." },
        { status: 409 }
      );
    }
    throw err;
  }
}
