import { cleanupStaleGameRooms } from "../lib/games/backgammonRoom.ts";

const configuredInterval = Number(process.env.GAME_MAINTENANCE_INTERVAL_MS || 20_000);
const intervalMs = Number.isFinite(configuredInterval) ? Math.max(5_000, configuredInterval) : 20_000;
let running = false;

async function tick() {
  if (running) return;
  running = true;
  try {
    await cleanupStaleGameRooms(new Date());
  } catch (error) {
    console.error("Oyun bakım döngüsü çalıştırılamadı:", error);
  } finally {
    running = false;
  }
}

await tick();
const timer = setInterval(() => void tick(), intervalMs);

function stop() {
  clearInterval(timer);
  process.exit(0);
}

process.on("SIGINT", stop);
process.on("SIGTERM", stop);

console.log(`Oyun bakım döngüsü ${intervalMs} ms aralıkla çalışıyor.`);
