import { PrismaClient } from "@prisma/client";
import { communityHealth } from "../lib/communityHealth.ts";
const args = process.argv.slice(2);
if (args.length > 1 || args.some(arg => arg !== "--json")) throw new Error("Use no arguments or --json");
const db = new PrismaClient();
try {
  const result = await communityHealth(db);
  if (args.includes("--json")) console.log(JSON.stringify(result));
  else {
    for (const check of result.checks) console.log(`${check.count ? check.severity === "error" ? "FAIL" : "WARN" : "PASS"} ${check.label}: ${check.count}`);
    console.log(`Topluluk kontrolü: ${result.status} (${result.errors} hata, ${result.warnings} uyarı). Veri değiştirilmedi.`);
  }
  process.exitCode = result.errors ? 1 : result.warnings ? 2 : 0;
} catch {
  console.error("Topluluk kontrolü tamamlanamadı. Veritabanı ve migration durumunu kontrol et. Veri değiştirilmedi."); process.exitCode = 1;
} finally { await db.$disconnect(); }
