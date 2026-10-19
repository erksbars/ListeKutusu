import { expect, test } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

test("event reports preserve drafts, stay private and reach scoped moderation", async ({ page, context, browser, request, baseURL }) => {
  test.skip(process.env.COMMUNITY_E2E !== "1", "Local event moderation integration is opt-in.");
  if (!baseURL || new URL(baseURL).hostname !== "127.0.0.1") throw new Error("Local test only");
  test.setTimeout(150_000); page.setDefaultTimeout(20_000);
  const db = new PrismaClient(), suffix = randomUUID(), emails = [0, 1].map(index => `event-report-${index}-${suffix}@example.test`);
  const reader = await browser.newContext({ baseURL, viewport: { width: 1280, height: 900 }, colorScheme: "dark" });
  const readerPage = await reader.newPage(); readerPage.setDefaultTimeout(20_000);
  const errors: string[] = []; for (const target of [page, readerPage]) target.on("pageerror", error => errors.push(error.message));
  try {
    for (const [index, client] of [context, reader].entries()) {
      const response = await client.request.post("/api/accounts", { headers: { Origin: baseURL, "X-Forwarded-For": `192.0.2.${1 + parseInt(suffix.slice(0, 2), 16) % 254}` }, data: { email: emails[index], password: `Test-${suffix}-42`, ownerName: index ? "Bildiren Üye" : "Etkinlik Kurucusu", playlistName: "Geçici test" } });
      expect(response.status()).toBe(200);
    }
    const headers = { Origin: baseURL };
    const created = await context.request.post("/api/communities", { headers, data: { name: "Etkinlik Bildirim Denemesi", description: "Gerçek buluşma içermeyen geçici test topluluğu.", category: "interest", rules: "Kişisel bilgi paylaşma. Bu topluluk yalnız otomatik test içindir." } });
    expect(created.status()).toBe(201); const { slug } = await created.json(), api = `/api/communities/${slug}`;
    expect((await reader.request.post(api, { headers, data: { action: "join" } })).status()).toBe(200);
    const input = { title: "İncelenecek örnek etkinlik", description: "Gerçek buluşma değildir; yalnız otomatik moderasyon testi duyurusudur.", localStart: new Date(Date.now() + 7 * 86_400_000 + 3 * 3_600_000).toISOString().slice(0, 16), city: "Ankara", venue: "Kurgusal kamusal mekân", publicLocationConfirmed: true };
    const eventResponse = await context.request.post(`${api}/events`, { headers, data: input });
    expect(eventResponse.status()).toBe(201); const { event } = await eventResponse.json(), eventApi = `${api}/events/${event.id}`;
    expect((await request.post(eventApi, { headers, data: { action: "report", reason: "Anonim bildirim" } })).status()).toBe(401);
    expect((await reader.request.post(eventApi, { headers: { Origin: "https://example.invalid" }, data: { action: "report", reason: "Yabancı kaynak" } })).status()).toBe(403);
    for (const target of [page, readerPage]) await target.addInitScript(() => localStorage.setItem("listekutusu-theme", "dark"));
    const detailUrl = `/communities/${slug}?section=events&event=${event.id}`;
    await readerPage.goto(detailUrl);
    await readerPage.getByRole("button", { name: "Etkinliği bildir", exact: true }).click();
    const reason = readerPage.getByRole("textbox", { name: "Etkinlik bildirim nedeni", exact: true });
    await reason.fill("Örnek etkinlik açıklamasını inceleyebilir misiniz?");
    let failWrite = true;
    await readerPage.route(`**${eventApi}`, route => {
      if (route.request().method() !== "POST" || !failWrite) return route.continue();
      failWrite = false; return route.fulfill({ status: 503, json: { error: "Geçici bildirim testi hatası" } });
    });
    await readerPage.getByRole("button", { name: "Etkinlik bildirimi gönder", exact: true }).click();
    await expect(readerPage.getByRole("alert").filter({ hasText: "Geçici bildirim testi hatası" })).toBeVisible();
    await expect(reason).toHaveValue("Örnek etkinlik açıklamasını inceleyebilir misiniz?");
    await expect(reason).toBeEnabled();
    await readerPage.getByRole("button", { name: "Etkinlik bildirimi gönder", exact: true }).click();
    await expect(readerPage.getByText("Bu etkinlik için bildirimin topluluk yönetiminin incelemesini bekliyor.", { exact: true })).toBeVisible();
    await expect(readerPage.getByRole("button", { name: "Etkinliği bildir", exact: true })).toHaveCount(0);
    await readerPage.unroute(`**${eventApi}`);
    const ordinary = await reader.request.get(api);
    expect((await ordinary.json()).reports).toEqual([]);
    await page.goto(detailUrl);
    await expect(page.getByRole("heading", { name: input.title, exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Etkinliği bildir", exact: true })).toHaveCount(0);
    await page.getByText("Topluluğu yönet", { exact: true }).click();
    const queue = page.locator("details").filter({ has: page.getByText("Topluluğu yönet", { exact: true }) });
    await expect(queue.getByText("Etkinlik bildirimi: Örnek etkinlik açıklamasını inceleyebilir misiniz?", { exact: true })).toBeVisible();
    await queue.getByRole("link", { name: "Etkinliği incele ↗", exact: true }).click();
    await expect(page.getByRole("heading", { name: input.title, exact: true })).toBeVisible();
    await page.getByText("Topluluğu yönet", { exact: true }).click();
    await page.screenshot({ path: "test-results/browser/community-event-reports-desktop.png", fullPage: true, animations: "disabled" });
    await queue.getByRole("button", { name: "İncelendi", exact: true }).click();
    await expect(queue.getByText("Bekleyen bildirim yok.", { exact: true })).toBeVisible();
    await readerPage.reload();
    await expect(readerPage.getByText("Bu etkinlik için bildirimin topluluk yönetimi tarafından incelendi.", { exact: true })).toBeVisible();
    expect((await (await request.get(eventApi)).json()).event.status).toBe("scheduled");
    // A separate reported event exercises removal without reopening the reviewed report.
    const secondResponse = await context.request.post(`${api}/events`, { headers, data: { ...input, title: "Kaldırılacak örnek etkinlik" } });
    expect(secondResponse.status()).toBe(201); const second = (await secondResponse.json()).event;
    const secondApi = `${api}/events/${second.id}`;
    expect((await reader.request.post(secondApi, { headers, data: { action: "rsvp", status: "attending" } })).status()).toBe(200);
    expect((await reader.request.post(secondApi, { headers, data: { action: "report", reason: "İkinci etkinlik incelensin" } })).status()).toBe(200);
    const report = (await (await context.request.get(api)).json()).reports[0];
    expect((await reader.request.post(api, { headers, data: { action: "resolve-report", reportId: report.id } })).status()).toBe(403);
    await page.goto(`/communities/${slug}?section=events&event=${second.id}`);
    await page.getByRole("button", { name: "Etkinliği kaldır", exact: true }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Onayla", exact: true }).click();
    await expect(page.getByRole("button", { name: "Etkinliği yayınla", exact: true })).toBeVisible();
    expect((await (await context.request.get(api)).json()).reports).toEqual([]);
    expect((await request.get(secondApi)).status()).toBe(404);
    const responseRow = await db.communityEventRsvp.findFirstOrThrow({ where: { eventId: second.id } });
    expect(responseRow.status).toBe("withdrawn");
    await promisify(execFile)(process.execPath, ["--disable-warning=MODULE_TYPELESS_PACKAGE_JSON", "--env-file=.env", "--experimental-strip-types", "scripts/event-notification-worker.mjs", "--once"]);
    expect(await db.notification.count({ where: { communityEventId: second.id, type: "community_event_removed", userId: responseRow.userId } })).toBe(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(errors).toEqual([]);
  } finally {
    const users = await db.userList.findMany({ where: { email: { in: emails } }, select: { id: true } });
    await db.community.deleteMany({ where: { ownerId: { in: users.map(user => user.id) } } });
    await db.userList.deleteMany({ where: { id: { in: users.map(user => user.id) } } });
    await db.$disconnect(); await reader.close();
  }
});
