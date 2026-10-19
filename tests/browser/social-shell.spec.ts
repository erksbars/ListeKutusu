import { expect, test } from "@playwright/test";

test("shared navigation survives desktop route changes", async ({ page }, testInfo) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
  await page.goto("/");
  const shell = page.getByTestId("app-shell-navigation");
  await expect(shell).toBeVisible();
  const original = await shell.elementHandle();
  for (const [label, url] of [["Keşfet", "/discover"], ["Topluluklar", "/communities"], ["Oyunlar", "/games"], ["Ana akış", "/"]]) {
    await shell.getByRole("link", { name: label, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`${url}$`), { timeout: 30_000 });
    await expect(shell.getByRole("link", { name: label, exact: true })).toHaveAttribute("aria-current", "page");
    await expect(page.locator("#main-content")).toHaveCount(1);
    expect(await original!.evaluate(node => node === document.querySelector('[data-testid="app-shell-navigation"]'))).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.goBack();
  await expect(shell.getByRole("link", { name: "Oyunlar", exact: true })).toHaveAttribute("aria-current", "page");
  expect(await original!.evaluate(node => node.isConnected)).toBe(true);
  expect(errors).toEqual([]);
  await page.screenshot({ path: testInfo.outputPath("social-shell-desktop.png") });
});
