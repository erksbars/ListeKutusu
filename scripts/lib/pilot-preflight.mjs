import { DatabaseSync } from "node:sqlite";
import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { communityHealth } from "../../lib/communityHealth.ts";
import { checkEnvironment } from "./environment-check.mjs";
import { readWorkerHealth, workerHealthDirectory } from "./event-worker-health.mjs";
import { sqliteFilePath } from "./sqlite-rehearsal.mjs";

export const MANUAL_PILOT_GATES = Object.freeze([
  "PRODUCTION_PROCESS_AND_EXTERNAL_ALERTS", "OFF_HOST_ENCRYPTED_BACKUP_AND_RETENTION",
  "STAGING_HTTP_WORKER_LOAD", "STAGING_RESTORE_AND_RPO_RTO", "PROVIDER_COMMERCIAL_LICENSE_REVIEW",
  "PRIVACY_RETENTION_AND_MODERATION_RESPONSIBILITY", "PRODUCTION_TLS_SECRETS_AND_RELEASE_APPROVAL",
]);
export async function expectedMigrations(directory) {
  const folders = (await readdir(directory, { withFileTypes: true })).filter(item => item.isDirectory()).map(item => item.name).sort();
  return Promise.all(folders.map(async name => ({ name, checksum: createHash("sha256").update(await readFile(path.join(directory, name, "migration.sql"))).digest("hex") })));
}
function migrationState(db, expected) {
  const rows = db.prepare('SELECT migration_name, checksum, finished_at, rolled_back_at FROM "_prisma_migrations"').all();
  const completed = rows.filter(row => row.finished_at !== null && row.rolled_back_at === null);
  const pending = expected.filter(item => !completed.some(row => row.migration_name === item.name));
  const unexpected = completed.filter(row => !expected.some(item => item.name === row.migration_name));
  const changed = completed.filter(row => expected.some(item => item.name === row.migration_name && item.checksum !== row.checksum));
  const unfinished = rows.filter(row => row.finished_at === null && row.rolled_back_at === null);
  return { expected: expected.length, applied: completed.length, pending: pending.length, unexpected: unexpected.length, checksumMismatch: changed.length, unfinished: unfinished.length, duplicates: completed.length - new Set(completed.map(row => row.migration_name)).size };
}
const isoDate = raw => raw === null ? null : new Date(typeof raw === "string" && /^\d{4}-\d\d-\d\d \d\d:\d\d:\d\d$/.test(raw) ? raw.replace(" ", "T") + "Z" : raw).toISOString();
export async function inspectPilotDatabase(file, expected, now = new Date()) {
  let db;
  try {
    // readOnly prevents a missing target from being silently created.
    db = new DatabaseSync(file, { readOnly: true });
    db.exec("PRAGMA query_only=ON; PRAGMA busy_timeout=5000; BEGIN");
    const quick = db.prepare("PRAGMA quick_check").all();
    const integrity = quick.length === 1 && quick[0].quick_check === "ok";
    const foreignKeys = !db.prepare("PRAGMA foreign_key_check").get();
    const migrations = migrationState(db, expected);
    const compatible = expected.length > 0 && !migrations.pending && !migrations.unexpected && !migrations.checksumMismatch && !migrations.unfinished && !migrations.duplicates;
    const database = { ok: integrity && foreignKeys && compatible, integrity, foreignKeys, migrations };
    if (!database.ok) return { database, communities: null, queue: null };
    const reader = { $queryRaw: (parts, ...values) => Promise.resolve(db.prepare(parts.join("?")).all(...values.map(value => value instanceof Date ? value.getTime() : value))) };
    const communities = await communityHealth(reader, now);
    const queueRow = db.prepare(`SELECT
      SUM(CASE WHEN completedAt IS NULL AND failedAt IS NULL THEN 1 ELSE 0 END) AS pending,
      SUM(CASE WHEN completedAt IS NULL AND failedAt IS NULL AND availableAt <= ? THEN 1 ELSE 0 END) AS ready,
      SUM(CASE WHEN failedAt IS NOT NULL THEN 1 ELSE 0 END) AS failed,
      MIN(CASE WHEN completedAt IS NULL AND failedAt IS NULL THEN createdAt ELSE NULL END) AS oldest
      FROM CommunityEventNotificationJob`).get(now.getTime());
    return { database, communities, queue: { pending: queueRow.pending ?? 0, ready: queueRow.ready ?? 0, failed: queueRow.failed ?? 0, oldestPendingAt: isoDate(queueRow.oldest) } };
  } catch { return { database: { ok: false, issue: "DATABASE_READ_FAILED" }, communities: null, queue: null }; }
  finally { db?.close(); }
}
export async function pilotPreflight({ env = process.env, cwd = process.cwd(), production = false, now = new Date() } = {}) {
  const environment = checkEnvironment(env, production);
  let inspection;
  try {
    if (environment.errors.some(item => item.field === "DATABASE_URL")) throw new Error();
    const expected = await expectedMigrations(path.join(cwd, "prisma", "migrations"));
    inspection = await inspectPilotDatabase(sqliteFilePath(env.DATABASE_URL, path.join(cwd, "prisma")), expected, now);
  } catch { inspection = { database: { ok: false, issue: "DATABASE_OR_MIGRATIONS_UNAVAILABLE" }, communities: null, queue: null }; }
  let worker = null;
  if (inspection.queue) {
    try { worker = await readWorkerHealth(workerHealthDirectory(env, cwd), inspection.queue, now); }
    catch { worker = { ok: false, issues: ["WORKER_HEALTH_UNAVAILABLE"] }; }
  }
  const failed = environment.errors.length > 0 || !inspection.database.ok || !inspection.communities || inspection.communities.errors > 0 || !worker?.ok;
  const warned = environment.warnings.length > 0 || inspection.communities?.warnings > 0;
  return { schema: 1, mode: environment.mode, automatedStatus: failed ? "failed" : warned ? "warning" : "passed", releaseApproved: false,
    environment, database: inspection.database, communities: inspection.communities, worker,
    manualGates: MANUAL_PILOT_GATES.map(id => ({ id, status: "unverified" })) };
}
export const pilotExitCode = result => result.automatedStatus === "passed" ? 0 : result.automatedStatus === "warning" ? 2 : 1;
