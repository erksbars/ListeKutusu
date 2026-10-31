import { expect, test } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";

test("real session chooses own library reference, publishes and retains snapshot", async ({ page, context, browser, baseURL }) => {
  test.skip(process.env.COMMUNITY_E2E !== "1", "Local database integration is opt-in.");
  if (!baseURL || new URL(baseURL).hostname !== "127.0.0.1") throw new Error("Local test only");
  test.setTimeout(150_000);
  const db = new PrismaClient();
  const suffix = randomUUID();
  const email = `review-link-${suffix}@example.test`;
  const visitor = await browser.newContext({ baseURL });
  try {
    const response = await context.request.post("/api/accounts", { headers: { Origin: baseURL, "X-Forwarded-For": `192.0.2.${1 + parseInt(suffix.slice(0, 2), 16) % 254}` }, data: { ownerName: "Kitaplık İnceleme Denemesi", playlistName: "Geçici test", email, password: `Test-${suffix}-42` } });
    expect(response.status()).toBe(200);
    const user = await db.userList.findUniqueOrThrow({ where: { email }, select: { id: true } });
    // Local metadata fixture, not a live provider or a forged session.
    const book = await db.mediaLibraryEntry.create({ data: { userId: user.id, kind: "book", provider: "openlibrary", externalId: "OL166894W", catalogId: "openlibrary:book:OL166894W", title: "Suç ve Ceza", creators: '["Fyodor Dostoyevski"]', status: "reading", sourceUrl: "https://openlibrary.org/works/OL166894W" } });
    const created = await context.request.post("/api/communities", { headers: { Origin: baseURL }, data: { name: "Kitaplık Denemesi", category: "interest", description: "İnceleme bağlantısı için geçici topluluk.", rules: "Saygılı ol ve spoiler işaretle." } });
    expect(created.status()).toBe(201);
    const { slug } = await created.json();
    expect((await visitor.request.get("/api/communities/references?kind=book")).status()).toBe(401);
    await page.addInitScript(() => localStorage.setItem("listekutusu-theme", "dark"));
    await page.goto(`/communities/${slug}`);
    await page.locator("summary").filter({ hasText: /^Sohbet veya inceleme paylaş$/ }).click();
    const type = page.getByRole("combobox", { name: "Paylaşım türü", exact: true });
    await expect(type).toBeEnabled({ timeout: 30_000 });
    await type.selectOption("review");
    await page.getByRole("combobox", { name: "İnceleme türü", exact: true }).selectOption("book");
    await page.getByRole("combobox", { name: "Eser seçimi", exact: true }).selectOption("library");
    const selection = page.getByRole("combobox", { name: "Kitaplığından eser seç", exact: true });
    await expect(selection).toBeEnabled();
    await selection.selectOption(book.id);
    await expect(page.getByText(/Özel kitaplığının tamamı ve okuma\/izleme durumu paylaşılmaz/)).toBeVisible();
    await page.getByRole("textbox", { name: "Paylaşım başlığı", exact: true }).fill("Kitaplığımdan bir inceleme");
    const text = "Karakterlerin seçimleri ve iç çatışmaları üzerine düşündüren bir okuma oldu.";
    await page.getByRole("textbox", { name: "İncelemen", exact: true }).fill(text);
    await page.evaluate(() => { (document.activeElement as HTMLElement | null)?.blur(); window.scrollTo({ top: 0, behavior: "instant" }); });
    await page.screenshot({ path: "test-results/browser/review-library-picker-desktop.png", fullPage: true, animations: "disabled" });
    await page.getByRole("button", { name: "İncelemeyi yayınla", exact: true }).click();
    const postCard = page.locator("[data-feed-id]").filter({ has: page.getByRole("heading", { name: "Kitaplığımdan bir inceleme", exact: true }) });
    await expect(postCard).toBeVisible();
    await postCard.locator(".feed-post-permalink").click(); await expect(page).toHaveURL(/post=/);
    await expect(page.getByText(text, { exact: true })).toBeVisible();
    await expect(page.getByText("Kitaplıktan seçildi · openlibrary", { exact: false })).toBeVisible();
    const publicData = await (await visitor.request.get(`/api/communities/${slug}`)).json();
    expect(publicData.posts[0].subjectTitle).toBe(book.title);
    expect(publicData.posts[0].referenceProvider).toBe("openlibrary");
    expect(publicData.posts[0].libraryEntryId).toBeUndefined(); expect(publicData.posts[0].readingStatus).toBeUndefined();
    expect((await db.mediaLibraryEntry.findUniqueOrThrow({ where: { id: book.id } })).status).toBe("reading");
    await db.mediaLibraryEntry.delete({ where: { id: book.id } });
    const canonical = page.url();
    await page.reload();
    await expect(page).toHaveURL(canonical);
    await expect(page.getByText(text, { exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: /Eser bağlantısı/ })).toHaveAttribute("href", "https://openlibrary.org/works/OL166894W");
  } finally {
    await visitor.close();
    try {
      const users = await db.userList.findMany({ where: { email }, select: { id: true } });
      await db.community.deleteMany({ where: { ownerId: { in: users.map(user => user.id) } } });
      await db.userList.deleteMany({ where: { email } });
    } finally { await db.$disconnect(); }
  }
});
