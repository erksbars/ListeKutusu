import { PrismaClient } from "@prisma/client";
import { cleanupStaleGameRooms } from "../lib/games/backgammonRoom.ts";

const prisma = new PrismaClient();
const now = new Date();
const readNotificationCutoff = new Date(now.getTime() - 180 * 86_400_000);
const completedEventJobCutoff = new Date(now.getTime() - 30 * 86_400_000);

try {
  await cleanupStaleGameRooms(now);
  const [sessions, notifications, eventJobs, offers] = await prisma.$transaction([
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
    prisma.communityEventNotificationJob.deleteMany({ where: { completedAt: { not: null, lte: completedEventJobCutoff } } }),
    prisma.communityOwnershipOffer.deleteMany({ where: { expiresAt: { lte: now } } }),
  ]);

  console.log(`Bakim tamamlandi: ${sessions.count} oturum, ${notifications.count} eski bildirim, ${eventJobs.count} tamamlanmis etkinlik isi ve ${offers.count} eski sahiplik teklifi temizlendi; oyun zaman asimlari islendi.`);
} finally {
  await prisma.$disconnect();
}
