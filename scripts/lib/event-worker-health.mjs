import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, readdir, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";

export const HEARTBEAT_MS = 10_000;
export const STALE_MS = 35_000;
export const STALLED_MS = 300_000;
export const QUEUE_AGE_MS = 300_000;
export function workerHealthDirectory(env = process.env, cwd = process.cwd()) {
  const scope = createHash("sha256").update(`${path.resolve(cwd)}\n${env.DATABASE_URL ?? ""}`).digest("hex").slice(0, 24);
  return path.join(cwd, "tmp", "event-worker-health", scope);
}
export async function createWorkerHeartbeat(directory, now = () => new Date()) {
  await mkdir(directory, { recursive: true, mode: 0o700 });
  const file = path.join(directory, `${randomUUID()}.json`), temporary = `${file}.tmp`;
  const state = { schema: 1, startedAt: now().toISOString(), heartbeatAt: null, lastSuccessAt: null, lastOutcome: "starting", consecutiveErrors: 0 };
  let writes = Promise.resolve(), closed = false;
  function record(patch = {}) {
    if (closed) return Promise.resolve();
    Object.assign(state, patch, { heartbeatAt: now().toISOString() });
    const content = JSON.stringify(state);
    // Serialize writes so a slow heartbeat cannot replace a newer tick result.
    writes = writes.catch(() => {}).then(async () => { await writeFile(temporary, content, { mode: 0o600 }); await rename(temporary, file); });
    return writes;
  }
  await record();
  return {
    pulse: () => record(),
    success: () => record({ lastSuccessAt: now().toISOString(), lastOutcome: "ok", consecutiveErrors: 0 }),
    failure: () => record({ lastOutcome: "error", consecutiveErrors: state.consecutiveErrors + 1 }),
    async close() { closed = true; await writes.catch(() => {}); await rm(file, { force: true }); await rm(temporary, { force: true }); },
  };
}
function timestamp(value) { return typeof value === "string" ? Date.parse(value) : NaN; }
export function assessWorkerHealth(records, queue, now = new Date(), invalid = 0) {
  const current = now.getTime();
  let live = 0, healthy = 0, stale = 0, errors = 0, stalled = 0, starting = 0;
  for (const record of records) {
    const beat = timestamp(record?.heartbeatAt), success = timestamp(record?.lastSuccessAt), start = timestamp(record?.startedAt);
    if (record?.schema !== 1 || !Number.isFinite(beat) || !Number.isFinite(start) || beat > current + 5000 || start > beat || !["starting", "ok", "error"].includes(record.lastOutcome) || !Number.isInteger(record.consecutiveErrors) || record.consecutiveErrors < 0 || (record.lastSuccessAt !== null && (!Number.isFinite(success) || success > beat))) { invalid++; continue; }
    if (current - beat > STALE_MS) { stale++; continue; }
    live++;
    if (record.lastOutcome === "error") errors++;
    else if (!Number.isFinite(success)) { if (current - start > STALE_MS) stalled++; else starting++; }
    else if (current - success > STALLED_MS) stalled++;
    else healthy++;
  }
  const oldest = timestamp(queue.oldestPendingAt);
  const oldestPendingAgeSeconds = Number.isFinite(oldest) ? Math.max(0, Math.floor((current - oldest) / 1000)) : null;
  const issues = [];
  if (!healthy) issues.push(live ? "WORKER_NOT_READY" : "WORKER_MISSING_OR_STALE");
  if (errors) issues.push("WORKER_TICK_ERROR");
  if (stalled) issues.push("WORKER_PROGRESS_STALLED");
  if (invalid) issues.push("INVALID_HEARTBEAT");
  if (queue.failed > 0) issues.push("FAILED_JOBS");
  if (Number.isFinite(oldest) && current - oldest > QUEUE_AGE_MS) issues.push("QUEUE_DELAYED");
  return { ok: issues.length === 0, issues, workers: { live, healthy, starting, stale, errors, stalled, invalid }, queue: { pending: queue.pending, ready: queue.ready, failed: queue.failed, oldestPendingAgeSeconds } };
}
export async function readWorkerHealth(directory, queue, now = new Date()) {
  let names;
  try { names = await readdir(directory); } catch (error) { if (error.code === "ENOENT") return assessWorkerHealth([], queue, now); throw error; }
  const files = names.filter(name => /^[a-f0-9-]{36}\.json$/.test(name));
  if (files.length > 1000) throw new Error("Too many heartbeat files; operator cleanup required");
  const records = []; let invalid = 0;
  for (const name of files) {
    try { const content = await readFile(path.join(directory, name), "utf8"); if (content.length > 2048) invalid++; else records.push(JSON.parse(content)); }
    catch (error) { if (error.code !== "ENOENT") invalid++; } // A graceful stop may remove its file during this read.
  }
  return assessWorkerHealth(records, queue, now, invalid);
}
