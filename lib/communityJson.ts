import type { NextRequest } from "next/server";
import { CommunityError } from "./communityError";
export async function readCommunityJson(req: NextRequest): Promise<Record<string, unknown>> {
  if (!req.headers.get("content-type")?.toLowerCase().startsWith("application/json")) throw new CommunityError("JSON içerik gerekli.", 415);
  const reader = req.body?.getReader(); if (!reader) throw new CommunityError("İstek gövdesi eksik.");
  const chunks: Uint8Array[] = []; let length = 0;
  while (true) {
    const { done, value } = await reader.read(); if (done) break;
    length += value.byteLength; if (length > 24_000) { await reader.cancel(); throw new CommunityError("İstek çok büyük.", 413); }
    chunks.push(value);
  }
  const parsed = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new CommunityError("Geçersiz istek.");
  return parsed;
}
