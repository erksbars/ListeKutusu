import { pilotExitCode, pilotPreflight } from "./lib/pilot-preflight.mjs";
const args = process.argv.slice(2);
if (args.some(arg => !["--production", "--json"].includes(arg)) || new Set(args).size !== args.length) {
  console.error("Yalnız --production ve --json seçenekleri desteklenir."); process.exitCode = 1;
} else {
  const result = await pilotPreflight({ production: args.includes("--production") });
  if (args.includes("--json")) console.log(JSON.stringify(result));
  else {
    console.log(`Pilot ön kontrolü (${result.mode}): ${result.automatedStatus}`);
    for (const item of result.environment.errors) console.log(`FAIL ${item.code} · ${item.field}`);
    for (const item of result.environment.warnings) console.log(`WARN ${item.code} · ${item.field}`);
    console.log(`Veritabanı: ${result.database.ok ? "PASS" : "FAIL"} · Topluluk: ${result.communities?.status ?? "kontrol edilemedi"} · İşçi: ${result.worker?.ok ? "PASS" : "hazır değil / kontrol edilemedi"}`);
    console.log(`Manuel doğrulama bekleyen kapı: ${result.manualGates.length}. Yayın onayı verilmedi.`);
    console.log("Veri, sırlar, kuyruk ve süreçler değiştirilmedi. Ayrıntı: --json");
  }
  process.exitCode = pilotExitCode(result);
}
