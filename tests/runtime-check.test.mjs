import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { alertDue, inspectRuntime, notifyRuntime, runtimeAlertFile } from "../scripts/lib/runtime-check.mjs";

const healthy = () => ({ environment: { errors: [] }, database: { ok: true }, communities: { errors: 0, warnings: 0 }, worker: { ok: true } });
const okResponse = () => new Response(JSON.stringify({ status: "ok", database: "available" }), { status: 200 });
test("runtime denetimi HTTP, DB, topluluk ve işçiyi ayrı değerlendirir; içerik sızdırmaz", async () => {
  const env = { APP_URL: "https://app.example.test" };
  assert.equal((await inspectRuntime({ env, inspect: async () => healthy(), request: async () => okResponse() })).state, "healthy");
  const broken = healthy(); broken.worker.ok = false; broken.database.ok = false; broken.communities.warnings = 1;
  const result = await inspectRuntime({ env, inspect: async () => broken, request: async () => { throw new Error("private-secret-url"); } });
  assert.deepEqual(result.issues, ["DATABASE_NOT_READY", "COMMUNITY_INTEGRITY", "WORKER_NOT_READY", "HTTP_HEALTH_FAILED"]);
  assert.equal(JSON.stringify(result).includes("private-secret"), false);
  for (const response of [new Response("bad json"), new Response(JSON.stringify({ status: "ok" })), new Response(JSON.stringify({ status: "ok", database: "available" }), { status: 503 })]) assert.equal((await inspectRuntime({ env, inspect: async () => healthy(), request: async () => response })).httpOk, false);
  const invalid = healthy(); invalid.environment.errors.push({ field: "APP_URL" });
  let fetched = false;
  const result2 = await inspectRuntime({ env, inspect: async () => invalid, request: async () => { fetched = true; } });
  assert.equal(fetched, false); assert.equal(result2.state, "failed");
  assert.deepEqual((await inspectRuntime({ inspect: async () => { throw new Error("private DB"); } })).issues, ["PREFLIGHT_UNAVAILABLE"]);
});

test("alarm sadece arıza/geçiş/30 dakika hatırlatmasında; onaysız hedef/redirect ve sır taşınmaz", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "lk-alert-test-")), file = path.join(directory, "state.json");
  const env = { OPERATIONS_ALERT_WEBHOOK: "https://operator.example/secret-path", OPERATIONS_ALERT_TOKEN: "private-token" };
  const failed = { state: "failed", issues: ["WORKER_NOT_READY", "private-query"] }, recovered = { state: "healthy", issues: [] };
  const sent = []; let now = 2_000_000;
  const request = async (url, options) => { assert.equal(url.protocol, "https:"); assert.equal(options.redirect, "error"); assert.equal(options.headers.Authorization, "Bearer private-token"); sent.push(JSON.parse(options.body)); return new Response(null, { status: 204 }); };
  try {
    assert.equal((await notifyRuntime(recovered, { env, file, now, request })).sent, false);
    assert.equal((await notifyRuntime(failed, { env, file, now, request })).sent, true);
    assert.equal((await notifyRuntime(failed, { env, file, now: now + 1000, request })).sent, false);
    now += 30 * 60_000; assert.equal((await notifyRuntime(failed, { env, file, now, request })).sent, true);
    now += 1000; assert.equal((await notifyRuntime(recovered, { env, file, now, request })).sent, true);
    assert.equal((await notifyRuntime(recovered, { env, file, now: now + 1000, request })).sent, false);
    assert.deepEqual(sent.map(item => item.state), ["failed", "failed", "healthy"]);
    assert.equal(JSON.stringify(sent).includes("private"), false);
    assert.equal((await readFile(file, "utf8")).includes("secret"), false);
    for (const target of ["http://operator.example", "https://user:pass@operator.example", "https://operator.example/#fragment"]) assert.equal((await notifyRuntime(failed, { env: { OPERATIONS_ALERT_WEBHOOK: target }, file, now, request })).issue, "ALERT_NOT_CONFIGURED");
    assert.equal((await notifyRuntime({ state: "unknown", issues: [] }, { env, file, request })).issue, "ALERT_REPORT_INVALID");
    assert.notEqual(runtimeAlertFile(directory, { APP_URL: "a" }), runtimeAlertFile(directory, { APP_URL: "b" }));
    assert.equal(alertDue(null, "healthy", now), false);
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test("alarm gönderimi başarısızsa state ilerlemez; bozuk/gelecek state gizlice sıfırlanmaz", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "lk-alert-fail-")), file = path.join(directory, "state.json");
  const env = { OPERATIONS_ALERT_WEBHOOK: "https://operator.example/hook" }, report = { state: "failed", issues: ["HTTP_HEALTH_FAILED"] };
  try {
    for (const request of [async () => new Response("private error", { status: 500 }), async () => { throw new Error("private failure"); }]) {
      const result = await notifyRuntime(report, { env, file, now: 1000, request }); assert.equal(result.ok, false); assert.equal(JSON.stringify(result).includes("private"), false);
      await assert.rejects(readFile(file), { code: "ENOENT" });
    }
    for (const bytes of ["{", JSON.stringify({ schema: 1, state: "failed", sentAt: 2000 })]) {
      await writeFile(file, bytes);
      const result = await notifyRuntime(report, { env, file, now: 1000, request: async () => { throw new Error("Must not send"); } });
      assert.equal(result.issue, "ALERT_STATE_INVALID"); assert.equal(await readFile(file, "utf8"), bytes);
    }
  } finally { await rm(directory, { recursive: true, force: true }); }
});
