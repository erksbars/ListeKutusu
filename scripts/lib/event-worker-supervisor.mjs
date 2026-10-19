import { spawn } from "node:child_process";

export function restartDelay(attempt) { return Math.min(30_000, 1000 * 2 ** Math.min(attempt, 5)); }
// This owns only the child it spawned. It never scans or kills unrelated processes.
export function superviseWorker({ command, args, cwd, env = process.env, spawnChild = spawn, clock = Date.now, schedule = setTimeout, cancel = clearTimeout, log = console.log, onFailure = () => { process.exitCode = 1; } }) {
  let child = null, timer = null, stopping = false, finished = false, failures = [], attempt = 0, started = 0;
  function launch() {
    if (stopping || finished) return;
    started = clock();
    try { child = spawnChild(command, args, { cwd, env, stdio: "inherit", windowsHide: true, shell: false }); }
    catch { failed(); return; }
    let settled = false;
    const ended = () => { if (settled) return; settled = true; child = null; if (!stopping) failed(); };
    child.once("error", ended); child.once("exit", ended);
  }
  function failed() {
    const now = clock();
    if (now - started >= 60_000) { attempt = 0; failures = []; }
    failures = failures.filter(time => now - time < 60_000); failures.push(now);
    if (failures.length >= 5) { finished = true; log("Etkinlik gözetmeni durdu: bir dakika içinde beş kapanış. Operatör incelemesi gerekli."); onFailure(); return; }
    const delay = restartDelay(attempt++);
    log(`Etkinlik işçisi kapandı; ${delay / 1000} saniye sonra tekrar başlatılacak.`);
    timer = schedule(() => { timer = null; launch(); }, delay);
  }
  launch();
  return { stop() { if (stopping) return; stopping = true; if (timer !== null) cancel(timer); timer = null; child?.kill("SIGTERM"); } };
}
