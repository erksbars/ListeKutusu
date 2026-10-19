import { mkdir, mkdtemp, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { probeSqliteLoad } from "./lib/sqlite-load-probe.mjs";

if (process.argv.length !== 2) throw new Error("Bu sınırlı prova argüman veya veritabanı hedefi kabul etmez.");
const root = fileURLToPath(new URL("../", import.meta.url));
let temporary;
try {
  await mkdir(path.join(root, "tmp"), { recursive: true, mode: 0o700 });
  temporary = await mkdtemp(path.join(root, "tmp", "sqlite-load-"));
  const result = await probeSqliteLoad(temporary, new URL("../prisma/migrations/", import.meta.url));
  console.log(JSON.stringify(result)); if (!result.ok) process.exitCode = 1;
} catch { console.error("Sentetik SQLite provası başarısız; canlı veritabanı hedeflenmedi."); process.exitCode = 1; }
finally { if (temporary) await rm(temporary, { recursive: true, force: true }); }
