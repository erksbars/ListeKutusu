import { PrismaClient } from "@prisma/client";
import { eventOutboxStatus, processEventNotificationBatch, retryFailedEventNotifications } from "../lib/communityEventOutbox.ts";
import { createWorkerHeartbeat, HEARTBEAT_MS, readWorkerHealth, workerHealthDirectory } from "./lib/event-worker-health.mjs";

const args = process.argv.slice(2);
if (args.length > 1 || args.some(arg => !["--once", "--status", "--health", "--retry-failed"].includes(arg))) throw new Error("Use --once, --status, --health or --retry-failed, or no arguments for the worker loop.");
const db = new PrismaClient();
async function tick() {
  let delivered = 0, skipped = 0, processed = 0, ok = true;
  for (let batch = 0; batch < 20; batch++) {
    const result = await processEventNotificationBatch(db);
    if (result.status === "idle") break;
    delivered += result.delivered; skipped += result.skipped; processed++;
    if (result.status === "retry" || result.status === "failed") { ok = false; break; }
  }
  if (processed) console.log(JSON.stringify({ processed, delivered, skipped, ...await eventOutboxStatus(db) }));
  return ok;
}
if (args.length) {
  try {
    if (args[0] === "--retry-failed") console.log(JSON.stringify({ requeued: (await retryFailedEventNotifications(db)).count }));
    if (args[0] === "--once" && !await tick()) process.exitCode = 1;
    const status = await eventOutboxStatus(db);
    if (args[0] === "--health") {
      const health = await readWorkerHealth(workerHealthDirectory(), status); console.log(JSON.stringify(health));
      if (!health.ok) process.exitCode = 1;
    } else { console.log(JSON.stringify(status)); if (status.failed) process.exitCode = 1; }
  } catch {
    console.error("Etkinlik bildirim komutu başarısız; kuyruk korunuyor."); process.exitCode = 1;
  } finally { await db.$disconnect(); }
} else {
  let heartbeat;
  try { heartbeat = await createWorkerHeartbeat(workerHealthDirectory()); }
  catch { console.error("İşçi sağlık kaydı açılamadı; işçi başlatılmadı."); await db.$disconnect(); process.exitCode = 1; }
  if (heartbeat) {
  let running = null, stopping = false;
  const heartbeatError = () => console.error("İşçi sağlık kaydı güncellenemedi; yerel sağlık kontrolünü incele.");
  const run = () => {
    if (running || stopping) return;
    running = tick().then(ok => ok ? heartbeat.success() : heartbeat.failure()).catch(async () => {
      console.error("Etkinlik bildirim işçisi başarısız; kuyruk korunuyor.");
      await heartbeat.failure().catch(heartbeatError);
    }).finally(() => { running = null; });
  };
  const timer = setInterval(run, 2000);
  const pulse = setInterval(() => { void heartbeat.pulse().catch(heartbeatError); }, HEARTBEAT_MS);
  async function stop() {
    if (stopping) return;
    stopping = true; clearInterval(timer); clearInterval(pulse); await running; await heartbeat.close().catch(heartbeatError); await db.$disconnect();
  }
  process.on("SIGINT", () => void stop()); process.on("SIGTERM", () => void stop());
  console.log("Etkinlik bildirim işçisi başladı (50 alıcı/batch, 2 saniye aralık).");
  run();
  }
}
