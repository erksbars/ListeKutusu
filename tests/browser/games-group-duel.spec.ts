import { expect, test } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { createEliminationState } from "../../lib/games/elimination";

const prisma = new PrismaClient();
const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000";

function accountPayload(index: number, runId: string) {
  return {
    ownerName: `Düello Oyuncu ${index}`,
    playlistName: `Düello ${index}`,
    email: `group-duel-${index}-${runId}@example.test`,
    password: "Test-Password-42",
  };
}

test("dört masaüstü oturumu aynı Şarkı Düellosunu kilitli aşamalarla tamamlar", async ({ browser }) => {
  test.setTimeout(90_000);
  const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const contexts = await Promise.all(Array.from({ length: 4 }, (_, index) => browser.newContext({
    baseURL,
    viewport: { width: 1280, height: 900 },
    colorScheme: "dark",
    extraHTTPHeaders: { "x-forwarded-for": `198.51.100.${index + 10}` },
  })));
  const createdUserIds: string[] = [];

  try {
    const accounts = [];
    for (let index = 0; index < contexts.length; index += 1) {
      const response = await contexts[index].request.post("/api/accounts", {
        data: accountPayload(index + 1, runId),
        headers: { Origin: baseURL, Referer: `${baseURL}/account` },
      });
      expect(response.ok(), `${index + 1}. hesap oluşturulamadı`).toBeTruthy();
      const sessionToken = /account_session=([^;]+)/u.exec(response.headers()["set-cookie"] ?? "")?.[1];
      expect(sessionToken, `${index + 1}. hesap oturum çerezi üretilmedi`).toBeTruthy();
      await contexts[index].addCookies([{ name: "account_session", value: sessionToken!, url: baseURL }]);
      const account = (await response.json()).list;
      accounts.push(account);
      createdUserIds.push(account.id);
    }

    const session = await prisma.gameSession.create({
      data: {
        gameCode: "song-elimination",
        gameVersion: 5,
        ownerId: accounts[0].id,
        status: "waiting",
        visibility: "public",
        targetSize: 16,
        maxPlayers: 4,
        currentRound: 1,
        state: "{}",
      },
    });
    const entryIds: string[] = [];
    for (let playerIndex = 0; playerIndex < accounts.length; playerIndex += 1) {
      const player = await prisma.gamePlayer.create({
        data: { sessionId: session.id, userId: accounts[playerIndex].id, seat: playerIndex + 1, state: "{}" },
      });
      for (let trackIndex = 0; trackIndex < 4; trackIndex += 1) {
        const seed = playerIndex * 4 + trackIndex + 1;
        const entry = await prisma.gameEntry.create({
          data: {
            sessionId: session.id,
            submittedByPlayerId: player.id,
            trackId: `group-duel-${runId}-${seed}`,
            trackName: `Test Parçası ${seed}`,
            artistName: `Test Sanatçı ${playerIndex + 1}`,
            externalUrl: null,
            youtubeVideoId: null,
            seed,
          },
        });
        entryIds.push(entry.id);
      }
    }
    const initialState = createEliminationState(entryIds);
    await prisma.$transaction([
      prisma.gamePlayer.updateMany({
        where: { sessionId: session.id },
        data: { state: JSON.stringify(initialState), status: "ready" },
      }),
      prisma.gameSession.update({
        where: { id: session.id },
        data: {
          state: JSON.stringify(initialState),
          status: "active",
          startedAt: new Date(),
          revision: { increment: 1 },
        },
      }),
    ]);

    const pages = await Promise.all(contexts.map((context) => context.newPage()));
    await Promise.all(pages.map((page) => page.goto(`/games/elimination/${session.id}`)));
    await Promise.all(pages.map((page) => expect(page.locator(".game-play-area")).toBeVisible({ timeout: 10_000 })));
    await Promise.all(pages.map((page) => expect(page.locator(".game-duel-player-grid")).toContainText("Düello Oyuncu 4")));

    let completedDecisions = 0;
    while (completedDecisions < 15) {
      const baselineResponse = await contexts[0].request.get(`/api/games/elimination/${session.id}`);
      expect(baselineResponse.ok()).toBeTruthy();
      const baseline = (await baselineResponse.json()).session;
      expect(baseline.status).toBe("active");
      const round = baseline.bracket.rounds.find((item: { number: number }) => item.number === baseline.bracket.currentRound);
      const matchup = round.matchups.find((item: { winnerEntryId: string | null }) => !item.winnerEntryId);
      expect(matchup).toBeTruthy();

      for (let playerIndex = 0; playerIndex < contexts.length; playerIndex += 1) {
        const voteResponse = await contexts[playerIndex].request.post(`/api/games/elimination/${session.id}/vote`, {
          data: { matchupNumber: matchup.number, selectedEntryId: matchup.entryAId },
          headers: { Origin: baseURL, Referer: `${baseURL}/games/elimination/${session.id}` },
        });
        const voteBody = await voteResponse.text();
        expect(
          voteResponse.ok(),
          `${playerIndex + 1}. oyuncunun ${completedDecisions + 1}. oyu kaydedilemedi: ${voteResponse.status()} ${voteBody}`
        ).toBeTruthy();
        const voted = JSON.parse(voteBody).session;
        if (playerIndex < contexts.length - 1) {
          expect(voted.status).toBe("active");
          expect(voted.bracket.currentRound).toBe(baseline.bracket.currentRound);
          expect(voted.viewerHasVotedCurrent).toBeTruthy();
          expect(voted.matchupVoteCount).toBe(playerIndex + 1);
        }
      }

      completedDecisions += 1;
      if (completedDecisions === 3) {
        await pages[1].close();
        pages[1] = await contexts[1].newPage();
        await pages[1].goto(`/games/elimination/${session.id}`);
        await expect(pages[1].locator(".game-play-area")).toBeVisible({ timeout: 10_000 });
      }
    }

    const finalViews = [];
    for (const context of contexts) {
      const response = await context.request.get(`/api/games/elimination/${session.id}`);
      expect(response.ok()).toBeTruthy();
      finalViews.push((await response.json()).session);
    }
    expect(new Set(finalViews.map((view) => view.winnerEntryId)).size).toBe(1);
    expect(finalViews.every((view) => view.status === "completed")).toBeTruthy();
    expect(finalViews.every((view) => view.players.every((player: { completed: boolean }) => player.completed))).toBeTruthy();
    await Promise.all(pages.map((page) => expect(page.locator(".game-group-result")).toBeVisible({ timeout: 10_000 })));

    const stale = await prisma.gameSession.create({
      data: {
        gameCode: "song-elimination",
        gameVersion: 5,
        ownerId: accounts[0].id,
        status: "waiting",
        visibility: "unlisted",
        targetSize: 8,
        maxPlayers: 2,
        currentRound: 1,
        state: "{}",
      },
    });
    await prisma.gamePlayer.create({ data: { sessionId: stale.id, userId: accounts[0].id, seat: 1, state: "{}" } });
    await prisma.gameSession.update({ where: { id: stale.id }, data: { updatedAt: new Date(Date.now() - 16 * 60_000) } });
    const staleResponse = await contexts[0].request.get(`/api/games/elimination/${stale.id}`);
    expect(staleResponse.ok()).toBeTruthy();
    expect((await staleResponse.json()).session.status).toBe("abandoned");
  } finally {
    await Promise.allSettled(contexts.map((context) => context.close()));
    if (createdUserIds.length) await prisma.userList.deleteMany({ where: { id: { in: createdUserIds } } });
  }
});

test.afterAll(async () => {
  await prisma.$disconnect();
});
