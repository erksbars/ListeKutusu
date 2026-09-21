import { prisma } from "../db.ts";
import {
  BACKGAMMON_CODE,
} from "./backgammon.ts";
import { isRoomStale, WAITING_ROOM_LIFETIME_MS } from "./room.ts";

const ROOM_CLEANUP_INTERVAL_MS = 20_000;
let lastRoomCleanupAt = 0;

export async function abandonExpiredWaitingRoom(id: string, now = new Date()) {
  const expiredBefore = new Date(now.getTime() - WAITING_ROOM_LIFETIME_MS);
  const result = await prisma.gameSession.updateMany({
    where: { id, status: "waiting", updatedAt: { lte: expiredBefore } },
    data: { status: "abandoned", revision: { increment: 1 }, completedAt: now },
  });
  return result.count === 1;
}

export async function abandonExpiredGameRoom(id: string, gameCode: string, now = new Date()) {
  const session = await prisma.gameSession.findFirst({
    where: { id, gameCode, status: { in: ["waiting", "active"] } },
    select: { status: true, revision: true, updatedAt: true },
  });
  if (!session || !isRoomStale(session.status as "waiting" | "active", session.updatedAt, now)) return false;
  const result = await prisma.gameSession.updateMany({
    where: { id, gameCode, status: session.status, revision: session.revision },
    data: { status: "abandoned", revision: { increment: 1 }, completedAt: now },
  });
  return result.count === 1;
}

export async function cleanupStaleGameRooms(now = new Date()) {
  if (now.getTime() - lastRoomCleanupAt < ROOM_CLEANUP_INTERVAL_MS) return;
  lastRoomCleanupAt = now.getTime();
  const waitingBefore = new Date(now.getTime() - WAITING_ROOM_LIFETIME_MS);
  const inactiveGameBefore = new Date(now.getTime() - 30 * 60_000);
  await Promise.all([
    prisma.gameSession.updateMany({
      where: { status: "waiting", updatedAt: { lte: waitingBefore } },
      data: { status: "abandoned", revision: { increment: 1 }, completedAt: now },
    }),
    prisma.gameSession.updateMany({
      where: {
        gameCode: { not: BACKGAMMON_CODE },
        status: "active",
        updatedAt: { lte: inactiveGameBefore },
      },
      data: { status: "abandoned", revision: { increment: 1 }, completedAt: now },
    }),
  ]);
}
