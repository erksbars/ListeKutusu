import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { mkdir } from "node:fs/promises";
import { encryptBackup, decryptBackup, validateBackupPassphrase } from "./lib/encrypted-backup.mjs";
import { snapshotSqlite, sqliteFilePath, sqliteFingerprint } from "./lib/sqlite-rehearsal.mjs";
import { createRehearsalDirectory, removeRehearsalDirectory } from "./lib/http-rehearsal-isolation.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
let temporary;
try {
  if (process.argv.length !== 2) throw new Error("INVALID_BACKUP_ARGUMENTS");
  validateBackupPassphrase(process.env.BACKUP_PASSPHRASE);
  temporary = await createRehearsalDirectory(root);
  const snapshot = path.join(temporary, "snapshot.db"), restored = path.join(temporary, "verified.db");
  await snapshotSqlite(sqliteFilePath(process.env.DATABASE_URL, path.join(root, "prisma")), snapshot);
  const before = sqliteFingerprint(snapshot);
  const directory = path.join(root, "backups"); await mkdir(directory, { recursive: true, mode: 0o700 });
  const file = path.join(directory, `encrypted-${new Date().toISOString().replaceAll(/[:.]/g, "-")}-${randomUUID()}.lkbackup`);
  await encryptBackup(snapshot, file, process.env.BACKUP_PASSPHRASE);
  await decryptBackup(file, restored, process.env.BACKUP_PASSPHRASE);
  if (JSON.stringify(before) !== JSON.stringify(sqliteFingerprint(restored))) throw new Error("BACKUP_CONTENT_MISMATCH");
  console.log(JSON.stringify({ ok: true, file: path.basename(file), encrypted: true, verified: true, offHost: false, pruned: 0 }));
} catch {
  console.error("Şifreli yedek başarısız; parola, izinler ve DB bütünlüğünü incele. Var olan yedekler/canlı DB değiştirilmedi."); process.exitCode = 1;
} finally { if (temporary) await removeRehearsalDirectory(temporary, root); }
