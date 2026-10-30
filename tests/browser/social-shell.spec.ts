import { expect, test } from "@playwright/test";

test("shared navigation survives desktop route changes", async ({ page }, testInfo) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
  await page.goto("/");
  const shell = page.getByRole("banner", { name: "Uygulama üst alanı", exact: true });
  await expect(shell).toBeVisible();
  const original = await shell.elementHandle();
  for (const [label, url] of [["Keşfet", "/discover"], ["Oyunlar", "/games"], ["Ana akış", "/"]]) {
    await page.locator("#account-menu-trigger").click();
    await shell.getByRole("menuitem", { name: label, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`${url}$`), { timeout: 30_000 });
    await expect(page.locator(".desktop-shell-sidebar")).toHaveCount(0);
    await expect(page.locator("#main-content")).toHaveCount(1);
    expect(await original!.evaluate(node => node === document.querySelector('header[aria-label="Uygulama üst alanı"]'))).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.goBack();
  await expect(page.getByRole("heading", { name: "Oyunlar", level: 1 })).toBeVisible();
  expect(await original!.evaluate(node => node.isConnected)).toBe(true);
  expect(errors).toEqual([]);
  await page.screenshot({ path: testInfo.outputPath("social-shell-desktop.png") });
});
