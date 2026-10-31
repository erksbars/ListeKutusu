import { expect, test } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";

test("real review validation, persistence and opt-in spoiler reveal", async ({ page, context, browser, baseURL }) => {
  test.skip(process.env.COMMUNITY_E2E !== "1", "Real local community check is opt-in.");
  if (!baseURL || new URL(baseURL).hostname !== "127.0.0.1") throw new Error("Local test only");
  test.setTimeout(180_000);
  const db = new PrismaClient();
  const suffix = randomUUID();
  const email = `community-review-${suffix}@example.test`;
  const visitor = await browser.newContext({ baseURL, viewport: { width: 1280, height: 900 }, colorScheme: "dark" });
  const visitorPage = await visitor.newPage();
  const reviewText = "Filmin sonunda karakterin seçimi bütün hikâyeyi farklı anlamlandırıyor.";
  try {
    const registration = await context.request.post("/api/accounts", { headers: { Origin: baseURL, "X-Forwarded-For": `192.0.2.${1 + parseInt(suffix.slice(0, 2), 16) % 254}` }, data: {
      ownerName: "İnceleme Denemesi", playlistName: "Geçici test", email, password: `Test-${suffix}-42`,
    } });
    expect(registration.status()).toBe(200);
    expect((await context.cookies()).some(cookie => cookie.name === "account_session")).toBe(true);
    const user = await db.userList.findUniqueOrThrow({ where: { email }, select: { id: true } });
    const created = await context.request.post("/api/communities", { headers: { Origin: baseURL }, data: { name: "İnceleme Kulübü", category: "interest", description: "Film ve kitapları konuşuyoruz.", rules: "Başlıklara spoiler yazmayın." } });
    expect(created.status()).toBe(201);
    const { slug } = await created.json();
    const api = `/api/communities/${slug}`;
    await page.addInitScript(() => localStorage.setItem("listekutusu-theme", "dark"));
    await visitorPage.addInitScript(() => localStorage.setItem("listekutusu-theme", "dark"));
    await page.goto(`/communities/${slug}`);
    await page.locator("summary").filter({ hasText: /^Sohbet veya inceleme paylaş$/ }).click();
    const type = page.getByRole("combobox", { name: "Paylaşım türü", exact: true });
    await expect(type).toBeEnabled({ timeout: 30_000 });
    await type.selectOption("review");
    await page.getByRole("combobox", { name: "İnceleme türü", exact: true }).selectOption("movie");
    await page.getByRole("textbox", { name: "Eser adı", exact: true }).fill("Inception");
    await page.getByRole("combobox", { name: "Puanın", exact: true }).selectOption("9");
    await page.getByRole("checkbox", { name: "Spoiler içeriyor", exact: true }).check();
    await page.getByRole("textbox", { name: "Paylaşım başlığı", exact: true }).fill("Inception üzerine düşüncelerim");
    const body = page.getByRole("textbox", { name: "İncelemen", exact: true });
    await body.fill(reviewText);
    const source = page.getByRole("textbox", { name: "Eser bağlantısı (isteğe bağlı)", exact: true });
    await source.fill("https://example.test/sahte");
    await page.getByRole("button", { name: "İncelemeyi yayınla", exact: true }).click();
    await expect(page.getByRole("alert").filter({ hasText: "HTTPS bağlantısı kullan" })).toBeVisible();
    await expect(body).toHaveValue(reviewText);
    expect(await db.communityPost.count({ where: { authorId: user.id } })).toBe(0);
    await source.fill("https://www.wikidata.org/wiki/Q25188");
    await page.getByRole("button", { name: "İncelemeyi yayınla", exact: true }).click();
    const topic = page.getByRole("heading", { name: "Inception üzerine düşüncelerim", exact: true });
    await expect(topic).toBeVisible();
    const record = await db.communityPost.findFirstOrThrow({ where: { authorId: user.id } });
    expect(record.rating).toBe(9); expect(record.type).toBe("review"); expect(record.spoiler).toBe(true);
    expect(await db.mediaLibraryEntry.count({ where: { userId: user.id } })).toBe(0);
    const listing = await (await visitor.request.get(api)).json();
    expect(listing.posts[0].excerpt).toBe(""); expect(listing.posts[0].body).toBeUndefined();
    const timeline = await (await visitor.request.get(`${api}/timeline?kind=all`)).json();
    expect(timeline.items[0].excerpt).toBe(""); expect(timeline.items[0].content).toBe(""); expect(timeline.items[0].body).toBeUndefined();
    await page.reload();
    const card = page.locator(`[data-feed-id="post:${record.id}"]`);
    await expect(page.getByText(reviewText, { exact: true })).toHaveCount(0);
    await card.getByRole("button", { name: "Spoiler içeren metni göster", exact: true }).click();
    await expect(page.getByText(reviewText, { exact: true })).toBeVisible();
    await card.getByRole("button", { name: /^Yorumlar/ }).click();
    await page.getByRole("textbox", { name: "Yorumun", exact: true }).fill("Bu yorum da son sahne hakkında.");
    await page.getByRole("button", { name: "Yorum gönder", exact: true }).click();
    await expect(page.getByText("Bu yorum da son sahne hakkında.", { exact: true })).toBeVisible();
    await visitorPage.goto(`/communities/${slug}`);
    const visitorCard = visitorPage.locator(`[data-feed-id="post:${record.id}"]`);
    await visitorCard.getByRole("button", { name: /^Yorumlar/ }).click();
    const reveal = visitorCard.getByRole("button", { name: "Spoiler içeren metni göster", exact: true });
    await expect(reveal).toBeVisible();
    await expect(visitorPage.getByText(reviewText, { exact: true })).toHaveCount(0);
    await expect(visitorPage.getByText("Bu yorum da son sahne hakkında.", { exact: true })).toHaveCount(0);
    await reveal.click();
    await expect(visitorPage.getByText(reviewText, { exact: true })).toBeVisible();
    await expect(visitorPage.getByText("Bu yorum da son sahne hakkında.", { exact: true })).toBeVisible();
    await visitorCard.getByRole("button", { name: "Spoilerı gizle", exact: true }).click();
    await expect(visitorPage.getByText(reviewText, { exact: true })).toHaveCount(0);
    await expect(visitorPage.getByText("Bu yorum da son sahne hakkında.", { exact: true })).toHaveCount(0);
    expect(await visitorPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await visitorPage.evaluate(() => { (document.activeElement as HTMLElement | null)?.blur(); window.scrollTo(0, 0); });
    await visitorPage.screenshot({ path: "test-results/browser/community-review-desktop-dark.png", fullPage: true, animations: "disabled" });
    await visitorCard.locator(".feed-post-permalink").click();
    await expect(visitorPage.getByRole("link", { name: /Eser bağlantısı/ })).toHaveAttribute("rel", "noopener noreferrer nofollow ugc");
  } finally {
    await visitor.close();
    try {
      const users = await db.userList.findMany({ where: { email }, select: { id: true } });
      await db.community.deleteMany({ where: { ownerId: { in: users.map(user => user.id) } } });
      await db.userList.deleteMany({ where: { email } });
    } finally { await db.$disconnect(); }
  }
});
