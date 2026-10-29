import { expect, test } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";

test("real community creation, membership, conversation and moderation", async ({ page, context, browser, baseURL }) => {
  test.skip(process.env.COMMUNITY_E2E !== "1", "Real database community check is opt-in.");
  if (!baseURL || new URL(baseURL).hostname !== "127.0.0.1") throw new Error("Local test only");
  test.setTimeout(180_000);
  const db = new PrismaClient();
  const suffix = randomUUID();
  // Isolate registration rate buckets across manual reruns on this local server.
  const testIp = `192.0.2.${1 + parseInt(suffix.slice(0, 2), 16) % 254}`;
  const emails = [`community-owner-${suffix}@example.test`, `community-member-${suffix}@example.test`];
  const member = await browser.newContext({ baseURL, viewport: { width: 1280, height: 900 }, colorScheme: "dark" });
  const memberPage = await member.newPage();
  const visitor = await browser.newContext({ baseURL });
  let slug = "";
  try {
    for (const [index, client] of [context, member].entries()) {
      const response = await client.request.post("/api/accounts", { headers: { Origin: baseURL, "X-Forwarded-For": testIp }, data: {
        email: emails[index], ownerName: index ? "Topluluk Katılımcısı" : "Topluluk Kurucusu", playlistName: "Geçici test", password: `Test-${suffix}-42`,
      } });
      expect(response.status()).toBe(200);
      expect((await client.cookies()).some(cookie => cookie.name === "account_session")).toBe(true);
    }
    await page.addInitScript(() => localStorage.setItem("listekutusu-theme", "dark"));
    await memberPage.addInitScript(() => localStorage.setItem("listekutusu-theme", "dark"));
    await page.goto("/communities/create");
    await page.getByRole("textbox", { name: "Topluluk adı", exact: true }).fill("Kutu Oyunu Denemesi");
    await page.getByRole("textbox", { name: "Açıklama", exact: true }).fill("Birlikte kutu oyunlarını konuşuyoruz.");
    await page.getByRole("textbox", { name: "Topluluk kuralları", exact: true }).fill("Saygılı ol ve kişisel bilgileri paylaşma.");
    await page.getByRole("button", { name: "Topluluk oluştur", exact: true }).click();
    await expect(page).toHaveURL(/\/communities\/kutu-oyunu-denemesi-/, { timeout: 30_000 });
    slug = new URL(page.url()).pathname.split("/").at(-1)!;
    const api = `/api/communities/${slug}`;
    await expect(page.getByText("Topluluğun sahibisin", { exact: true })).toBeVisible();
    expect((await visitor.request.post(api, { headers: { Origin: baseURL }, data: { action: "join" } })).status()).toBe(401);
    expect((await context.request.post(api, { headers: { Origin: "https://evil.test" }, data: { action: "join" } })).status()).toBe(403);
    expect((await context.request.post(api, { headers: { Origin: baseURL, "Content-Type": "application/json" }, data: "{" })).status()).toBe(400);
    expect((await context.request.post(api, { headers: { Origin: baseURL }, data: { body: "x".repeat(24_001) } })).status()).toBe(413);
    await memberPage.goto(`/communities/${slug}`);
    await expect(memberPage.getByRole("textbox", { name: "Paylaşım başlığı", exact: true })).toHaveCount(0);
    await memberPage.getByRole("button", { name: "Topluluğa katıl", exact: true }).click();
    const title = memberPage.getByRole("textbox", { name: "Paylaşım başlığı", exact: true });
    await expect(title).toBeEnabled();
    await title.fill("İlk oyun sohbetimiz");
    await memberPage.getByRole("textbox", { name: "Paylaşımın", exact: true }).fill("Bu hafta hangi kutu oyununu konuşalım?");
    await memberPage.getByRole("button", { name: "Paylaş", exact: true }).click();
    const topic = memberPage.getByRole("button", { name: "İlk oyun sohbetimiz", exact: true });
    await expect(topic).toBeVisible(); await topic.click();
    const comment = memberPage.getByRole("textbox", { name: "Yorumun", exact: true });
    await expect(comment).toBeEnabled(); await comment.fill("Ben Catan öneriyorum.");
    await memberPage.getByRole("button", { name: "Yorum gönder", exact: true }).click();
    await expect(memberPage.getByText("Ben Catan öneriyorum.", { exact: true })).toBeVisible();
    await page.reload();
    await page.getByRole("button", { name: "İlk oyun sohbetimiz", exact: true }).click();
    const post = page.getByRole("article").filter({ has: page.getByRole("heading", { name: "İlk oyun sohbetimiz", exact: true }) });
    await expect(post.getByRole("button", { name: "Bildir", exact: true })).toBeEnabled();
    await post.getByRole("button", { name: "Bildir", exact: true }).click();
    await page.getByRole("textbox", { name: "Bildirim nedeni", exact: true }).fill("Moderasyon denemesi yapılıyor.");
    await page.getByRole("button", { name: "Bildirim gönder", exact: true }).click();
    await page.getByText("Topluluğu yönet", { exact: true }).click();
    await expect(page.getByText("Paylaşım bildirimi: Moderasyon denemesi yapılıyor.", { exact: true })).toBeVisible();
    const publicData = await (await visitor.request.get(api)).json();
    expect(publicData.reports).toEqual([]); expect(publicData.members).toEqual([]);
    expect((await member.request.post(api, { headers: { Origin: baseURL }, data: { action: "moderate-member", userId: "unknown", operation: "ban" } })).status()).toBe(403);
    await page.evaluate(() => { (document.activeElement as HTMLElement | null)?.blur(); window.scrollTo(0, 0); });
    await page.screenshot({ path: "test-results/browser/community-desktop-dark.png", fullPage: true, animations: "disabled" });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await post.getByRole("button", { name: "Paylaşımı kaldır", exact: true }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Onayla", exact: true }).click();
    await expect(page.getByRole("button", { name: "İlk oyun sohbetimiz", exact: true })).toHaveCount(0);
    await expect(page.getByText("Bekleyen bildirim yok.", { exact: true })).toBeVisible();
    const memberRow = page.locator("details .community-divider").filter({ has: page.getByRole("link", { name: "Topluluk Katılımcısı", exact: true }) });
    await expect(memberRow.getByRole("button", { name: "Uzaklaştır", exact: true })).toBeEnabled();
    await memberRow.getByRole("button", { name: "Uzaklaştır", exact: true }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Onayla", exact: true }).click();
    await expect(memberRow.getByText("Uzaklaştırıldı", { exact: true })).toBeVisible();
    expect((await member.request.post(api, { headers: { Origin: baseURL }, data: { action: "join" } })).status()).toBe(403);
    await memberPage.reload();
    await expect(memberPage.getByText("Bu topluluğa katılımın kapatılmış.", { exact: true })).toBeVisible();
    await expect(memberPage.getByRole("textbox", { name: "Paylaşım başlığı", exact: true })).toHaveCount(0);
  } finally {
    await member.close(); await visitor.close();
    try {
      const users = await db.userList.findMany({ where: { email: { in: emails } }, select: { id: true } });
      // Community is deleted first, and only if owned by this run's randomized accounts.
      await db.community.deleteMany({ where: { ownerId: { in: users.map(user => user.id) } } });
      await db.userList.deleteMany({ where: { email: { in: emails } } });
    } finally { await db.$disconnect(); }
  }
});
