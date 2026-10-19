import { expect, test } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { signCatalogSelection } from "../../lib/catalogSelection";
import type { CatalogItem } from "../../lib/mediaCatalog";

test("review catalog choice preserves draft on expiry/failure, avoids library writes and stale search results", async ({ page, context, browser, baseURL, request }) => {
  test.skip(process.env.COMMUNITY_E2E !== "1", "Local catalog integration is opt-in.");
  if (!baseURL || new URL(baseURL).hostname !== "127.0.0.1") throw new Error("Local test only");
  test.setTimeout(180_000); page.setDefaultTimeout(25_000);
  const db = new PrismaClient(), suffix = randomUUID(), emails = [0, 1].map(i => `review-catalog-${i}-${suffix}@example.test`), ids: string[] = [];
  const owner = await browser.newContext({ baseURL }), headers = { Origin: baseURL };
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  let searches = 0, expired = true, release: (() => void) | undefined;
  const book: CatalogItem = { id: "openlibrary:book:OL1W", kind: "book", provider: "openlibrary", externalId: "OL1W", title: "Kurgusal katalog kitabı", creators: ["Test yazarı"], year: 2020, sourceUrl: "https://openlibrary.org/works/OL1W" };
  const tv: CatalogItem = { id: "tvmaze:tv:82", kind: "tv", provider: "tvmaze", externalId: "82", title: "Kurgusal katalog dizisi", creators: [], year: 2014, sourceUrl: "https://www.tvmaze.com/shows/82" };
  try {
    for (const [i, client] of [context, owner].entries()) {
      const registered = await client.request.post("/api/accounts", { headers: { ...headers, "X-Forwarded-For": `192.0.2.${1 + parseInt(suffix.slice(0, 2), 16) % 254}` }, data: { email: emails[i], password: `Test-${suffix}-42`, ownerName: i ? "Katalog Kurucusu" : "Katalog Okuru", playlistName: "Geçici test" } });
      expect(registered.status()).toBe(200); ids.push((await db.userList.findUniqueOrThrow({ where: { email: emails[i] } })).id);
    }
    const source = await owner.request.post("/api/communities", { headers, data: { name: "Doğrudan Katalog Denemesi", category: "interest", description: "Dış sağlayıcı çağrısı yapmayan geçici katalog testidir.", rules: "Yalnız sentetik test verisi kullanılır." } });
    expect(source.status()).toBe(201); const { slug } = await source.json(), api = `/api/communities/${slug}`;
    expect((await context.request.post(api, { headers, data: { action: "join" } })).status()).toBe(200);
    const anonymous = await request.get("/api/catalog/search?kind=book&q=Kitap"); expect(anonymous.status()).toBe(401); expect(anonymous.headers()["cache-control"]).toBe("private, no-store");
    const invalid = await context.request.get("/api/catalog/search?kind=book&q=a"); expect(invalid.status()).toBe(400); expect(invalid.headers()["cache-control"]).toBe("private, no-store");
    // Only search responses are fixture metadata; real signatures and publish API are exercised.
    await page.route("**/api/catalog/search?*", async route => {
      searches++; const params = new URL(route.request().url()).searchParams;
      if (params.get("q") === "Kesinti") return route.fulfill({ status: 503, json: { error: "Geçici katalog kesintisi" } });
      if (params.get("q") === "Boş") return route.fulfill({ json: { results: [], provider: "openlibrary" } });
      if (params.get("q") === "Yavaş") await new Promise<void>(resolve => { release = resolve; });
      const item = params.get("kind") === "tv" ? tv : book;
      await route.fulfill({ json: { results: [{ ...item, selectionToken: signCatalogSelection(item, ids[0], expired ? Date.now() - 31 * 60_000 : Date.now()) }], provider: item.provider } }).catch(() => {});
    });
    await page.addInitScript(() => localStorage.setItem("listekutusu-theme", "dark")); await page.goto(`/communities/${slug}`);
    await page.getByRole("combobox", { name: "Paylaşım türü", exact: true }).selectOption("review");
    const kind = page.getByRole("combobox", { name: "İnceleme türü", exact: true }), mode = page.getByRole("combobox", { name: "Eser seçimi", exact: true });
    await kind.selectOption("book"); await mode.selectOption("catalog");
    const query = page.getByRole("textbox", { name: "Katalogda eser ara", exact: true }), search = page.getByRole("button", { name: "Katalogda ara", exact: true });
    const picker = page.getByRole("combobox", { name: "Katalogdan eser seç", exact: true }), publish = page.getByRole("button", { name: "İncelemeyi yayınla", exact: true });
    const title = page.getByRole("textbox", { name: "Paylaşım başlığı", exact: true }), body = page.getByRole("textbox", { name: "İncelemen", exact: true });
    const draft = "Katalogdan seçilen eser için uzun inceleme taslağı. Spoiler metni burada kalır.";
    await query.fill("Kitap"); await title.fill("Katalogdan kitap hakkındaki düşüncelerim"); await body.fill(draft);
    expect(searches).toBe(0); await expect(publish).toBeDisabled();
    await search.click(); await expect(picker).toBeEnabled(); await picker.selectOption(book.id);
    await page.getByRole("checkbox", { name: "Spoiler içeriyor", exact: true }).check(); await publish.click();
    await expect(page.getByRole("alert").filter({ hasText: "süresi dolmuş" })).toBeVisible(); await expect(body).toHaveValue(draft); await expect(picker).toHaveValue(book.id);
    expect(await db.communityPost.count({ where: { authorId: ids[0] } })).toBe(0);
    expired = false; await search.click(); await expect(picker).toHaveValue(""); await picker.selectOption(book.id);
    await query.fill("Kesinti"); await search.click(); await expect(page.getByRole("alert").filter({ hasText: "Geçici katalog kesintisi" })).toBeVisible(); await expect(body).toHaveValue(draft); await expect(picker).toHaveValue(book.id);
    await query.fill("Boş"); await search.click(); await expect(page.getByText("Bu aramada eser bulunamadı. Başka bir adla ara veya elle girişe dön.", { exact: true })).toBeVisible(); await expect(publish).toBeDisabled();
    await query.fill("Kitap"); await query.press("Enter"); await expect(picker).toBeEnabled(); await picker.selectOption(book.id);
    await expect(body).toHaveValue(draft); await expect(title).toHaveValue("Katalogdan kitap hakkındaki düşüncelerim");
    await publish.click(); const cardTitle = page.getByRole("button", { name: "Katalogdan kitap hakkındaki düşüncelerim", exact: true }); await expect(cardTitle).toBeVisible();
    const post = await db.communityPost.findFirstOrThrow({ where: { authorId: ids[0] } });
    expect(post.subjectTitle).toBe(book.title); expect(post.sourceUrl).toBe(book.sourceUrl); expect(post.referenceProvider).toBe("openlibrary"); expect(post.spoiler).toBe(true);
    expect(await db.mediaLibraryEntry.count({ where: { userId: ids[0] } })).toBe(0); expect(await db.suggestion.count({ where: { listId: ids[0] } })).toBe(0);
    const publicList = await (await request.get(api)).json(); expect(publicList.posts[0].excerpt).toBe(""); expect(JSON.stringify(publicList)).not.toContain("selectionToken"); expect(JSON.stringify(publicList)).not.toContain(draft);
    await cardTitle.click(); await expect(page.getByText(`Kaynaklı eser seçimi · ${book.provider}`, { exact: false })).toBeVisible(); await expect(page.getByText(draft, { exact: true })).toHaveCount(0);
    await expect(page.getByRole("link", { name: /Eser bağlantısı/ })).toHaveAttribute("href", book.sourceUrl);
    await page.getByRole("button", { name: "Akışa dön", exact: true }).click();
    await body.fill("Tür değişimlerinde korunması gereken ikinci taslak metni."); await title.fill("İkinci inceleme taslağı");
    await query.fill("Yavaş"); await search.click(); await expect.poll(() => Boolean(release)).toBe(true);
    await kind.selectOption("tv"); await expect(picker).toHaveValue(""); release?.();
    await query.fill("Dizi"); await search.click(); await expect(picker).toBeEnabled(); await picker.selectOption(tv.id);
    await expect(page.getByRole("link", { name: /TVmaze/ }).first()).toBeVisible(); await expect(picker.locator("option")).toHaveCount(2);
    await expect(body).toHaveValue("Tür değişimlerinde korunması gereken ikinci taslak metni.");
    await page.getByRole("heading", { name: "İnceleme yaz", exact: true }).scrollIntoViewIfNeeded();
    await page.screenshot({ path: "test-results/browser/community-catalog-reference-desktop.png", fullPage: false, animations: "disabled" });
    await kind.selectOption("music"); await expect(mode).toHaveValue("manual"); await expect(mode.locator('option[value="catalog"]')).toBeDisabled();
    await mode.selectOption("library"); await expect(page.getByRole("combobox", { name: "Kitaplığından eser seç", exact: true })).toBeVisible();
    await kind.selectOption("game"); await expect(mode).toHaveValue("manual"); await expect(mode.locator('option[value="catalog"]')).toBeDisabled(); await expect(mode.locator('option[value="library"]')).toBeDisabled();
    const libraryBook = await db.mediaLibraryEntry.create({ data: { userId: ids[0], kind: "book", provider: "openlibrary", externalId: "OL2W", catalogId: "openlibrary:book:OL2W", title: "Özel kitaplıktaki kitap", creators: '["Test yazarı"]', status: "reading", sourceUrl: "https://openlibrary.org/works/OL2W" } });
    await kind.selectOption("book"); await mode.selectOption("library");
    const libraryPicker = page.getByRole("combobox", { name: "Kitaplığından eser seç", exact: true });
    await expect(libraryPicker.locator(`option[value="${libraryBook.id}"]`)).toHaveCount(1); await libraryPicker.selectOption(libraryBook.id);
    await publish.click(); await expect(page.getByRole("button", { name: "İkinci inceleme taslağı", exact: true })).toBeVisible();
    const libraryPost = await db.communityPost.findFirstOrThrow({ where: { authorId: ids[0], title: "İkinci inceleme taslağı" } }); expect(libraryPost.subjectTitle).toBe(libraryBook.title);
    expect(await db.mediaLibraryEntry.count({ where: { userId: ids[0] } })).toBe(1); expect((await db.mediaLibraryEntry.findUniqueOrThrow({ where: { id: libraryBook.id } })).status).toBe("reading");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true); expect(errors).toEqual([]);
  } finally {
    release?.(); const users = await db.userList.findMany({ where: { email: { in: emails } }, select: { id: true } }), targets = [...new Set([...ids, ...users.map(user => user.id)])];
    await db.community.deleteMany({ where: { ownerId: { in: targets } } }); await db.userList.deleteMany({ where: { id: { in: targets } } }); await owner.close(); await db.$disconnect();
  }
});
