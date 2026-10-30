import { expect, test } from "@playwright/test";

for (const width of [1280, 1440, 1728]) {
  test(`single desktop navigation and visible page start at ${width}px`, async ({ page }, testInfo) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width, height: 950 });
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.route("**/api/library?**", route => route.fulfill({ status: 401, json: { error: "Kitaplığını görmek için giriş yap." } }));
    await page.goto("/library?type=book");
    const nav = page.getByRole("banner", { name: "Uygulama üst alanı", exact: true });
    await expect(nav).toHaveCount(1);
    await expect(page.locator(".desktop-shell-sidebar")).toHaveCount(0);
    await expect(nav.getByRole("combobox", { name: "ListeKutusu’nda ara" })).toHaveCount(1);
    await expect(page.getByRole("heading", { name: "Kitaplığım", level: 1, exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Kitaplar", exact: true }).scrollIntoViewIfNeeded();
    await page.locator("#account-menu-trigger").click();
    await nav.getByRole("menuitem", { name: "Ana akış", exact: true }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("heading", { name: "Ana akış", level: 1 })).toBeVisible();
    const heading = page.locator("main h1");
    await expect(heading).toHaveCount(1);
    await expect(heading).toBeVisible();
    expect((await heading.boundingBox())!.y).toBeGreaterThanOrEqual(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(errors).toEqual([]);
    if (width === 1440) await page.screenshot({ path: testInfo.outputPath("desktop-shell-feed.png"), fullPage: true });
  });
}

test("library separates login, service unavailable, failure and genuine empty states", async ({ page }, testInfo) => {
  test.setTimeout(90_000);
  let status = 401;
  await page.route("**/api/library?**", route => route.fulfill({ status, json: status === 200 ? { entries: [], nextCursor: null } : { error: status === 401 ? "Kitaplığını görmek için giriş yap." : status === 503 ? "Katalog henüz kullanıma açık değil." : "Geçici okuma hatası." } }));
  await page.goto("/library?type=book");
  await expect(page.getByRole("heading", { name: "Kitaplığın için giriş yap", exact: true })).toBeVisible();
  await expect(page.locator(".ui-content-state-login")).toHaveAttribute("role", "status");
  await expect(page.locator(".library-heading > span")).toHaveText("—");
  await expect(page.locator(".ui-content-state-login").getByRole("link", { name: "Giriş yap" })).toHaveAttribute("href", "/account?mode=login&next=%2Flibrary%3Ftype%3Dbook");
  status = 503;
  await page.getByRole("button", { name: "Diziler", exact: true }).click();
  await expect(page.locator(".ui-content-state-unavailable")).toBeVisible();
  await expect(page.locator(".ui-content-state-error, .ui-content-state-empty")).toHaveCount(0);
  status = 500;
  await page.getByRole("button", { name: "Filmler", exact: true }).click();
  await expect(page.locator(".ui-content-state-error")).toHaveAttribute("role", "alert");
  await expect(page.locator(".library-heading > span")).toHaveText("—");
  status = 200;
  await page.getByRole("button", { name: "Yeniden dene", exact: true }).click();
  await expect(page.locator(".ui-content-state-empty")).toBeVisible();
  await expect(page.locator(".library-heading > span")).toHaveText("0 kayıt");
  await expect(page.locator(".ui-content-state-error")).toHaveCount(0);
  await page.screenshot({ path: testInfo.outputPath("library-empty-state.png"), fullPage: true });
});

test("existing demo profile connections use the shared modal layer", async ({ page, baseURL }, testInfo) => {
  test.skip(process.env.UI_DEMO_PROFILE !== "1", "Read-only existing local demo profile check is opt-in.");
  if (!baseURL || new URL(baseURL).hostname !== "127.0.0.1") throw new Error("Local demo only");
  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
  await page.route("**/api/profiles/connections?**", route => route.fulfill({ json: { users: [], nextCursor: null } }));
  const response = await page.goto("/u/demo-topluluk-1");
  test.skip(response?.status() === 404, "Existing demo fixture is absent; do not seed or change the database.");
  const trigger = page.getByRole("button", { name: /\d+\s*takipçi$/ });
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "Takipçiler", exact: true });
  await expect(dialog).toBeVisible();
  await expect(page.locator(".modal-backdrop")).toHaveCSS("opacity", "1");
  await expect(page.locator(".ui-modal-layer").getByRole("dialog")).toHaveCount(1);
  await expect(page.locator(".desktop-shell")).toHaveAttribute("inert", "");
  await expect(dialog.getByRole("button", { name: "Kapat", exact: true })).toBeFocused();
  expect(await dialog.evaluate(element => {
    const box = element.getBoundingClientRect();
    return element.contains(document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2));
  })).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("profile-connections-modal.png"), animations: "disabled" });
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await expect(page.locator(".desktop-shell")).not.toHaveAttribute("inert", "");
  expect(await page.evaluate(() => document.body.style.overflow)).toBe("");
});
