import assert from "node:assert/strict";
import test from "node:test";
import { DatabaseSync } from "node:sqlite";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { snapshotSqlite, sqliteFilePath, sqliteFingerprint, rehearseSqliteRestore } from "../scripts/lib/sqlite-rehearsal.mjs";

test("SQLite geri yükleme: kaynak koruma, tam içerik ve yazma rollback", async t => {
  const directory = await mkdtemp(path.join(tmpdir(), "listekutusu-restore-"));
  const source = path.join(directory, "source.db"), backup = path.join(directory, "backup.db"), restored = path.join(directory, "restored.db");
  try {
    const db = new DatabaseSync(source);
    db.exec("CREATE TABLE Parent(id INTEGER PRIMARY KEY, title TEXT, data BLOB); CREATE TABLE Child(id INTEGER PRIMARY KEY, parentId INTEGER REFERENCES Parent(id)); CREATE INDEX title_idx ON Parent(title)");
    db.prepare("INSERT INTO Parent VALUES (?,?,?)").run(9007199254740993n, "Türkçe özel veri: ğüşİıöç", Buffer.from([0, 255, 42]));
    db.prepare("INSERT INTO Child VALUES (1,?)").run(9007199254740993n); db.close();
    const original = await readFile(source);
    await t.test("sade URL çözer; belirsiz/non-SQLite hedefi reddeder", () => {
      assert.equal(sqliteFilePath("file:./dev.db", directory), path.join(directory, "dev.db"));
      for (const url of ["", "file:", "postgres://secret", "file:db?mode=rw", "file:db#fragment"]) assert.throws(() => sqliteFilePath(url, directory));
    });
    await t.test("salt okunur snapshot kaynak baytlarını değiştirmez ve yok dosya yaratmaz", async () => {
      await snapshotSqlite(source, backup); assert.deepEqual(await readFile(source), original);
      assert.deepEqual(sqliteFingerprint(source), sqliteFingerprint(backup));
      await assert.rejects(snapshotSqlite(path.join(directory, "missing.db"), path.join(directory, "unused.db")));
      await assert.rejects(readFile(path.join(directory, "missing.db")));
    });
    await t.test("Unicode, BLOB ve büyük integer korunur; rollback kopyayı değiştirmez", async () => {
      const result = await rehearseSqliteRestore(backup, restored);
      assert.equal(result.contentEqual, true); assert.equal(result.writeRollback, true); assert.equal(result.rowCount, 2);
      assert.deepEqual(sqliteFingerprint(restored), sqliteFingerprint(source)); assert.deepEqual(await readFile(source), original);
    });
    await t.test("kaynak, yedek ve mevcut/boş hedef asla ezilmez", async () => {
      await assert.rejects(rehearseSqliteRestore(backup, backup)); await assert.rejects(rehearseSqliteRestore(backup, source));
      await assert.rejects(snapshotSqlite(source, backup));
      const empty = path.join(directory, "empty.db"); await writeFile(empty, "");
      await assert.rejects(snapshotSqlite(source, empty)); await assert.rejects(rehearseSqliteRestore(backup, empty));
      assert.equal((await readFile(empty)).length, 0); assert.deepEqual(await readFile(source), original);
    });
    await t.test("aynı sayıda değiştirilmiş içerik ve şema parmak izinde ayrılır", () => {
      const changed = new DatabaseSync(restored); changed.exec("UPDATE Parent SET title='değişen veri'"); changed.close();
      const before = sqliteFingerprint(backup), after = sqliteFingerprint(restored);
      assert.equal(before.tables[1].rows, after.tables[1].rows); assert.notDeepEqual(before.tables, after.tables);
      const schema = new DatabaseSync(restored); schema.exec("CREATE INDEX extra_idx ON Child(parentId)"); schema.close();
      assert.notEqual(before.schemaHash, sqliteFingerprint(restored).schemaHash);
    });
    await t.test("foreign key ihlali ve bozuk dosya sağlıklı kabul edilmez", async () => {
      const broken = new DatabaseSync(restored); broken.exec("PRAGMA foreign_keys=OFF; INSERT INTO Child VALUES(2,123)"); broken.close();
      assert.throws(() => sqliteFingerprint(restored), /foreign key/);
      const invalid = path.join(directory, "invalid.db"); await writeFile(invalid, "not sqlite");
      await assert.rejects(rehearseSqliteRestore(invalid, path.join(directory, "bad-copy.db")));
    });
    await t.test("WAL içindeki commit snapshot'a girer; ham ana dosya kopyasına dayanmaz", async () => {
      const walFile = path.join(directory, "wal.db"), snapshot = path.join(directory, "wal-snapshot.db");
      const wal = new DatabaseSync(walFile);
      try {
        wal.exec("PRAGMA journal_mode=WAL; PRAGMA wal_autocheckpoint=0; CREATE TABLE Sample(id INTEGER PRIMARY KEY, value TEXT); INSERT INTO Sample VALUES(1,'WAL içeriği')");
        await snapshotSqlite(walFile, snapshot);
        assert.deepEqual(sqliteFingerprint(walFile), sqliteFingerprint(snapshot));
        assert.equal(sqliteFingerprint(snapshot).tables[0].rows, 1);
      } finally { wal.close(); }
    });
    await t.test("CLI şeması farklı sağlam yedeği uygulamaya uyumlu saymaz", async () => {
      const result = spawnSync(process.execPath, ["--env-file=.env", "scripts/rehearse-database-restore.mjs", "--backup", backup], { cwd: fileURLToPath(new URL("../", import.meta.url)), encoding: "utf8", timeout: 30_000, windowsHide: true });
      assert.equal(result.status, 1); const output = JSON.parse(result.stdout);
      assert.equal(output.contentEqual, true); assert.equal(output.compatibleSchema, false); assert.equal(output.liveReplaced, false);
      assert.deepEqual(await readFile(source), original);
    });
  } finally { await rm(directory, { recursive: true, force: true }); }
});
