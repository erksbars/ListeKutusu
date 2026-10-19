import { expect, test } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
const runOutbox = () => promisify(execFile)(process.execPath, ["--disable-warning=MODULE_TYPELESS_PACKAGE_JSON", "--env-file=.env", "--experimental-strip-types", "scripts/event-notification-worker.mjs", "--once"]);

test("real edit conflict preserves draft and notifications open the event", async ({ page, context, browser, baseURL }) => {
  test.skip(process.env.COMMUNITY_E2E !== "1", "Local event edit integration is opt-in.");
  if (!baseURL || new URL(baseURL).hostname !== "127.0.0.1") throw new Error("Local test only");
  test.setTimeout(180_000);
  const db = new PrismaClient();
  const suffix = randomUUID(), emails = [0, 1].map(index => `event-edit-${index}-${suffix}@example.test`);
  const member = await browser.newContext({ baseURL, viewport: { width: 1280, height: 900 }, colorScheme: "dark" });
  const memberPage = await member.newPage();
  try {
    for (const [index, client] of [context, member].entries()) {
      const registered = await client.request.post("/api/accounts", { headers: { Origin: baseURL, "X-Forwarded-For": `192.0.2.${1 + parseInt(suffix.slice(0, 2), 16) % 254}` }, data: { ownerName: index ? "Etkinlik Bildirim Üyesi" : "Etkinlik Düzenleyeni", playlistName: "Geçici test", email: emails[index], password: `Test-${suffix}-42` } });
      expect(registered.status()).toBe(200);
    }
    const community = await context.request.post("/api/communities", { headers: { Origin: baseURL }, data: { name: "Etkinlik Düzenleme Denemesi", category: "interest", description: "Yalnız otomatik düzenleme ve bildirim testi.", rules: "Bu topluluk gerçek bir buluşma duyurmaz." } });
    expect(community.status()).toBe(201);
    const { slug } = await community.json();
    expect((await member.request.post(`/api/communities/${slug}`, { headers: { Origin: baseURL }, data: { action: "join" } })).status()).toBe(200);
    const input = { title: "Kurgusal düzenleme etkinliği", description: "Gerçek buluşma değildir, yalnız otomatik düzenleme testi içindir.", localStart: new Date(Date.now() + 7 * 86_400_000 + 3 * 3_600_000).toISOString().slice(0, 16), city: "Örnek şehir", venue: "İlk kurgusal kamusal mekân", capacity: 4, publicLocationConfirmed: true };
    const created = await context.request.post(`/api/communities/${slug}/events`, { headers: { Origin: baseURL }, data: input });
    expect(created.status()).toBe(201);
    const { event } = await created.json();
    const api = `/api/communities/${slug}/events/${event.id}`;
    expect((await member.request.post(api, { headers: { Origin: baseURL }, data: { action: "rsvp", status: "attending" } })).status()).toBe(200);
    for (const target of [page, memberPage]) await target.addInitScript(() => localStorage.setItem("listekutusu-theme", "dark"));
    const direct = `/communities/${slug}?section=events&event=${event.id}`;
    await page.goto(direct);
    await page.getByRole("button", { name: "Etkinliği düzenle", exact: true }).click();
    const form = page.getByRole("form", { name: "Etkinlik düzenleme", exact: true });
    const venue = form.getByRole("textbox", { name: "Mekân", exact: true });
    await venue.fill("Taslak olarak korunan mekân");
    await form.getByRole("checkbox").check();
    const external = await context.request.patch(api, { headers: { Origin: baseURL }, data: { ...input, venue: "Sunucudaki güncel mekân", expectedVersion: 0 } });
    expect(external.status()).toBe(200);
    await form.getByRole("button", { name: "Değişiklikleri kaydet", exact: true }).click();
    await expect(page.getByRole("alert").filter({ hasText: "Etkinlik değişti" })).toBeVisible();
    await expect(venue).toHaveValue("Taslak olarak korunan mekân");
    await page.getByRole("button", { name: "Formu kapatıp güncel etkinliği yükle", exact: true }).click();
    await expect(page.getByText("Örnek şehir · Sunucudaki güncel mekân", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Etkinliği düzenle", exact: true }).click();
    await venue.fill("Son güncel kamusal mekân");
    await form.getByRole("checkbox").check();
    await form.getByRole("button", { name: "Değişiklikleri kaydet", exact: true }).click();
    await expect(page.getByText("Örnek şehir · Son güncel kamusal mekân", { exact: true })).toBeVisible();
    // The supervised worker may already have delivered either job. Check durable
    // creation and eventual exact delivery, not an assumption that it is stopped.
    expect(await db.communityEventNotificationJob.count({ where: { eventId: event.id } })).toBe(2);
    await runOutbox();
    await expect.poll(() => db.notification.count({ where: { communityEventId: event.id } })).toBe(2);
    await expect.poll(() => db.communityEventNotificationJob.count({ where: { eventId: event.id, completedAt: null } })).toBe(0);
    await runOutbox();
    expect(await db.notification.count({ where: { communityEventId: event.id } })).toBe(2);
    const notices = await (await member.request.get("/api/notifications")).json();
    expect(notices.notifications.filter((item: { type: string }) => item.type === "community_event_updated")).toHaveLength(2);
    await memberPage.goto(`/communities/${slug}`);
    await memberPage.getByTestId("notification-trigger").click();
    const panel = memberPage.getByTestId("notification-panel");
    const updateLink = panel.getByRole("link").filter({ hasText: "bilgileri güncellendi" });
    await expect(updateLink).toHaveCount(1);
    await updateLink.click();
    await expect(memberPage).toHaveURL(new RegExp(`event=${event.id}`));
    await expect(memberPage.getByText("Örnek şehir · Son güncel kamusal mekân", { exact: true })).toBeVisible();
    await expect(memberPage.getByText("Tercihin: Katılacağım", { exact: true })).toBeVisible();
    await expect(memberPage.getByRole("button", { name: "Etkinliği düzenle", exact: true })).toHaveCount(0);
    await memberPage.evaluate(() => { (document.activeElement as HTMLElement | null)?.blur(); window.scrollTo({ top: 0, behavior: "instant" }); });
    await memberPage.screenshot({ path: "test-results/browser/event-update-notification-desktop.png", fullPage: true, animations: "disabled" });
    await page.getByRole("button", { name: "Etkinliği iptal et", exact: true }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Onayla", exact: true }).click();
    await expect(page.getByText("Etkinlik iptal edildi.", { exact: true })).toBeVisible();
    await runOutbox();
    await expect.poll(() => db.notification.count({ where: { communityEventId: event.id } })).toBe(3);
    await memberPage.goto(`/communities/${slug}`);
    await memberPage.getByTestId("notification-trigger").click();
    await panel.getByRole("link").filter({ hasText: "iptal edildi" }).click();
    await expect(memberPage.getByText("Etkinlik iptal edildi.", { exact: true })).toBeVisible();
    await expect(memberPage.getByText("Tercihin: Vazgeçtim", { exact: true })).toBeVisible();
  } finally {
    await member.close();
    try {
      const users = await db.userList.findMany({ where: { email: { in: emails } }, select: { id: true } });
      await db.community.deleteMany({ where: { ownerId: { in: users.map(user => user.id) } } });
      await db.userList.deleteMany({ where: { email: { in: emails } } });
    } finally { await db.$disconnect(); }
  }
});
