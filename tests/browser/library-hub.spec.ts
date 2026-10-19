import { expect, test } from "@playwright/test";

test("library separates music, TV, films and books and preserves music management", async ({ page }, testInfo) => {
  test.setTimeout(90_000);
  let playlistName = "Benim müzik listem";
  let savedName = "";
  const account = () => ({ id: "test-list", ownerName: "Test Kullanıcısı", slug: "test", playlistName, suggestions: [], spotifyPlaylistId: null, spotifyExternalUrl: null, submitCode: null });
  const track = { id: "saved-track", trackId: "track1", trackName: "Müzik kaydım", artistName: "Test Sanatçı", durationMs: 180000, suggestedBy: null, imageUrl: null, externalUrl: null, album: "Albüm", genres: ["Rock"], primaryGenre: "Rock", artists: [] };
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.addInitScript(() => localStorage.setItem("listekutusu-theme", "dark"));
  await page.route("**/api/accounts/control", route => route.fulfill({ json: { list: account(), tracks: [track] } }));
  await page.route("**/api/accounts/me", route => route.fulfill({ json: { list: account() } }));
  await page.route("**/api/accounts/settings", route => {
    savedName = route.request().postDataJSON().playlistName;
    playlistName = savedName;
    return route.fulfill({ json: { list: account() } });
  });
  const requestedKinds: string[] = [];
  await page.route("**/api/library?**", route => {
    requestedKinds.push(new URL(route.request().url()).searchParams.get("kind")!);
    return route.fulfill({ status: 503, json: { error: "Katalog henüz kullanıma açık değil." } });
  });
  await page.goto("/control");
  await expect(page).toHaveURL(/\/library\?type=music/);
  await expect(page.getByRole("heading", { name: "Müzik listem", exact: true })).toBeVisible();
  await expect(page.getByText("Müzik kaydım", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Sanatçıya göre", exact: true }).click();
  await page.getByText("Spotify, liste ayarları ve toplu içe aktarma", { exact: true }).click();
  await page.getByLabel("Liste adı", { exact: true }).fill("Kitaplıktaki müziklerim");
  await page.getByRole("button", { name: "Liste adını kaydet" }).click();
  await expect(page.getByText("Liste adı güncellendi.", { exact: true })).toBeVisible();
  expect(savedName).toBe("Kitaplıktaki müziklerim");
  await page.getByText("Spotify, liste ayarları ve toplu içe aktarma", { exact: true }).click();
  expect(await page.locator("main").count()).toBe(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("library-music-desktop.png"), fullPage: true });
  for (const [label, kind] of [["Diziler", "tv"], ["Filmler", "movie"], ["Kitaplar", "book"]]) {
    await page.getByRole("button", { name: label, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`type=${kind}`));
    await expect(page.getByText("Katalog henüz kullanıma açık değil.")).toBeVisible();
    await expect(page.getByText("Müzik kaydım", { exact: true })).toHaveCount(0);
  }
  expect(requestedKinds).toEqual(expect.arrayContaining(["tv", "movie", "book"]));
  await page.goBack();
  await expect(page.getByRole("button", { name: "Filmler", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Müzik", exact: true }).click();
  await expect(page.getByText("Müzik kaydım", { exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});
