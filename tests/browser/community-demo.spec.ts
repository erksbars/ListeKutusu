import { expect, test } from "@playwright/test";

test("seeded communities display demo profiles, reviews and comments", async ({ page, baseURL }) => {
  test.skip(process.env.COMMUNITY_DEMO_E2E !== "1", "Requires manually seeded local demo data; read-only test.");
  if (!baseURL || new URL(baseURL).hostname !== "127.0.0.1") throw new Error("Local test only");
  test.setTimeout(120_000);
  const failures: string[] = [];
  page.on("pageerror", error => failures.push(error.message));
  await page.addInitScript(() => localStorage.setItem("listekutusu-theme", "dark"));
  await page.goto("/search?q=Demo&type=communities");
  await expect(page.getByRole("region", { name: "Topluluklar", exact: true }).getByRole("article")).toHaveCount(8, { timeout: 30_000 });
  await page.getByRole("link", { name: "Film Günlüğü (Demo)", exact: true }).click();
  await expect(page.getByText("5 üye", { exact: true })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole("region", { name: "Topluluk paylaşımları" }).locator('[data-feed-kind="discussion"], [data-feed-kind="review"]')).toHaveCount(4);
  const review = page.getByRole("article").filter({ has: page.getByRole("heading", { name: "Final üzerine bir yorum", exact: true }) });
  await review.getByRole("button", { name: "Spoiler içeren metni göster", exact: true }).click();
  await review.getByRole("button", { name: /^Yorumlar/ }).click();
  await expect(page.getByText(/Finalde kesin bir cevap aramaktan/)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Yorumlar", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: /^Demo ·/ }).first()).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.evaluate(() => { (document.activeElement as HTMLElement | null)?.blur(); window.scrollTo(0, 0); });
  await page.screenshot({ path: "test-results/browser/community-demo-film-desktop.png", fullPage: true, animations: "disabled" });
  expect(failures).toEqual([]);
});
