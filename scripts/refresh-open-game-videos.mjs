import { PrismaClient } from "@prisma/client";
import { resolveGameEntryVideos } from "../lib/youtube.ts";

const prisma = new PrismaClient();

try {
  const entries = await prisma.gameEntry.findMany({
    where: { session: { status: { in: ["waiting", "active"] }, gameVersion: { gte: 5 } } },
    select: { id: true },
  });
  await resolveGameEntryVideos(prisma, entries.map((entry) => entry.id), { force: true });
  console.log(`${entries.length} acik oyun videosu yeniden dogrulandi.`);
} finally {
  await prisma.$disconnect();
}
