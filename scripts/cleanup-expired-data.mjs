import { PrismaClient } from "@prisma/client";
import { cleanupStaleGameRooms } from "../lib/games/backgammonRoom.ts";

const prisma = new PrismaClient();
const now = new Date();
const readNotificationCutoff = new Date(now.getTime() - 180 * 86_400_000);

try {
  await cleanupStaleGameRooms(now);
  const [sessions, notifications] = await prisma.$transaction([
    prisma.accountSession.deleteMany({
      where: {
        OR: [
          { expiresAt: { lte: now } },
          { revokedAt: { not: null } },
        ],
      },
    }),
    prisma.notification.deleteMany({
      where: {
        readAt: { not: null, lte: readNotificationCutoff },
      },
    }),
  ]);

  console.log(`Bakim tamamlandi: ${sessions.count} oturum ve ${notifications.count} eski bildirim temizlendi; oyun zaman asimlari islendi.`);
} finally {
  await prisma.$disconnect();
}
