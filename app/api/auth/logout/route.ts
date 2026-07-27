import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set("owner_session", "", {
    httpOnly: true,
    expires: new Date(0),
    path: "/",
  });
  res.cookies.set("spotify_oauth_state", "", {
    httpOnly: true,
    expires: new Date(0),
    path: "/",
  });
  return res;
}
