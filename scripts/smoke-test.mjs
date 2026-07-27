const baseUrl = process.env.APP_URL || "http://127.0.0.1:3000";

const checks = [
  { name: "Keşfet sayfası", path: "/discover", status: 200, content: "text/html" },
  { name: "Forum sayfası", path: "/forum", status: 200, content: "text/html" },
  { name: "Forum API", path: "/api/forum", status: 200, content: "application/json" },
  { name: "Forum moderasyon koruması", path: "/api/admin/forum", status: 401, content: "application/json" },
  { name: "Kullanıcı rolü yönetimi koruması", path: "/api/admin/users/role", method: "PATCH", status: 401, content: "application/json" },
  { name: "Yönetim raporu koruması", path: "/api/admin/activity", status: 401, content: "application/json" },
  { name: "Keşfet API", path: "/api/discover", status: 200, content: "application/json" },
  { name: "Günlük hedef koruması", path: "/api/daily-goals", status: 401, content: "application/json" },
  { name: "Başarım koruması", path: "/api/achievements", status: 401, content: "application/json" },
  { name: "Ana sayfa", path: "/", status: 200, content: "text/html" },
  { name: "Hesap", path: "/account", status: 200, content: "text/html" },
  { name: "Şarkı önerme", path: "/suggest", status: 200, content: "text/html" },
  { name: "Liste kontrolü", path: "/control", status: 200, content: "text/html" },
  { name: "Yasal metin", path: "/legal", status: 200, content: "text/html" },
  { name: "Robots", path: "/robots.txt", status: 200, content: "text/plain" },
  { name: "Sitemap", path: "/sitemap.xml", status: 200, content: "application/xml" },
  { name: "Servis sağlığı", path: "/api/health", status: 200, content: "application/json" },
  { name: "Akış API", path: "/api/feed?take=1", status: 200, content: "application/json" },
  { name: "Kaydedilen akış giriş koruması", path: "/api/feed/saves", method: "POST", status: 401, content: "application/json" },
  { name: "Akış gizleme giriş koruması", path: "/api/feed/hides", method: "POST", status: 401, content: "application/json" },
  { name: "Forum çözümü giriş koruması", path: "/api/forum/replies/gecersiz/accept", method: "POST", status: 401, content: "application/json" },
  { name: "Liderlik API", path: "/api/leaderboard", status: 200, content: "application/json" },
  { name: "Oturum koruması", path: "/api/accounts/me", status: 401, content: "application/json" },
  { name: "Oturum listesi koruması", path: "/api/accounts/sessions", status: 401, content: "application/json" },
  { name: "Davet kodu koruması", path: "/api/accounts/resolve?code=EKLE-00000000", status: 401, content: "application/json" },
  { name: "Veri dışa aktarma koruması", path: "/api/accounts/export", status: 401, content: "application/json" },
  { name: "Hesap silme koruması", path: "/api/accounts/delete", method: "DELETE", status: 401, content: "application/json" },
  { name: "Yönetici OAuth koruması", path: "/api/auth/login", status: 401, content: "application/json" },
  { name: "Eski whitelist kaldırıldı", path: "/api/admin/whitelist", status: 404, content: "text/html" },
  {
    name: "Aynı kaynak kayıt isteği",
    path: "/api/accounts",
    method: "POST",
    headers: { Origin: baseUrl, "Sec-Fetch-Site": "same-origin", "Content-Type": "application/json" },
    status: 400,
    content: "application/json",
  },
  {
    name: "Çapraz site mutation koruması",
    path: "/api/accounts/logout",
    method: "POST",
    headers: { Origin: "https://example.invalid", "Sec-Fetch-Site": "cross-site" },
    status: 403,
    content: "application/json",
  },
  {
    name: "Sosyal mutation çapraz kaynak koruması",
    path: "/api/feed/saves",
    method: "POST",
    headers: {
      Origin: "https://example.invalid",
      "Sec-Fetch-Site": "cross-site",
      "Content-Type": "application/json",
    },
    status: 403,
    content: "application/json",
  },
  { name: "404 ekranı", path: "/olmayan-sayfa-smoke-test", status: 404, content: "text/html" },
];

let failed = 0;
for (const check of checks) {
  try {
    const response = await fetch(`${baseUrl}${check.path}`, {
      method: check.method || "GET",
      headers: { Accept: check.content, ...(check.headers || {}) },
      redirect: "manual",
    });
    const contentType = response.headers.get("content-type") || "";
    const ok = response.status === check.status && contentType.includes(check.content);
    if (!ok) failed += 1;
    console.log(
      `${ok ? "PASS" : "FAIL"} ${check.name}: ${response.status} ${contentType.split(";")[0]}`
    );
  } catch (error) {
    failed += 1;
    console.log(`FAIL ${check.name}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

try {
  const response = await fetch(`${baseUrl}/`, { redirect: "manual" });
  const expectedHeaders = {
    "x-dns-prefetch-control": "off",
    "x-content-type-options": "nosniff",
    "x-frame-options": "DENY",
    "referrer-policy": "strict-origin-when-cross-origin",
    "cross-origin-resource-policy": "same-origin",
    "x-permitted-cross-domain-policies": "none",
  };
  const missing = Object.entries(expectedHeaders).filter(
    ([key, value]) => response.headers.get(key) !== value
  );
  const ok = missing.length === 0;
  if (!ok) failed += 1;
  console.log(
    `${ok ? "PASS" : "FAIL"} Güvenlik başlıkları${
      ok ? "" : `: ${missing.map(([key]) => key).join(", ")}`
    }`
  );
  const csp = response.headers.get("content-security-policy") || "";
  const cspOk = csp.includes("object-src 'none'") && csp.includes("frame-ancestors 'none'");
  if (!cspOk) failed += 1;
  console.log(`${cspOk ? "PASS" : "FAIL"} İçerik güvenlik politikası`);
} catch (error) {
  failed += 1;
  console.log(
    `FAIL Güvenlik başlıkları: ${error instanceof Error ? error.message : String(error)}`
  );
}

if (failed > 0) {
  console.error(`\n${failed} sağlık kontrolü başarısız.`);
  process.exit(1);
}

console.log(`\n${checks.length + 1} sağlık kontrolü başarılı.`);
