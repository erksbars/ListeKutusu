import { expect, test } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";

test("real RSVP choices, full capacity, release and cancellation", async ({ page, context, browser, baseURL }) => {
  test.skip(process.env.COMMUNITY_E2E !== "1", "Local RSVP integration is opt-in.");
  if (!baseURL || new URL(baseURL).hostname !== "127.0.0.1") throw new Error("Local test only");
  test.setTimeout(180_000);
  const db = new PrismaClient();
  const suffix = randomUUID();
  const emails = [0, 1, 2].map(index => `event-rsvp-${index}-${suffix}@example.test`);
  const first = await browser.newContext({ baseURL, viewport: { width: 1280, height: 900 }, colorScheme: "dark" });
  const second = await browser.newContext({ baseURL, viewport: { width: 1280, height: 900 }, colorScheme: "dark" });
  const visitor = await browser.newContext({ baseURL });
  const firstPage = await first.newPage(), secondPage = await second.newPage();
  const pages = [page, firstPage, secondPage], clients = [context, first, second];
  try {
    for (const [index, client] of clients.entries()) {
      const registered = await client.request.post("/api/accounts", { headers: { Origin: baseURL, "X-Forwarded-For": `192.0.2.${1 + parseInt(suffix.slice(0, 2), 16) % 254}` }, data: { ownerName: ["RSVP Düzenleyeni", "RSVP İlk Üye", "RSVP İkinci Üye"][index], playlistName: "Geçici test", email: emails[index], password: `Test-${suffix}-42` } });
      expect(registered.status()).toBe(200);
      await pages[index].addInitScript(() => localStorage.setItem("listekutusu-theme", "dark"));
    }
    const community = await context.request.post("/api/communities", { headers: { Origin: baseURL }, data: { name: "Katılım Deneme Kulübü", category: "interest", description: "Yalnız otomatik RSVP testi için geçici topluluk.", rules: "Bu topluluk gerçek buluşma duyurmaz." } });
    expect(community.status()).toBe(201);
    const { slug } = await community.json();
    for (const client of [first, second]) expect((await client.request.post(`/api/communities/${slug}`, { headers: { Origin: baseURL }, data: { action: "join" } })).status()).toBe(200);
    const created = await context.request.post(`/api/communities/${slug}/events`, { headers: { Origin: baseURL }, data: { title: "Kurgusal katılım denemesi", description: "Gerçek buluşma değildir; yalnız otomatik katılım testi için oluşturuldu.", localStart: new Date(Date.now() + 7 * 86_400_000 + 3 * 3_600_000).toISOString().slice(0, 16), city: "Örnek şehir", venue: "Kurgusal kamusal test mekânı", capacity: 2, publicLocationConfirmed: true } });
    expect(created.status()).toBe(201);
    const { event } = await created.json();
    const api = `/api/communities/${slug}/events/${event.id}`;
    async function open(target: typeof page, cancelled = false) {
      await target.goto(`/communities/${slug}`);
      await target.getByRole("button", { name: "Etkinlikler", exact: true }).click();
      if (cancelled) await target.getByRole("combobox", { name: "Etkinlik zamanı", exact: true }).selectOption("cancelled");
      await expect(target.getByRole("heading", { name: "Kurgusal katılım denemesi", exact: true })).toBeVisible();
    }
    await open(page);
    await expect(page.getByText("0 katılacak · 0 ilgileniyor · 2 yer kaldı", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Katılacağım", exact: true }).click();
    await expect(page.getByText("Tercihin: Katılacağım", { exact: true })).toBeVisible();
    await open(firstPage);
    await firstPage.getByRole("button", { name: "İlgileniyorum", exact: true }).click();
    await expect(firstPage.getByText("1 katılacak · 1 ilgileniyor · 1 yer kaldı", { exact: true })).toBeVisible();
    await firstPage.getByRole("button", { name: "Katılacağım", exact: true }).click();
    await expect(firstPage.getByText("2 katılacak · 0 ilgileniyor · 0 yer kaldı", { exact: true })).toBeVisible();
    await open(secondPage);
    await expect(secondPage.getByRole("button", { name: "Katılacağım", exact: true })).toBeDisabled();
    await secondPage.getByRole("button", { name: "İlgileniyorum", exact: true }).click();
    await expect(secondPage.getByText("Tercihin: İlgileniyorum", { exact: true })).toBeVisible();
    const publicData = await (await visitor.request.get(api)).json();
    expect(publicData.event.attendingCount).toBe(2); expect(publicData.event.interestedCount).toBe(1); expect(publicData.event.viewerStatus).toBeNull(); expect(publicData.participants).toEqual([]);
    expect((await visitor.request.post(api, { headers: { Origin: baseURL }, data: { action: "rsvp", status: "attending" } })).status()).toBe(401);
    await open(page);
    await page.locator(`[data-feed-id="event:${event.id}"] .feed-post-permalink`).click();
    const roster = page.getByRole("region", { name: "Etkinlik katılımcıları", exact: true });
    await expect(roster.getByRole("link", { name: "RSVP İlk Üye", exact: true })).toBeVisible();
    await page.evaluate(() => { (document.activeElement as HTMLElement | null)?.blur(); window.scrollTo({ top: 0, behavior: "instant" }); });
    await page.screenshot({ path: "test-results/browser/community-attendance-desktop-dark.png", fullPage: true, animations: "disabled" });
    await page.getByRole("button", { name: "Vazgeçtim", exact: true }).click();
    await expect(page.getByText("1 katılacak · 1 ilgileniyor · 1 yer kaldı", { exact: true })).toBeVisible();
    await open(secondPage);
    await secondPage.getByRole("button", { name: "Katılacağım", exact: true }).click();
    await expect(secondPage.getByText("Tercihin: Katılacağım", { exact: true })).toBeVisible();
    await open(secondPage);
    await expect(secondPage.getByText("Tercihin: Katılacağım", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Etkinliği iptal et", exact: true }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Onayla", exact: true }).click();
    await expect(page.getByText("Etkinlik iptal edildi.", { exact: true })).toBeVisible();
    await open(secondPage, true);
    await expect(secondPage.getByText("Tercihin: Vazgeçtim", { exact: true })).toBeVisible();
    await expect(secondPage.getByRole("button", { name: "Katılacağım", exact: true })).toHaveCount(0);
    expect((await second.request.post(api, { headers: { Origin: baseURL }, data: { action: "rsvp", status: "attending" } })).status()).toBe(409);
  } finally {
    await Promise.all([first.close(), second.close(), visitor.close()]);
    try {
      const users = await db.userList.findMany({ where: { email: { in: emails } }, select: { id: true } });
      await db.community.deleteMany({ where: { ownerId: { in: users.map(user => user.id) } } });
      await db.userList.deleteMany({ where: { email: { in: emails } } });
    } finally { await db.$disconnect(); }
  }
});
