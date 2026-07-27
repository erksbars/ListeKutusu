import { NextResponse } from "next/server";
import {
  clearAccountSessionCookieOnResponse,
  revokeCurrentAccountSession,
} from "@/lib/session";

export async function POST() {
  await revokeCurrentAccountSession();
  const res = NextResponse.json({ ok: true });
  clearAccountSessionCookieOnResponse(res);
  return res;
}
