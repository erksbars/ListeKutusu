import { expect, test } from "@playwright/test";

test("film rafı Wikidata kaydını ve eski TMDB kaynağını ayırır", async ({ page }, testInfo) => {
  test.setTimeout(90_000);
  await page.addInitScript(() => localStorage.setItem("listekutusu-theme", "dark"));
  const film = { id: "wikidata:movie:Q25188", kind: "movie", provider: "wikidata", externalId: "Q25188", title: "Başlangıç", creators: [], year: 2010, sourceUrl: "https://www.wikidata.org/wiki/Q25188", selectionToken: "film-selection" };
  const legacy = { ...film, id: "legacy", catalogId: "tmdb:movie:1", title: "Eski film", provider: "tmdb", sourceUrl: "https://www.themoviedb.org/movie/1", status: "watched" };
  await page.route("**/api/catalog/search?**", async route => {
    expect(new URL(route.request().url()).searchParams.get("kind")).toBe("movie");
    await route.fulfill({ json: { results: [film], provider: "wikidata" } });
  });
  await page.route("**/api/library**", async route => {
    if (route.request().method() === "POST") {
      expect(route.request().postDataJSON()).toEqual({ selectionToken: "film-selection", status: "to_watch" });
      await route.fulfill({ json: { entry: { ...film, id: "new-film", catalogId: film.id, status: "to_watch" } } });
    } else await route.fulfill({ json: { entries: [legacy], nextCursor: null } });
  });
  await page.goto("/library?type=movie");
  await expect(page.getByRole("article").filter({ hasText: "Eski film" }).getByRole("link", { name: "Kaynak kaydı ↗" })).toHaveAttribute("href", legacy.sourceUrl);
  await page.getByLabel("Film ara", { exact: true }).fill("Başlangıç");
  await page.getByRole("button", { name: "Kitaplığıma ekle", exact: true }).click();
  await expect(page.getByLabel("Başlangıç durumu")).toHaveValue("to_watch");
  await expect(page.getByRole("link", { name: "Wikidata kaydı ↗" })).toHaveAttribute("href", film.sourceUrl);
  await expect(page.locator(".library-source").filter({ hasText: "Film verileri:" })).toContainText("Wikidata (CC0)");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("wikidata-library-desktop.png"), fullPage: true });
});

test("desktop private library search, save, failure recovery and removal", async ({ page }, testInfo) => {
  test.setTimeout(90_000);
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.addInitScript(() => localStorage.setItem("listekutusu-theme", "dark"));
  const item = { id: "openlibrary:book:OL1W", kind: "book", provider: "openlibrary", externalId: "OL1W", title: "Suç ve Ceza", creators: ["Fyodor Dostoyevski"], year: 1866, sourceUrl: "https://openlibrary.org/works/OL1W", selectionToken: "test-selection" };
  let entries: object[] = [];
  let failPatch = true;
  await page.route("**/api/catalog/search?**", async route => {
    const url = new URL(route.request().url());
    expect(url.searchParams.get("kind")).toBe("book");
    await route.fulfill({ json: { results: [item], provider: "openlibrary" } });
  });
  await page.route("**/api/library**", async route => {
    const request = route.request();
    if (request.method() === "POST") {
      expect(request.postDataJSON()).toEqual({ selectionToken: "test-selection", status: "to_read" });
      const entry = { ...item, id: "entry1", catalogId: item.id, status: "to_read" };
      entries = [entry]; await route.fulfill({ json: { entry } });
    } else if (request.method() === "PATCH") {
      if (Object.hasOwn(request.postDataJSON(), "showcase")) {
        await route.fulfill({ json: { id: "entry1", showcasedAt: request.postDataJSON().showcase ? new Date().toISOString() : null } });
      } else if (failPatch) { failPatch = false; await route.abort("failed"); }
      else await route.fulfill({ json: { id: "entry1", status: "read" } });
    } else if (request.method() === "DELETE") {
      entries = []; await route.fulfill({ json: { ok: true } });
    } else await route.fulfill({ json: { entries, nextCursor: null } });
  });
  await page.goto("/library");
  await expect(page.getByRole("heading", { name: "Kitaplığım", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Kitaplar", exact: true }).click();
  await expect(page.getByText("Bu raf henüz boş.")).toBeVisible();
  await page.getByLabel("Kitap veya yazar ara", { exact: true }).fill("Suç");
  await page.getByRole("button", { name: "Kitaplığıma ekle", exact: true }).click();
  const status = page.getByLabel("Suç ve Ceza durumu");
  await expect(status).toHaveValue("to_read");
  await status.selectOption("read");
  await expect(page.locator(".library-error[role=alert]")).toContainText("İşlem tamamlanamadı");
  await expect(status).toHaveValue("to_read");
  await expect(status).toBeEnabled();
  await status.selectOption("read");
  await expect(status).toHaveValue("read");
  await page.getByRole("button", { name: "Profil vitrinine ekle", exact: true }).click();
  await expect(page.getByText(/Okuma\/izleme durumun özel kalır/)).toBeVisible();
  await page.getByRole("button", { name: "Herkese açık vitrine ekle", exact: true }).click();
  await expect(page.getByText("Profil vitrini için seçildi · Herkese açık")).toBeVisible();
  await page.getByRole("button", { name: "Vitrinden kaldır", exact: true }).click();
  await expect(page.getByText("Özel kayıt · Yalnız sen görebilirsin")).toBeVisible();
  await expect(status).toHaveValue("read");
  await page.getByRole("button", { name: "Uyarıyı kapat" }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("media-library-desktop.png"), fullPage: true });
  await page.getByRole("button", { name: "Kitaplıktan kaldır", exact: true }).click();
  await page.getByRole("button", { name: "Vazgeç", exact: true }).click();
  await expect(status).toBeVisible();
  await page.getByRole("button", { name: "Kitaplıktan kaldır", exact: true }).click();
  await page.getByRole("button", { name: "Kaldırmayı onayla", exact: true }).click();
  await expect(page.getByText("Bu raf henüz boş.")).toBeVisible();
  expect(errors).toEqual([]);
});
