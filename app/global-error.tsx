"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application render failed", error);
  }, [error]);

  return (
    <html lang="tr">
      <body style={{ margin: 0, background: "#050912", color: "#fff", fontFamily: "system-ui, sans-serif" }}>
        <main style={{ display: "grid", minHeight: "100vh", placeItems: "center", padding: 24, textAlign: "center" }}>
          <section role="alert" style={{ maxWidth: 520 }}>
            <p style={{ color: "#a5f3fc", fontSize: 13, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase" }}>ListeKutusu</p>
            <h1 style={{ margin: "12px 0 0", fontSize: 32 }}>Uygulama başlatılamadı.</h1>
            <p style={{ margin: "12px auto 0", color: "#cbd5e1", fontSize: 14, lineHeight: 1.7 }}>Geçici bir sistem sorunu oluştu. Sayfayı yeniden hazırlamak için tekrar deneyebilirsin.</p>
            <button type="button" onClick={reset} style={{ minHeight: 44, marginTop: 24, border: "1px solid #67e8f9", borderRadius: 10, background: "#67e8f9", color: "#08202a", padding: "0 20px", fontSize: 14, fontWeight: 800, cursor: "pointer" }}>Tekrar dene</button>
          </section>
        </main>
      </body>
    </html>
  );
}
