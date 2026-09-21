import { expect, test } from "@playwright/test";

test("desktop profile recovers from failed follow and displays its music identity", async ({ page }, testInfo) => {
  const slug = process.env.PROFILE_TEST_SLUG;
  test.skip(!slug, "Set PROFILE_TEST_SLUG to an existing public profile; no records are created.");
  test.setTimeout(90_000);
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
  await page.route("**/api/profiles/follow", route => route.abort("failed"));
  const response = await page.goto(`/u/${slug}`);
  expect(response?.status()).toBe(200);
  await expect(page.getByText("Kişisel müzik vitrini", { exact: true })).toBeVisible();
  const follow = page.getByRole("button", { name: "Takip et", exact: true });
  await follow.click();
  await expect(page.getByText("Takip işlemi doğrulanamadı. Bağlantını kontrol edip tekrar dene.", { exact: true })).toBeVisible();
  await expect(follow).toBeEnabled();
  await expect(page.getByRole("link", { name: "Özel oyun oluştur" })).toBeVisible();
  await page.getByRole("tab", { name: /Hakkında/ }).click();
  await expect(page.getByRole("tabpanel")).toBeVisible();
  await page.getByRole("tab", { name: /Vitrin/ }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
  await page.screenshot({ path: testInfo.outputPath("profile-v4-desktop.png"), fullPage: true });
});
