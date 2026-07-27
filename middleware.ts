import { NextRequest, NextResponse } from "next/server";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export function middleware(req: NextRequest) {
  if (SAFE_METHODS.has(req.method)) return NextResponse.next();

  const fetchSite = req.headers.get("sec-fetch-site");
  if (fetchSite === "cross-site") {
    return NextResponse.json({ error: "İstek kaynağına izin verilmedi." }, { status: 403 });
  }

  const origin = req.headers.get("origin");
  if (!origin) return NextResponse.next();

  const allowedOrigins = new Set([req.nextUrl.origin]);
  const requestHost = req.headers.get("host");
  if (requestHost) {
    const requestProtocol = req.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() || req.nextUrl.protocol.replace(":", "");
    try {
      allowedOrigins.add(new URL(`${requestProtocol}://${requestHost}`).origin);
    } catch {
      // Geçersiz Host başlığı izin listesine eklenmez.
    }
  }
  const configuredOrigin = process.env.APP_URL?.trim();
  if (configuredOrigin) {
    try {
      allowedOrigins.add(new URL(configuredOrigin).origin);
    } catch {
      // Ortam kontrolü geçersiz APP_URL değerini ayrıca raporlar.
    }
  }

  if (!allowedOrigins.has(origin)) {
    return NextResponse.json({ error: "İstek kaynağına izin verilmedi." }, { status: 403 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
