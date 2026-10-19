import { DatabaseSync } from "node:sqlite";
import { createHash, randomUUID } from "node:crypto";
import { constants } from "node:fs";
import { copyFile, lstat, realpath } from "node:fs/promises";
import path from "node:path";

const quote = name => `"${name.replaceAll('"', '""')}"`;
const encode = value => JSON.stringify(value, (_, item) => typeof item === "bigint" ? { integer: item.toString() } : item instanceof Uint8Array ? { blob: Buffer.from(item).toString("hex") } : item);
export function sqliteFilePath(url, schemaDirectory) {
  if (typeof url !== "string" || !url.startsWith("file:") || !url.slice(5) || /[?#\u0000]/.test(url)) throw new Error("Yalnız sade SQLite file: URL desteklenir.");
  return path.resolve(schemaDirectory, url.slice(5));
}
async function absent(target) {
  try { await lstat(target); } catch (error) { if (error.code === "ENOENT") return; throw error; }
  throw new Error("Hedef zaten var; üzerine yazılmaz.");
}
export async function snapshotSqlite(source, target) {
  const input = await realpath(source); await absent(target);
  const db = new DatabaseSync(input, { readOnly: true });
  try { db.exec("PRAGMA busy_timeout=5000"); db.exec(`VACUUM INTO '${path.resolve(target).replaceAll("\\", "/").replaceAll("'", "''")}'`); }
  finally { db.close(); }
}
export function sqliteFingerprint(file) {
  const db = new DatabaseSync(file, { readOnly: true });
  try {
    db.exec("PRAGMA query_only=ON; BEGIN");
    const integrity = db.prepare("PRAGMA integrity_check").all();
    if (integrity.length !== 1 || integrity[0].integrity_check !== "ok") throw new Error("SQLite bütünlük kontrolü başarısız.");
    if (db.prepare("PRAGMA foreign_key_check").get()) throw new Error("SQLite foreign key kontrolü başarısız.");
    const schema = db.prepare("SELECT type,name,tbl_name,sql FROM sqlite_schema WHERE name NOT LIKE 'sqlite_%' ORDER BY type,name").all();
    const schemaHash = createHash("sha256").update(encode(schema)).digest("hex");
    const tables = [];
    for (const { name } of db.prepare("SELECT name FROM sqlite_schema WHERE type='table' AND (name NOT LIKE 'sqlite_%' OR name='sqlite_sequence') ORDER BY name").all()) {
      const columns = db.prepare(`PRAGMA table_xinfo(${quote(name)})`).all().map(column => column.name);
      const statement = db.prepare(`SELECT ${columns.map(quote).join(",")} FROM ${quote(name)} ORDER BY ${columns.map(quote).join(",")}`); statement.setReadBigInts(true);
      const hash = createHash("sha256"); let rows = 0;
      for (const row of statement.iterate()) { hash.update(encode(row)); hash.update("\n"); rows++; }
      tables.push({ name, rows, hash: hash.digest("hex") });
    }
    db.exec("ROLLBACK"); return { schemaHash, tables };
  } finally { db.close(); }
}
export async function rehearseSqliteRestore(backup, restored) {
  const input = await realpath(backup); await absent(restored);
  const before = sqliteFingerprint(input);
  await copyFile(input, restored, constants.COPYFILE_EXCL);
  const copied = sqliteFingerprint(restored);
  if (encode(before) !== encode(copied)) throw new Error("Geri yükleme içerik karşılaştırması başarısız.");
  const probe = `restore_probe_${randomUUID().replaceAll("-", "")}`;
  const db = new DatabaseSync(restored);
  try { db.exec(`BEGIN IMMEDIATE; CREATE TABLE ${quote(probe)} (id INTEGER PRIMARY KEY, value TEXT); INSERT INTO ${quote(probe)} VALUES (1, 'rollback probe'); ROLLBACK`); }
  finally { db.close(); }
  const after = sqliteFingerprint(restored);
  if (encode(before) !== encode(after)) throw new Error("Yazma/rollback sonrası içerik değişti.");
  return { integrity: "ok", foreignKeys: "ok", contentEqual: true, writeRollback: true, tableCount: before.tables.length, rowCount: before.tables.reduce((sum, table) => sum + table.rows, 0) };
}
