import { createHmac, timingSafeEqual } from "node:crypto";
import type { CatalogItem } from "./mediaCatalog.ts";

function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) throw new Error("Catalog signing is not configured");
  return value;
}

// A short-lived, user-bound proof of server-fetched metadata, not an auth token.
export function signCatalogSelection(item: CatalogItem, userId: string, now = Date.now()) {
  const payload = Buffer.from(JSON.stringify({ item, userId, expiresAt: now + 30 * 60_000 })).toString("base64url");
  const signature = createHmac("sha256", secret()).update(`catalog:v1:${payload}`).digest("base64url");
  return `${payload}.${signature}`;
}

export function verifyCatalogSelection(token: unknown, userId: string, now = Date.now()): CatalogItem | null {
  if (typeof token !== "string" || token.length > 16_000) return null;
  const parts = token.split(".");
  if (parts.length !== 2 || !/^[A-Za-z0-9_-]{43}$/.test(parts[1])) return null;
  const expected = createHmac("sha256", secret()).update(`catalog:v1:${parts[0]}`).digest();
  const actual = Buffer.from(parts[1], "base64url");
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
  try {
    const data = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8"));
    if (data.userId !== userId || !Number.isFinite(data.expiresAt) || data.expiresAt <= now) return null;
    return data.item;
  } catch {
    return null;
  }
}
