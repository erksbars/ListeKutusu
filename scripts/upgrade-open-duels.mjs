import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function shuffle(items) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}

function createState(entryIds) {
  return {
    format: "single-elimination",
    rounds: [{
      number: 1,
      matchups: Array.from({ length: 4 }, (_, index) => ({
        number: index + 1,
        entryAId: entryIds[index * 2],
        entryBId: entryIds[index * 2 + 1],
        winnerEntryId: null,
      })),
    }],
    currentRound: 1,
    completed: false,
    winnerEntryId: null,
  };
}

const sessions = await prisma.gameSession.findMany({
  where: { gameCode: "song-elimination", gameVersion: { in: [3, 4] }, status: "active" },
  include: { entries: true, players: { include: { votes: { select: { id: true } } } } },
});

let upgraded = 0;
for (const session of sessions) {
  if (session.entries.length !== 8 || session.players.length !== 2 || session.players.some((player) => player.votes.length > 0)) continue;
  const state = createState(shuffle(session.entries.map((entry) => entry.id)));
  await prisma.$transaction([
    prisma.gamePlayer.updateMany({ where: { sessionId: session.id }, data: { state: JSON.stringify(state), status: "ready" } }),
    prisma.gameSession.update({ where: { id: session.id }, data: { gameVersion: 5, maxPlayers: 2, visibility: "public", state: JSON.stringify(state), currentRound: 1 } }),
  ]);
  upgraded += 1;
}

console.log(`${upgraded} açık düello ortak havuz kuralına yükseltildi.`);
await prisma.$disconnect();
