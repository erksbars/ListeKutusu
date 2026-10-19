import { checkEnvironment } from "./lib/environment-check.mjs";
const args = process.argv.slice(2);
if (args.some(arg => arg !== "--production") || args.length > 1) {
  console.error("Yalnız --production seçeneği desteklenir."); process.exitCode = 1;
} else {
  const result = checkEnvironment(process.env, args.includes("--production"));
  for (const item of result.warnings) console.warn(`UYARI: ${item.message}`);
  for (const item of result.errors) console.error(`HATA: ${item.message}`);
  if (result.errors.length) process.exitCode = 1;
  else console.log(`Ortam kontrolü başarılı (${result.mode}).`);
}
