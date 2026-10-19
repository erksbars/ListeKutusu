import { fileURLToPath } from "node:url";
import { inspectRuntime, notifyRuntime, runtimeAlertFile } from "./lib/runtime-check.mjs";

const args = process.argv.slice(2), cwd = fileURLToPath(new URL("../", import.meta.url));
if (new Set(args).size !== args.length || args.some(arg => !["--development", "--notify"].includes(arg)) || args.includes("--development") && args.includes("--notify")) {
  console.error("Yalnız --development veya --notify kullan; development ortamında dış bildirim gönderilmez."); process.exitCode = 1;
} else {
  try {
    const report = await inspectRuntime({ cwd, production: !args.includes("--development") });
    const alert = args.includes("--notify") ? await notifyRuntime(report, { file: runtimeAlertFile(cwd, process.env) }) : { requested: false };
    console.log(JSON.stringify({ ...report, alert }));
    if (report.state !== "healthy" || alert.ok === false) process.exitCode = 1;
  } catch { console.error("Çalışma sağlığı kontrol edilemedi; ortam değerleri veya ham hata yazdırılmadı."); process.exitCode = 1; }
}
