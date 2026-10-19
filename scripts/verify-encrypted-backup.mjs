import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { decryptBackup, validateBackupPassphrase } from "./lib/encrypted-backup.mjs";
import { sqliteFingerprint } from "./lib/sqlite-rehearsal.mjs";
import { createRehearsalDirectory, removeRehearsalDirectory } from "./lib/http-rehearsal-isolation.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
let temporary;
try {
  const args = process.argv.slice(2);
  if (args.length !== 2 || args[0] !== "--backup" || !args[1]) throw new Error();
  validateBackupPassphrase(process.env.BACKUP_PASSPHRASE);
  temporary = await createRehearsalDirectory(root);
  const restored = path.join(temporary, "verified.db");
  await decryptBackup(path.resolve(args[1]), restored, process.env.BACKUP_PASSPHRASE);
  const state = sqliteFingerprint(restored);
  const diff = spawnSync(process.execPath, [path.join(root, "node_modules/prisma/build/index.js"), "migrate", "diff", "--from-url", `file:${restored.replaceAll("\\", "/")}`, "--to-schema-datamodel", path.join(root, "prisma/schema.prisma"), "--exit-code"], { cwd: root, env: process.env, encoding: "utf8", timeout: 30_000, windowsHide: true });
  const compatibleSchema = !diff.error && diff.status === 0;
  console.log(JSON.stringify({ ok: compatibleSchema, authenticated: true, integrity: true, foreignKeys: true, compatibleSchema, tableCount: state.tables.length, liveReplaced: false }));
  if (!compatibleSchema) process.exitCode = 1;
} catch {
  console.error("Şifreli yedek doğrulanamadı. --backup <dosya>, parola, dosya bütünlüğü ve izinleri incele; canlı DB değiştirilmedi."); process.exitCode = 1;
} finally { if (temporary) await removeRehearsalDirectory(temporary, root); }
