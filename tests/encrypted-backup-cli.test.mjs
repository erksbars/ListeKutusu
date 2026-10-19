import assert from "node:assert/strict";
import test from "node:test";
import { DatabaseSync } from "node:sqlite";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { tmpdir } from "node:os";
import { encryptBackup } from "../scripts/lib/encrypted-backup.mjs";

test("şifreli yedek CLI: doğrulanan güncel şema, eski şemada ret ve kaynağı koruma", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "lk-encrypted-cli-")), phrase = randomBytes(32).toString("hex");
  const command = file => spawnSync(process.execPath, ["--disable-warning=ExperimentalWarning", "scripts/verify-encrypted-backup.mjs", "--backup", file], { encoding: "utf8", windowsHide: true, timeout: 30_000, env: { ...process.env, BACKUP_PASSPHRASE: phrase } });
  try {
    const source = path.join(directory, "current.db"), encrypted = path.join(directory, "current.lkbackup");
    const db = new DatabaseSync(source);
    try {
      const migrations = new URL("../prisma/migrations/", import.meta.url);
      for (const name of (await readdir(migrations, { withFileTypes: true })).filter(item => item.isDirectory()).map(item => item.name).sort()) db.exec(await readFile(new URL(`${name}/migration.sql`, migrations), "utf8"));
    } finally { db.close(); }
    const before = await readFile(source); await encryptBackup(source, encrypted, phrase);
    const result = command(encrypted); assert.equal(result.status, 0);
    assert.equal(JSON.parse(result.stdout).compatibleSchema, true); assert.equal(JSON.parse(result.stdout).liveReplaced, false);
    assert.equal(result.stdout.includes(phrase), false); assert.deepEqual(await readFile(source), before);
    const old = path.join(directory, "old.db"), oldEncrypted = path.join(directory, "old.lkbackup");
    const oldDb = new DatabaseSync(old); oldDb.exec("CREATE TABLE old(id INTEGER PRIMARY KEY)"); oldDb.close();
    await encryptBackup(old, oldEncrypted, phrase);
    const rejected = command(oldEncrypted); assert.equal(rejected.status, 1); assert.equal(JSON.parse(rejected.stdout).compatibleSchema, false);
    const wrong = spawnSync(process.execPath, ["scripts/encrypted-database-backup.mjs"], { encoding: "utf8", windowsHide: true, env: { ...process.env, BACKUP_PASSPHRASE: "", DATABASE_URL: "file:private-source-never-opened.db" } });
    assert.equal(wrong.status, 1); assert.equal(wrong.stderr.includes("private-source"), false);
  } finally { await rm(directory, { recursive: true, force: true }); }
});
