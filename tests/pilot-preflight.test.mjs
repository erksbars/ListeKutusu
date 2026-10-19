import assert from "node:assert/strict";
import test from "node:test";
import { DatabaseSync } from "node:sqlite";
import { copyFile, mkdtemp, mkdir, readFile, readdir, rm, stat } from "node:fs/promises";
import { PrismaClient } from "@prisma/client";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { createWorkerHeartbeat, workerHealthDirectory } from "../scripts/lib/event-worker-health.mjs";
import { expectedMigrations, inspectPilotDatabase, pilotExitCode, pilotPreflight, MANUAL_PILOT_GATES } from "../scripts/lib/pilot-preflight.mjs";
const root = fileURLToPath(new URL("../", import.meta.url));
const hash = async file => createHash("sha256").update(await readFile(file)).digest("hex");

test("pilot ön kontrolü salt okunur, fail-closed ve yayın onayından ayrıdır", async t => {
  const directory = await mkdtemp(path.join(tmpdir(), "listekutusu-pilot-")), file = path.join(directory, "test.db");
  const expected = await expectedMigrations(path.join(root, "prisma", "migrations"));
  const db = new DatabaseSync(file);
  try {
    for (const item of expected) db.exec(await readFile(path.join(root, "prisma", "migrations", item.name, "migration.sql"), "utf8"));
    db.exec('CREATE TABLE "_prisma_migrations" (migration_name TEXT, checksum TEXT, finished_at DATETIME, rolled_back_at DATETIME)');
    const insert = db.prepare('INSERT INTO "_prisma_migrations" VALUES (?, ?, 1, NULL)'); for (const item of expected) insert.run(item.name, item.checksum);
    await t.test("bütünlük, FK ve tam migration history/checksum; tüm okumalar veriyi korur", async () => {
      const before = await hash(file), result = await inspectPilotDatabase(file, expected);
      assert.equal(result.database.ok, true); assert.equal(result.database.migrations.applied, expected.length); assert.equal(result.communities.status, "ok"); assert.equal(result.communities.checks.length, 12); assert.equal(result.queue.pending, 0);
      assert.equal(await hash(file), before);
    });
    await t.test("eksik/fazla/yarım/değişmiş migration otomatik uygulanmaz", async () => {
      for (const sql of ["UPDATE _prisma_migrations SET checksum='changed' WHERE rowid=1", "UPDATE _prisma_migrations SET finished_at=NULL WHERE rowid=1", "UPDATE _prisma_migrations SET rolled_back_at=1 WHERE rowid=1", "UPDATE _prisma_migrations SET migration_name='unexpected' WHERE rowid=1"]) {
        db.exec(sql); const before = await hash(file), result = await inspectPilotDatabase(file, expected);
        assert.equal(result.database.ok, false); assert.equal(result.communities, null); assert.equal(result.queue, null); assert.equal(await hash(file), before);
        db.prepare("UPDATE _prisma_migrations SET migration_name=?, checksum=?, finished_at=1, rolled_back_at=NULL WHERE rowid=1").run(expected[0].name, expected[0].checksum);
      }
      assert.equal((await inspectPilotDatabase(file, [])).database.ok, false);
      insert.run(expected[0].name, expected[0].checksum); assert.equal((await inspectPilotDatabase(file, expected)).database.migrations.duplicates, 1); assert.equal((await inspectPilotDatabase(file, expected)).database.ok, false); db.prepare("DELETE FROM _prisma_migrations WHERE rowid > ?").run(expected.length);
    });
    await t.test("FK ihlali ve eksik tablo açık hata; ham SQL/path sızmaz", async () => {
      db.exec("PRAGMA foreign_keys=OFF; INSERT INTO CommunityPostSave (userId, postId) VALUES ('missing-user', 'missing-post')");
      const result = await inspectPilotDatabase(file, expected); assert.equal(result.database.ok, false); assert.equal(result.database.foreignKeys, false);
      db.exec("DELETE FROM CommunityPostSave");
      const wrong = path.join(directory, "private-file-name.db"), empty = new DatabaseSync(wrong); empty.close();
      const failure = await inspectPilotDatabase(wrong, expected); assert.equal(failure.database.ok, false); assert.ok(!JSON.stringify(failure).includes(wrong));
    });
    await t.test("bulunmayan DB yaratılmaz; hata mesajı hedefi açıklamaz", async () => {
      const missing = path.join(directory, "private-missing.db"), result = await inspectPilotDatabase(missing, expected);
      assert.equal(result.database.ok, false); await assert.rejects(stat(missing), { code: "ENOENT" }); assert.ok(!JSON.stringify(result).includes(missing));
    });
    await t.test("gerçek yerel rapor işçi yokken yeşil olamaz; başarı bile manuel onay değildir", async () => {
      await mkdir(path.join(directory, "prisma", "migrations"), { recursive: true });
      for (const item of expected) { const target = path.join(directory, "prisma", "migrations", item.name); await mkdir(target); await copyFile(path.join(root, "prisma", "migrations", item.name, "migration.sql"), path.join(target, "migration.sql")); }
      const env = { DATABASE_URL: `file:${file.replaceAll("\\", "/")}`, SESSION_SECRET: "test-only-private-pilot-secret-value-32-chars", ADMIN_LOGIN_KEY: "different-private-owner-key-42", SPOTIFY_CLIENT_ID: "configured-id", SPOTIFY_CLIENT_SECRET: "configured-secret", APP_URL: "http://127.0.0.1:3000", SPOTIFY_REDIRECT_URI: "http://127.0.0.1:3000/api/auth/callback" };
      const result = await pilotPreflight({ cwd: directory, env }); assert.equal(result.database.ok, true); assert.equal(result.automatedStatus, "failed"); assert.equal(pilotExitCode(result), 1); assert.equal(result.releaseApproved, false); assert.ok(result.worker.issues.includes("WORKER_MISSING_OR_STALE"));
      assert.equal(result.manualGates.length, MANUAL_PILOT_GATES.length); assert.ok(result.manualGates.every(item => item.status === "unverified"));
      const healthDir = workerHealthDirectory(env, directory), heartbeat = await createWorkerHeartbeat(healthDir); await heartbeat.success();
      try {
        const passing = await pilotPreflight({ cwd: directory, env }); assert.equal(passing.automatedStatus, "passed"); assert.equal(passing.releaseApproved, false); assert.ok(passing.manualGates.every(item => item.status === "unverified"));
        const production = await pilotPreflight({ cwd: directory, env, production: true }); assert.equal(production.automatedStatus, "failed"); assert.equal(production.releaseApproved, false);
      }
      finally { await heartbeat.close(); }
      assert.equal(pilotExitCode({ automatedStatus: "warning" }), 2); assert.equal(pilotExitCode({ automatedStatus: "passed" }), 0);
      assert.equal(pilotExitCode({ automatedStatus: "unknown" }), 1);
      for (const marker of [env.SESSION_SECRET, env.ADMIN_LOGIN_KEY, env.SPOTIFY_CLIENT_SECRET, file]) assert.ok(!JSON.stringify(result).includes(marker));
    });
    await t.test("gerçek kuyruk tarih bağlama ve geciken iş raporu salt okunurdur", async () => {
      const prisma = new PrismaClient({ datasources: { db: { url: `file:${file.replaceAll("\\", "/")}` } } });
      try {
        const user = await prisma.userList.create({ data: { ownerName: "Test operatörü", slug: "test-operator" } });
        const community = await prisma.community.create({ data: { ownerId: user.id, name: "Test", slug: "test", category: "interest", description: "Test açıklaması", rules: "Sentetik test" } });
        await prisma.communityMember.create({ data: { communityId: community.id, userId: user.id, role: "owner" } });
        const event = await prisma.communityEvent.create({ data: { communityId: community.id, organizerId: user.id, title: "Test", description: "Sentetik etkinlik", startsAt: new Date(Date.now() + 86400000), city: "Test", venue: "Test alanı" } });
        const old = new Date(Date.now() - 600000);
        await prisma.communityEventNotificationJob.create({ data: { id: "private-test-job", eventId: event.id, actorId: user.id, version: 1, type: "community_event_updated", createdAt: old, availableAt: old } });
        const before = await hash(file), result = await inspectPilotDatabase(file, expected);
        assert.equal(result.queue.pending, 1); assert.equal(result.queue.ready, 1); assert.equal(result.queue.oldestPendingAt, old.toISOString()); assert.equal(result.communities.checks.find(item => item.key === "old-pending-job").count, 1); assert.equal(await hash(file), before);
      } finally { await prisma.$disconnect(); }
    });
    assert.equal((await readdir(directory)).includes("test.db"), true);
  } finally { db.close(); await rm(directory, { recursive: true, force: true }); }
});

test("pilot CLI yalnız read-only seçenekleri kabul eder, hatada değer yazdırmaz", () => {
  for (const args of [["--once"], ["--json", "--json"], ["--database=PRIVATE_DB_MARKER"], ["--retry-failed"]]) {
    const result = spawnSync(process.execPath, ["--disable-warning=ExperimentalWarning", "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON", "--experimental-strip-types", "scripts/check-pilot.mjs", ...args], { cwd: root, encoding: "utf8", timeout: 5000 });
    assert.equal(result.status, 1); assert.ok(!`${result.stdout}${result.stderr}`.includes("PRIVATE_DB_MARKER")); assert.ok(result.stderr.includes("Yalnız"));
  }
});
