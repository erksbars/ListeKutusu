import { expect, test } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";

test("real community event creation, persistence, cancellation and removal", async ({ page, context, browser, baseURL }) => {
  test.skip(process.env.COMMUNITY_E2E !== "1", "Local event integration is opt-in.");
  if (!baseURL || new URL(baseURL).hostname !== "127.0.0.1") throw new Error("Local test only");
  test.setTimeout(150_000);
  const db = new PrismaClient();
  const suffix = randomUUID();
  const email = `community-event-${suffix}@example.test`;
  const visitor = await browser.newContext({ baseURL });
  try {
    const registered = await context.request.post("/api/accounts", { headers: { Origin: baseURL, "X-Forwarded-For": `192.0.2.${1 + parseInt(suffix.slice(0, 2), 16) % 254}` }, data: { ownerName: "Etkinlik Denemesi", playlistName: "Geçici test", email, password: `Test-${suffix}-42` } });
    expect(registered.status()).toBe(200);
    const community = await context.request.post("/api/communities", { headers: { Origin: baseURL }, data: { name: "Etkinlik Deneme Kulübü", category: "interest", description: "Yerel etkinlik akışı için geçici test topluluğu.", rules: "Özel adres paylaşma; bu topluluk test içindir." } });
    expect(community.status()).toBe(201);
    const { slug } = await community.json();
    const api = `/api/communities/${slug}/events`;
    expect((await visitor.request.post(api, { headers: { Origin: baseURL }, data: {} })).status()).toBe(401);
    await page.addInitScript(() => localStorage.setItem("listekutusu-theme", "dark"));
    await page.goto(`/communities/${slug}`);
    await page.getByRole("button", { name: "Etkinlikler", exact: true }).click();
    await page.locator("summary").filter({ hasText: /^Etkinlik oluştur$/ }).click();
    const title = page.getByRole("textbox", { name: "Etkinlik başlığı", exact: true });
    await expect(title).toBeEnabled({ timeout: 30_000 });
    await expect(page.locator("summary").filter({ hasText: /^Sohbet veya inceleme paylaş$/ })).toBeHidden();
    await title.fill("Demo kutu oyunu buluşması");
    await page.getByRole("textbox", { name: "Etkinlik açıklaması", exact: true }).fill("Yalnız otomatik test için kurgusal etkinliktir; gerçek buluşma değildir.");
    const future = new Date(Date.now() + 7 * 86_400_000 + 3 * 3_600_000).toISOString().slice(0, 16);
    await page.locator('input[name="localStart"]').fill(future);
    await page.getByRole("textbox", { name: "Şehir", exact: true }).fill("Örnek şehir");
    await page.getByRole("textbox", { name: "Mekân", exact: true }).fill("Kurgusal kamusal test mekânı");
    await page.getByRole("spinbutton", { name: "Katılımcı kapasitesi (isteğe bağlı)", exact: true }).fill("6");
    await page.getByRole("checkbox", { name: "Etkinlik ve mekân bilgilerinin herkese açık olduğunu biliyorum.", exact: true }).check();
    await page.getByRole("button", { name: "Etkinliği yayınla", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Demo kutu oyunu buluşması", exact: true })).toBeVisible();
    await page.reload();
    await page.getByRole("button", { name: "Etkinlikler", exact: true }).click();
    await expect(page.getByText("6 kişilik kapasite", { exact: true })).toBeVisible();
    await expect(page.getByText(/Türkiye saati/).first()).toBeVisible();
    const listing = await (await visitor.request.get(api)).json();
    expect(listing.events).toHaveLength(1);
    const eventId = listing.events[0].id;
    expect(listing.events[0].organizer.email).toBeUndefined();
    expect((await visitor.request.get(`${api}/${eventId}`)).status()).toBe(200);
    await page.locator(`[data-feed-id="event:${eventId}"] .feed-post-permalink`).click();
    await expect(page.getByText("Kapasite: 6 kişi", { exact: true })).toBeVisible();
    await page.evaluate(() => { (document.activeElement as HTMLElement | null)?.blur(); window.scrollTo({ top: 0, behavior: "instant" }); });
    await page.screenshot({ path: "test-results/browser/community-event-desktop-dark.png", fullPage: true, animations: "disabled" });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.getByRole("button", { name: "Etkinliği iptal et", exact: true }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Onayla", exact: true }).click();
    await expect(page.getByText("Etkinlik iptal edildi.", { exact: true })).toBeVisible();
    expect((await (await visitor.request.get(api)).json()).events).toHaveLength(0);
    expect((await (await visitor.request.get(`${api}?filter=cancelled`)).json()).events).toHaveLength(1);
    await page.getByRole("button", { name: "Etkinliği kaldır", exact: true }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Onayla", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Bu görünümde paylaşım yok", exact: true })).toBeVisible();
    expect((await visitor.request.get(`${api}/${eventId}`)).status()).toBe(404);
  } finally {
    await visitor.close();
    try {
      const users = await db.userList.findMany({ where: { email }, select: { id: true } });
      await db.community.deleteMany({ where: { ownerId: { in: users.map(user => user.id) } } });
      await db.userList.deleteMany({ where: { email } });
    } finally { await db.$disconnect(); }
  }
});
