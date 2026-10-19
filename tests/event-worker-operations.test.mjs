import assert from "node:assert/strict";
import test from "node:test";
import { EventEmitter } from "node:events";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import { PrismaClient } from "@prisma/client";
import { assessWorkerHealth, createWorkerHeartbeat, readWorkerHealth, workerHealthDirectory } from "../scripts/lib/event-worker-health.mjs";
import { restartDelay, superviseWorker } from "../scripts/lib/event-worker-supervisor.mjs";

const time = new Date("2026-10-17T12:00:00Z");
const queue = { pending: 0, ready: 0, failed: 0, oldestPendingAt: null };
const record = patch => ({ schema: 1, startedAt: time.toISOString(), heartbeatAt: time.toISOString(), lastSuccessAt: time.toISOString(), lastOutcome: "ok", consecutiveErrors: 0, ...patch });
test("işçi operasyonları: canlılık, ilerleme, özel kayıt ve sınırlı yeniden başlama", async t => {
  const directory = await mkdtemp(path.join(tmpdir(), "listekutusu-worker-health-"));
  try {
    await t.test("boş kuyruk canlı işçi kanıtı değildir; başlangıç hazır sayılmaz", () => {
      assert.equal(assessWorkerHealth([], queue, time).ok, false);
      assert.equal(assessWorkerHealth([record({ lastSuccessAt: null, lastOutcome: "starting" })], queue, time).ok, false);
      assert.equal(assessWorkerHealth([record()], queue, time).ok, true);
      assert.equal(assessWorkerHealth([record()], queue, new Date(+time + 35_001)).workers.stale, 1);
    });
    await t.test("atan kalp takılı işi gizlemez; hata, failed ve kuyruk yaşı alarmdır", () => {
      const now = new Date(+time + 301_000);
      const stalled = assessWorkerHealth([record({ heartbeatAt: now.toISOString() })], queue, now);
      assert.equal(stalled.workers.stalled, 1); assert.equal(stalled.ok, false);
      const failed = assessWorkerHealth([record({ lastOutcome: "error", consecutiveErrors: 1 })], { ...queue, pending: 2, failed: 1, oldestPendingAt: new Date(+time - 300_001).toISOString() }, time);
      assert.deepEqual(failed.issues, ["WORKER_NOT_READY", "WORKER_TICK_ERROR", "FAILED_JOBS", "QUEUE_DELAYED"]);
    });
    await t.test("eski süreç kaydı sağlıklı yeni işçiyi kapatmaz; bozuk/gelecek kayıt hazır sayılmaz", () => {
      assert.equal(assessWorkerHealth([record({ heartbeatAt: new Date(+time - 40_000).toISOString(), startedAt: new Date(+time - 50_000).toISOString(), lastSuccessAt: null }), record()], queue, time).ok, true);
      for (const value of [null, {}, record({ heartbeatAt: new Date(+time + 6000).toISOString() }), record({ consecutiveErrors: -1 })]) {
        const result = assessWorkerHealth([value], queue, time); assert.equal(result.ok, false); assert.equal(result.workers.invalid, 1);
      }
    });
    await t.test("atomik seri yazma, hata kurtarma ve yalnız kendi kaydını kapatma", async () => {
      let now = time;
      const heartbeat = await createWorkerHeartbeat(directory, () => now);
      assert.equal((await readWorkerHealth(directory, queue, now)).ok, false);
      await Promise.all([heartbeat.success(), heartbeat.pulse()]);
      assert.equal((await readWorkerHealth(directory, queue, now)).ok, true);
      await heartbeat.failure(); assert.equal((await readWorkerHealth(directory, queue, now)).workers.errors, 1);
      now = new Date(+time + 2000); await heartbeat.success();
      const second = await createWorkerHeartbeat(directory, () => now); await second.success();
      await heartbeat.close(); await heartbeat.pulse();
      assert.equal((await readWorkerHealth(directory, queue, now)).workers.live, 1);
      await second.close(); assert.equal((await readdir(directory)).length, 0);
    });
    await t.test("bozuk JSON güvenli hata; hedef DB/workspace ayrımı ve DTO'da sır yok", async () => {
      const file = path.join(directory, `${randomUUID()}.json`); await writeFile(file, "{broken");
      const result = await readWorkerHealth(directory, queue, time); assert.equal(result.workers.invalid, 1);
      assert.equal(JSON.stringify(result).includes(directory), false); await rm(file);
      assert.notEqual(workerHealthDirectory({ DATABASE_URL: "secret-one" }, directory), workerHealthDirectory({ DATABASE_URL: "secret-two" }, directory));
      assert.equal(workerHealthDirectory({ DATABASE_URL: "secret-one" }, directory).includes("secret-one"), false);
    });
    function harness() {
      let now = 0, launches = 0, failure = 0, cancelled = 0;
      const children = [], tasks = [], logs = [];
      const supervisor = superviseWorker({ command: "test-only", args: [], cwd: directory,
        spawnChild: () => { launches++; const child = new EventEmitter(); child.kill = signal => { child.signal = signal; }; children.push(child); return child; },
        clock: () => now, schedule: (fn, delay) => { const task = { fn, delay }; tasks.push(task); return task; }, cancel: () => cancelled++, log: line => logs.push(line), onFailure: () => failure++,
      });
      return { supervisor, children, tasks, logs, next() { const task = tasks.shift(); now += task.delay; task.fn(); }, advance(ms) { now += ms; }, stats: () => ({ launches, failure, cancelled }) };
    }
    await t.test("çift exit/error tek restart; beş hızlı kapanışta devre kesici", () => {
      const h = harness();
      h.children[0].emit("error", new Error("secret query not logged")); h.children[0].emit("exit", 1);
      assert.equal(h.tasks.length, 1); assert.equal(h.tasks[0].delay, 1000); h.next();
      for (let i = 1; i < 5; i++) { h.children[i].emit("exit", 0); if (i < 4) h.next(); }
      assert.equal(h.stats().launches, 5); assert.equal(h.stats().failure, 1); assert.equal(h.tasks.length, 0);
      assert.equal(h.logs.join(" ").includes("secret"), false); assert.equal(restartDelay(100), 30_000);
    });
    await t.test("stop yalnız kendi çocuğuna sinyal verir; bekleyen restart iptal olur", () => {
      const h = harness(); h.supervisor.stop(); h.supervisor.stop();
      assert.equal(h.children[0].signal, "SIGTERM"); h.children[0].emit("exit", 0); assert.equal(h.tasks.length, 0);
      const waiting = harness(); waiting.children[0].emit("exit", 1); waiting.supervisor.stop();
      assert.equal(waiting.stats().cancelled, 1); waiting.next(); assert.equal(waiting.stats().launches, 1);
    });
    await t.test("kararlı çalışma restart bütçesini sıfırlar", () => {
      const h = harness(); h.children[0].emit("exit", 1); h.next();
      h.advance(60_000); h.children[1].emit("exit", 1); assert.equal(h.tasks[0].delay, 1000);
      h.supervisor.stop();
    });
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test("gerçek işçi CLI: geçici DB, canlı health ve salt okunur denetim", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "listekutusu-worker-cli-"));
  const url = `file:${path.join(directory, "test.db").replaceAll("\\", "/")}`;
  const db = new PrismaClient({ datasources: { db: { url } } });
  const env = { ...process.env, DATABASE_URL: url }, cwd = fileURLToPath(new URL("../", import.meta.url));
  const healthDir = workerHealthDirectory(env, cwd); let worker;
  const args = ["--disable-warning=MODULE_TYPELESS_PACKAGE_JSON", "--env-file=.env", "--experimental-strip-types", "scripts/event-notification-worker.mjs"];
  function command(extra) { return new Promise((resolve, reject) => { const child = spawn(process.execPath, [...args, extra], { cwd, env, windowsHide: true }); let output = ""; child.stdout.on("data", chunk => { output += chunk; }); child.once("error", reject); child.once("exit", code => resolve({ code, output })); }); }
  try {
    const root = new URL("../prisma/migrations/", import.meta.url);
    for (const folder of (await readdir(root, { withFileTypes: true })).filter(item => item.isDirectory()).map(item => item.name).sort()) for (const sql of (await readFile(new URL(`${folder}/migration.sql`, root), "utf8")).split(";").map(item => item.trim()).filter(Boolean)) await db.$executeRawUnsafe(sql);
    assert.equal((await command("--health")).code, 1); assert.equal((await command("--once")).code, 0);
    assert.equal((await readWorkerHealth(healthDir, queue)).ok, false); // One-shot does not impersonate a persistent worker.
    worker = spawn(process.execPath, args, { cwd, env, windowsHide: true, stdio: "ignore" });
    await new Promise((resolve, reject) => { const deadline = Date.now() + 10_000; const poll = async () => { try { if ((await readWorkerHealth(healthDir, queue)).ok) return resolve(); if (Date.now() > deadline) return reject(new Error("Worker startup timeout")); setTimeout(poll, 50); } catch (error) { reject(error); } }; worker.once("error", reject); void poll(); });
    const result = await command("--health"); assert.equal(result.code, 0); assert.equal(JSON.parse(result.output).workers.healthy, 1);
    assert.equal(await db.userList.count(), 0); assert.equal(await db.communityEventNotificationJob.count(), 0);
    const exited = new Promise(resolve => worker.once("exit", resolve)); worker.kill("SIGTERM"); await exited; worker = null;
    assert.equal((await readWorkerHealth(healthDir, queue, new Date(Date.now() + 36_000))).ok, false);
  } finally {
    if (worker) { const exited = new Promise(resolve => worker.once("exit", resolve)); worker.kill(); await exited; }
    await db.$disconnect(); await rm(healthDir, { recursive: true, force: true }); await rm(directory, { recursive: true, force: true });
  }
});

test("gözetmen gerçek çocuk kapanışında yeni süreç açar ve stop yeniden açmaz", async () => {
  const children = [];
  let secondStarted;
  const started = new Promise(resolve => { secondStarted = resolve; });
  const supervisor = superviseWorker({ command: process.execPath, args: ["-e", "setInterval(()=>{},1000)"], cwd: process.cwd(), log: () => {},
    spawnChild: (...args) => { const child = spawn(...args); children.push(child); if (children.length === 2) child.once("spawn", secondStarted); return child; },
  });
  let timeout;
  try {
    const first = children[0]; await new Promise((resolve, reject) => { first.once("spawn", resolve); first.once("error", reject); });
    first.kill("SIGTERM");
    await Promise.race([started, new Promise((_, reject) => { timeout = setTimeout(() => reject(new Error("Supervisor restart timeout")), 5000); })]);
    assert.notEqual(children[1].pid, first.pid);
    const stopped = new Promise(resolve => children[1].once("exit", resolve)); supervisor.stop(); await stopped;
    assert.equal(children.length, 2);
  } finally {
    clearTimeout(timeout); supervisor.stop();
    for (const child of children) if (child.exitCode === null && child.signalCode === null) { const exit = new Promise(resolve => child.once("exit", resolve)); child.kill(); await exit; }
  }
});
