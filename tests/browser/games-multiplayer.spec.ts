import { expect, test } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000";

function accountPayload(label: string, runId: string) {
  return {
    ownerName: `${label} ${runId.slice(-5)}`,
    playlistName: `${label} Seçkisi`,
    email: `game-${label.toLocaleLowerCase("tr-TR")}-${runId}@example.test`,
    password: "Test-Password-42",
  };
}

test("iki masaüstü kullanıcısı aynı Tavla odasında tıklama ve sürükle-bırak hamlelerini görür", async ({ browser }) => {
  test.setTimeout(45_000);
  const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const contextA = await browser.newContext({
    baseURL,
    viewport: { width: 1280, height: 900 },
    colorScheme: "dark",
    extraHTTPHeaders: { "x-forwarded-for": "198.51.100.21" },
  });
  const contextB = await browser.newContext({
    baseURL,
    viewport: { width: 1280, height: 900 },
    colorScheme: "dark",
    extraHTTPHeaders: { "x-forwarded-for": "198.51.100.22" },
  });
  const createdUserIds: string[] = [];

  try {
    const register = async (context: typeof contextA, label: string) => {
      const response = await context.request.post("/api/accounts", {
        data: accountPayload(label, runId),
        headers: { Origin: baseURL, Referer: `${baseURL}/account` },
      });
      expect(response.ok(), `${label} hesabı oluşturulamadı`).toBeTruthy();
      const sessionToken = /account_session=([^;]+)/u.exec(response.headers()["set-cookie"] ?? "")?.[1];
      expect(sessionToken, `${label} oturum çerezi üretilmedi`).toBeTruthy();
      await context.addCookies([{ name: "account_session", value: sessionToken!, url: baseURL }]);
      const payload = await response.json();
      createdUserIds.push(payload.list.id);
      return payload.list;
    };

    const [accountA, accountB] = await Promise.all([
      register(contextA, "OyuncuA"),
      register(contextB, "OyuncuB"),
    ]);

    const createResponse = await contextA.request.post("/api/games/backgammon", {
      data: { visibility: "unlisted" },
      headers: { Origin: baseURL, Referer: `${baseURL}/games/backgammon/new` },
    });
    expect(createResponse.status()).toBe(201);
    const { sessionId } = await createResponse.json();

    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();
    const roomPath = `/games/backgammon/${sessionId}`;
    await Promise.all([pageA.goto(roomPath), pageB.goto(roomPath)]);
    await expect(pageA.getByRole("heading", { name: "Masada bir koltuk boş." })).toBeVisible();
    await pageB.getByRole("button", { name: "Masaya katıl" }).click();

    await Promise.all([
      expect(pageA.locator(".backgammon-game-shell")).toBeVisible({ timeout: 8_000 }),
      expect(pageB.locator(".backgammon-game-shell")).toBeVisible({ timeout: 8_000 }),
    ]);

    const [viewAResponse, viewBResponse] = await Promise.all([
      contextA.request.get(`/api/games/backgammon/${sessionId}`),
      contextB.request.get(`/api/games/backgammon/${sessionId}`),
    ]);
    const viewA = (await viewAResponse.json()).session;
    const viewB = (await viewBResponse.json()).session;
    expect(viewA.revision).toBe(viewB.revision);
    expect(viewA.game.activeUserId).toBeTruthy();

    const pointOrder = (page: typeof pageA, side: "top" | "bottom") => page
      .locator(`.backgammon-point-row.is-${side} [data-point-id]`)
      .evaluateAll((points) => points.map((point) => point.getAttribute("data-point-id")));
    const initialOrders = await Promise.all([
      pointOrder(pageA, "top"),
      pointOrder(pageA, "bottom"),
      pointOrder(pageB, "top"),
      pointOrder(pageB, "bottom"),
    ]);
    expect(initialOrders[0]).toEqual(Array.from({ length: 12 }, (_, index) => String(index + 13)));
    expect(initialOrders[1]).toEqual(Array.from({ length: 12 }, (_, index) => String(12 - index)));
    expect(initialOrders[2]).toEqual(Array.from({ length: 12 }, (_, index) => String(index + 1)));
    expect(initialOrders[3]).toEqual(Array.from({ length: 12 }, (_, index) => String(24 - index)));

    if (process.env.BACKGAMMON_SCREENSHOT_PATH) {
      await pageA.locator(".backgammon-board-frame").screenshot({
        path: process.env.BACKGAMMON_SCREENSHOT_PATH,
        animations: "disabled",
      });
    }

    const activeIsA = viewA.game.activeUserId === accountA.id;
    const activePage = activeIsA ? pageA : pageB;
    const activeContext = activeIsA ? contextA : contextB;
    const passivePage = activeIsA ? pageB : pageA;
    let activeView = activeIsA ? viewA : viewB;
    let expectedRevision = activeView.revision;

    if (activeView.game.canRoll) {
      await activePage.getByRole("button", { name: /Zar at/u }).click();
      expectedRevision += 1;
      await expect.poll(async () => {
        const response = await activeContext.request.get(`/api/games/backgammon/${sessionId}`);
        const payload = await response.json();
        return payload.session.revision;
      }, { timeout: 8_000 }).toBe(expectedRevision);
      const rolledResponse = await activeContext.request.get(`/api/games/backgammon/${sessionId}`);
      activeView = (await rolledResponse.json()).session;
    }

    const legalSources = new Set(
      activeView.game.legalMoves
        .map((move: { from: number | "bar" }) => move.from)
        .filter((point: number | "bar"): point is number => typeof point === "number"),
    );
    for (const point of legalSources) {
      await expect(activePage.locator(`[data-point-id="${point}"]`)).toBeEnabled();
    }
    const inactivePoint = Array.from({ length: 24 }, (_, index) => index + 1).find((point) => !legalSources.has(point));
    if (inactivePoint) await expect(activePage.locator(`[data-point-id="${inactivePoint}"]`)).toBeDisabled();

    const invalidMove = activeView.game.legalMoves[0];
    if (invalidMove && invalidMove.from !== "bar") {
      const invalidPoint = activePage.locator(`[data-point-id="${invalidMove.from}"]`);
      await invalidPoint.locator('.backgammon-checker[draggable="true"]').dragTo(activePage.locator(".backgammon-turn-header"));
      await expect(invalidPoint).toHaveClass(/is-invalid-drop/u);
      const unchangedResponse = await activeContext.request.get(`/api/games/backgammon/${sessionId}`);
      expect((await unchangedResponse.json()).session.revision).toBe(expectedRevision);
    }

    for (let moveIndex = 0; moveIndex < 4 && activeView.game.activeUserId === (activeIsA ? accountA.id : accountB.id); moveIndex += 1) {
      const move = activeView.game.legalMoves[0];
      expect(move, "Zardan sonra geçerli Tavla hamlesi bulunamadı").toBeTruthy();
      expect(move.from).not.toBe("bar");
      expect(move.to).not.toBe("off_board");
      const source = activePage.locator(`[data-point-id="${move.from}"] .backgammon-checker[draggable="true"]`);
      const target = activePage.locator(`[data-point-id="${move.to}"]`);
      if (moveIndex === 0) {
        await activePage.locator(`[data-point-id="${move.from}"]`).click();
        await expect(target).toHaveClass(/is-(empty|stack|hit)-target/u);
        await expect(target).toBeEnabled();
        await target.click();
        expectedRevision += 1;
      } else {
        await source.dragTo(target);
        expectedRevision += 1;
      }
      await expect.poll(async () => {
        const response = await activeContext.request.get(`/api/games/backgammon/${sessionId}`);
        const payload = await response.json();
        return payload.session.revision;
      }, { timeout: 8_000 }).toBe(expectedRevision);
      const movedResponse = await activeContext.request.get(`/api/games/backgammon/${sessionId}`);
      activeView = (await movedResponse.json()).session;
    }

    expect(activeView.game.activeUserId).not.toBe(activeIsA ? accountA.id : accountB.id);

    await expect(passivePage.locator(".game-event-log li").first()).toBeVisible({ timeout: 8_000 });
    await expect.poll(async () => (await pointOrder(pageA, "top")).join(","), { timeout: 8_000 })
      .toBe(initialOrders[0].join(","));
    expect(await pointOrder(pageA, "bottom")).toEqual(initialOrders[1]);
    expect(await pointOrder(pageB, "top")).toEqual(initialOrders[2]);
    expect(await pointOrder(pageB, "bottom")).toEqual(initialOrders[3]);
    const [finalAResponse, finalBResponse] = await Promise.all([
      contextA.request.get(`/api/games/backgammon/${sessionId}`),
      contextB.request.get(`/api/games/backgammon/${sessionId}`),
    ]);
    const finalA = (await finalAResponse.json()).session;
    const finalB = (await finalBResponse.json()).session;
    expect(finalA.revision).toBe(expectedRevision);
    expect(finalB.revision).toBe(finalA.revision);
    expect(finalA.events[0].eventType).toBe(finalB.events[0].eventType);
    expect(["dice_rolled", "checker_moved"]).toContain(finalA.events[0].eventType);
    expect([accountA.id, accountB.id]).toContain(finalA.game.activeUserId);

    await prisma.gameSession.update({
      where: { id: sessionId },
      data: { updatedAt: new Date(Date.now() - 31_000) },
    });
    const idleResponse = await activeContext.request.get(`/api/games/backgammon/${sessionId}`);
    expect(idleResponse.ok()).toBeTruthy();
    const idle = (await idleResponse.json()).session;
    expect(idle.status).toBe("active");
    expect(idle.game.turnDeadlineAt).toBeNull();
  } finally {
    await Promise.allSettled([contextA.close(), contextB.close()]);
    if (createdUserIds.length) await prisma.userList.deleteMany({ where: { id: { in: createdUserIds } } });
  }
});

test.afterAll(async () => {
  await prisma.$disconnect();
});
