import { expect, test } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";

test("private event agenda filters, history, withdrawal failures and last-page recovery", async ({ page, context, browser, baseURL, request }) => {
  test.skip(process.env.COMMUNITY_E2E !== "1", "Local agenda integration is opt-in.");
  if (!baseURL || new URL(baseURL).hostname !== "127.0.0.1") throw new Error("Local test only");
  test.setTimeout(180_000); page.setDefaultTimeout(25_000);
  const db = new PrismaClient(), suffix = randomUUID(), emails = [0, 1].map(i => `agenda-${i}-${suffix}@example.test`), ids: string[] = [];
  const owner = await browser.newContext({ baseURL }), headers = { Origin: baseURL }, sources: { id: string; slug: string }[] = [];
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  try {
    for (const [i, client] of [context, owner].entries()) {
      const response = await client.request.post("/api/accounts", { headers: { ...headers, "X-Forwarded-For": `192.0.2.${1 + parseInt(suffix.slice(0, 2), 16) % 254}` }, data: { email: emails[i], password: `Test-${suffix}-42`, ownerName: i ? "Ajanda Kurucusu" : "Ajanda Üyesi", playlistName: "Geçici test" } });
      expect(response.status()).toBe(200); ids.push((await db.userList.findUniqueOrThrow({ where: { email: emails[i] } })).id);
    }
    for (let i = 0; i < 2; i++) {
      const response = await owner.request.post("/api/communities", { headers, data: { name: `Özel Ajanda Denemesi ${i}`, category: "interest", description: "Kişisel etkinlik listesi için geçici test topluluğudur.", rules: "Gerçek etkinlik değildir; yalnız sentetik test verisi." } });
      expect(response.status()).toBe(201); const { slug } = await response.json(); sources.push(await db.community.findUniqueOrThrow({ where: { slug }, select: { id: true, slug: true } }));
      expect((await context.request.post(`/api/communities/${slug}`, { headers, data: { action: "join" } })).status()).toBe(200);
    }
    const clock = Date.now(), rows = Array.from({ length: 21 }, (_, i) => ({ id: `agenda-${suffix}-${i}`, communityId: sources[i % 2].id, organizerId: ids[1], title: `Kişisel test etkinliği ${i}`, description: "Listeye taşınmayacak sentetik açıklama metni.", startsAt: new Date(clock + (i + 1) * 86400_000), city: "İstanbul", venue: "Kurgusal kamusal test alanı" }));
    await db.communityEvent.createMany({ data: rows }); await db.communityEventRsvp.createMany({ data: rows.map((event, i) => ({ eventId: event.id, userId: ids[0], status: i % 2 ? "interested" : "attending" })) });
    const own = await db.communityEvent.create({ data: { communityId: sources[0].id, organizerId: ids[0], title: "Kendi düzenlediğim test etkinliği", description: "Düzenleyen otomatik katılmış sayılmaz.", startsAt: new Date(clock + 22 * 86400_000), city: "İstanbul", venue: "Kurgusal kamusal alan" } });
    const cancelled = await db.communityEvent.create({ data: { communityId: sources[1].id, organizerId: ids[1], title: "İptal edilen ajanda etkinliği", description: "Geri çekilmiş tercihleri taşıyan örnek iptal kaydı.", startsAt: new Date(clock + 5 * 86400_000), status: "cancelled", city: "İstanbul", venue: "Kurgusal alan" } });
    await db.communityEventRsvp.create({ data: { eventId: cancelled.id, userId: ids[0], status: "withdrawn" } });
    const past = await db.communityEvent.create({ data: { communityId: sources[0].id, organizerId: ids[1], title: "Başlangıcı geçmiş ajanda etkinliği", description: "Fiziksel katılım kanıtı olmayan sentetik eski kayıt.", startsAt: new Date(clock - 86400_000), city: "İstanbul", venue: "Kurgusal alan" } });
    await db.communityEventRsvp.create({ data: { eventId: past.id, userId: ids[0], status: "withdrawn" } });
    expect((await request.get("/api/communities/agenda")).status()).toBe(401); expect((await context.request.get("/api/communities/agenda?role=bad")).status()).toBe(400);
    const foreign = await owner.request.get(`/api/communities/agenda?role=responded&userId=${ids[0]}`); expect((await foreign.json()).items).toHaveLength(0); expect(foreign.headers()["cache-control"]).toBe("private, no-store");
    const ownRead = await context.request.get("/api/communities/agenda"); const serialized = JSON.stringify(await ownRead.json()); for (const field of ["responses", "participants", "organizerId", "description"]) expect(serialized).not.toContain(`"${field}"`);
    await page.addInitScript(() => localStorage.setItem("listekutusu-theme", "dark")); await page.goto("/communities"); await page.getByRole("link", { name: "Etkinliklerim ↗", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Etkinliklerim", exact: true })).toBeVisible(); await expect(page.getByRole("article")).toHaveCount(20);
    const role = page.getByRole("combobox", { name: "Etkinlikle ilişkim", exact: true }), view = page.getByRole("combobox", { name: "Etkinlik zamanı", exact: true });
    await role.selectOption("organizing"); await expect(page).toHaveURL(/role=organizing/); await expect(page.getByRole("article")).toHaveCount(1); await expect(page.getByRole("article")).toContainText(own.title); await expect(page.getByRole("article")).toContainText("Henüz belirtilmedi");
    await role.selectOption("responded"); await expect(page.getByRole("article")).toHaveCount(20);
    await page.getByRole("link", { name: "Sonraki etkinlikler", exact: true }).click(); await expect(page).toHaveURL(/page=2/); await expect(page.getByRole("article")).toHaveCount(1);
    await page.getByRole("button", { name: "Katılım tercihimi geri çek", exact: true }).click(); const dialog = page.getByRole("dialog", { name: "Katılım tercihini geri çek?", exact: true });
    await expect(dialog).toBeVisible(); await page.keyboard.press("Escape"); await expect(page.getByRole("article")).toHaveCount(1);
    let fail = true; const last = rows[20], lastApi = `/api/communities/${sources[0].slug}/events/${last.id}`;
    await page.route(`**${lastApi}`, route => { if (route.request().method() !== "POST" || !fail) return route.continue(); fail = false; return route.fulfill({ status: 503, json: { error: "Geçici tercih geri alma hatası" } }); });
    await page.getByRole("button", { name: "Katılım tercihimi geri çek", exact: true }).click(); await dialog.getByRole("button", { name: "Tercihimi geri çek", exact: true }).click();
    await expect(page.getByRole("alert").filter({ hasText: "Geçici tercih geri alma hatası" })).toBeVisible(); expect((await db.communityEventRsvp.findUniqueOrThrow({ where: { eventId_userId: { eventId: last.id, userId: ids[0] } } })).status).toBe("attending");
    await page.getByRole("button", { name: "Katılım tercihimi geri çek", exact: true }).click(); await dialog.getByRole("button", { name: "Tercihimi geri çek", exact: true }).click(); await expect(page).toHaveURL(/page=1/); await expect(page.getByRole("article")).toHaveCount(20);
    await page.getByRole("link", { name: "Etkinlik detayını aç ↗", exact: true }).first().click(); await expect(page).toHaveURL(new RegExp(`event=${rows[0].id}`)); await expect(page.getByRole("region", { name: "Topluluk etkinlikleri", exact: true }).getByText("Tercihin: Katılacağım", { exact: true })).toBeVisible(); await page.goBack(); await expect(role).toHaveValue("responded");
    await view.selectOption("cancelled"); await expect(page).toHaveURL(/view=cancelled/); await expect(page.getByRole("article")).toHaveCount(1); await expect(page.getByRole("article")).toContainText(cancelled.title); await page.reload(); await expect(view).toHaveValue("cancelled");
    await view.selectOption("past"); await expect(page.getByRole("article")).toHaveCount(1); await expect(page.getByRole("article")).toContainText(past.title); await page.goBack(); await expect(view).toHaveValue("cancelled");
    await view.selectOption("upcoming"); await expect(page.getByRole("article")).toHaveCount(20); await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await page.screenshot({ path: "test-results/browser/community-agenda-desktop.png", fullPage: false, animations: "disabled" });
    await db.userBlock.create({ data: { blockerId: ids[1], blockedId: ids[0] } }); await page.getByRole("button", { name: "Etkinliklerimi yenile", exact: true }).click(); await expect(page.getByText("Bu görünümde sana ait görünür etkinlik yok.", { exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true); expect(errors).toEqual([]);
    const anon = await browser.newContext({ baseURL }); try { const anonPage = await anon.newPage(); await anonPage.goto("/community-events"); await expect(anonPage.getByRole("link", { name: "Giriş ekranı ↗", exact: true })).toBeVisible(); await expect(anonPage.getByRole("article")).toHaveCount(0); } finally { await anon.close(); }
  } finally {
    const users = await db.userList.findMany({ where: { email: { in: emails } }, select: { id: true } }), targets = [...new Set([...ids, ...users.map(user => user.id)])];
    await db.community.deleteMany({ where: { ownerId: { in: targets } } }); await db.userList.deleteMany({ where: { id: { in: targets } } }); await owner.close(); await db.$disconnect();
  }
});
