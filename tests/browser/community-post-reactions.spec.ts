import { expect, test, type APIRequestContext } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";

test("community likes and private saved filter with failures, paging, export and archive withdrawal", async ({ page, context, browser, baseURL, request }) => {
  test.skip(process.env.COMMUNITY_E2E !== "1", "Local reaction integration is opt-in.");
  if (!baseURL || new URL(baseURL).hostname !== "127.0.0.1") throw new Error("Local test only");
  test.setTimeout(180_000); page.setDefaultTimeout(25_000);
  const db = new PrismaClient(), suffix = randomUUID(), emails = [0, 1].map(index => `reactions-${index}-${suffix}@example.test`), ids: string[] = [];
  const owner = await browser.newContext({ baseURL }), headers = { Origin: baseURL }, password = `Test-${suffix}-42`;
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  try {
    for (const [index, client] of [context, owner].entries()) {
      const registration = await client.request.post("/api/accounts", { headers: { ...headers, "X-Forwarded-For": `192.0.2.${1 + parseInt(suffix.slice(0, 2), 16) % 254}` }, data: { email: emails[index], password, ownerName: index ? "Etkileşim Kurucusu" : "Etkileşim Okuru", playlistName: "Geçici test" } });
      expect(registration.status()).toBe(200); ids.push((await db.userList.findUniqueOrThrow({ where: { email: emails[index] }, select: { id: true } })).id);
    }
    const created = await owner.request.post("/api/communities", { headers, data: { name: "Özel Kayıt Denemesi", category: "interest", description: "Beğeni ve özel kayıt için geçici test topluluğu.", rules: "Gerçek bir topluluk değildir; yalnız test verisidir." } });
    expect(created.status()).toBe(201); const { slug } = await created.json(), api = `/api/communities/${slug}`;
    const community = await db.community.findUniqueOrThrow({ where: { slug } });
    const posted = await owner.request.post(api, { headers, data: { action: "create-post", title: "Kaydedilebilir sohbet", body: "Sahibine özel kaydetme ve beğeni testi sohbetidir." } });
    expect(posted.status()).toBe(200); const { post } = await posted.json();
    const react = (client: APIRequestContext, action: string, active: boolean) => client.post(api, { headers, data: { action, active, postId: post.id } });
    expect((await react(context.request, "set-like", true)).status()).toBe(403);
    expect((await react(request, "set-like", true)).status()).toBe(401);
    expect((await owner.request.get(`${api}?saved=invalid`)).status()).toBe(400);
    expect((await request.get(`${api}?saved=1`)).status()).toBe(401);
    expect((await context.request.post(api, { headers, data: { action: "join" } })).status()).toBe(200);
    await page.addInitScript(() => localStorage.setItem("listekutusu-theme", "dark")); await page.goto(`/communities/${slug}`);
    const card = page.locator(`[data-feed-id="post:${post.id}"]`);
    await expect(card.getByRole("button", { name: "Beğen", exact: true })).toBeEnabled();
    let fail = true;
    await page.route(`**/api/communities/${slug}`, route => { if (route.request().method() !== "POST" || !fail) return route.continue(); fail = false; return route.fulfill({ status: 503, json: { error: "Geçici etkileşim hatası" } }); });
    await card.getByRole("button", { name: "Beğen", exact: true }).click();
    await expect(page.getByRole("alert").filter({ hasText: "Geçici etkileşim hatası" })).toBeVisible(); await expect(card.getByText("0 beğeni", { exact: true })).toBeVisible();
    await card.getByRole("button", { name: "Beğen", exact: true }).click(); await expect(card.getByText("1 beğeni", { exact: true })).toBeVisible();
    await card.getByRole("button", { name: "Kaydet", exact: true }).click(); await expect(card.getByRole("button", { name: "Kaydı kaldır", exact: true })).toBeVisible();
    expect((await react(context.request, "set-like", true)).status()).toBe(200); expect(await db.communityPostLike.count({ where: { postId: post.id } })).toBe(1);
    const saved = page.getByRole("button", { name: "Kaydettiklerim", exact: true });
    await saved.click(); await expect(page).toHaveURL(/saved=1/); await expect(card).toBeVisible(); await page.reload(); await expect(saved).toHaveAttribute("aria-pressed", "true");
    const ownExport = await (await context.request.get("/api/accounts/export")).json(); expect(ownExport.account.communityPostSaves).toHaveLength(1); expect(ownExport.account.communityPostLikes).toHaveLength(1);
    const ownerSaved = await (await owner.request.get(`${api}?saved=1&userId=${ids[0]}`)).json(); expect(ownerSaved.posts).toHaveLength(0);
    const outsider = (await (await owner.request.get(api)).json()).posts[0]; expect(outsider.viewerSaved).toBe(false); expect(outsider.viewerLiked).toBe(false);
    const publicPost = (await (await request.get(api)).json()).posts[0]; expect(publicPost.likeCount).toBe(1);
    for (const field of ["saves", "likes", "saveCount", "saverIds", "likerIds"]) expect(publicPost[field]).toBeUndefined();
    await saved.click(); await expect(page).not.toHaveURL(/saved=1/); await page.goBack(); await expect(saved).toHaveAttribute("aria-pressed", "true");
    await card.locator(".feed-post-permalink").click();
    await page.getByRole("button", { name: "Kaydı kaldır", exact: true }).click(); await expect(page.getByRole("button", { name: "Kaydet", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Akışa dön", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Bu filtrelerde kaydın yok", exact: true })).toBeVisible();
    expect((await react(context.request, "set-save", true)).status()).toBe(200);
    const rows = Array.from({ length: 20 }, (_, index) => ({ id: `reaction-fixture-${suffix}-${index}`, communityId: community.id, authorId: ids[1], title: `Özel sayfa kaydı ${index}`, body: "Yalnız özel kayıt sayfalama fixture'ıdır.", createdAt: new Date(Date.now() - (index + 1) * 86400_000) }));
    await db.communityPost.createMany({ data: rows }); await db.communityPostSave.createMany({ data: rows.map(row => ({ userId: ids[0], postId: row.id })) });
    await page.reload(); await expect(page.locator("[data-feed-id]")).toHaveCount(10);
    for (let next = 2; next <= 3; next++) { await page.getByRole("button", { name: "Sonraki paylaşımlar", exact: true }).click(); await expect(page).toHaveURL(new RegExp(`page=${next}`)); }
    expect(new URL(page.url()).searchParams.get("cursor")).toBeTruthy();
    await expect(page.locator("[data-feed-id]")).toHaveCount(1);
    await page.getByRole("button", { name: "Kaydı kaldır", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Bu filtrelerde kaydın yok", exact: true })).toBeVisible();
    await expect(page.locator("[data-feed-id]")).toHaveCount(0); expect(await db.communityPostSave.count({ where: { userId: ids[0] } })).toBe(20);
    await page.getByRole("button", { name: "Önceki paylaşımlar", exact: true }).click(); await expect(page).toHaveURL(/page=2/);
    await expect(page.locator("[data-feed-id]")).toHaveCount(10);
    await page.getByRole("button", { name: "Önceki paylaşımlar", exact: true }).click(); await expect(page).not.toHaveURL(/page=2/);
    await expect(page.locator("[data-feed-id]")).toHaveCount(10); await expect(card).toBeVisible();
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" })); await page.screenshot({ path: "test-results/browser/community-post-reactions-desktop.png", fullPage: false, animations: "disabled" });
    expect((await owner.request.post(`${api}/ownership`, { headers, data: { action: "archive", confirmation: "TOPLULUĞU ARŞİVLE" } })).status()).toBe(200);
    await page.reload(); await expect(page.getByText(/Bu topluluk arşivde/)).toBeVisible();
    await card.getByRole("button", { name: "Beğeniyi kaldır", exact: true }).click(); await expect(card.getByText("0 beğeni", { exact: true })).toBeVisible();
    expect((await react(context.request, "set-like", true)).status()).toBe(409);
    await card.getByRole("button", { name: "Kaydı kaldır", exact: true }).click(); await expect(card).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true); expect(errors).toEqual([]);
  } finally {
    const leftovers = await db.userList.findMany({ where: { email: { in: emails } }, select: { id: true } });
    const all = [...new Set([...ids, ...leftovers.map(user => user.id)])];
    await db.community.deleteMany({ where: { ownerId: { in: all } } }); await db.userList.deleteMany({ where: { id: { in: all } } });
    await owner.close(); await db.$disconnect();
  }
});
