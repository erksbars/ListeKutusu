import { readdir } from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const backupDirectory = path.resolve("backups");
const backups = (await readdir(backupDirectory, { withFileTypes: true }))
  .filter((entry) => entry.isFile() && /^playlist-.*\.db$/.test(entry.name))
  .map((entry) => entry.name)
  .sort()
  .reverse();

if (!backups.length) throw new Error("Dogrulanacak veritabani yedegi bulunamadi.");

const backupPath = path.join(backupDirectory, backups[0]);
const datasourceUrl = `file:${backupPath.replaceAll("\\", "/")}`;
const prisma = new PrismaClient({ datasources: { db: { url: datasourceUrl } } });

try {
  const integrityRows = await prisma.$queryRawUnsafe("PRAGMA integrity_check");
  const integrityValue = integrityRows?.[0]?.integrity_check;
  if (integrityValue !== "ok") {
    throw new Error(`SQLite butunluk kontrolu basarisiz: ${String(integrityValue)}`);
  }
  const accountCount = await prisma.userList.count();
  const postCount = await prisma.feedPost.count();
  console.log(`Yedek geri okuma testi basarili: ${backupPath}`);
  console.log(`Kayit ozeti: ${accountCount} hesap, ${postCount} akis paylasimi.`);
} finally {
  await prisma.$disconnect();
}
