import { mkdtemp, mkdir, rm } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { performance } from "node:perf_hooks";
import { rehearseSqliteRestore, snapshotSqlite, sqliteFilePath } from "./lib/sqlite-rehearsal.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const args = process.argv.slice(2);
if (args.length && (args.length !== 2 || args[0] !== "--backup")) throw new Error("Argümansız veya --backup <dosya> ile kullan.");
let temporary;
try {
  await mkdir(path.join(root, "tmp"), { recursive: true, mode: 0o700 });
  temporary = await mkdtemp(path.join(root, "tmp", "restore-rehearsal-"));
  const started = performance.now();
  let backup = args.length ? path.resolve(args[1]) : null;
  if (!backup) {
    await mkdir(path.join(root, "backups"), { recursive: true, mode: 0o700 });
    backup = path.join(root, "backups", `rehearsal-${randomUUID()}.db`);
    await snapshotSqlite(sqliteFilePath(process.env.DATABASE_URL, path.join(root, "prisma")), backup);
  }
  const restored = path.join(temporary, "restored.db");
  const result = await rehearseSqliteRestore(backup, restored);
  const diff = spawnSync(process.execPath, [path.join(root, "node_modules/prisma/build/index.js"), "migrate", "diff", "--from-url", `file:${restored.replaceAll("\\", "/")}`, "--to-schema-datamodel", path.join(root, "prisma/schema.prisma"), "--exit-code"], { cwd: root, env: process.env, encoding: "utf8", timeout: 30_000, windowsHide: true });
  const compatibleSchema = !diff.error && diff.status === 0;
  console.log(JSON.stringify({ ...result, compatibleSchema, elapsedMs: Math.round(performance.now() - started), backup: path.relative(root, backup), liveReplaced: false }));
  if (!compatibleSchema) process.exitCode = 1;
} catch {
  console.error("Geri yükleme provası başarısız. Kaynak/yedek ve şema uyumunu incele; canlı veritabanının üzerine yazılmadı."); process.exitCode = 1;
} finally {
  // Only this invocation's mkdtemp output is removed; source and backups are retained.
  if (temporary) await rm(temporary, { recursive: true, force: true });
}
