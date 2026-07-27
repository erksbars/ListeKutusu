import { mkdir, open, readdir, rm, stat } from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const databaseUrl = process.env.DATABASE_URL || "";
if (!databaseUrl.startsWith("file:")) {
  throw new Error("db:backup yalnizca SQLite file: DATABASE_URL ile kullanilabilir.");
}

const backupDirectory = path.resolve("backups");
await mkdir(backupDirectory, { recursive: true });

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupPath = path.join(backupDirectory, `playlist-${timestamp}.db`);
const escapedBackupPath = backupPath.replaceAll("'", "''").replaceAll("\\", "/");
const prisma = new PrismaClient();

try {
  await prisma.$executeRawUnsafe(`VACUUM INTO '${escapedBackupPath}'`);

  const backupStat = await stat(backupPath);
  const handle = await open(backupPath, "r");
  const signature = Buffer.alloc(16);
  try {
    await handle.read(signature, 0, signature.length, 0);
  } finally {
    await handle.close();
  }
  if (backupStat.size < 4096 || signature.toString("utf8") !== "SQLite format 3\u0000") {
    await rm(backupPath, { force: true });
    throw new Error("Olusturulan yedek gecerli bir SQLite veritabani degil.");
  }

  const backups = (await readdir(backupDirectory, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && /^playlist-.*\.db$/.test(entry.name))
    .map((entry) => entry.name)
    .sort()
    .reverse();

  for (const oldBackup of backups.slice(20)) {
    await rm(path.join(backupDirectory, oldBackup));
  }

  console.log(`Veritabani yedegi dogrulandi: ${backupPath} (${backupStat.size} bayt)`);
} finally {
  await prisma.$disconnect();
}
