import crypto from "crypto";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "./db";
import {
  createAccountSessionToken,
  hashAccountSessionToken,
  isAccountSessionToken,
} from "./sessionToken";

const SECRET = (() => {
  const configured = process.env.SESSION_SECRET;
  if (configured && configured.length >= 32) return configured;
  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET üretim ortamında en az 32 karakter olmalı.");
  }
  return "local-development-session-secret-change-before-deploy";
})();
const COOKIE_NAME = "owner_session";
const ACCOUNT_COOKIE_NAME = "account_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 gün
const SESSION_AGE_SECONDS = 60 * 60 * 12; // 12 saat

function sign(value: string) {
  const hmac = crypto.createHmac("sha256", SECRET).update(value).digest("hex");
  return `${value}.${hmac}`;
}

function verify(signed: string): string | null {
  const idx = signed.lastIndexOf(".");
  if (idx === -1) return null;
  const value = signed.slice(0, idx);
  const sig = signed.slice(idx + 1);
  const expected = crypto.createHmac("sha256", SECRET).update(value).digest("hex");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  return value;
}

// Owner Spotify OAuth'tan döndükten sonra çağrılır.
export async function setOwnerSessionCookie() {
  const token = sign("owner");
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE_SECONDS,
    path: "/",
  });
}

export function setOwnerSessionCookieOnResponse(res: NextResponse) {
  const token = sign("owner");
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE_SECONDS,
    path: "/",
  });
}

export async function isOwnerAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(COOKIE_NAME)?.value;
  if (!cookie) return false;
  return verify(cookie) === "owner";
}

export async function clearOwnerSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

function accountTokenHash(token: string) {
  return hashAccountSessionToken(token, SECRET);
}

export async function setAccountSessionCookieOnResponse(
  res: NextResponse,
  listId: string,
  remember = false
) {
  const token = createAccountSessionToken();
  const lifetime = remember ? MAX_AGE_SECONDS : SESSION_AGE_SECONDS;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + lifetime * 1000);
  const overflowSessions = await prisma.accountSession.findMany({
    where: { userId: listId, revokedAt: null, expiresAt: { gt: now } },
    orderBy: { lastSeenAt: "desc" },
    skip: 9,
    select: { id: true },
  });

  await prisma.$transaction([
    prisma.accountSession.deleteMany({
      where: {
        userId: listId,
        OR: [{ expiresAt: { lte: now } }, { revokedAt: { not: null } }],
      },
    }),
    prisma.accountSession.updateMany({
      where: { id: { in: overflowSessions.map((session) => session.id) } },
      data: { revokedAt: now },
    }),
    prisma.accountSession.create({
      data: {
        userId: listId,
        tokenHash: accountTokenHash(token),
        persistent: remember,
        expiresAt,
      },
    }),
  ]);

  res.cookies.set(ACCOUNT_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    priority: "high",
    ...(remember ? { maxAge: MAX_AGE_SECONDS } : {}),
    path: "/",
  });
}

export async function getAuthenticatedAccountListId(): Promise<string | null> {
  const session = await getAuthenticatedAccountSession();
  return session?.userId ?? null;
}

export async function getAuthenticatedAccountSession(): Promise<{
  id: string;
  userId: string;
  persistent: boolean;
  createdAt: Date;
  lastSeenAt: Date;
  expiresAt: Date;
} | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ACCOUNT_COOKIE_NAME)?.value;
  if (!token || !isAccountSessionToken(token)) return null;

  const now = new Date();
  const session = await prisma.accountSession.findUnique({
    where: { tokenHash: accountTokenHash(token) },
    select: {
      id: true,
      userId: true,
      persistent: true,
      createdAt: true,
      lastSeenAt: true,
      expiresAt: true,
      revokedAt: true,
      user: { select: { status: true } },
    },
  });
  if (
    !session ||
    session.revokedAt ||
    session.expiresAt <= now ||
    session.user.status !== "active"
  ) {
    return null;
  }

  if (session.lastSeenAt.getTime() < now.getTime() - 15 * 60_000) {
    await prisma.accountSession.update({
      where: { id: session.id },
      data: { lastSeenAt: now },
    });
  }

  return {
    id: session.id,
    userId: session.userId,
    persistent: session.persistent,
    createdAt: session.createdAt,
    lastSeenAt: now,
    expiresAt: session.expiresAt,
  };
}

export async function revokeCurrentAccountSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ACCOUNT_COOKIE_NAME)?.value;
  if (!token || !isAccountSessionToken(token)) return;
  await prisma.accountSession.updateMany({
    where: { tokenHash: accountTokenHash(token), revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function revokeAllAccountSessions(listId: string) {
  await prisma.accountSession.updateMany({
    where: { userId: listId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export function clearAccountSessionCookieOnResponse(res: NextResponse) {
  res.cookies.set(ACCOUNT_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
}

