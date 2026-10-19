import { expect, test } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";

test("explicit distribution appears at home, opens correct content and can be withdrawn", async ({ page, context, browser, baseURL }) => {
  test.skip(process.env.COMMUNITY_E2E !== "1", "Local community distribution integration is opt-in.");
  if (!baseURL || new URL(baseURL).hostname !== "127.0.0.1") throw new Error("Local test only");
  test.setTimeout(180_000);
  const db = new PrismaClient(), suffix = randomUUID(), email = `distribution-${suffix}@example.test`;
  const visitor = await browser.newContext({ baseURL, viewport: { width: 1280, height: 900 }, colorScheme: "dark" });
  const guest = await visitor.newPage();
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message)); guest.on("pageerror", error => errors.push(error.message));
  try {
    const registered = await context.request.post("/api/accounts", { headers: { Origin: baseURL, "X-Forwarded-For": `192.0.2.${1 + parseInt(suffix.slice(0, 2), 16) % 254}` }, data: { ownerName: "Akış Testi", playlistName: "Geçici test", email, password: `Test-${suffix}-42` } });
    expect(registered.status()).toBe(200);
    const response = await context.request.post("/api/communities", { headers: { Origin: baseURL }, data: { name: "Genel Akış Test Topluluğu", category: "interest", description: "Yalnız otomatik dağıtım testi.", rules: "Gerçek buluşma veya gerçek içerik değildir." } });
    expect(response.status()).toBe(201); const { slug } = await response.json();
    const api = `/api/communities/${slug}`;
    expect((await context.request.post(api, { headers: { Origin: baseURL }, data: { action: "create-post", title: "Yalnız topluluk denemesi", body: "Genel akışta yer almamalı." } })).status()).toBe(200);
    for (const target of [page, guest]) {
      await target.addInitScript(() => localStorage.setItem("listekutusu-theme", "dark"));
      await target.route("**/api/discovery/random**", route => route.fulfill({ json: { sourceName: "Yerel test seçkisi", total: 0, tracks: [] } }));
    }
    await page.goto(`/communities/${slug}`);
    await page.getByRole("combobox", { name: "Paylaşım türü", exact: true }).selectOption("review");
    await page.getByRole("textbox", { name: "Eser adı", exact: true }).fill("Kurgusal film");
    await page.getByRole("textbox", { name: "Paylaşım başlığı", exact: true }).fill("Genel akış inceleme denemesi");
    await page.getByRole("textbox", { name: "İncelemen", exact: true }).fill("Bu gizli spoiler metni yalnız açınca görünmeli.");
    await page.getByRole("checkbox", { name: "Spoiler içeriyor", exact: true }).check();
    await page.getByRole("combobox", { name: "Akışta gösterim", exact: true }).selectOption("general");
    await page.getByRole("button", { name: "İncelemeyi yayınla", exact: true }).click();
    await expect(page.getByRole("button", { name: "Genel akış inceleme denemesi", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Etkinlikler", exact: true }).click();
    await page.getByRole("textbox", { name: "Etkinlik başlığı", exact: true }).fill("Genel akış etkinlik denemesi");
    await page.getByRole("textbox", { name: "Etkinlik açıklaması", exact: true }).fill("Kurgusal duyurudur; gerçek buluşma veya rezervasyon değildir.");
    await page.locator('input[name="localStart"]').fill(new Date(Date.now() + 7 * 86_400_000 + 3 * 3_600_000).toISOString().slice(0, 16));
    await page.getByRole("textbox", { name: "Şehir", exact: true }).fill("Örnek şehir");
    await page.getByRole("textbox", { name: "Mekân", exact: true }).fill("Kurgusal kamusal mekân");
    await page.getByRole("checkbox", { name: "Etkinlik ve mekân bilgilerinin herkese açık olduğunu biliyorum.", exact: true }).check();
    await page.getByRole("combobox", { name: "Akışta gösterim", exact: true }).last().selectOption("general");
    await page.getByRole("button", { name: "Etkinliği yayınla", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Genel akış etkinlik denemesi", exact: true })).toBeVisible();
    const feedResponse = await visitor.request.get("/api/communities/feed");
    expect(feedResponse.headers()["cache-control"]).toContain("no-store");
    const items = (await feedResponse.json()).items.filter((item: { community: { slug: string } }) => item.community.slug === slug);
    expect(items).toHaveLength(2);
    expect(JSON.stringify(items)).not.toContain("gizli spoiler metni");
    const review = items.find((item: { kind: string }) => item.kind === "post");
    await guest.goto("/");
    const feed = guest.locator("#feed-posts");
    await expect(feed.getByRole("heading", { name: "Genel akış inceleme denemesi", exact: true })).toBeVisible({ timeout: 30_000 });
    await expect(feed.getByText("Yalnız topluluk denemesi", { exact: true })).toHaveCount(0);
    await expect(feed.getByText("Bu gizli spoiler metni", { exact: false })).toHaveCount(0);
    await expect(guest.locator("#feed-posts")).toHaveAttribute("aria-busy", "false", { timeout: 30_000 });
    await guest.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await guest.screenshot({ path: "test-results/browser/community-distribution-desktop.png", fullPage: true, animations: "disabled" });
    expect(await guest.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await feed.getByRole("heading", { name: "Genel akış etkinlik denemesi", exact: true }).getByRole("link").click();
    await expect(guest.getByRole("heading", { name: "Genel akış etkinlik denemesi", exact: true })).toBeVisible({ timeout: 30_000 });
    await expect(guest.getByRole("button", { name: "Katılacağım", exact: true })).toHaveCount(0);
    await guest.goto("/");
    await feed.getByRole("heading", { name: "Genel akış inceleme denemesi", exact: true }).getByRole("link").click();
    await expect(guest).toHaveURL(new RegExp(`post=${review.id}`));
    await expect(guest.getByText("Bu gizli spoiler metni yalnız açınca görünmeli.", { exact: true })).toHaveCount(0);
    await guest.getByRole("button", { name: "İncelemeyi ve yorumları göster", exact: true }).click();
    await expect(guest.getByText("Bu gizli spoiler metni yalnız açınca görünmeli.", { exact: true })).toBeVisible();
    await page.goto(`/communities/${slug}?post=${review.id}`);
    await page.getByRole("combobox", { name: "Akışta gösterim", exact: true }).selectOption("community");
    await expect(page.getByText("Yalnız topluluk akışında dağıtılıyor", { exact: true })).toBeVisible();
    const current = await (await visitor.request.get("/api/communities/feed")).json();
    expect(current.items.some((item: { id: string }) => item.id === review.id)).toBe(false);
    expect((await visitor.request.get(`${api}/posts/${review.id}`)).status()).toBe(200);
    expect(errors).toEqual([]);
  } finally {
    await visitor.close();
    try {
      const user = await db.userList.findUnique({ where: { email }, select: { id: true } });
      if (user) { await db.community.deleteMany({ where: { ownerId: user.id } }); await db.userList.delete({ where: { id: user.id } }); }
    } finally { await db.$disconnect(); }
  }
});
