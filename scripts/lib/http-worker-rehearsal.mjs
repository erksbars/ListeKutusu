import { PrismaClient } from "@prisma/client";
import { DatabaseSync } from "node:sqlite";
import { spawn } from "node:child_process";
import { open, readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { performance } from "node:perf_hooks";
import { setTimeout as delay } from "node:timers/promises";
import { hashPassword } from "../../lib/password.ts";
import { communityHealth } from "../../lib/communityHealth.ts";
import { eventOutboxStatus } from "../../lib/communityEventOutbox.ts";
import { readWorkerHealth, workerHealthDirectory } from "./event-worker-health.mjs";
import { latencySummary, runBounded } from "./sqlite-load-probe.mjs";
import { assertRehearsalDirectory, copyRehearsalSource, createRehearsalDirectory, rehearsalEnvironment, removeRehearsalDirectory } from "./http-rehearsal-isolation.mjs";

const root = fileURLToPath(new URL("../../", import.meta.url));

function startChild(role, directory, env) {
  const child = spawn(process.execPath, ["--disable-warning=ExperimentalWarning", "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON", "--experimental-strip-types", fileURLToPath(new URL("./http-rehearsal-child.mjs", import.meta.url)), role], { cwd: directory, env, stdio: ["ignore", role === "build" ? "pipe" : "ignore", role === "build" ? "pipe" : "ignore", "ipc"], windowsHide: true });
  let diagnostics = "";
  for (const stream of [child.stdout, child.stderr]) stream?.on("data", value => { diagnostics = (diagnostics + value.toString()).slice(-100_000); });
  let ended = false;
  const exit = new Promise(resolve => { child.once("exit", code => { ended = true; resolve(code); }); child.once("error", () => { ended = true; resolve(1); }); });
  const ready = new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("CHILD_START_TIMEOUT")), role === "build" ? 180_000 : 60_000);
    child.once("message", message => { clearTimeout(timer); if (message?.ready) resolve(message); else reject(new Error("CHILD_NOT_READY")); });
    void exit.then(() => { clearTimeout(timer); reject(new Error("CHILD_START_FAILED")); });
  });
  return { ready, isRunning: () => !ended, diagnostics: () => diagnostics, async stop() {
    if (!ended && child.connected) child.send("stop", () => {});
    const result = await Promise.race([exit.then(() => true), delay(15_000, undefined, { ref: false }).then(() => false)]);
    if (result) return true;
    // No process-name, port-based or process-tree killing. Retain the directory on forced stop.
    child.kill(); await Promise.race([exit, delay(5000, undefined, { ref: false })]); return false;
  } };
}

async function initialize(directory) {
  await assertRehearsalDirectory(directory, root);
  const file = path.join(directory, "synthetic-http.db");
  const handle = await open(file, "wx"); await handle.close();
  const db = new DatabaseSync(file);
  try {
    const migrations = path.join(root, "prisma", "migrations");
    for (const name of (await readdir(migrations, { withFileTypes: true })).filter(item => item.isDirectory()).map(item => item.name).sort()) {
      db.exec(await readFile(path.join(migrations, name, "migration.sql"), "utf8"));
    }
  } finally { db.close(); }
  return `file:${file.replaceAll("\\", "/")}`;
}

export { startChild as startRehearsalChild, initialize as initializeRehearsalDatabase, httpClient as rehearsalHttpClient, expect as expectRehearsalStatus };

function httpClient(base) {
  return async (route, cookie = "", method = "GET", body, origin = base) => {
    if (!route.startsWith("/api/")) throw new Error("INVALID_REHEARSAL_ROUTE");
    const response = await fetch(`${base}${route}`, { method, redirect: "error", signal: AbortSignal.timeout(60_000), headers: {
      ...(cookie ? { cookie } : {}), ...(method !== "GET" ? { origin, "Content-Type": "application/json" } : {}),
    }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    const data = await response.json();
    return { status: response.status, data, cookie: response.headers.getSetCookie().map(value => value.split(";")[0]).join("; "), private: response.headers.get("cache-control")?.includes("no-store") === true };
  };
}
function expect(response, status, step) {
  if (response.status !== status) throw new Error(`${step}_STATUS_${response.status}`);
  return response.data;
}

export async function rehearseHttpWorker(progress = () => {}) {
  const directory = await createRehearsalDirectory(root);
  let db, server, worker, cleanupSafe = true;
  try {
    await assertRehearsalDirectory(directory, root);
    progress("ISOLATED_SOURCE_AND_FIXTURE");
    await copyRehearsalSource(root, directory);
    const env = { ...rehearsalEnvironment(), DATABASE_URL: await initialize(directory) };
    db = new PrismaClient({ datasources: { db: { url: env.DATABASE_URL } } });
    const password = randomBytes(24).toString("hex"), passwordHash = await hashPassword(password);
    const ids = Array.from({ length: 13 }, (_, i) => `http-probe-${i}`);
    await db.userList.createMany({ data: ids.map(id => ({ id, slug: id, email: `${id}@example.test`, ownerName: "Sentetik prova kullanıcısı", passwordHash })) });
    progress("ISOLATED_HTTP_START");
    server = startChild("server", directory, env);
    const { port } = await server.ready;
    if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("INVALID_CHILD_PORT");
    const base = `http://127.0.0.1:${port}`, http = httpClient(base), cookies = [];
    for (const id of ids) {
      const response = await http("/api/accounts/login", "", "POST", { email: `${id}@example.test`, password });
      expect(response, 200, "LOGIN"); if (!response.cookie.includes("account_session=")) throw new Error("SESSION_MISSING");
      cookies.push(response.cookie);
    }
    progress("AUTH_MEMBERSHIP_AND_GUARDS");
    const owner = cookies[0], members = cookies.slice(1);
    const slug = expect(await http("/api/communities", owner, "POST", { name: "Sentetik HTTP prova topluluğu", description: "Yalnız geçici yerel prova için oluşturulmuş topluluk.", category: "interest", rules: "Gerçek etkinlik veya kullanıcı değildir." }), 201, "CREATE_COMMUNITY").slug;
    if (typeof slug !== "string" || !/^[a-z0-9-]+$/.test(slug)) throw new Error("INVALID_FIXTURE_SLUG");
    const community = `/api/communities/${slug}`;
    for (const cookie of members) expect(await http(community, cookie, "POST", { action: "join" }), 200, "JOIN");
    expect(await http(community, "", "POST", { action: "join" }), 401, "ANONYMOUS_GUARD");
    expect(await http(community, owner, "POST", { action: "join" }, "https://invalid.example"), 403, "ORIGIN_GUARD");
    // Warm all route modules before timing. Worker runs concurrently with measured HTTP operations.
    const eventInput = { title: "Sentetik HTTP kapasite provası", description: "Yalnız geçici ortamda HTTP ve işçi ölçümü için oluşturulmuştur.", localStart: new Date(Date.now() + 7 * 86400_000).toISOString().slice(0, 16), city: "İstanbul", venue: "Kurgusal prova alanı", capacity: 8, publicLocationConfirmed: true };
    const stages = [];
    worker = startChild("worker", directory, env); await worker.ready;
    for (const concurrency of [1, 4, 8]) {
      progress(`HTTP_CONCURRENCY_${concurrency}`);
      const eventId = expect(await http(`${community}/events`, owner, "POST", eventInput), 201, "CREATE_EVENT").event?.id;
      if (typeof eventId !== "string" || !/^[a-zA-Z0-9_-]+$/.test(eventId)) throw new Error("INVALID_FIXTURE_EVENT");
      const route = `${community}/events/${eventId}`;
      expect(await http(route, owner), 200, "WARM_DETAIL");
      expect(await http(route, "", "POST", { action: "rsvp", status: "attending" }), 401, "WARM_RSVP");
      const reads = [], acceptedTimes = [], rejectedTimes = [], errors = {}; let accepted = 0, rejected = 0;
      const tasks = members.flatMap(cookie => [async () => {
        const start = performance.now();
        try {
          const result = await http(route, cookie, "POST", { action: "rsvp", status: "attending" });
          if (result.status === 200) { accepted++; acceptedTimes.push(performance.now() - start); }
          else if (result.status === 409) { rejected++; rejectedTimes.push(performance.now() - start); }
          else errors[`HTTP_${result.status}`] = (errors[`HTTP_${result.status}`] ?? 0) + 1;
        } catch { errors.REQUEST_FAILED = (errors.REQUEST_FAILED ?? 0) + 1; }
      }, async () => {
        const start = performance.now();
        try { const result = await http(route, cookie); if (result.status !== 200 || !result.private) errors.READ_INVALID = (errors.READ_INVALID ?? 0) + 1; }
        catch { errors.READ_FAILED = (errors.READ_FAILED ?? 0) + 1; }
        finally { reads.push(performance.now() - start); }
      }]);
      await runBounded(tasks, concurrency);
      const stored = await db.communityEventRsvp.count({ where: { eventId, status: "attending" } });
      const deliveryStart = performance.now();
      expect(await http(route, owner, "PATCH", { ...eventInput, venue: "Güncellenmiş kurgusal alan", expectedVersion: 0 }), 200, "UPDATE_EVENT");
      let notifications = 0;
      const deadline = Date.now() + 20_000;
      do {
        notifications = await db.notification.count({ where: { communityEventId: eventId } });
        if (notifications === stored) break;
        await delay(200);
      } while (Date.now() < deadline);
      const deliveryMs = Math.round(performance.now() - deliveryStart);
      const audience = await db.communityEventRsvp.findMany({ where: { eventId, status: "attending" }, select: { userId: true } });
      const recipients = new Set(audience.map(item => item.userId));
      for (const [index, userId] of ids.entries()) {
        const result = await http("/api/notifications", cookies[index]);
        const expected = recipients.has(userId) ? 1 : 0;
        if (result.status !== 200 || !result.private || result.data.notifications?.filter(item => item.communityEventId === eventId).length !== expected) errors.NOTIFICATION_VISIBILITY = (errors.NOTIFICATION_VISIBILITY ?? 0) + 1;
      }
      stages.push({ concurrency, attempts: 12, capacity: 8, accepted, capacityRejected: rejected, stored, notifications, deliveryMs, errors,
        reads: latencySummary(reads), acceptedWrites: latencySummary(acceptedTimes), capacityRejections: latencySummary(rejectedTimes),
        ok: accepted === 8 && rejected === 4 && stored === 8 && notifications === 8 && !Object.keys(errors).length });
    }
    progress("INTEGRITY_AND_WORKER_HEALTH");
    const health = await communityHealth(db), queue = await eventOutboxStatus(db);
    const quick = await db.$queryRawUnsafe("PRAGMA quick_check"), foreignKeys = await db.$queryRawUnsafe("PRAGMA foreign_key_check");
    const sqliteOk = quick.length === 1 && quick[0].quick_check === "ok" && foreignKeys.length === 0;
    const workerHealth = await readWorkerHealth(workerHealthDirectory(env, directory), queue);
    if (!server.isRunning() || !worker.isRunning()) throw new Error("REHEARSAL_CHILD_EXITED");
    return { schema: 1, scope: "synthetic-local-development-http-and-worker", productionCapacityEvidence: false, fixture: { users: 13, communities: 1, events: 3 },
      guards: { anonymous: true, origin: true }, stages, integrity: { sqliteOk, errors: health.errors, warnings: health.warnings },
      worker: { ok: workerHealth.ok, pending: queue.pending, failed: queue.failed },
      ok: stages.every(stage => stage.ok) && sqliteOk && health.errors === 0 && health.warnings === 0 && workerHealth.ok && queue.pending === 0 && queue.failed === 0 };
  } finally {
    // Stop only owned children before touching their directory. A forced stop retains it.
    for (const child of [worker, server]) if (child && !await child.stop()) cleanupSafe = false;
    if (db) await db.$disconnect();
    if (cleanupSafe) await removeRehearsalDirectory(directory, root);
    else throw new Error("CHILD_STOP_INCOMPLETE_TEMP_RETAINED");
  }
}
