import { expect, test } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";

test("mixed community reactions and private cross-community saved center", async ({ page, context, browser, baseURL, request }) => {
  test.skip(process.env.COMMUNITY_E2E !== "1", "Local integration is opt-in.");
  if (!baseURL || new URL(baseURL).hostname !== "127.0.0.1") throw new Error("Local test only");
  test.setTimeout(180_000); page.setDefaultTimeout(25_000);
  const db = new PrismaClient(), suffix = randomUUID(), emails = [0, 1].map(i => `saved-center-${i}-${suffix}@example.test`), ids: string[] = [];
  const author = await browser.newContext({ baseURL }), headers = { Origin: baseURL }, sources: { id: string; slug: string }[] = [];
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  try {
    for (const [i, client] of [context, author].entries()) {
      const registered = await client.request.post("/api/accounts", { headers: { ...headers, "X-Forwarded-For": `192.0.2.${1 + parseInt(suffix.slice(0, 2), 16) % 254}` }, data: { email: emails[i], password: `Test-${suffix}-42`, ownerName: i ? "Kayıt Merkezi Yazarı" : "Kayıt Merkezi Okuru", playlistName: "Geçici test" } });
      expect(registered.status()).toBe(200); ids.push((await db.userList.findUniqueOrThrow({ where: { email: emails[i] } })).id);
    }
    for (let i = 0; i < 2; i++) {
      const response = await author.request.post("/api/communities", { headers, data: { name: `Kayıt Merkezi Denemesi ${i}`, category: "interest", description: "Gerçek olmayan geçici test topluluğudur.", rules: "Yalnız test fixture verisi kullanılır." } });
      expect(response.status()).toBe(201); const { slug } = await response.json();
      sources.push(await db.community.findUniqueOrThrow({ where: { slug }, select: { id: true, slug: true } }));
      expect((await context.request.post(`/api/communities/${slug}`, { headers, data: { action: "join" } })).status()).toBe(200);
    }
    const post = await db.communityPost.create({ data: { communityId: sources[0].id, authorId: ids[1], title: "Merkezdeki kitap incelemesi", body: "Bu gizli spoiler metni DOM veya liste DTO içinde görünmez.", type: "review", reviewKind: "book", subjectTitle: "Kurgusal kitap", rating: 8, spoiler: true, distribution: "general", createdAt: new Date(Date.now() + 1000) } });
    const other = await db.communityPost.create({ data: { communityId: sources[1].id, authorId: ids[1], title: "Diğer topluluktaki sohbet", body: "Yalnız kaynak toplulukta yayımlanan test sohbeti." } });
    await db.communityPostSave.create({ data: { userId: ids[0], postId: other.id, createdAt: new Date(Date.now() - 10_000) } });
    const api = `/api/communities/${sources[0].slug}`;
    expect((await request.get("/api/communities/saved")).status()).toBe(401);
    expect((await context.request.get("/api/communities/saved?page=101")).status()).toBe(400);
    const foreign = await author.request.get(`/api/communities/saved?userId=${ids[0]}`); expect(foreign.headers()["cache-control"]).toBe("private, no-store"); expect((await foreign.json()).items).toEqual([]);
    await page.addInitScript(() => localStorage.setItem("listekutusu-theme", "dark"));
    await page.route("**/api/discovery/random**", route => route.fulfill({ json: { sourceName: "Yerel test", total: 0, tracks: [] } }));
    await page.goto("/"); const card = page.locator(`[data-feed-id="post:${post.id}"]`);
    await expect(card.getByRole("button", { name: "Beğen", exact: true })).toBeEnabled();
    let fail = true;
    await page.route(`**${api}`, route => { if (route.request().method() !== "POST" || !fail) return route.continue(); fail = false; return route.fulfill({ status: 503, json: { error: "Geçici karma kart hatası" } }); });
    await card.getByRole("button", { name: "Beğen", exact: true }).click(); await expect(card.getByRole("alert")).toHaveText("Geçici karma kart hatası"); await expect(card.getByText("0 beğeni", { exact: true })).toBeVisible();
    await card.getByRole("button", { name: "Beğen", exact: true }).click(); await expect(card.getByText("1 beğeni", { exact: true })).toBeVisible();
    await card.getByRole("button", { name: "Kaydet", exact: true }).click(); await expect(card.getByRole("button", { name: "Kaydı kaldır", exact: true })).toBeVisible();
    await page.getByRole("link", { name: "Topluluk kayıtlarım", exact: true }).click(); await expect(page.getByRole("heading", { name: "Topluluk kayıtlarım", exact: true })).toBeVisible();
    await expect(page.getByRole("article")).toHaveCount(2); await expect(page.getByRole("article").first()).toContainText(post.title);
    await expect(page.getByText(post.body, { exact: true })).toHaveCount(0);
    await page.getByRole("combobox", { name: "Kayıt türü", exact: true }).selectOption("review"); await expect(page).toHaveURL(/postType=review/); await expect(page.getByRole("article")).toHaveCount(1);
    await page.getByRole("combobox", { name: "İnceleme alanı", exact: true }).selectOption("book"); await expect(page).toHaveURL(/reviewKind=book/); await page.reload(); await expect(page.getByRole("combobox", { name: "İnceleme alanı", exact: true })).toHaveValue("book");
    await page.getByRole("combobox", { name: "Kayıt türü", exact: true }).selectOption("discussion"); await expect(page.getByRole("article")).toHaveCount(1); await expect(page.getByRole("article")).toContainText(other.title);
    await page.goBack(); await expect(page.getByRole("article")).toContainText(post.title);
    await page.getByRole("combobox", { name: "Kayıt türü", exact: true }).selectOption("all"); await expect(page.getByRole("article")).toHaveCount(2);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await page.screenshot({ path: "test-results/browser/community-saved-center-desktop.png", fullPage: false, animations: "disabled" });
    // A loaded feed card may outlive distribution changes; withdrawal remains safe.
    await page.goto("/"); await expect(page.getByRole("link", { name: "Topluluk kayıtlarım", exact: true })).toBeVisible();
    await Promise.all([page.waitForResponse(response => response.url().includes("/api/feed/mixed?")), page.getByRole("button", { name: "Akışı yenile", exact: true }).click()]);
    await expect(card.getByRole("button", { name: "Beğeniyi kaldır", exact: true })).toBeVisible();
    await db.communityPost.update({ where: { id: post.id }, data: { distribution: "community" } });
    await card.getByRole("button", { name: "Beğeniyi kaldır", exact: true }).click();
    await expect(page.getByText("Bu paylaşım artık bu görünümde bulunmuyor. Listeyi yenileyebilirsin.", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: post.title, exact: true })).toHaveCount(0);
    await page.goto("/community-saved"); await expect(page.getByRole("article")).toHaveCount(2);
    const rows = Array.from({ length: 19 }, (_, i) => ({ id: `saved-center-${suffix}-${i}`, communityId: sources[i % 2].id, authorId: ids[1], title: `Merkez sayfalama ${i}`, body: "Yalnız sayfalama test içeriği." }));
    await db.communityPost.createMany({ data: rows }); await db.communityPostSave.createMany({ data: rows.map(row => ({ userId: ids[0], postId: row.id, createdAt: new Date(Date.now() - 20_000) })) });
    await page.getByRole("button", { name: "Kayıtları yenile", exact: true }).click(); await expect(page.getByRole("article")).toHaveCount(20);
    await page.getByRole("link", { name: "Sonraki kayıtlar", exact: true }).click(); await expect(page).toHaveURL(/page=2/); await expect(page.getByRole("article")).toHaveCount(1);
    await page.getByRole("button", { name: "Kaydı kaldır", exact: true }).click(); await expect(page).toHaveURL(/page=1/); await expect(page.getByRole("article")).toHaveCount(20);
    await db.userBlock.create({ data: { blockerId: ids[1], blockedId: ids[0] } });
    await page.getByRole("button", { name: "Kayıtları yenile", exact: true }).click(); await expect(page.getByText("Bu filtrelerde kaydettiğin görünür paylaşım yok.", { exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true); expect(errors).toEqual([]);
    const anonymous = await browser.newContext({ baseURL });
    try { const anonymousPage = await anonymous.newPage(); await anonymousPage.goto("/community-saved"); await expect(anonymousPage.getByRole("link", { name: "Giriş ekranı ↗", exact: true })).toBeVisible(); await expect(anonymousPage.getByRole("article")).toHaveCount(0); }
    finally { await anonymous.close(); }
  } finally {
    const users = await db.userList.findMany({ where: { email: { in: emails } }, select: { id: true } }), targets = [...new Set([...ids, ...users.map(user => user.id)])];
    await db.community.deleteMany({ where: { ownerId: { in: targets } } }); await db.userList.deleteMany({ where: { id: { in: targets } } });
    await author.close(); await db.$disconnect();
  }
});
