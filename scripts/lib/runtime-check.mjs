import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { pilotPreflight } from "./pilot-preflight.mjs";

// Explicit health fields only. Never forward preflight payloads, URLs or exception bodies.
export async function inspectRuntime({ env = process.env, cwd = process.cwd(), production = true, inspect = pilotPreflight, request = fetch } = {}) {
  let result;
  try { result = await inspect({ env, cwd, production }); }
  catch { return { schema: 1, state: "failed", issues: ["PREFLIGHT_UNAVAILABLE"], httpOk: false, workerOk: false }; }
  const issues = [];
  if (result.environment.errors.length) issues.push("ENVIRONMENT_INVALID");
  if (!result.database.ok) issues.push("DATABASE_NOT_READY");
  if (!result.communities || result.communities.errors || result.communities.warnings) issues.push("COMMUNITY_INTEGRITY");
  if (!result.worker?.ok) issues.push("WORKER_NOT_READY");
  let httpOk = false;
  if (!result.environment.errors.some(item => item.field === "APP_URL")) {
    try {
      const response = await request(new URL("/api/health", env.APP_URL), { redirect: "error", signal: AbortSignal.timeout(5000), headers: { Accept: "application/json" } });
      const value = await response.json();
      httpOk = response.status === 200 && value?.status === "ok" && value?.database === "available";
    } catch { /* fixed code below, not provider/HTTP exception */ }
  }
  if (!httpOk) issues.push("HTTP_HEALTH_FAILED");
  return { schema: 1, state: issues.length ? "failed" : "healthy", issues, httpOk, workerOk: result.worker?.ok === true };
}

export function runtimeAlertFile(cwd, env) {
  const scope = createHash("sha256").update(`${env.APP_URL ?? ""}\n${env.OPERATIONS_ALERT_WEBHOOK ?? ""}`).digest("hex").slice(0, 24);
  return path.join(cwd, "tmp", "runtime-alert-state", `${scope}.json`);
}
export function alertDue(previous, state, now) {
  return state === "failed" ? previous?.state !== "failed" || now - previous.sentAt >= 30 * 60_000 : previous?.state === "failed";
}
export async function notifyRuntime(report, { env = process.env, file = runtimeAlertFile(process.cwd(), env), now = Date.now(), request = fetch } = {}) {
  if (!report || !["failed", "healthy"].includes(report.state) || !Array.isArray(report.issues)) return { ok: false, sent: false, issue: "ALERT_REPORT_INVALID" };
  let previous;
  try {
    previous = JSON.parse(await readFile(file, "utf8"));
    if (previous.schema !== 1 || !["failed", "healthy"].includes(previous.state) || !Number.isSafeInteger(previous.sentAt) || previous.sentAt > now || previous.sentAt < 0) throw new Error();
  } catch (error) {
    if (error.code !== "ENOENT") return { ok: false, sent: false, issue: "ALERT_STATE_INVALID" };
  }
  let url;
  try {
    url = new URL(env.OPERATIONS_ALERT_WEBHOOK);
    if (url.protocol !== "https:" || url.username || url.password || url.hash || /[\u0000-\u001f\u007f]/.test(env.OPERATIONS_ALERT_WEBHOOK) || /[\r\n]/.test(env.OPERATIONS_ALERT_TOKEN ?? "")) throw new Error();
  } catch { return { ok: false, sent: false, issue: "ALERT_NOT_CONFIGURED" }; }
  if (!alertDue(previous, report.state, now)) return { ok: true, sent: false, issue: null };
  // Never accept arbitrary fields/issue strings in outbound payloads.
  const allowed = ["PREFLIGHT_UNAVAILABLE", "ENVIRONMENT_INVALID", "DATABASE_NOT_READY", "COMMUNITY_INTEGRITY", "WORKER_NOT_READY", "HTTP_HEALTH_FAILED"];
  const payload = { schema: 1, service: "listekutusu", state: report.state === "healthy" ? "healthy" : "failed", issues: report.issues.filter(item => allowed.includes(item)) };
  let temporary;
  try {
    const response = await request(url, { method: "POST", redirect: "error", signal: AbortSignal.timeout(5000), headers: {
      "Content-Type": "application/json", ...(env.OPERATIONS_ALERT_TOKEN ? { Authorization: `Bearer ${env.OPERATIONS_ALERT_TOKEN}` } : {}),
    }, body: JSON.stringify(payload) });
    await response.body?.cancel();
    if (!response.ok) return { ok: false, sent: false, issue: "ALERT_DELIVERY_FAILED" };
    await mkdir(path.dirname(file), { recursive: true, mode: 0o700 });
    temporary = `${file}.${randomUUID()}.tmp`;
    await writeFile(temporary, JSON.stringify({ schema: 1, state: payload.state, sentAt: now }), { flag: "wx", mode: 0o600 });
    await rename(temporary, file);
    return { ok: true, sent: true, issue: null };
  } catch { return { ok: false, sent: false, issue: "ALERT_DELIVERY_OR_STATE_FAILED" }; }
  finally { if (temporary) await rm(temporary, { force: true }).catch(() => {}); }
}
